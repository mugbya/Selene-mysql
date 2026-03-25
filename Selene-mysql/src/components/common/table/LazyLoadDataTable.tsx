import { useEffect, useState } from "react";
import { ExecResult } from "@/types";
import { ChevronLeft, ChevronRight, Plus, Save, Trash, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

// 筛选条件类型
type FilterCondition = {
  columnIndex: number;
  value: string;
};

interface EditableDataTableProps {
  loadData: (offset: number, limit: number) => Promise<ExecResult>;
  fetchAllData?: () => Promise<string[][]>;
  onFilterChange?: (filters: FilterCondition[]) => void;
  totalCount: number;
  dbName: string;
  tableName: string;
  pageSize?: number;
}

export default function LazyLoadDataTable({
  loadData,
  fetchAllData,
  onFilterChange,
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
  // 筛选状态：key 为列索引，value 为 Set<选中的值>
  const [filters, setFilters] = useState<Record<number, Set<string>>>({});
  const [activeFilterCol, setActiveFilterCol] = useState<number | null>(null);
  const [allDataRows, setAllDataRows] = useState<string[][]>([]);

  // 获取所有数据用于分组统计
  useEffect(() => {
    if (fetchAllData) {
      fetchAllData().then(data => setAllDataRows(data));
    }
  }, [fetchAllData, tableName]);

  // 计算每个列的唯一值及其数量（基于所有数据）
  const getColumnValues = (colIdx: number) => {
    const valueCounts = new Map<string, number>();
    const rowsToCount = allDataRows.length > 0 ? allDataRows : dataRows;
    rowsToCount.forEach(row => {
      const value = row[colIdx]?.toString() || "(空)";
      valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
    });
    return Array.from(valueCounts.entries())
      .sort((a, b) => b[1] - a[1]) // 按数量降序
      .slice(0, 10); // 只取前10个
  };

  // 筛选过滤后的数据
  const filteredRows = dataRows.filter(row =>
    Object.entries(filters).every(([colIdx, selectedValues]) => {
      if (selectedValues.size === 0) return true;
      const cellValue = row[parseInt(colIdx)]?.toString() || "(空)";
      return selectedValues.has(cellValue);
    })
  );

  // 切换某列的筛选值
  const toggleFilterValue = (colIdx: number, value: string) => {
    // 先构建新的筛选状态
    const newFilters: Record<number, Set<string>> = {};
    // 复制现有的筛选条件
    Object.keys(filters).forEach(key => {
      newFilters[parseInt(key)] = new Set(filters[parseInt(key)]);
    });

    // 获取或创建该列的筛选集合
    let colSet = newFilters[colIdx] ? new Set(newFilters[colIdx]) : new Set<string>();

    if (colSet.has(value)) {
      colSet.delete(value);
      if (colSet.size === 0) {
        delete newFilters[colIdx];
      } else {
        newFilters[colIdx] = colSet;
      }
    } else {
      colSet.add(value);
      newFilters[colIdx] = colSet;
    }

    // 更新前端状态
    setFilters(newFilters);

    // 触发后端重新查询
    if (onFilterChange) {
      const filterConditions: FilterCondition[] = [];
      Object.entries(newFilters).forEach(([colIdx, values]) => {
        if (values.size > 0) {
          values.forEach(v => {
            filterConditions.push({
              columnIndex: parseInt(colIdx),
              value: v
            });
          });
        }
      });
      onFilterChange(filterConditions);
    }
  };

  // 清除某列的筛选
  const clearFilter = (colIdx: number) => {
    const newFilters = { ...filters };
    delete newFilters[colIdx];
    setFilters(newFilters);

    // 触发后端重新查询
    if (onFilterChange) {
      const filterConditions: FilterCondition[] = [];
      Object.entries(newFilters).forEach(([idx, values]) => {
        if (values.size > 0) {
          values.forEach(v => {
            filterConditions.push({
              columnIndex: parseInt(idx),
              value: v
            });
          });
        }
      });
      onFilterChange(filterConditions);
    }
  };

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

  // 监听清空筛选事件
  useEffect(() => {
    const handleClearFilters = (event: Event) => {
      const customEvent = event as CustomEvent;
      setFilters({});
      // 如果需要重新加载数据
      if (customEvent.detail?.reload) {
        fetchData();
      }
    };
    window.addEventListener('clear-table-filters', handleClearFilters);
    return () => {
      window.removeEventListener('clear-table-filters', handleClearFilters);
    };
  }, []);

  // 当筛选变化时，重新加载数据
  useEffect(() => {
    if (onFilterChange) {
      // 如果有 onFilterChange，说明是通过筛选触发的，需要重置页码并重新加载
      setPage(0);
      fetchData();
    }
  }, [filters]);

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
        <div className="text-xs text-gray-500">
          {Object.keys(filters).length > 0 ? (
            <>显示 {filteredRows.length} / {totalCount} 条</>
          ) : (
            <>总共 {totalCount} 条</>
          )}
        </div>
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
              {columns.map((col, idx) => {
                const colValues = getColumnValues(idx);
                const hasFilter = filters[idx] && filters[idx].size > 0;
                return (
                <th
                  key={idx}
                  className="border px-1 py-1 text-left text-xs font-semibold text-gray-700 whitespace-nowrap relative"
                  style={{ minWidth: 120 }}
                >
                  <div className="flex items-center gap-1">
                    <span className="flex-1 truncate">{col}</span>
                    <button
                      className={`p-0.5 ${hasFilter ? 'text-green-600' : 'text-gray-300'}`}
                      onClick={() => {
                        setActiveFilterCol(activeFilterCol === idx ? null : idx);
                      }}
                      title="筛选"
                    >
                      <Filter className={`w-3 h-3 ${hasFilter ? 'fill-green-600' : ''}`} />
                    </button>
                  </div>
                  {/* 筛选弹窗 */}
                  {activeFilterCol === idx && (
                    <div className="absolute top-full left-0 z-20 mt-1 bg-white border rounded shadow-lg p-2" style={{ minWidth: 200, maxHeight: 300, overflow: 'auto' }}>
                      <div className="flex items-center justify-between mb-1 pb-1 border-b">
                        <span className="text-xs font-medium">{col}</span>
                        {hasFilter && (
                          <button
                            className="text-xs text-blue-600 hover:underline"
                            onClick={() => clearFilter(idx)}
                          >
                            清除
                          </button>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        {colValues.map(([value, count]) => (
                          <label key={value} className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 py-0.5">
                            <input
                              type="checkbox"
                              className="w-3 h-3"
                              checked={filters[idx]?.has(value) || false}
                              onChange={() => toggleFilterValue(idx, value)}
                            />
                            <span className="text-xs truncate flex-1" title={value}>{value}</span>
                            <span className="text-xs text-gray-400">({count})</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </th>
              )})}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, rowIdx) => (
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
