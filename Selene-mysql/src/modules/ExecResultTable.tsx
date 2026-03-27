import React, { useState } from "react";
import { Save, MinusCircle, X } from "lucide-react";
import { ExecResult } from "@/types";

// 判断是否是 DDL 操作
const isDDL = (text: string): boolean => {
  const upper = text.trim().toUpperCase();
  return upper.startsWith('CREATE') ||
         upper.startsWith('ALTER') ||
         upper.startsWith('DROP') ||
         upper.startsWith('TRUNCATE');
};

// DDL 操作结果组件
const DDLResultView: React.FC<{ result: ExecResult }> = ({ result }) => {
  return (
    <div className="flex-none p-2">
      {result.success === false ? (
        <div className="text-red-600">
          <div className="font-medium">操作失败</div>
          {result.error && <div className="text-sm mt-1 whitespace-pre-wrap">{result.error}</div>}
        </div>
      ) : (
        <div className="text-green-600">操作执行成功</div>
      )}
    </div>
  );
};

// DML 操作结果组件（查询结果表格）
const DMLResultView: React.FC<EditableResultTableProps> = ({ result, onDelete, onEdit, onClose }) => {
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
    <div className="flex-1 flex flex-col">
      {/* 顶部操作栏 */}
      <div className="p-2 border-b bg-white flex gap-2 items-center justify-between">
        {result.success === false ? (
          <span className="text-red-600 font-medium">执行失败</span>
        ) : (
          <span className="text-green-600 font-medium">执行成功</span>
        )}

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

      {/* 错误详情 */}
      {result.error && (
        <div className="flex-1 overflow-auto p-4 bg-red-50">
          <div className="text-red-600 whitespace-pre-wrap">{result.error}</div>
        </div>
      )}

      {/* 查询结果表格 */}
      {!result.error && result.columns.length > 0 && (
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
                <th className="px-2 py-1 text-center">操作</th>
              </tr>
            </thead>

            <tbody>
              {result.rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={selectedRows.includes(rowIndex) ? "bg-blue-50" : "hover:bg-gray-50"}
                >
                  <td className="px-2 py-1 border-r text-center">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(rowIndex)}
                      onChange={() => toggleSelect(rowIndex)}
                    />
                  </td>
                  {editingRow === rowIndex ? (
                    <>
                      {editedRowData.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-2 py-1 border-r">
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) =>
                              setEditedRowData((prev) => {
                                const next = [...prev];
                                next[cellIndex] = e.target.value;
                                return next;
                              })
                            }
                            className="w-full border rounded px-1"
                          />
                        </td>
                      ))}
                      <td className="px-2 py-1 text-center flex gap-1">
                        <button onClick={handleSaveEdit} className="text-green-500 hover:text-green-700">
                          <Save className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingRow(null)} className="text-gray-500 hover:text-gray-700">
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-2 py-1 border-r whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                          {String(cell ?? '')}
                        </td>
                      ))}
                      <td className="px-2 py-1 text-center flex gap-1">
                        {onEdit && (
                          <button onClick={() => handleEdit(rowIndex)} className="text-blue-500 hover:text-blue-700">
                            <Save className="w-4 h-4" />
                          </button>
                        )}
                        {onDelete && (
                          <button onClick={() => onDelete([rowIndex])} className="text-red-500 hover:text-red-700">
                            <MinusCircle className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 底部统计 */}
      <div className="border-t p-2 bg-white flex justify-between items-center text-xs">
        <span>共 {result.rows.length} 条记录，已选中 {selectedRows.length} 条</span>
        {selectedRows.length > 0 && onDelete && (
          <button
            onClick={handleDeleteSelected}
            className="text-red-500 hover:text-red-700"
          >
            删除选中
          </button>
        )}
      </div>

      
    </div>
  );
};

interface EditableResultTableProps {
  result: ExecResult;
  onDelete?: (rows: number[]) => void;
  onEdit?: (rowIndex: number, updated: string[]) => void;
  onClose?: () => void;
}

export const EditableResultTable: React.FC<EditableResultTableProps> = ({ result, onDelete, onEdit, onClose }) => {
  // 根据 SQL 类型判断是 DDL 还是 DML
  console.log('isDDLOperation', result.isDDL);

  // DDL 操作：只显示结果
  if (result.isDDL) {
    return <DDLResultView result={result} />;
  }

  // DML 操作：显示完整表格
  return <DMLResultView result={result} onDelete={onDelete} onEdit={onEdit} onClose={onClose} />;
};
