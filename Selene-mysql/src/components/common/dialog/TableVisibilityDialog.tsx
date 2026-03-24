import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";

interface TableVisibilityDialogProps {
  open: boolean;
  onClose: () => void;
  tables: string[];
  visibleTables: string[];
  onSave: (selected: string[]) => void;
}

/**
 * 表显示控制弹窗
 * @param param0 
 * @returns 
 */
export function TableVisibilityDialog({
  open,
  onClose,
  tables,
  visibleTables,
  onSave,
}: TableVisibilityDialogProps) {
  const [selected, setSelected] = useState<string[]>(visibleTables);

  useEffect(() => {
    if (open) {
      setSelected(visibleTables);
    }
  }, [open, visibleTables]);
  
  const toggle = (table: string) => {
    setSelected((prev) =>
      prev.includes(table) ? prev.filter((t) => t !== table) : [...prev, table]
    );
  };
  //   const toggle = (table: string, checked: boolean | "indeterminate") => {
  //     if (checked === true) {
  //       setSelected((prev) => [...prev, table]);
  //     } else {
  //       setSelected((prev) => prev.filter((t) => t !== table));
  //     }
  //   };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>表显示控制</DialogTitle>
        </DialogHeader>

        {/* ✅ 全选/清除操作区 */}
        <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">
            已选中 {selected.length} / {tables.length} 个
            </span>
            <div className="space-x-2">
            <button
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                onClick={() => setSelected([...tables])}
            >
                全选
            </button>
            <button
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                onClick={() => setSelected([])}
            >
                清除
            </button>
            </div>
        </div>

        {/* ✅ 表列表 */}
        <div className="space-y-2 max-h-[300px] overflow-auto">
          {tables.map((table) => (
            <label
              key={table}
              className="flex items-center space-x-2 p-1 rounded hover:bg-gray-100 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(table)}
                onChange={() => toggle(table)}
              />
              <span>{table}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1 bg-gray-300 rounded">
            取消
          </button>
          <button
            onClick={() => {
              onSave(selected);
              onClose();
            }}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            保存
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
