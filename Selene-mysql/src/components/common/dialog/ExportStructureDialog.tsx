import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { executeSQL } from "@/db/msyql-client";

interface ExportStructureDialogProps {
  open: boolean;
  onClose: () => void;
  dbKey: string;
  dbName: string;
  tableName: string;
}

export function ExportStructureDialog({
  open,
  onClose,
  dbKey,
  dbName,
  tableName,
}: ExportStructureDialogProps) {
  const [loading, setLoading] = useState(false);
  const [createSQL, setCreateSQL] = useState<string>("");

  useEffect(() => {
    if (open && tableName) {
      loadTableStructure();
    }
  }, [open, tableName]);

  const loadTableStructure = async () => {
    setLoading(true);
    try {
      // 直接在表名前指定数据库名，避免 USE 语句在不同连接上不生效的问题
      const sql = `SHOW CREATE TABLE \`${dbName}\`.\`${tableName}\``;
      const result = await executeSQL(dbKey, sql);

      if (result.success && result.data && result.data.rows.length > 0) {
        // MySQL 返回两列: Table, Create Table
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>导出表结构 - {tableName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : (
            <>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="w-4 h-4 mr-1" /> 复制
                </Button>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-auto max-h-[400px] text-xs font-mono">
                {createSQL}
              </pre>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
