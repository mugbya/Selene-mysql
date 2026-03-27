import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SavedQuery } from "@/types/connection";

interface SaveQueryDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  initialName?: string;
  mode?: 'save' | 'rename';
}

export function SaveQueryDialog({
  open,
  onClose,
  onSave,
  initialName = "",
  mode = 'save',
}: SaveQueryDialogProps) {
  const [name, setName] = useState(initialName);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      setName("");
      onClose();
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setName(initialName);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'save' ? '保存查询' : '重命名查询'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'save'
              ? '为您的查询输入一个名称以便保存到查询列表中。'
              : '输入新的查询名称。'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Input
              id="queryName"
              placeholder="查询名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {mode === 'save' ? '保存' : '确定'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
