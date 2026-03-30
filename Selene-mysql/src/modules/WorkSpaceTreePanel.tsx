import { useEffect, useRef, useState, useCallback } from "react";
import { Database as DatabaseIcon, Table, AlarmClock, TerminalSquare, FunctionSquare, Eye, Trash2, Plus, Filter, FileText, Edit, Save, RefreshCw} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { DatabaseTree } from "@/types";
import { nanoid } from "nanoid";
import { useConnectionStore } from "@/store/useConnectionStore";
import { useShallow } from "zustand/shallow";
import { executeSQL, fetchDatabases } from "@/db/msyql-client";
import { toast } from "sonner";

// import { fetchTablesForDatabase } from "@/db/mysqlConnection";
import { TreeNode } from "@/components/common/tree-panel/TreeNode";
// import { TreeLeaf } from "@/components/common/tree-panel/TreeLeaf";
import { TableTreeLeaf } from "@/components/common/tree-panel/TableTreeLeaf";
import { TableVisibilityDialog } from "@/components/common/dialog/TableVisibilityDialog";
import { ExportWizardDialog } from "@/components/common/dialog/ExportWizardDialog";
import { CreateDatabaseDialog } from "@/components/common/dialog/CreateDatabaseDialog";
import { fetchTables } from "@/db/msyql-client";
import { useSavedQueries, getSavedQueryContent } from "@/hooks/useSavedQueries";
import { SaveQueryDialog } from "@/components/common/dialog/SaveQueryDialog";
import { Input } from "@/components/ui/input";

