// import CodeMirror from '@uiw/react-codemirror';
// import { javascript } from '@codemirror/lang-javascript';

// export default function CodeMirrorViewer({
//                                            code,
//                                            language,
//                                            editable,
//                                            onChange,
//                                          }: {
//   code: string;
//   language: string;
//   editable: boolean;
//   onChange: (newCode: string) => void;
// }) {
//   const extensions = language === 'javascript' ? [javascript()] : [];

//   return (
//       <CodeMirror
//           className="text-left"  // Tailwind 用户
//           value={code}
//           // min-height = "90rem"
//           minHeight='20rem'
//           maxHeight="100%"
//           // height="100%"
//           // height="30rem" // 每行大约 1rem 高
//           // basicSetup={{
//           //   lineNumbers: true,
//           //   highlightActiveLine: true,
//           // }}
//           basicSetup={true} // 或直接设为 true 使用默认配置
//           editable={editable}
//           extensions={extensions}
//           onChange={(value) => onChange(value)}
//       />
//   );
// }


import React, { useCallback, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { keymap } from '@codemirror/view';
import { EditorView } from '@codemirror/view';

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: (value: string) => void;
  height?: string;
  language?: 'sql' | 'js' | 'json'; // 可扩展语言类型
}

const CodeMirrorEditor: React.FC<CodeMirrorEditorProps> = ({
  value,
  onChange,
  onSave,
  height = '200px',
  language = 'sql',
}) => {
  // 保存快捷键 Ctrl+S / Cmd+S
  const handleSaveKey = useCallback(() => {
    if (onSave) onSave(value);
    return true; // 阻止默认行为
  }, [value, onSave]);

  const extensions = [
    sql(),
    EditorView.lineWrapping,
    EditorView.theme({
'&': {
    height: '100%', // 或固定值，如 '300px'
    backgroundColor: '#fff',
    overflow: 'auto',
  },
  '.cm-editor': {
    height: '100%',
  },
  '.cm-scroller': {
    height: '100%',
    overflow: 'auto',
  },
  '.cm-content': {
    minHeight: '100%',
    paddingTop: '8px',
    paddingBottom: '8px',
  },
    }),
    keymap.of([
      {
        key: 'Mod-s', // Cmd+S (Mac) or Ctrl+S
        run: handleSaveKey,
      },
    ]),
  ];

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      // height={height}
      height="300px"
      extensions={extensions}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: true,
      }}
      theme="light"
    />
  );
};

export default CodeMirrorEditor;