import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, RefreshCw, Loader2 } from "lucide-react";
import { executeSQL } from "@/db/msyql-client";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

interface TableExportTabProps {
  dbKey: string;
  dbName: string;
  tableName: string;
}

export function TableExportTab({ dbKey, dbName, tableName }: TableExportTabProps) {
  const [loading, setLoading] = useState(false);
  const [createSQL, setCreateSQL] = useState<string>("");

  useEffect(() => {
    loadTableStructure();
  }, [dbKey, dbName, tableName]);

  const loadTableStructure = async () => {
    setLoading(true);
    try {
      const sql = `SHOW CREATE TABLE \`${dbName}\`.\`${tableName}\``;
      const result = await executeSQL(dbKey, sql);

      if (result.success && result.data && result.data.rows.length > 0) {
        const createStatement = result.data.rows[0][1];
        setCreateSQL(createStatement);
      } else {
        toast.error("无法获取表结构: " + result.message);
      }
    } catch (error) {
      toast.error(`获取表结构失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(createSQL);
    toast.success("已复制到剪贴板");
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="font-medium">{tableName}</span>
          <span className="text-sm text-gray-500">表结构</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={loadTableStructure} disabled={loading} title="刷新">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopy} title="复制">
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <SyntaxHighlighter
            language="sql"
            style={oneLight}
            customStyle={{
              margin: 0,
              padding: '16px',
              borderRadius: '8px',
              fontSize: '14px',
              lineHeight: '1.5',
              background: '#f9fafb',
            }}
            showLineNumbers={true}
          >
            {createSQL}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
}