function WorkSpaceTreePanel({
  tabId,
  dbKey,
  databases,
  allDatabases,
}: {
  tabId: string;
  dbKey: string | null;
  databases: string[];
  allDatabases?: string[];
}) {
  const renderCount = useRef(0);

  useEffect(() => {
    console.log("[WorkSpaceTreePanel] 渲染次数:", renderCount.current++);
  }, []);

  console.log("[WorkSpaceTreePanel] databases:", databases);

  const totalDatabases = allDatabases ?? databases;

  const [visibleTableDialogOpen, setVisibleTableDialogOpen] = useState(false);
  const [dialogTargetDB, setDialogTargetDB] = useState<DatabaseTree | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportTargetDB, setExportTargetDB] = useState<string>("");
  const [createDbDialogOpen, setCreateDbDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filterDbList, setFilterDbList] = useState<string[]>([]);
  const [filterSelectedDBs, setFilterSelectedDBs] = useState<string[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterSearchKeyword, setFilterSearchKeyword] = useState("");

  // 从 localStorage 加载查询列表展开状态
  const loadQueriesExpanded = (): boolean => {
    const key = `dbTree_queriesExpanded_${tabId}`;
    const saved = localStorage.getItem(key);
    return saved === 'true';
  };

  // 保存查询列表展开状态到 localStorage
  const saveQueriesExpanded = (expanded: boolean) => {
    const key = `dbTree_queriesExpanded_${tabId}`;
    localStorage.setItem(key, String(expanded));
  };

  // 保存的查询相关状态
  const [queriesExpanded, setQueriesExpanded] = useState(loadQueriesExpanded);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTargetQuery, setRenameTargetQuery] = useState<{ id: string; name: string } | null>(null);
  const [renameInput, setRenameInput] = useState("");

  const { savedQueries, deleteSavedQuery, updateSavedQuery, refreshQueries } = useSavedQueries(dbKey ?? undefined);

  const { openContentTab, setActiveContentTab, contentTabs, activeContentId } = useConnectionStore(
    useShallow((state) => ({
      openContentTab: state.openContentTab,
      setActiveContentTab: state.setActiveContentTab,
      contentTabs: state.contentTabs,
      activeContentId: state.activeContentId,
    }))
  );

  // 获取当前正在使用的数据库
  const activeContent = contentTabs.find(t => t.tabId === activeContentId);
  const currentDatabase = activeContent?.dbKey === dbKey ? activeContent?.databaseName : null;

  // 从 localStorage 加载展开状态
  const loadExpandedState = (dbName: string): boolean => {
    const key = `dbTree_expanded_${tabId}_${dbName}`;
    const saved = localStorage.getItem(key);
    return saved === 'true';
  };

  // 保存展开状态到 localStorage
  const saveExpandedState = (dbName: string, expanded: boolean) => {
    const key = `dbTree_expanded_${tabId}_${dbName}`;
    localStorage.setItem(key, String(expanded));
  };

  // 初始化 dbTrees，直接从 localStorage 读取 visibleTables 和展开状态
  const [dbTrees, setDBTrees] = useState<DatabaseTree[]>(() => {
    return databases.map((name) => {
      const connection = useConnectionStore.getState().connectiontabs.find(c => c.tabId === tabId);
      const key = `${connection?.key || tabId}_${name}`;
      const saved = localStorage.getItem(`visibleTables_${key}`);
      const visibleTables = saved ? JSON.parse(saved) : [];
      const savedTablesCount = localStorage.getItem(`tablesCount_${key}`);
      const tablesCount = savedTablesCount ? parseInt(savedTablesCount, 10) : undefined;
      // 从 localStorage 加载展开状态
      const expanded = loadExpandedState(name);
      return {
        name,
        expanded,
        visibleTables,
        tablesCount,
      };
    });
  });

  // 当 databases 变化时，更新 dbTrees - 只更新数据库列表，不覆盖已有数据
  useEffect(() => {
    setDBTrees(prev => {
      // 检查是否需要更新（是否有新的数据库加入）
      const prevNames = prev.map(db => db.name);
      const newDatabases = databases.filter(name => !prevNames.includes(name));

      if (newDatabases.length === 0) {
        // 没有新数据库，不需要更新
        return prev;
      }

      // 只有新数据库才从 localStorage 读取
      return databases.map((name) => {
        const existing = prev.find(db => db.name === name);
        if (existing) {
          // 已存在的数据库保留原有数据
          return existing;
        }
        // 新数据库从 localStorage 读取
        const connection = useConnectionStore.getState().connectiontabs.find(c => c.tabId === tabId);
        const key = `${connection?.key || tabId}_${name}`;
        const saved = localStorage.getItem(`visibleTables_${key}`);
        const visibleTables = saved ? JSON.parse(saved) : [];
        const savedTablesCount = localStorage.getItem(`tablesCount_${key}`);
        const tablesCount = savedTablesCount ? parseInt(savedTablesCount, 10) : undefined;
        // 从 localStorage 加载展开状态
        const expanded = loadExpandedState(name);
        return {
          name,
          expanded,
          visibleTables,
          tablesCount,
        };
      });
    });
  }, [databases, tabId]);
  
  const toggleDatabaseExpand = (dbName: string) => {
    setDBTrees((prev) => {
      const updated = prev.map((db) =>
        db.name === dbName ? { ...db, expanded: !db.expanded } : db
      );
      // 保存展开状态到 localStorage
      const newState = updated.find(db => db.name === dbName);
      if (newState) {
        saveExpandedState(dbName, newState.expanded);
      }
      return updated;
    });
  };

  const openQueryTab = async (dbName: string) => {
    if (!dbKey) return;
    
    await executeSQL(dbKey, `use \`${dbName}\``);
    
    const newTabId = nanoid();
    useConnectionStore.getState().updateCurrentDb(dbKey, dbName);
    
    openContentTab({
      tabId: newTabId,
      title: `查询 - ${dbName}`,
      tabType: 'query',
      content: `use \`${dbName}\`;\n\n`,
      dbKey,
      databaseName: dbName,
    });
    setActiveContentTab(newTabId);
  };

  // 打开保存的查询 - 从 localStorage 读取内容
  const openSavedQuery = (savedQuery: { id: string; name: string; databaseName?: string }) => {
    if (!dbKey) return;

    // 从 localStorage 读取完整查询内容
    const fullQuery = getSavedQueryContent(savedQuery.id);
    if (!fullQuery) {
      toast.error("无法加载查询内容");
      return;
    }

    const newTabId = nanoid();
    openContentTab({
      tabId: newTabId,
      title: savedQuery.name,
      tabType: 'query',
      content: fullQuery.content,
      dbKey,
      databaseName: fullQuery.databaseName,
      savedQueryId: savedQuery.id,
      isSaved: true,
    });
    setActiveContentTab(newTabId);
  };

  // 处理重命名
  const handleRename = (queryId: string, currentName: string) => {
    setRenameTargetQuery({ id: queryId, name: currentName });
    setRenameInput(currentName);
    setRenameDialogOpen(true);
  };

  const confirmRename = () => {
    if (renameTargetQuery && renameInput.trim()) {
      updateSavedQuery(renameTargetQuery.id, { name: renameInput.trim() });
      toast.success("查询已重命名");
      setRenameDialogOpen(false);
      setRenameTargetQuery(null);
    }
  };

  // 处理删除
  const handleDeleteQuery = (queryId: string) => {
    deleteSavedQuery(queryId);
    toast.success("查询已删除");
  };

  const loadTables = useCallback(async (dbName: string) => {
    if (!dbKey) return;
    const tables = await fetchTables(dbKey, dbName); // 你需要实现
    console.log("[WorkSpaceTreePanel] tables:", tables);

    if (!tables) return;

    // 缓存表数量到 localStorage
    const connection = useConnectionStore.getState().connectiontabs.find(c => c.tabId === tabId);
    const key = `${connection?.key || tabId}_${dbName}`;
    localStorage.setItem(`tablesCount_${key}`, String(tables.length));

    setDBTrees((prev) =>
      prev.map((db) => {
        if (db.name !== dbName) return db;

        // 优先使用内存中已有的 visibleTables
        const existingVisibleTables = db.visibleTables;

        // 只有当内存中没有 visibleTables 时，才从 localStorage 读取
        let currentVisibleTables: string[];
        if (existingVisibleTables && existingVisibleTables.length > 0) {
          // 使用内存中的值，并过滤掉已经不存在的表
          currentVisibleTables = existingVisibleTables.filter(t => tables.includes(t));
        } else {
          // 从 localStorage 读取
          const saved = localStorage.getItem(`visibleTables_${key}`);
          currentVisibleTables = saved ? JSON.parse(saved) : [];
          // 过滤掉已经不存在的表
          currentVisibleTables = currentVisibleTables.filter(t => tables.includes(t));
        }

        // 更新 localStorage
        localStorage.setItem(`visibleTables_${key}`, JSON.stringify(currentVisibleTables));

        return { ...db, tables, visibleTables: currentVisibleTables, tablesCount: tables.length };
      })
    );
  }, [dbKey, tabId]);

  const removeTable = useCallback((dbName: string, tableName: string) => {
    setDBTrees((prev) =>
      prev.map((db) => {
        if (db.name !== dbName) return db;
        
        const tables = db.tables?.filter(t => t !== tableName) || [];
        const visibleTables = db.visibleTables?.filter(t => t !== tableName) || [];
        
        const connection = useConnectionStore.getState().connectiontabs.find(c => c.tabId === tabId);
        const key = `${connection?.key || tabId}_${dbName}`;
        localStorage.setItem(`visibleTables_${key}`, JSON.stringify(visibleTables));
        
        return { ...db, tables, visibleTables };
      })
    );
  }, [tabId]);

  // 监听表创建/删除事件，刷新表列表
  useEffect(() => {
    const handleTableCreated = (event: CustomEvent<{ dbKey: string; dbName: string }>) => {
      const { dbKey: eventDbKey, dbName } = event.detail;
      console.log("[WorkSpaceTreePanel] table-created event:", event.detail);
      if (dbKey === eventDbKey) {
        loadTables(dbName);
      }
    };

    const handleTableDropped = (event: CustomEvent<{ dbKey: string; dbName: string; tableName: string }>) => {
      const { dbKey: eventDbKey, dbName, tableName } = event.detail;
      console.log("[WorkSpaceTreePanel] table-dropped event:", event.detail, "current dbKey:", dbKey);
      if (dbKey === eventDbKey) {
        console.log("[WorkSpaceTreePanel] 删除表:", dbName, tableName);
        removeTable(dbName, tableName);
      }
    };

    window.addEventListener('table-created', handleTableCreated as EventListener);
    window.addEventListener('table-dropped', handleTableDropped as EventListener);

    return () => {
      window.removeEventListener('table-created', handleTableCreated as EventListener);
      window.removeEventListener('table-dropped', handleTableDropped as EventListener);
    };
  }, [dbKey, loadTables, removeTable]);

  function handleGroupAction(action: string, dbName: string) {
    console.log(`[WorkSpaceTreePanel] 执行 ${action} 操作，数据库：${dbName}`);
    if (action === "export_all") {
      setExportTargetDB(dbName);
      setExportDialogOpen(true);
    }
    if (action === "create" && dbKey) {
      // 打开新建表 tab
      const newTabId = nanoid();
      openContentTab({
        tabId: newTabId,
        title: `新建表 - ${dbName}`,
        tabType: "createTable",
        dbKey: dbKey || undefined,
        databaseName: dbName,
      });
      setActiveContentTab(newTabId);
    }
  }

  // 刷新数据库列表
  const refreshDatabases = useCallback(async () => {
    if (!dbKey) return;

    const newDatabases = await fetchDatabases(dbKey);
    if (newDatabases) {
      // 获取当前连接的配置
      const connection = useConnectionStore.getState().connectiontabs.find(c => c.tabId === tabId);
      const currentDisplayDatabases = connection?.displayDatabases;

      // 更新 store 中的 databases（所有数据库）
      useConnectionStore.getState().updateConnectionDatabases(tabId, newDatabases);

      // 只显示 displayDatabases 勾选的数据库，如果没有勾选则显示所有
      const displayDbs = currentDisplayDatabases && currentDisplayDatabases.length > 0
        ? newDatabases.filter(db => currentDisplayDatabases.includes(db))
        : newDatabases;

      // 更新 store 中的 displayDatabases
      useConnectionStore.getState().updateConnectionDisplayDatabases(tabId, displayDbs);

      // 更新本地 dbTrees 状态（保留展开状态）
      setDBTrees(displayDbs.map((name) => {
        const key = `${connection?.key || tabId}_${name}`;
        const saved = localStorage.getItem(`visibleTables_${key}`);
        const visibleTables = saved ? JSON.parse(saved) : [];
        // 保留展开状态
        const expanded = loadExpandedState(name);
        return {
          name,
          expanded,
          visibleTables,
        };
      }));
    }
  }, [dbKey, tabId]);

  // 删除数据库
  const deleteDatabase = useCallback(async (dbName: string) => {
    if (!dbKey) return;

    const result = await executeSQL(dbKey, `DROP DATABASE \`${dbName}\``);
    if (result.success) {
      toast.success(`数据库 ${dbName} 删除成功`);
      // 从 displayDatabases 中移除该数据库
      const currentDatabases = useConnectionStore.getState()
        .connectiontabs.find(c => c.tabId === tabId)?.displayDatabases || [];
      const newDatabases = currentDatabases.filter(db => db !== dbName);
      useConnectionStore.getState().updateConnectionDisplayDatabases(tabId, newDatabases);

      // 同时更新 localStorage 中的 displayDatabases - 保存到 db-connections-tree
      const connection = useConnectionStore.getState().connectiontabs.find(c => c.tabId === tabId);
      if (connection?.key) {
        const savedNodes = JSON.parse(localStorage.getItem('db-connections-tree') || '[]');
        const nodeIndex = savedNodes.findIndex((n: any) => n.id === connection.key);
        if (nodeIndex >= 0 && savedNodes[nodeIndex].data) {
          savedNodes[nodeIndex].data.displayDatabases = newDatabases;
          localStorage.setItem('db-connections-tree', JSON.stringify(savedNodes));
        }
      }

      // 删除该数据库关联的查询列表（根据 dbKey）
      // 注意：删除数据库时，查询应该根据 dbKey 来删除，而不是 dbKey + databaseName
      // 因为新建同名数据库时，databaseName 可能相同但查询应该被清空了
      const savedQueriesRaw = localStorage.getItem('saved-queries');
      if (savedQueriesRaw) {
        let savedQueries = JSON.parse(savedQueriesRaw);
        // 过滤掉与当前 dbKey 关联的查询
        savedQueries = savedQueries.filter((q: any) => q.dbKey !== dbKey);
        localStorage.setItem('saved-queries', JSON.stringify(savedQueries));
        // 刷新显示
        refreshQueries();
      }

      // 更新本地 dbTrees 状态
      setDBTrees(prev => prev.filter(db => db.name !== dbName));
    } else {
      toast.error("删除失败: " + result.message);
    }
  }, [dbKey, tabId, refreshQueries]);

  function handleAction(action: string, dbName: string) {
    console.log(`[WorkSpaceTreePanel] 执行 ${action} 操作，数据库：${dbName}`);
    if (action === "delete") {
      deleteDatabase(dbName);
    }
    if (action === "refresh" && dbKey) {
      loadTables(dbName);
    }
  }


  return (
    <div className="flex-1 left-panel p-2 space-y-2 text-sm h-full overflow-y-auto overflow-x-auto whitespace-nowrap">

      <TableVisibilityDialog
        open={visibleTableDialogOpen}
        onClose={() => setVisibleTableDialogOpen(false)}
        tables={dialogTargetDB?.tables ?? []}
        visibleTables={dialogTargetDB?.visibleTables ?? []}
        onSave={(selected) => {
          if (dialogTargetDB) {
            setDBTrees((prev) =>
              prev.map((db) =>
                db.name === dialogTargetDB.name ? { ...db, visibleTables: selected } : db
              )
            );
            const connection = useConnectionStore.getState().connectiontabs.find(c => c.tabId === tabId);
            if (connection) {
              const key = `${connection.key || connection.tabId}_${dialogTargetDB.name}`;
              localStorage.setItem(`visibleTables_${key}`, JSON.stringify(selected));
            }
          }
        }}
      />

      <ExportWizardDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        dbKey={dbKey || ""}
        dbName={exportTargetDB}
        tables={dbTrees.find(db => db.name === exportTargetDB)?.tables ?? []}
      />

      <CreateDatabaseDialog
        open={createDbDialogOpen}
        onClose={() => setCreateDbDialogOpen(false)}
        dbKey={dbKey || ""}
        onSuccess={(newDbName: string) => {
          // 先将新数据库添加到 displayDatabases
          const connection = useConnectionStore.getState().connectiontabs.find(c => c.tabId === tabId);
          const currentDisplayDatabases = connection?.displayDatabases || [];

          // 如果新数据库不在勾选列表中，添加进去
          if (!currentDisplayDatabases.includes(newDbName)) {
            const newDisplayDatabases = [...currentDisplayDatabases, newDbName];
            useConnectionStore.getState().updateConnectionDisplayDatabases(tabId, newDisplayDatabases);
          }

          // 刷新数据库列表
          refreshDatabases();
        }}
      />

      {filterDialogOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-background p-4 rounded border w-[400px] max-h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold">筛选数据库</h3>
              <button onClick={() => setFilterDialogOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            
            <input
              type="text"
              placeholder="搜索数据库..."
              className="w-full p-2 border rounded mb-3"
              value={filterSearchKeyword}
              onChange={(e) => setFilterSearchKeyword(e.target.value)}
            />

            {filterLoading ? (
              <div className="text-muted-foreground">正在加载...</div>
            ) : (
              <div className="flex-1 overflow-auto">
                <div className="mb-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={filterSelectedDBs.length === filterDbList.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilterSelectedDBs(filterDbList);
                        } else {
                          setFilterSelectedDBs([]);
                        }
                      }}
                    />
                    <span>全选 ({filterSelectedDBs.length}/{filterDbList.length})</span>
                  </label>
                </div>
                <div className="space-y-1 max-h-[250px] overflow-auto">
                  {filterDbList
                    .filter(name => name.toLowerCase().includes(filterSearchKeyword.toLowerCase()))
                    .map(name => (
                      <label key={name} className="flex items-center gap-2 hover:bg-accent py-1">
                        <input
                          type="checkbox"
                          checked={filterSelectedDBs.includes(name)}
                          onChange={() => {
                            setFilterSelectedDBs(prev =>
                              prev.includes(name)
                                ? prev.filter(n => n !== name)
                                : [...prev, name]
                            );
                          }}
                        />
                        <span>{name}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-3 py-1 bg-muted text-foreground rounded"
                onClick={() => setFilterDialogOpen(false)}
              >
                取消
              </button>
              <button
                className="px-3 py-1 bg-primary text-primary-foreground rounded"
                onClick={() => {
                  useConnectionStore.getState().updateConnectionDisplayDatabases(tabId, filterSelectedDBs);

                  // 同时保存到 localStorage - 保存到 db-connections-tree
                  const connection = useConnectionStore.getState().connectiontabs.find(c => c.tabId === tabId);
                  if (connection && connection.key) {
                    const savedNodes = JSON.parse(localStorage.getItem('db-connections-tree') || '[]');
                    const nodeIndex = savedNodes.findIndex((n: any) => n.id === connection.key);
                    if (nodeIndex >= 0 && savedNodes[nodeIndex].data) {
                      savedNodes[nodeIndex].data.displayDatabases = filterSelectedDBs;
                      localStorage.setItem('db-connections-tree', JSON.stringify(savedNodes));
                    }
                  }

                  refreshDatabases();
                  setFilterDialogOpen(false);
                }}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full">
        <div className="flex items-center justify-between px-2 py-1">
          <div className="flex items-center">
            <span className="text-sm font-medium">数据库列表</span>
            {/* 显示筛选数量/总数 */}
            {databases.length > 0 && (
              <span className="text-xs text-muted-foreground ml-1">
                ({databases.length}/{totalDatabases.length})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Filter
              className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground"
              onClick={() => {
                const connection = useConnectionStore.getState().connectiontabs.find(c => c.tabId === tabId);
                const currentDisplayDbs = connection?.displayDatabases || [];
                setFilterDialogOpen(true);
                if (dbKey) {
                  setFilterLoading(true);
                  fetchDatabases(dbKey).then(result => {
                    const latestDatabases = result || [];
                    setFilterDbList(latestDatabases);
                    const newSelectedDbs = currentDisplayDbs.filter(db => latestDatabases.includes(db));
                    if (latestDatabases.length !== currentDisplayDbs.length) {
                      useConnectionStore.getState().updateConnectionDisplayDatabases(tabId, newSelectedDbs);
                    }
                    setFilterSelectedDBs(newSelectedDbs);
                    setFilterLoading(false);
                  });
                }
              }}
            />
            <Plus
              className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground"
              onClick={() => setCreateDbDialogOpen(true)}
            />
          </div>
        </div>
        <ul className="px-2 text-sm space-y-1">
        {dbTrees.map((db) => (
        <li key={db.name}>
          <ContextMenu>
            <ContextMenuTrigger>
              <div
                className={`flex items-center space-x-2 cursor-pointer rounded px-1 py-0.5 ${
                  db.expanded || currentDatabase === db.name
                    ? "text-primary font-medium"
                    : "hover:text-primary"
                }`}
                onClick={() => toggleDatabaseExpand(db.name)}
                onDoubleClick={() => openQueryTab(db.name)}
              >
                <DatabaseIcon className="w-5 h-5 text-primary" />
                <span>{db.name}</span>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
              <ContextMenuItem onClick={() => openQueryTab(db.name)}>新建查询</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => handleAction("delete", db.name)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                删除数据库
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>

          {/* 展开分类 */}
          {db.expanded && (
            <ul className="ml-2 mt-1 space-y-1 text-muted-foreground text-sm">
              <TreeNode
                label={
                  <ContextMenu>
                    <ContextMenuTrigger>
                      <div className="flex items-center gap-1">
                        <Table className="w-4 h-4" />
                        <span>表</span>
                        {/* 有表数据时显示已筛选/总数，或者有缓存的总表数时显示 */}
                        {db.tables && db.tables.length > 0 ? (() => {
                          const displayedCount = (db.visibleTables?.length === 0 || !db.visibleTables)
                            ? db.tables.length
                            : db.tables.filter(t => (db.visibleTables || []).includes(t)).length;
                          return (
                            <span className="text-xs text-muted-foreground">
                              ({displayedCount}/{db.tables.length})
                            </span>
                          );
                        })() : db.tablesCount ? (
                          <span className="text-xs text-muted-foreground">
                            ({db.visibleTables?.length || 0}/{db.tablesCount})
                          </span>
                        ) : null}
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                      <ContextMenuItem onClick={() => handleGroupAction("create", db.name)}>新建表</ContextMenuItem>
                      {/* <ContextMenuItem onClick={() => handleGroupAction("refresh", db.name)}>刷新列表</ContextMenuItem> */}
                      <ContextMenuSeparator />
                      <ContextMenuItem onClick={() => handleGroupAction("export_all", db.name)}>导出SQL</ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem 
                        onMouseDown={(e) => e.stopPropagation()} // 提前阻止事件冒泡，避免点击后触发外层的点击事件
                        onClick={(e) => {
                          e.stopPropagation();
                          setDialogTargetDB(db);
                          setVisibleTableDialogOpen(true);
                        }}>表显示控制
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => handleAction("refresh", db.name)}>刷新</ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                }
                onExpand={() => {
                  // 展开时设置当前数据库
                  if (dbKey) {
                    useConnectionStore.getState().updateCurrentDb(dbKey, db.name);
                  }
                  // 如果还没有表数据，先从 localStorage 加载 visibleTables 和 tablesCount
                  if (!db.tables) {
                    const connection = useConnectionStore.getState().connectiontabs.find(c => c.tabId === tabId);
                    const key = `${connection?.key || tabId}_${db.name}`;
                    const saved = localStorage.getItem(`visibleTables_${key}`);
                    const visibleTables = saved ? JSON.parse(saved) : [];
                    const savedTablesCount = localStorage.getItem(`tablesCount_${key}`);
                    const tablesCount = savedTablesCount ? parseInt(savedTablesCount, 10) : undefined;
                    // 先设置 visibleTables 和 tablesCount，这样可以在加载表之前就显示数量
                    setDBTrees(prev => prev.map(d =>
                      d.name === db.name ? { ...d, visibleTables, tablesCount } : d
                    ));
                    // 然后异步加载表
                    loadTables(db.name);
                  }
                }}
              >
                
                {db.tables
                  ?.filter((t) =>
                    !db.visibleTables || db.visibleTables.length === 0 ? true : db.visibleTables.includes(t)
                  )
                  .map((table) => (
                    <li key={table}>
                      <TableTreeLeaf dbkey={dbKey} dbName={db.name} tableName={table} />
                    </li>
                ))}
              </TreeNode>
              {/* <TreeNode label="视图" icon={<Eye className="w-4 h-4"/>} />
              <TreeNode label="函数" icon={<FunctionSquare className="w-4 h-4"/>} />
              <TreeNode label="事件" icon={<AlarmClock className="w-4 h-4"/>} /> */}

              {/* 保存的查询列表 */}
              <TreeNode
                label={
                  <div
                    className="flex items-center gap-1 cursor-pointer w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newState = !queriesExpanded;
                      setQueriesExpanded(newState);
                      saveQueriesExpanded(newState);
                    }}
                  >
                    <TerminalSquare className="w-4 h-4" />
                    <span className="flex-1">查询</span>
                    <span className="text-xs text-muted-foreground">({savedQueries.length})</span>
                    {/* <RefreshCw
                      className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        refreshQueries();
                      }}
                      title="刷新查询列表"
                    /> */}
                  </div>
                }
                defaultExpanded={queriesExpanded}
              >
                {savedQueries.length === 0 ? (
                  <li className="text-muted-foreground text-xs ml-4">暂无保存的查询</li>
                ) : (
                  savedQueries.map((query) => (
                    <li key={query.id}>
                      <ContextMenu>
                        <ContextMenuTrigger>
                          <div
                            className="flex items-center gap-1 cursor-pointer hover:text-primary py-0.5"
                            onClick={() => openSavedQuery(query)}
                          >
                            <FileText className="w-4 h-4" />
                            <span className="truncate">{query.name}</span>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-48">
                          <ContextMenuItem
                            onClick={() => handleRename(query.id, query.name)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            重命名
                          </ContextMenuItem>
                          <ContextMenuSeparator />
                          <ContextMenuItem
                            onClick={() => handleDeleteQuery(query.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            删除
                          </ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    </li>
                  ))
                )}
              </TreeNode>
            </ul>
          )}
        </li>
      ))}
        </ul>
      </div>

      {/* 重命名查询对话框 */}
      {renameDialogOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-background p-4 rounded border w-[300px]">
            <h3 className="text-lg font-bold mb-3 text-foreground">重命名查询</h3>
            <Input
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              placeholder="输入新名称"
              className="mb-3"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmRename();
                if (e.key === 'Escape') setRenameDialogOpen(false);
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 bg-muted text-foreground rounded"
                onClick={() => setRenameDialogOpen(false)}
              >
                取消
              </button>
              <button
                className="px-3 py-1 bg-primary text-primary-foreground rounded"
                onClick={confirmRename}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkSpaceTreePanel;
