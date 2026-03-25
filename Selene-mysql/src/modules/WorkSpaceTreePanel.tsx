import { useEffect, useRef, useState, useCallback } from "react";
import { Database as DatabaseIcon, Table, AlarmClock, TerminalSquare, FunctionSquare, Eye, Trash2, Plus} from "lucide-react";
import { Button } from "@/components/ui/button";
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

function WorkSpaceTreePanel({
  tabId,
  dbKey,
  databases,
}: {
  tabId: string;
  dbKey: string | null;
  databases: string[];
}) {
  const renderCount = useRef(0);

  useEffect(() => {
    console.log("[WorkSpaceTreePanel] 渲染次数:", renderCount.current++);
  }, []);

  console.log("[WorkSpaceTreePanel] databases:", databases);

  const [visibleTableDialogOpen, setVisibleTableDialogOpen] = useState(false);
  const [dialogTargetDB, setDialogTargetDB] = useState<DatabaseTree | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportTargetDB, setExportTargetDB] = useState<string>("");
  const [createDbDialogOpen, setCreateDbDialogOpen] = useState(false);

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

  const [dbTrees, setDBTrees] = useState<DatabaseTree[]>(() => {
    const connection = useConnectionStore.getState().connectiontabs.find(c => c.tabId === tabId);
    return databases.map((name) => {
      const key = `${connection?.key || tabId}_${name}`;
      const saved = localStorage.getItem(`visibleTables_${key}`);
      const visibleTables = saved ? JSON.parse(saved) : [];
      return {
        name,
        expanded: false,
        visibleTables,
      };
    });
  });
  
  const toggleDatabaseExpand = (dbName: string) => {
    setDBTrees((prev) =>
      prev.map((db) =>
        db.name === dbName ? { ...db, expanded: !db.expanded } : db
      )
    );
  };

  const openQueryTab = async (dbName: string) => {
    if (!dbKey) return;
    
    await executeSQL(dbKey, `use \`${dbName}\``);
    
    const tabId = nanoid();
    openContentTab({
      tabId,
      title: `查询 - ${dbName}`,
      tabType: 'query',
      content: `use \`${dbName}\`;\n\n`,
      dbKey,
      databaseName: dbName,
    });
    setActiveContentTab(tabId);
  };


  const loadTables = useCallback(async (dbName: string) => {
    if (!dbKey) return;
    const tables = await fetchTables(dbKey, dbName); // 你需要实现
    console.log("[WorkSpaceTreePanel] tables:", tables);

    if (!tables) return;

    setDBTrees((prev) =>
      prev.map((db) => {
        if (db.name !== dbName) return db;

        // 获取当前的 visibleTables
        const connection = useConnectionStore.getState().connectiontabs.find(c => c.tabId === tabId);
        const key = `${connection?.key || tabId}_${dbName}`;
        const saved = localStorage.getItem(`visibleTables_${key}`);
        const currentVisibleTables: string[] = saved ? JSON.parse(saved) : [];

        // 更新 visibleTables：删除的表移除，新建的要自动添加
        const newVisibleTables = [...new Set([...currentVisibleTables.filter(t => tables.includes(t)), ...tables])];

        // 保存到 localStorage
        localStorage.setItem(`visibleTables_${key}`, JSON.stringify(newVisibleTables));

        return { ...db, tables, visibleTables: newVisibleTables };
      })
    );
  }, [dbKey, tabId]);

  // 监听表创建/删除事件，刷新表列表
  useEffect(() => {
    const handleTableCreated = (event: CustomEvent<{ dbKey: string; dbName: string }>) => {
      const { dbKey: eventDbKey, dbName } = event.detail;
      console.log("[WorkSpaceTreePanel] table-created event:", event.detail);
      if (dbKey === eventDbKey) {
        loadTables(dbName);
      }
    };

    const handleTableDropped = (event: CustomEvent<{ dbKey: string; dbName: string }>) => {
      const { dbKey: eventDbKey, dbName } = event.detail;
      console.log("[WorkSpaceTreePanel] table-dropped event:", event.detail, "current dbKey:", dbKey);
      if (dbKey === eventDbKey) {
        console.log("[WorkSpaceTreePanel] 刷新表列表:", dbName);
        loadTables(dbName);
      }
    };

    window.addEventListener('table-created', handleTableCreated as EventListener);
    window.addEventListener('table-dropped', handleTableDropped as EventListener);

    return () => {
      window.removeEventListener('table-created', handleTableCreated as EventListener);
      window.removeEventListener('table-dropped', handleTableDropped as EventListener);
    };
  }, [dbKey, loadTables]);

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

      // 更新本地 dbTrees 状态
      setDBTrees(displayDbs.map((name) => {
        const key = `${connection?.key || tabId}_${name}`;
        const saved = localStorage.getItem(`visibleTables_${key}`);
        const visibleTables = saved ? JSON.parse(saved) : [];
        return {
          name,
          expanded: false,
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

      // 更新本地 dbTrees 状态
      setDBTrees(prev => prev.filter(db => db.name !== dbName));
    } else {
      toast.error("删除失败: " + result.message);
    }
  }, [dbKey, tabId]);

  function handleAction(action: string, dbName: string) {
    console.log(`[WorkSpaceTreePanel] 执行 ${action} 操作，数据库：${dbName}`);
    if (action === "delete") {
      deleteDatabase(dbName);
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

      <div className="w-full">
        <div className="flex items-center gap-2 px-2 py-1">
          {/* <DatabaseIcon className="w-4 h-4 text-muted-foreground" /> */}
          <span className="text-sm font-medium flex-1">数据库列表</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setCreateDbDialogOpen(true)}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        <ul className="px-2 text-sm space-y-1">
        {dbTrees.map((db) => (
        <li key={db.name}>
          <ContextMenu>
            <ContextMenuTrigger>
              <div
                className={`flex items-center space-x-2 cursor-pointer rounded px-1 py-0.5 ${
                  db.expanded || currentDatabase === db.name
                    ? "text-blue-600 font-medium"
                    : "hover:text-blue-600"
                }`}
                onClick={() => toggleDatabaseExpand(db.name)}
                onDoubleClick={() => openQueryTab(db.name)}
              >
                <DatabaseIcon className="w-5 h-5" />
                <span>{db.name}</span>
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
              <ContextMenuItem onClick={() => openQueryTab(db.name)}>新建查询</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => handleAction("delete", db.name)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                删除数据库
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>

          {/* 展开分类 */}
          {db.expanded && (
            <ul className="ml-2 mt-1 space-y-1 text-gray-600 text-sm">
              <TreeNode
                label={
                  <ContextMenu>
                    <ContextMenuTrigger>
                      <div className="flex items-center gap-1">
                        <Table className="w-4 h-4" />
                        <span>表</span>
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
                  if (!db.tables) loadTables(db.name);
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
              <TreeNode label="查询" icon={<TerminalSquare className="w-4 h-4"/>} />
            </ul>
          )}
        </li>
      ))}
        </ul>
      </div>
    </div>
  );
}

export default WorkSpaceTreePanel;
