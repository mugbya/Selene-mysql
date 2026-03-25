import React, { useEffect, useState } from "react";
import { ExecResult } from "@/types";
import { ChevronLeft, ChevronRight, Plus, Save, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditableDataTableProps {
  loadData: (offset: number, limit: number) => Promise<ExecResult>;
  totalCount: number;
  dbName: string;
  tableName: string;
  pageSize?: number;
}

export default function LazyLoadDataTable({
  loadData,
  totalCount,
  dbName,
  tableName,
  pageSize = 50,
}: EditableDataTableProps) {
  const [columns, setColumns] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<string[][]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [editState, setEditState] = useState<Record<string, string>>({});
  const [sqlOutput, setSqlOutput] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  const offset = page * pageSize;

  const fetchData = async () => {
    setLoading(true);
    const result = await loadData(offset, pageSize);
    if (result) {
      setColumns(result.columns);
      setDataRows(result.rows);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [dbName, tableName, page]);

  const handleAddRow = () => {
    const emptyRow = new Array(columns.length).fill("");
    setDataRows((prev) => [...prev, emptyRow]);
  };

  const handleCheckboxChange = (rowIdx: number) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowIdx)) newSet.delete(rowIdx);
      else newSet.add(rowIdx);
      return newSet;
    });
  };

  const handleCellChange = (rowIdx: number, colIdx: number, value: string) => {
    const key = `${rowIdx}-${colIdx}`;
    setEditState((prev) => ({ ...prev, [key]: value }));

    const newDataRows = [...dataRows];
    newDataRows[rowIdx][colIdx] = value;
    setDataRows(newDataRows);

    const sql = `UPDATE ${tableName} SET ${columns[colIdx]} = '${value}' WHERE id = ${rowIdx};`;

    setSqlOutput((prev) => {
      const filtered = prev.filter(
        (s) =>
          !s.includes(`WHERE id = ${rowIdx}`) ||
          !s.includes(`${columns[colIdx]}`)
      );
      return [...filtered, sql];
    });
  };

  const handleDelete = () => {
    const deleteSqls = Array.from(selectedRows).map(
      (rowIdx) => `DELETE FROM ${tableName} WHERE id = ${rowIdx};`
    );
    setSqlOutput((prev) => [...prev, ...deleteSqls]);

    setDataRows((prev) => prev.filter((_, idx) => !selectedRows.has(idx)));
    setSelectedRows(new Set());
  };

  const handleSave = () => {
    alert("执行 SQL:\n" + sqlOutput.join("\n"));
  };

  const maxPage = Math.floor((totalCount - 1) / pageSize);

  return (
    <div className="flex flex-col h-full border rounded-md overflow-hidden">
      {/* 功能栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs text-gray-700">
            第 {page + 1} 页 / 共 {maxPage + 1} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= maxPage}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-xs text-gray-500">总共 {totalCount} 条</div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleAddRow}>
            <Plus className="w-4 h-4 mr-1" /> 添加
          </Button>
          <Button size="sm" variant="outline" onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" /> 保存
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDelete}>
            <Trash className="w-4 h-4 mr-1" /> 删除
          </Button>
        </div>
      </div>

      {/* 表格内容 */}
      <div className="overflow-auto flex-1 font-mono-tight">
        <table className="min-w-full table-fixed border-collapse">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="border px-1 py-1 text-xs font-semibold">✓</th>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="border px-2 py-1 text-left text-xs font-semibold text-gray-700 whitespace-nowrap"
                  style={{ minWidth: 120 }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={`even:bg-gray-50 ${selectedRows.has(rowIdx) ? 'bg-blue-100' : ''}`}
              >
                <td className="border px-1 text-center">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(rowIdx)}
                    onChange={() => handleCheckboxChange(rowIdx)}
                  />
                </td>
                {row.map((cell, colIdx) => {
                  const isEditing =
                    editingCell?.row === rowIdx && editingCell?.col === colIdx;

                  return (
                    <td
                      key={colIdx}
                      className="border px-2 py-1 text-xs text-gray-800 whitespace-nowrap"
                      onClick={() =>
                        setEditingCell({ row: rowIdx, col: colIdx })
                      }
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          className="w-full h-full text-xs outline-none border-none p-0"
                          value={row[colIdx]}
                          onChange={(e) =>
                            handleCellChange(rowIdx, colIdx, e.target.value)
                          }
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") setEditingCell(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        // <span>{cell}</span>
                        <span className="inline-block min-h-[1.5rem]">
                          {cell || "\u00A0"}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {dataRows.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="text-center text-xs text-gray-400 py-6"
                >
                  暂无数据
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="text-center text-xs text-gray-400 py-6"
                >
                  加载中...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* SQL 编辑区 */}
      {sqlOutput.length > 0 && (
        <div className="border-t bg-gray-50 p-2 text-xs">
          <label className="block font-medium text-gray-700 mb-1">
            生成的 SQL：
          </label>
          <textarea
            value={sqlOutput.join("\n")}
            onChange={(e) => setSqlOutput(e.target.value.split("\n"))}
            rows={6}
            className="w-full border rounded p-2 font-mono text-xs text-gray-800"
          />
        </div>
      )}
    </div>
  );
}
