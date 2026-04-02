import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Upload, Loader2, FileText } from "lucide-react";
import { executeSQL } from "@/db/msyql-client";
import { useI18n } from "@/i18n";
import * as dialog from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  dbKey: string;
  dbName: string;
}

export function ImportDialog({
  open,
  onClose,
  dbKey,
  dbName,
}: ImportDialogProps) {
  const { t } = useI18n();
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [sqlContent, setSqlContent] = useState<string>("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedFile("");
      setFileName("");
      setSqlContent("");
    }
  }, [open]);

  const handleSelectFile = async () => {
    try {
      const filePath = await dialog.open({
        multiple: false,
        filters: [{
          name: 'SQL Files',
          extensions: ['sql']
        }, {
          name: 'Text Files',
          extensions: ['txt']
        }, {
          name: 'All Files',
          extensions: ['*']
        }]
      });

      console.log("[ImportDialog] filePath:", filePath);

      if (filePath && typeof filePath === 'string') {
        setSelectedFile(filePath);
        // 提取文件名
        const name = filePath.split(/[/\\]/).pop() || "unknown.sql";
        setFileName(name);

        // 读取文件内容并直接导入
        const content = await readTextFile(filePath);
        setSqlContent(content);
        // 自动开始导入
        await handleImportFile(content);
      }
    } catch (error) {
      toast.error(t('import.selectFailed') + `: ${error}`);
    }
  };

  const handleImportFile = async (content: string) => {
    setImporting(true);

    try {
      // 按分号分割SQL语句（简单处理）
      const statements = content
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      let successCount = 0;
      let failedCount = 0;

      for (const statement of statements) {
        if (statement.length > 0) {
          const result = await executeSQL(dbKey, statement);
          if (result.success) {
            successCount++;
          } else {
            failedCount++;
            console.error('[Import] SQL执行失败:', statement, result.message);
          }
        }
      }

      if (failedCount > 0) {
        toast.warning(t('import.partialSuccess', { success: successCount, failed: failedCount }));
      } else {
        toast.success(t('import.success', { count: successCount }));
      }

      onClose();
    } catch (error) {
      toast.error(t('import.failed') + `: ${error}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('import.title')} - {dbName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 文件选择 */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {selectedFile ? (
              <div className="flex items-center justify-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium">{fileName}</span>
                {importing ? (
                  <span className="text-sm text-muted-foreground">{t('import.importing')}</span>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleSelectFile}>
                    {t('import.change')}
                  </Button>
                )}
              </div>
            ) : (
              <Button onClick={handleSelectFile} variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                {t('import.selectFile')}
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={importing}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}