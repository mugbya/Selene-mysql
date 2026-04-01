import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, RefreshCw, Loader2 } from "lucide-react";
import { executeSQL } from "@/db/msyql-client";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useI18n } from "@/i18n";

interface TableExportTabProps {
  dbKey: string;
  dbName: string;
  tableName: string;
}

export function TableExportTab({ dbKey, dbName, tableName }: TableExportTabProps) {
  const { t } = useI18n();
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
        toast.error(t('table.getStructureFailed', { message: result.message }));
      }
    } catch (error) {
      toast.error(t('table.getStructureError', { message: String(error) }));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(createSQL);
    toast.success(t('table.copiedToClipboard'));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">{tableName}</span>
          <span className="text-sm text-muted-foreground">{t('table.structureLabel')}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={loadTableStructure} disabled={loading} title={t('common.refresh')}>
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleCopy} title={t('export.copy')}>
            <Copy className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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
