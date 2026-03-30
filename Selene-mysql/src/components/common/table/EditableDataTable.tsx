// components/EditableDataTable.tsx
import React, { useState } from "react";
import { ExecResult } from "@/types";

export interface ColumnDef {
  key: string;
  label: string;
  width?: string; // optional: "150px"
  render?: (row: any) => React.ReactNode;
}

interface EditableDataTableProps {
  result: ExecResult;
  // columns: ColumnDef[];
  // data: any[];
  // selectable?: boolean;
  // onSelectChange?: (keys: string[]) => void;
}

export const EditableDataTable: React.FC<EditableDataTableProps> = ({
  result,
  // columns,
  // data,
  // selectable = false,
  // onSelectChange,
}) => {
  // const [selected, setSelected] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editedRowData, setEditedRowData] = useState<string[]>([]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

    const startResize = (e: React.MouseEvent, col: string) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = columnWidths[col] || 120;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      setColumnWidths((prev) => ({ ...prev, [col]: Math.max(60, startWidth + delta) }));
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // const toggleRow = (key: string) => {
  //   let newSelected: string[];
  //   if (selected.includes(key)) {
  //     newSelected = selected.filter((k) => k !== key);
  //   } else {
  //     newSelected = [...selected, key];
  //   }
  //   setSelected(newSelected);
  //   onSelectChange?.(newSelected);
  // };

  const toggleSelect = (index: number) => {
    setSelectedRows((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleAll = () => {
    if (selectedRows.length === result.rows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(result.rows.map((_, i) => i));
    }
  };

  return (
    <div className="h-full flex flex-col text-xs">
      <div className="flex-1 overflow-auto">
        <table className="table-fixed border-collapse w-full">
          <colgroup>
            <col className="w-8" />
            {result.columns.map((col) => (
              <col
                key={col}
                style={{ width: columnWidths[col] || 120 }}
              />
            ))}
            <col className="w-24" />
          </colgroup>

          <thead className="bg-muted sticky top-0 z-10">
            <tr>
              <th className="px-2 py-1 text-center">
                <input type="checkbox" onChange={toggleAll} checked={selectedRows.length === result.rows.length} />
              </th>
              {result.columns.map((col) => (
                <th
                  key={col}
                  className="px-2 py-1 border-r text-left whitespace-nowrap relative group"
                >
                  <div className="flex items-center justify-between">
                    <span>{col}</span>
                    <div
                      onMouseDown={(e) => startResize(e, col)}
                      className="w-1 h-full cursor-col-resize absolute right-0 top-0"
                    />
                  </div>
                </th>
              ))}
              {/* <th className="px-2 py-1">操作</th> */}
            </tr>
          </thead>

          <tbody>
            {result.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-background" : "bg-muted"}>
                <td className="px-2 py-1 text-center">
                  <input
                    type="checkbox"
                    checked={selectedRows.includes(rowIndex)}
                    onChange={() => toggleSelect(rowIndex)}
                  />
                </td>
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-2 py-1 border-t border-r max-w-[200px] overflow-hidden whitespace-nowrap text-ellipsis"
                  >
                    {editingRow === rowIndex ? (
                      <input
                        className="w-full bg-yellow-50/50 border rounded px-1 text-xs"
                        value={editedRowData[colIndex]}
                        onChange={(e) => {
                          const copy = [...editedRowData];
                          copy[colIndex] = e.target.value;
                          setEditedRowData(copy);
                        }}
                      />
                    ) : (
                      <span title={cell != null ? String(cell) : undefined}>{cell}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t p-2 bg-muted flex justify-between items-center text-xs">
        <span>共 {result.rows.length} 条记录，已选中 {selectedRows.length} 条</span>
      </div>
    </div>
  );
};