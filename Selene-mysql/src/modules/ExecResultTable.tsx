import React, { useState } from "react";
import { Save, MinusCircle, X } from "lucide-react";
import { ExecResult } from "@/types";

// export type ExecResult = {
//   columns: string[];
//   rows: string[][];
//   rows_affected: number;
// };

interface EditableResultTableProps {
  result: ExecResult;
  onDelete?: (rows: number[]) => void;
  onEdit?: (rowIndex: number, updated: string[]) => void;
  onClose?: () => void;
}

export const EditableResultTable: React.FC<EditableResultTableProps> = ({ result, onDelete, onEdit, onClose }) => {
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

  const handleEdit = (index: number) => {
    setEditingRow(index);
    setEditedRowData([...result.rows[index]]);
  };

  const handleSaveEdit = () => {
    if (editingRow !== null && onEdit) {
      onEdit(editingRow, editedRowData);
    }
    setEditingRow(null);
  };

  const handleDeleteSelected = () => {
    if (onDelete && selectedRows.length > 0) {
      onDelete(selectedRows);
      setSelectedRows([]);
    }
  };

  return (
    <div className="h-full flex flex-col text-xs">
      {/* 顶部操作栏 */}
      <div className="p-2 border-b bg-white flex gap-2 items-center justify-between">
        {/* <div className="flex gap-2">
          <button
            onClick={handleSaveEdit}
            className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
          >
            <Save className="w-4 h-4" /> 保存
          </button>
          <button
            onClick={handleDeleteSelected}
            className="flex items-center gap-1 text-red-600 hover:underline text-sm"
          >
            <MinusCircle className="w-4 h-4" /> 删除选中
          </button>
        </div> */}

        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black flex items-center"
            title="关闭结果表"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

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

          <thead className="bg-gray-100 sticky top-0 z-10">
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
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
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
                        className="w-full bg-yellow-50 border rounded px-1 text-xs"
                        value={editedRowData[colIndex]}
                        onChange={(e) => {
                          const copy = [...editedRowData];
                          copy[colIndex] = e.target.value;
                          setEditedRowData(copy);
                        }}
                      />
                    ) : (
                      <span title={cell}>{cell}</span>
                    )}
                  </td>
                ))}
                {/* <td className="px-2 py-1 text-center">
                  {editingRow === rowIndex ? (
                    <button onClick={handleSaveEdit} className="text-blue-600 hover:underline text-xs">
                      保存
                    </button>
                  ) : (
                    <button onClick={() => handleEdit(rowIndex)} className="text-blue-600 hover:underline text-xs">
                      编辑
                    </button>
                  )}
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t p-2 bg-white flex justify-between items-center text-xs">
        <span>共 {result.rows.length} 条记录，已选中 {selectedRows.length} 条</span>
      </div>
    </div>
  );
};
