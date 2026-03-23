import { useEffect, useRef, useState } from "react";
import { Database as DatabaseIcon, Table, AlarmClock, TerminalSquare, FunctionSquare, Eye} from "lucide-react";
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
import { executeSQL } from "@/db/msyql-client";

// import { fetchTablesForDatabase } from "@/db/mysqlConnection";
import { TreeNode } from "@/components/common/tree-panel/TreeNode";
// import { TreeLeaf } from "@/components/common/tree-panel/TreeLeaf";
import { TableTreeLeaf } from "@/components/common/tree-panel/TableTreeLeaf";
import { TableVisibilityDialog } from "@/components/common/dialog/TableVisibilityDialog";
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

  const { openContentTab, setActiveContentTab } = useConnectionStore();

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


  const loadTables = async (dbName: string) => {
    if (!dbKey) return;
    const tables = await fetchTables(dbKey, dbName); // 你需要实现
    console.log("[WorkSpaceTreePanel] tables:", tables);
    setDBTrees((prev) =>
      prev.map((db) =>
        db.name === dbName ? { ...db, tables } : db
      )
    );
  };

  function handleGroupAction(action: string, dbName: string) {
    console.log(`[WorkSpaceTreePanel] 执行 ${action} 操作，数据库：${dbName}`);
    // 在这里添加你的逻辑
  }
  
  function handleAction(action: string, dbName: string) {
    console.log(`[WorkSpaceTreePanel] 执行 ${action} 操作，数据库：${dbName}`);
    // 在这里添加你的逻辑
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
             

      <div className="w-max">
        <h2 className="font-semibold pl-3 pb-2">数据库列表</h2>
        <ul className="pl-2 text-sm space-y-1">
        {dbTrees.map((db) => (
        <li key={db.name}>
          <div
            className="flex items-center space-x-2 cursor-pointer hover:text-blue-600"
            onClick={() => toggleDatabaseExpand(db.name)}
            onDoubleClick={() => openQueryTab(db.name)}
          >
            <DatabaseIcon className="w-5 h-5" />
            <span>{db.name}</span>
          </div>

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
              <TreeNode label="视图" icon={<Eye className="w-4 h-4"/>} />
              <TreeNode label="函数" icon={<FunctionSquare className="w-4 h-4"/>} />
              <TreeNode label="事件" icon={<AlarmClock className="w-4 h-4"/>} />
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
