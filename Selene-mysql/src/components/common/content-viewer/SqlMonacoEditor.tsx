import React, { useRef, useState, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { format } from "sql-formatter";
import { editor as MonacoEditor } from "monaco-editor";
import SqlToolbar from "../toolbar/SqlToolbar";
import { executeSQL } from "@/db/msyql-client";
import { useConnectionStore } from "@/store/useConnectionStore";
import { ExecResult, ExecResultProps } from "@/types";
import { EditableResultTable } from "@/modules/ExecResultTable";
import { X } from "lucide-react";

// export default function SqlMonacoEditor({dbKey}: { dbKey: string | null }) {
export const SqlMonacoEditor: React.FC<ExecResultProps & { execResult?: ExecResult; onClearResult?: () => void; onSave?: () => void; onSaveAs?: () => void; onContentChange?: (content: string) => void }> = ({
  dbKey,
  onExecResult,
  initialContent,
  execResult,
  onClearResult,
  onSave,
  onSaveAs,
  onContentChange,
}) => {
  // const [code, setCode] = useState("SELECT * FROM users WHERE id = 1;");
  const [code, setCode] = useState(initialContent || "");
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 从 store 获取内容标签和连接标签
  const contentTabs = useConnectionStore((state) => state.contentTabs);
  const activeContentId = useConnectionStore((state) => state.activeContentId);
  const connectiontabs = useConnectionStore((state) => state.connectiontabs);

  // 获取当前活动的内容标签
  const activeContent = contentTabs.find((t) => t.tabId === activeContentId);

  // 获取当前连接（通过 dbKey 匹配）
  const currentConnection = connectiontabs.find(
    (c) => c.key === dbKey || c.tabId === dbKey,
  );

  // 当 initialContent 变化时更新 code
  useEffect(() => {
    if (initialContent !== undefined) {
      setCode(initialContent);
    }
  }, [initialContent]);

  // 监听外层div尺寸变化，自动layout
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new window.ResizeObserver(() => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    // 初始化时也 layout 一次
    setTimeout(() => {
      editor.layout();
    }, 0);
  };

  function handleFormat() {
    const text = getSelectedOrAllText();
    console.log("[执行 SQL]:", text);
    // setCode(format(code, { language: "sql" }));
    setCode(format(text, { language: "sql" }));
    // 格式化后也触发布局
    setTimeout(() => {
      editorRef.current?.layout();
    }, 0);
  }

  // 获取选中内容或全文
  const getSelectedOrAllText = () => {
    const editor = editorRef.current;
    if (!editor) return "";

    const selection = editor.getSelection();
    const model = editor.getModel();

    if (!model || !selection) return "";

    if (selection.isEmpty()) {
      console.log("没有选中内容");
      return model.getValue(); // ✅ 全部内容
    } else {
      console.log("选中内容:", selection);
      return model.getValueInRange(selection); // ✅ 选中内容
    }
  };

  const handleRun = async () => {
    if (!dbKey) return;
    const text = getSelectedOrAllText();

    // 优先使用内容标签的 databaseName，否则使用连接的 currentDb
    const currentDb =
      activeContent?.databaseName || currentConnection?.currentDb;

    // 检查是否需要添加 USE 语句
    const trimmedText = text.trim().toUpperCase();
    const needsUseDb = currentDb && !trimmedText.startsWith("USE ");
    let finalText = text;
    if (needsUseDb) {
      finalText = `USE \`${currentDb}\`;\n${text}`;
      console.log("[执行 SQL] 添加 USE 语句:", finalText);
    }

    console.log("[执行 SQL] finalText:", finalText);

    console.log("[执行 SQL] trimmedText:", trimmedText);

    // 简单判断 DDL（更可靠的方式是根据执行结果来判断）
    // const isDDLQuery =
    //   trimmedText.startsWith("DROP") ||
    //   trimmedText.startsWith("CREATE") ||
    //   trimmedText.startsWith("ALTER") ||
    //   trimmedText.startsWith("TRUNCATE");

    // const isDMLQuery =
    //   trimmedText.startsWith("DELETE") ||
    //   trimmedText.startsWith("UPDATE") ||
    //   trimmedText.startsWith("INSERT") ||
    //   trimmedText.startsWith("SELECT");

    // console.log("[执行 SQL] isDDLQuery:", isDDLQuery);
    // console.log("[执行 SQL] isDMLQuery:", isDMLQuery);

    const result = await executeSQL(dbKey, finalText);

    // SQL 执行失败
    if (!result.success) {
      // 根据结果判断是 DDL 还是 DML 失败
      const hasData = result.data && (result.data.columns.length > 0 || result.data.rows.length > 0);
      const errorResult: ExecResult = {
        columns: result.data?.columns || [],
        rows: result.data?.rows || [],
        rows_affected: result.data?.rows_affected || 0,
        error: result.message,
        success: false,
        isDDL: !hasData ,
        isDML: hasData ,
      };
      onExecResult?.(errorResult);
      return;
    }

    // SQL 执行成功，根据结果判断类型
    // 如果有 columns 或 rows 数据，则是查询/DML；否则是 DDL
    const hasData = result.data && (result.data.columns.length > 0 || result.data.rows.length > 0);
    const isDDL = !hasData; // 没有结果数据的就是 DDL

    if (isDDL) {
      // DDL 操作成功
      onExecResult?.({
        columns: [],
        rows: [],
        rows_affected: result.data?.rows_affected || 0,
        success: true,
        isDDL: true,
      });

      // 如果是 DROP TABLE，触发事件刷新表列表
      if (trimmedText.startsWith("DROP")) {
        const tableName = text
          .trim()
          .replace(/^DROP\s+TABLE\s+/i, "")
          .replace(/^DROP\s+TABLE\s+IF\s+EXISTS\s+/i, "")
          .replace(/[`;]/g, "")
          .trim();
        const event = new CustomEvent("table-dropped", {
          detail: { dbKey, dbName: currentDb, tableName },
        });
        window.dispatchEvent(event);
      }
      return;
    }

    // DML/查询操作
    const data: ExecResult = result.data as ExecResult;
    const { columns, rows, rows_affected } = data;
    console.log("[执行 SQL] 结果:", columns, rows, rows_affected);

    // 如果查询返回空结果，不显示结果面板
    if (columns.length === 0 && rows.length === 0) {
      return;
    }

    onExecResult?.({ ...data, success: true, isDML: true });
  };

  return (
    // <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative" }}>
    <div className="flex flex-col h-full">
      {/* 工具栏：各种按钮 */}
      <SqlToolbar handleRun={handleRun} handleFormat={handleFormat} handleSave={onSave} handleSaveAs={onSaveAs} />

      <div
        ref={containerRef}
        className="flex-1 min-h-0 relative"
        style={{ width: "100%" }}
      >
        <Editor
          height="100%"
          language="sql"
          value={code}
          onChange={(value) => {
            setCode(value ?? "");
            onContentChange?.(value ?? "");
          }}
          theme="vs-light"
          options={{
            fontSize: 13,
            fontFamily:
              "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
            minimap: { enabled: false },
            wordWrap: "on",
            scrollBeyondLastLine: false,
            lineHeight: 20,
          }}
          onMount={handleEditorDidMount}
        />
      </div>

      {/* 结果区域：仅在有执行结果时展示 */}
      {execResult && (
        <div className="flex-1 min-h-0 border-t overflow-auto p-2 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">执行结果</span>
            <span
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
              onClick={onClearResult}
              title="关闭结果"
            >
              <X className="w-4 h-4" />
            </span>
          </div>
          <div className="flex-1 overflow-auto">
            <EditableResultTable result={execResult} onClose={onClearResult} />
          </div>
        </div>
      )}
    </div>
  );
};
