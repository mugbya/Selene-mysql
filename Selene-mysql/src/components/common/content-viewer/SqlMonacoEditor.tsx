import React, { useRef, useState, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { format } from "sql-formatter";
import { editor as MonacoEditor } from "monaco-editor";
import SqlToolbar from "../toolbar/SqlToolbar";
import { executeSQL } from "@/db/msyql-client";
import { ExecResult, ExecResultProps } from "@/types";
import { toast } from "sonner";

// export default function SqlMonacoEditor({dbKey}: { dbKey: string | null }) {
export const SqlMonacoEditor: React.FC<ExecResultProps> = ({ dbKey, onExecResult, initialContent }) => {
  // const [code, setCode] = useState("SELECT * FROM users WHERE id = 1;");
  const [code, setCode] = useState(initialContent || "");
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  const handleRun = async() => {
    if (!dbKey) return;
    const text = getSelectedOrAllText();
    console.log("[执行 SQL]:", text);
    const result = await executeSQL(dbKey, text);
    if (!result.success) {
        toast.error(`查询失败 ${result.message}`, { closeButton: true });
        return;
    }
    if (!result.data) {
      toast.error(`查询未返回数据`, { closeButton: true });
        return;
    }
    const data:ExecResult = result.data;
    const { columns, rows, rows_affected  } = data;
    console.log("[执行 SQL] 结果:", columns, rows, rows_affected);
    // toast.success(`查询成功`, { closeButton: true });
    onExecResult?.(data); // ✅ 返回结果给父组件
    // toast.success(`查询成功 ${columns.length} 列 ${rows.length} 行`, { closeButton: true });
  };

  return (
    // <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative" }}>
    <div className="flex flex-col h-full">
      {/* 工具栏：各种按钮 */}
      <SqlToolbar handleRun={handleRun} handleFormat={handleFormat}/>

      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", position: "relative" }}
      >
        <Editor
          height="100%"
          language="sql"
          value={code}
          onChange={(value) => setCode(value ?? "")}
          theme="vs-light"
          options={{
            fontSize: 13,
            fontFamily: "'SF Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
            minimap: { enabled: false },
            wordWrap: "on",
            scrollBeyondLastLine: false,
            lineHeight: 20,
          }}
          onMount={handleEditorDidMount}
        />
      </div>
    </div>
  );
}
