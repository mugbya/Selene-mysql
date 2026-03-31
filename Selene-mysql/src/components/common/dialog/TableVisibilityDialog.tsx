import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Check, X, CheckSquare, XCircle, Save, List } from "lucide-react";

interface TableVisibilityDialogProps {
  open: boolean;
  onClose: () => void;
  tables: string[];
  visibleTables: string[];
  tablesCount?: number;
  onLoadTables?: () => void;
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
  tablesCount,
  onLoadTables,
  onSave,
}: TableVisibilityDialogProps) {
  const [selected, setSelected] = useState<string[]>(visibleTables);

  useEffect(() => {
    if (open) {
      setSelected(visibleTables);
      // 如果没有表数据且有加载函数，则触发加载
      if (tables.length === 0 && onLoadTables) {
        onLoadTables();
      }
    }
  }, [open, visibleTables, tables.length, onLoadTables]);

  const toggle = (table: string) => {
    setSelected((prev) =>
      prev.includes(table) ? prev.filter((t) => t !== table) : [...prev, table]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md" style={{ padding: '16px' }}>
        <DialogHeader style={{ marginBottom: '12px' }}>
          <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <List className="w-4 h-4" />
            表显示控制
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            选择需要在树形视图中显示的表
          </p>
        </DialogHeader>

        {/* 操作栏 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            padding: '8px 12px',
            backgroundColor: 'var(--muted)',
            borderRadius: '6px',
          }}
        >
          <span className="text-sm" style={{ color: 'var(--foreground)' }}>
            已选择 <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{selected.length}</span> / {tablesCount ?? tables.length} 个
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <div
              className="p-1.5 hover:bg-accent rounded cursor-pointer"
              onClick={() => setSelected(tables.length > 0 ? [...tables] : (tablesCount ? Array.from({ length: tablesCount }, (_, i) => `table_${i}`) : []))}
              title="全选"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <CheckSquare className="w-4 h-4" style={{ color: 'var(--foreground)' }} />
            </div>
            <div
              className="p-1.5 hover:bg-accent rounded cursor-pointer"
              onClick={() => setSelected([])}
              title="清除"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <XCircle className="w-4 h-4" style={{ color: 'var(--foreground)' }} />
            </div>
          </div>
        </div>

        {/* 表列表 */}
        <div
          style={{
            maxHeight: '300px',
            overflowY: 'auto',
            border: '1px solid var(--border)',
            borderRadius: '6px',
          }}
        >
          {tables.length > 0 ? tables.map((table) => (
            <div
              key={table}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                backgroundColor: selected.includes(table) ? 'var(--accent)' : 'transparent',
              }}
              onClick={() => toggle(table)}
              onMouseEnter={(e) => {
                if (!selected.includes(table)) {
                  e.currentTarget.style.backgroundColor = 'var(--muted)';
                }
              }}
              onMouseLeave={(e) => {
                if (!selected.includes(table)) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid var(--border)',
                  borderRadius: '3px',
                  backgroundColor: selected.includes(table) ? 'var(--primary)' : 'transparent',
                }}
              >
                {selected.includes(table) && <Check className="w-3 h-3" style={{ color: 'var(--primary-foreground)' }} />}
              </div>
              <span className="text-sm" style={{ color: 'var(--foreground)' }}>{table}</span>
            </div>
          )) : tablesCount ? (
            <div style={{ padding: '12px', textAlign: 'center', color: 'var(--muted-foreground)' }}>
              正在加载表列表...
            </div>
          ) : null}
        </div>

        {/* 底部操作 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
          <div
            onClick={onClose}
            className="p-2 hover:bg-accent rounded cursor-pointer"
            title="取消"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X className="w-4 h-4" style={{ color: 'var(--foreground)' }} />
          </div>
          <div
            onClick={() => {
              onSave(selected);
              onClose();
            }}
            className="p-2 hover:bg-accent rounded cursor-pointer"
            title="保存"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Save className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}