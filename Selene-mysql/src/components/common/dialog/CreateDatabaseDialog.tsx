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
  const [dbName, setDbName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!dbName.trim()) {
      toast.error("请输入数据库名称");
      return;
    }

    // 验证数据库名称格式（允许包含连字符）
    const namePattern = /^[a-zA-Z_][a-zA-Z0-9_-]*$/;
    if (!namePattern.test(dbName)) {
      toast.error("数据库名称只能包含字母、数字、下划线和连字符，且不能以数字开头");
      return;
    }

    setLoading(true);
    try {
      const sql = `CREATE DATABASE \`${dbName}\``;
      const result = await executeSQL(dbKey, sql);

      if (result.success) {
        toast.success(`数据库 ${dbName} 创建成功`);
        setDbName("");
        onSuccess(dbName);
        onClose();
      } else {
        toast.error("创建失败: " + result.message);
      }
    } catch (error) {
      toast.error(`创建失败: ${error}`);
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
          <DialogTitle>新建数据库</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">数据库名称</label>
            <Input
              placeholder="请输入数据库名称"
              value={dbName}
              onChange={(e) => setDbName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
            <p className="text-xs text-gray-500">
              只能包含字母、数字、下划线和连字符，且不能以数字开头
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button onClick={handleCreate} disabled={loading || !dbName.trim()}>
            {loading ? "创建中..." : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
