import { SqlMonacoEditor } from "@/components/common/content-viewer/SqlMonacoEditor";
import { TableViewTab } from "@/components/common/TableViewTab";
import { TableExportTab } from "@/components/common/TableExportTab";
import { CreateTableTab } from "@/components/common/CreateTableTab";
import { cn } from "@/lib/utils";
import { useConnectionStore } from "@/store/useConnectionStore";
import { ExecResultProps } from "@/types";
import { Plus, X } from "lucide-react";
import { nanoid } from "nanoid";
import { EditTabs } from "./EditTabs";
import { EditableStructureTable } from "@/components/common/table/EditableStructureTable";
import LazyLoadDataTable from "@/components/common/table/LazyLoadDataTable";

// export const EditorTabManager: React.FC<{ dbKey: string; onExecResult: ExecResultCallback }> = ({ dbKey, onExecResult }) => {
export const ContentTabManager: React.FC<ExecResultProps> = ({
  dbKey,
  onExecResult,
}) => {
  const {
    contentTabs,
    activeContentId,
    openContentTab,
    closeContentTab,
    setActiveContentTab,
    getActiveContent,
    getActiveTab,
    connectiontabs,
    updateCurrentDb,
  } = useConnectionStore();

  // if (!activeContentTab) return null;
  const activeTab = getActiveTab();
  const currentDbName = activeTab?.currentDb || "";
  const activeContentTab = getActiveContent();

  // if (!activeContentTab) return null;
  

  return (
    <main className="flex flex-col flex-1 h-full pr-1.5">
      {/* Tabs Header */}
      <div className="flex items-center border-b bg-muted p-1">
        {contentTabs.map((tab) => (
          <div
            key={tab.tabId}
            className={cn(
              "flex items-center px-3 py-1 mr-1 text-sm rounded-t border border-b-0 cursor-pointer",
              tab.tabId === activeContentId
                ? "bg-white border-gray-300 font-semibold"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            )}
            onClick={() => setActiveContentTab(tab.tabId)}
          >
            <span>{tab.title}</span>
            <X
              className="ml-2 w-4 h-4 hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                closeContentTab(tab.tabId);
              }}
            />
          </div>
        ))}

        <button
          className="px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-600"
          onClick={() => {
            const id = nanoid();
            const content = currentDbName ? `use \`${currentDbName}\`;\n\n` : "";
            openContentTab({
              tabId: id,
              title: "新建查询",
              content,
              isSaved: false,
              tabType: "query",
              databaseName: currentDbName || undefined,
            });
          }}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs Content */}
      <div className="flex-1 overflow-auto p-2">
        <div className="flex flex-col flex-1 h-full overflow-auto resize-none font-mono-tight border rounded p-2 ">
        {(() => {
          if (!activeContentTab) {
            return (
              <div className="text-center text-gray-400 mt-10">
                没有打开的标签页
              </div>
            );
          }

          if (activeContentTab.tabType === "query") {
              return <SqlMonacoEditor dbKey={dbKey} onExecResult={onExecResult} initialContent={activeContentTab.content} />
          } else if (activeContentTab.tabType === "tableView") {
            return <TableViewTab dbkey={dbKey} dbName={activeContentTab.databaseName || ""} tableName={activeContentTab.tableName || ""} />;
          } else if (activeContentTab.tabType === "tableStructure") {
            return <EditableStructureTable dbKey={dbKey} dbName={activeContentTab.databaseName || ""} tableName={activeContentTab.tableName || ""} result={activeContentTab.execResult!} />;
          } else if (activeContentTab.tabType === "tableExport") {
            return <TableExportTab dbKey={dbKey} dbName={activeContentTab.databaseName || ""} tableName={activeContentTab.tableName || ""} />;
          } else if (activeContentTab.tabType === "createTable") {
            return <CreateTableTab dbKey={dbKey} dbName={activeContentTab.databaseName || ""} tableName={activeContentTab.tableName} />;
          }
          else {
            return <div>未知类型</div>;
          }
        })()}
        </div>
      </div>
    </main>
  );
};
