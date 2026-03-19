import React, { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { format } from "sql-formatter";

export default function SqlEditor() {
  const [sqlCode, setSqlCode] = useState("SELECT * FROM users;");

  return (
    <div>
      <CodeMirror
        value={sqlCode}
        height="300px"
        extensions={[sql()]}
        onChange={setSqlCode}
        theme="light"
      />
      <button
        onClick={() => setSqlCode(format(sqlCode))}
        style={{ marginTop: 8 }}
        className="px-3 py-1 rounded border bg-blue-500 text-white"
      >
        格式化
      </button>
    </div>
  );
}