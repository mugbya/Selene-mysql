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

/**
 * 查询(内容)tab页
 */
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

  // 过滤出属于当前连接的内容 tab
  const currentConnectionContentTabs = contentTabs.filter(tab => tab.dbKey === dbKey);
  // 当前活动的内容 tab（也需要属于当前连接）
  const currentActiveContentTab = currentConnectionContentTabs.find(tab => tab.tabId === activeContentId) || currentConnectionContentTabs[0];

  // 处理保存（更新已保存的查询）
  const handleSave = () => {
    if (!currentActiveContentTab || !dbKey) return;

    const content = currentActiveContentTab.content || "";
    if (!content.trim()) {
      toast.warning("没有内容可保存");
      return;
    }

    // 如果已经有 savedQueryId，直接更新
    if (currentActiveContentTab.savedQueryId) {
      // 获取保存的查询名称
      const savedQuery = savedQueries.find(q => q.id === currentActiveContentTab.savedQueryId);
      updateSavedQuery(currentActiveContentTab.savedQueryId, {
        name: savedQuery?.name || currentActiveContentTab.title,
        content,
        dbKey,
        databaseName: currentActiveContentTab.databaseName,
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
    if (!currentActiveContentTab || !dbKey) return;

    const content = currentActiveContentTab.content || "";
    if (!content.trim()) {
      toast.warning("没有内容可保存");
      return;
    }

    // 获取当前名称作为默认名称
    setDialogInitialName(currentActiveContentTab.title === "新建查询" ? "" : currentActiveContentTab.title);
    setSaveAsMode(true);
    setSaveDialogOpen(true);
  };

  const handleSaveQuery = (name: string) => {
    if (!currentActiveContentTab || !dbKey) return;

    const content = currentActiveContentTab.content || "";

    // 如果已经有 savedQueryId，说明是更新已保存的查询
    if (currentActiveContentTab.savedQueryId) {
      updateSavedQuery(currentActiveContentTab.savedQueryId, {
        name,
        content,
        dbKey,
        databaseName: currentActiveContentTab.databaseName,
      });
      // 更新 tab 标题
      updateContentTitle(currentActiveContentTab.tabId, name);
      toast.success("查询已更新");
    } else {
      // 新建保存的查询
      const newQuery = addSavedQuery({
        name,
        content,
        dbKey,
        databaseName: currentActiveContentTab.databaseName,
      });

      // 更新 tab 状态
      setContentSavedQueryId(currentActiveContentTab.tabId, newQuery.id);
      // 更新 tab 标题
      updateContentTitle(currentActiveContentTab.tabId, name);

      toast.success("查询已保存");
    }
  };

  // if (!activeContentTab) return null;


  return (
    <main className="flex flex-col flex-1 h-full pr-1.5">
      {/* Tabs Header */}
      <div className="flex items-center border-b bg-muted p-1">
        {currentConnectionContentTabs.map((tab) => (
          <div
            key={tab.tabId}
            className={cn(
              "flex items-center px-3 py-1 mr-1 text-sm rounded-t border border-b-0 cursor-pointer",
              tab.tabId === activeContentId
                ? "bg-background border-border font-semibold"
                : "bg-muted hover:bg-accent text-muted-foreground"
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
          className="px-2 py-1 text-sm rounded hover:bg-accent text-muted-foreground"
          onClick={() => {
            const id = nanoid();
            // 新建查询页是空白页面
            openContentTab({
              tabId: id,
              title: "新建查询",
              content: "",
              isSaved: false,
              tabType: "query",
              dbKey,
            });
          }}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs Content */}
      <div className="flex-1 overflow-auto p-2">
        <div className="flex flex-col flex-1 h-full overflow-auto resize-none font-mono-tight p-2 " style={{ border: "1px solid var(--border)", borderRadius: "0.375rem" }}>
        {(() => {
          if (!currentActiveContentTab) {
            return (
              <div className="text-center text-muted-foreground mt-10">
                没有打开的标签页
              </div>
            );
          }

          if (currentActiveContentTab.tabType === "query") {
              return (
                <SqlMonacoEditor
                  key={currentActiveContentTab.tabId}
                  dbKey={dbKey}
                  onExecResult={(result) => {
                    if (onExecResult) {
                      onExecResult(result);
                    }
                    updateContentExecResult(currentActiveContentTab.tabId, result);
                  }}
                  initialContent={currentActiveContentTab.content}
                  execResult={currentActiveContentTab.execResult}
                  onClearResult={() => {
                    updateContentExecResult(currentActiveContentTab.tabId, undefined);
                  }}
                  onSave={handleSave}
                  onSaveAs={handleSaveAs}
                  onContentChange={(content) => {
                    updateContentContent(currentActiveContentTab.tabId, content);
                  }}
                />
              );
          } else if (currentActiveContentTab.tabType === "tableView") {
            return <TableViewTab key={currentActiveContentTab.tabId} dbkey={dbKey} dbName={currentActiveContentTab.databaseName || ""} tableName={currentActiveContentTab.tableName || ""} />;
          } else if (currentActiveContentTab.tabType === "tableStructure") {
            return <EditableStructureTable key={currentActiveContentTab.tabId} dbKey={dbKey} dbName={currentActiveContentTab.databaseName || ""} tableName={currentActiveContentTab.tableName || ""} result={currentActiveContentTab.execResult!} />;
          } else if (currentActiveContentTab.tabType === "tableExport") {
            return <TableExportTab key={currentActiveContentTab.tabId} dbKey={dbKey} dbName={currentActiveContentTab.databaseName || ""} tableName={currentActiveContentTab.tableName || ""} />;
          } else if (currentActiveContentTab.tabType === "createTable") {
            return <CreateTableTab key={currentActiveContentTab.tabId} dbKey={dbKey} dbName={currentActiveContentTab.databaseName || ""} tableName={currentActiveContentTab.tableName || ""} />;
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
