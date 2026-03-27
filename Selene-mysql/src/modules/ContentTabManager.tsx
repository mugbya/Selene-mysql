import { SqlMonacoEditor } from "@/components/common/content-viewer/SqlMonacoEditor";
import { TableViewTab } from "@/components/common/TableViewTab";
import { TableExportTab } from "@/components/common/TableExportTab";
import { CreateTableTab } from "@/components/common/CreateTableTab";
import { cn } from "@/lib/utils";
import { useConnectionStore } from "@/store/useConnectionStore";
import { ExecResultProps } from "@/types";
import { Plus, X, Save } from "lucide-react";
import { nanoid } from "nanoid";
import { EditTabs } from "./EditTabs";
import { EditableStructureTable } from "@/components/common/table/EditableStructureTable";
import LazyLoadDataTable from "@/components/common/table/LazyLoadDataTable";
import { useState, useEffect } from "react";
import { SavedQuery } from "@/types/connection";
import { toast } from "sonner";
import { SaveQueryDialog } from "@/components/common/dialog/SaveQueryDialog";
import { useSavedQueries } from "@/hooks/useSavedQueries";

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
    updateContentExecResult,
    updateContentTitle,
    updateContentContent,
    setContentSavedQueryId,
  } = useConnectionStore();

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveAsMode, setSaveAsMode] = useState(false);
  const [dialogInitialName, setDialogInitialName] = useState("");
  const { savedQueries, addSavedQuery, updateSavedQuery } = useSavedQueries(dbKey ?? undefined);

  // if (!activeContentTab) return null;
  const activeTab = getActiveTab();
  const currentDbName = activeTab?.currentDb || "";
  const activeContentTab = getActiveContent();

  // 处理保存（更新已保存的查询）
  const handleSave = () => {
    if (!activeContentTab || !dbKey) return;

    const content = activeContentTab.content || "";
    if (!content.trim()) {
      toast.warning("没有内容可保存");
      return;
    }

    // 如果已经有 savedQueryId，直接更新
    if (activeContentTab.savedQueryId) {
      // 获取保存的查询名称
      const savedQuery = savedQueries.find(q => q.id === activeContentTab.savedQueryId);
      updateSavedQuery(activeContentTab.savedQueryId, {
        name: savedQuery?.name || activeContentTab.title,
        content,
        dbKey,
        databaseName: activeContentTab.databaseName,
      });
      toast.success("查询已更新");
    } else {
      // 没有保存过，打开另存为对话框
      setDialogInitialName("");
      setSaveAsMode(true);
      setSaveDialogOpen(true);
    }
  };

  // 处理另存为
  const handleSaveAs = () => {
    if (!activeContentTab || !dbKey) return;

    const content = activeContentTab.content || "";
    if (!content.trim()) {
      toast.warning("没有内容可保存");
      return;
    }

    // 获取当前名称作为默认名称
    setDialogInitialName(activeContentTab.title === "新建查询" ? "" : activeContentTab.title);
    setSaveAsMode(true);
    setSaveDialogOpen(true);
  };

  const handleSaveQuery = (name: string) => {
    if (!activeContentTab || !dbKey) return;

    const content = activeContentTab.content || "";

    // 如果已经有 savedQueryId，说明是更新已保存的查询
    if (activeContentTab.savedQueryId) {
      updateSavedQuery(activeContentTab.savedQueryId, {
        name,
        content,
        dbKey,
        databaseName: activeContentTab.databaseName,
      });
      // 更新 tab 标题
      updateContentTitle(activeContentTab.tabId, name);
      toast.success("查询已更新");
    } else {
      // 新建保存的查询
      const newQuery = addSavedQuery({
        name,
        content,
        dbKey,
        databaseName: activeContentTab.databaseName,
      });

      // 更新 tab 状态
      setContentSavedQueryId(activeContentTab.tabId, newQuery.id);
      // 更新 tab 标题
      updateContentTitle(activeContentTab.tabId, name);

      toast.success("查询已保存");
    }
  };

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
            {tab.isSaved && <span className="ml-1 text-green-500">*</span>}
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
            // 新建查询页是空白页面
            openContentTab({
              tabId: id,
              title: "新建查询",
              content: "",
              isSaved: false,
              tabType: "query",
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
              return (
                <SqlMonacoEditor
                  key={activeContentTab.tabId}
                  dbKey={dbKey}
                  onExecResult={(result) => {
                    if (onExecResult) {
                      onExecResult(result);
                    }
                    updateContentExecResult(activeContentTab.tabId, result);
                  }}
                  initialContent={activeContentTab.content}
                  execResult={activeContentTab.execResult}
                  onClearResult={() => {
                    updateContentExecResult(activeContentTab.tabId, undefined);
                  }}
                  onSave={handleSave}
                  onSaveAs={handleSaveAs}
                  onContentChange={(content) => {
                    updateContentContent(activeContentTab.tabId, content);
                  }}
                />
              );
          } else if (activeContentTab.tabType === "tableView") {
            return <TableViewTab key={activeContentTab.tabId} dbkey={dbKey} dbName={activeContentTab.databaseName || ""} tableName={activeContentTab.tableName || ""} />;
          } else if (activeContentTab.tabType === "tableStructure") {
            return <EditableStructureTable key={activeContentTab.tabId} dbKey={dbKey} dbName={activeContentTab.databaseName || ""} tableName={activeContentTab.tableName || ""} result={activeContentTab.execResult!} />;
          } else if (activeContentTab.tabType === "tableExport") {
            return <TableExportTab key={activeContentTab.tabId} dbKey={dbKey} dbName={activeContentTab.databaseName || ""} tableName={activeContentTab.tableName || ""} />;
          } else if (activeContentTab.tabType === "createTable") {
            return <CreateTableTab key={activeContentTab.tabId} dbKey={dbKey} dbName={activeContentTab.databaseName || ""} tableName={activeContentTab.tableName || ""} />;
          }
          else {
            return <div>未知类型</div>;
          }
        })()}
        </div>
      </div>

      <SaveQueryDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleSaveQuery}
        initialName={dialogInitialName}
      />
    </main>
  );
};
