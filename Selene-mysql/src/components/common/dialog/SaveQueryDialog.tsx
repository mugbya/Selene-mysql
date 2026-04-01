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
import { useI18n } from "@/i18n";

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
  const { t } = useI18n();
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
            {mode === 'save' ? t('query.save') : t('query.rename')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'save'
              ? t('query.saveDesc')
              : t('query.renameDesc')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Input
              id="queryName"
              placeholder={t('query.name')}
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
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {mode === 'save' ? t('common.save') : t('common.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
