import { useConnectionStore } from "@/store/useConnectionStore";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils"; // 你可以改成手写 classNames 合并函数
import { nanoid } from "nanoid";
import {SqlMonacoEditor} from "@/components/common/content-viewer/SqlMonacoEditor";
import { useRef } from "react";
import { editor as MonacoEditor } from "monaco-editor";
import { ExecResultProps } from "@/types";


export const EditTabs: React.FC<ExecResultProps> = ({ dbKey, onExecResult }) => {
  const {
    contentTabs,
    activeContentId,
    openContentTab,
    closeContentTab,
    setActiveContentTab,
    getActiveContent,
    getActiveTab
  } = useConnectionStore();

  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);

  const activeTab = getActiveTab();
  if (!activeTab?.isDataBase) {
    return null;
  }

  const activeEditorTab = getActiveContent();
 
  const handleRun = () => {
    // const sqlToRun = selectedText || fullText; // 如果选中有文本，则执行选中内容
    // runSQL(sqlToRun);
    console.log("执行SQL");
  };
  
  const handleFormat = () => {
    // const sqlToFormat = selectedText || fullText;
    // const formatted = formatSQL(sqlToFormat); // 你可以集成 sql-formatter 库
    // updateEditorText(formatted);

    console.log("执行SQL");
  };
  // 滚动容器的 ref

  return (
    <main className="flex flex-col flex-1 h-full pr-1.5">

      {/* Tabs header */}
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

        {/* + 新建按钮 */}
        <button
          className="px-2 py-1 text-sm rounded hover:bg-gray-200 text-gray-600"
          onClick={() => {
            const id = nanoid();
            openContentTab({
              tabId: id,
              title: "新建查询",
              tabType: "query",
              content: "",
              isSaved: false,
            });
          }}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-2">
        {activeEditorTab ? (
          // <textarea
          //   className="w-full h-full border rounded p-2 text-sm font-mono"
          //   value={activeEditorTab.content}
          //   onChange={(e) => updateEditorContent(activeTab.tabId, e.target.value)}
          // />
          <div className="flex flex-col flex-1 h-full overflow-auto resize-none font-mono text-sm border rounded p-2 " >
            <SqlMonacoEditor dbKey={dbKey} onExecResult={onExecResult} />
          </div>
        ) : (
          <div className="text-center text-gray-400 mt-10">没有打开的编辑器</div>
        )}
      </div>
    </main>
  );
}
