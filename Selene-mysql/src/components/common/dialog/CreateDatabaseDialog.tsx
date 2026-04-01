import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { executeSQL } from "@/db/msyql-client";
import { useI18n } from "@/i18n";

interface CreateDatabaseDialogProps {
  open: boolean;
  onClose: () => void;
  dbKey: string;
  onSuccess: (dbName: string) => void;
}

export function CreateDatabaseDialog({
  open,
  onClose,
  dbKey,
  onSuccess,
}: CreateDatabaseDialogProps) {
  const { t } = useI18n();
  const [dbName, setDbName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!dbName.trim()) {
      toast.error(t('common.inputRequired'));
      return;
    }

    // 验证数据库名称格式（允许包含连字符）
    const namePattern = /^[a-zA-Z_][a-zA-Z0-9_-]*$/;
    if (!namePattern.test(dbName)) {
      toast.error(t('common.invalidName'));
      return;
    }

    setLoading(true);
    try {
      const sql = `CREATE DATABASE \`${dbName}\``;
      const result = await executeSQL(dbKey, sql);

      if (result.success) {
        toast.success(t('database.created'));
        setDbName("");
        onSuccess(dbName);
        onClose();
      } else {
        toast.error(t('common.error') + ": " + result.message);
      }
    } catch (error) {
      toast.error(t('common.error') + `: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setDbName("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('database.new')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('database.name')}</label>
            <Input
              placeholder={t('database.name')}
              value={dbName}
              onChange={(e) => setDbName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
            <p className="text-xs text-muted-foreground">
              {t('database.nameHint')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleCreate} disabled={loading || !dbName.trim()}>
            {loading ? t('common.creating') : t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
