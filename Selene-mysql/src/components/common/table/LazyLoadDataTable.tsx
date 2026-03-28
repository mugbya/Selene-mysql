import { useEffect, useState, useRef } from "react";
import { ExecResult } from "@/types";
import { ChevronLeft, ChevronRight, Plus, Save, Trash, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { executeSQL } from "@/db/msyql-client";
import { toast } from "sonner";

// 筛选条件类型
type FilterCondition = {
  columnIndex: number;
  value: string;
};

interface EditableDataTableProps {
  loadData: (offset: number, limit: number) => Promise<ExecResult>;
  fetchAllData?: () => Promise<string[][]>;
  onFilterChange?: (filters: FilterCondition[]) => void;
  onAddRow?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  totalCount: number;
  dbName: string;
  tableName: string;
  dbKey: string | null;
  pageSize?: number;
}

export default function LazyLoadDataTable({
  loadData,
  fetchAllData,
  onFilterChange,
  onAddRow,
  onSave,
  onDelete,
  totalCount,
  dbName,
  tableName,
  dbKey,
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
  const [expandedCell, setExpandedCell] = useState<{ row: number; col: number } | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<number, { default: number; max: number }>>({});
  const [filterThRef, setFilterThRef] = useState<HTMLTableHeaderCellElement | null>(null);
  // 主键信息
  const [primaryKey, setPrimaryKey] = useState<string | null>(null);
  const [primaryKeyColumnIndex, setPrimaryKeyColumnIndex] = useState<number | null>(null);
  // 记录原始数据用于对比
  const originalDataRef = useRef<string[][]>([]);
  // 新增行的数据
  const [newRows, setNewRows] = useState<string[][]>([]);
  // 脏行标记（编辑过的行）
  const [dirtyRows, setDirtyRows] = useState<Set<number>>(new Set());

  // 点击外部关闭筛选弹窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeFilterCol !== null && filterThRef) {
        const rect = filterThRef.getBoundingClientRect();
        const isOutside = 
          event.clientX < rect.left || 
          event.clientX > rect.right || 
          event.clientY < rect.top || 
          event.clientY > rect.bottom;
        if (isOutside) {
          setActiveFilterCol(null);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeFilterCol, filterThRef]);

  // 获取所有数据用于分组统计
  useEffect(() => {
    if (fetchAllData) {
      fetchAllData().then(data => {
        setAllDataRows(data);
        const widths: Record<number, { default: number; max: number }> = {};
        data.forEach(row => {
          row.forEach((cell, idx) => {
            const len = cell ? cell.toString().length : 0;
            if (!widths[idx]) {
              widths[idx] = { default: 100, max: 300 };
            }
            if (len > widths[idx].default) {
              widths[idx].default = Math.min(len * 8, 200);
            }
            if (len > widths[idx].max) {
              widths[idx].max = Math.min(len * 8, 600);
            }
          });
        });
        setColumnWidths(widths);
      });
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

  // 获取主键信息
  useEffect(() => {
    if (!dbKey || !dbName || !tableName) return;

    const fetchPrimaryKey = async () => {
      try {
        const sql = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = '${tableName}' AND CONSTRAINT_NAME = 'PRIMARY'`;
        const result = await executeSQL(dbKey, sql);
        if (result.success && result.data && result.data.rows.length > 0) {
          const pk = result.data.rows[0][0];
          setPrimaryKey(pk);
          console.log('[LazyLoadDataTable] Primary key:', pk);
        }
      } catch (err) {
        console.error('[LazyLoadDataTable] Failed to get primary key:', err);
      }
    };

    fetchPrimaryKey();
  }, [dbKey, dbName, tableName]);

  // 当 columns 变化时，查找主键列的索引
  useEffect(() => {
    if (primaryKey && columns.length > 0) {
      const idx = columns.indexOf(primaryKey);
      if (idx >= 0) {
        setPrimaryKeyColumnIndex(idx);
      }
    }
  }, [primaryKey, columns]);

  // 存储原始数据用于对比
  useEffect(() => {
    originalDataRef.current = dataRows;
  }, [dataRows]);

  const handleAddRow = () => {
    if (!primaryKey || primaryKeyColumnIndex === null) {
      toast.error('无法添加行：表没有主键', { closeButton: true });
      return;
    }

    const emptyRow = new Array(columns.length).fill("");
    const newRowIndex = dataRows.length;
    setNewRows((prev) => [...prev, emptyRow]);
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
    if (!primaryKey || primaryKeyColumnIndex === null) {
      toast.error('无法编辑：表没有主键', { closeButton: true });
      return;
    }

    const key = `${rowIdx}-${colIdx}`;
    setEditState((prev) => ({ ...prev, [key]: value }));

    const newDataRows = [...dataRows];
    newDataRows[rowIdx][colIdx] = value;
    setDataRows(newDataRows);

    // 标记该行为脏行（已编辑）
    setDirtyRows(prev => new Set(prev).add(rowIdx));

    // 获取主键值
    const pkValue = newDataRows[rowIdx][primaryKeyColumnIndex];
    if (!pkValue) {
      toast.error('无法编辑：主键值为空', { closeButton: true });
      return;
    }

    // 转义值中的单引号
    const escapedValue = value.replace(/'/g, "''");
    const sql = `UPDATE \`${tableName}\` SET \`${columns[colIdx]}\` = '${escapedValue}' WHERE \`${primaryKey}\` = '${pkValue.replace(/'/g, "''")}'`;

    setSqlOutput((prev) => {
      // 移除该行之前的 UPDATE 语句
      const filtered = prev.filter(
        (s) => !s.includes(`WHERE \`${primaryKey}\` = '${pkValue}'`)
      );
      return [...filtered, sql];
    });
  };

  const handleDelete = async () => {
    if (selectedRows.size === 0) {
      toast.error('请选择要删除的行', { closeButton: true });
      return;
    }

    // 区分新增行和已有行
    const existingRowIndices = Array.from(selectedRows).filter(idx => idx < originalDataRef.current.length);
    const newRowIndices = Array.from(selectedRows).filter(idx => idx >= originalDataRef.current.length);

    // 如果有新增行被选中，直接从本地删除
    if (newRowIndices.length > 0) {
      setNewRows(prev => prev.filter((_, idx) => !newRowIndices.includes(idx + originalDataRef.current.length)));
      setDataRows(prev => prev.filter((_, idx) => !selectedRows.has(idx)));
    }

    // 删除已有行需要执行 SQL
    if (existingRowIndices.length > 0) {
      if (!primaryKey || primaryKeyColumnIndex === null) {
        toast.error('无法删除：表没有主键', { closeButton: true });
        return;
      }

      // 收集要删除的行
      const rowsToDelete = existingRowIndices.map(rowIdx => ({
        rowIdx,
        pkValue: dataRows[rowIdx]?.[primaryKeyColumnIndex]
      })).filter(row => row.pkValue);

      if (rowsToDelete.length === 0) {
        toast.error('无法删除：主键值为空', { closeButton: true });
        return;
      }

      // 执行删除
      let successCount = 0;
      for (const { pkValue } of rowsToDelete) {
        const sql = `DELETE FROM \`${tableName}\` WHERE \`${primaryKey}\` = '${pkValue.replace(/'/g, "''")}'`;
        console.log('[LazyLoadDataTable] Executing delete:', sql);
        const result = await executeSQL(dbKey!, sql);
        if (result.success) {
          successCount++;
        } else {
          toast.error(`删除失败: ${result.message}`, { closeButton: true });
        }
      }

      if (successCount > 0) {
        toast.success(`成功删除 ${successCount} 行`, { closeButton: true });
        // 刷新数据
        fetchData();
      }
    } else {
      // 只是新增行被删除，直接刷新视图
      setDataRows(prev => prev.filter((_, idx) => !selectedRows.has(idx)));
    }

    setSelectedRows(new Set());
  };

  const handleSave = async () => {
    if (!dbKey) {
      toast.error('数据库连接失败', { closeButton: true });
      return;
    }

    if (newRows.length === 0 && dirtyRows.size === 0) {
      toast.info('没有需要保存的更改', { closeButton: true });
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // 处理新增行
    for (const row of newRows) {
      // 检查是否有非空值
      const hasValue = row.some(v => v && v.trim() !== '');
      if (!hasValue) continue;

      // 构建 INSERT 语句
      const columnsList = columns.map(c => `\`${c}\``).join(', ');
      const valuesList = row.map(v => {
        const val = v || '';
        return `'${val.replace(/'/g, "''")}'`;
      }).join(', ');

      const sql = `INSERT INTO \`${tableName}\` (${columnsList}) VALUES (${valuesList})`;
      console.log('[LazyLoadDataTable] Executing insert:', sql);

      const result = await executeSQL(dbKey, sql);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        toast.error(`插入失败: ${result.message}`, { closeButton: true });
      }
    }

    // 处理更新（编辑过的行）
    for (const rowIdx of dirtyRows) {
      const row = dataRows[rowIdx];
      const originalRow = originalDataRef.current[rowIdx];
      if (!row || !originalRow) continue;

      // 找出变更的列
      const changes: string[] = [];
      for (let i = 0; i < columns.length; i++) {
        if (row[i] !== originalRow[i]) {
          const colName = columns[i];
          const newValue = row[i] || '';
          changes.push(`\`${colName}\` = '${newValue.replace(/'/g, "''")}'`);
        }
      }

      if (changes.length === 0) continue;

      // 获取主键值
      const pkValue = row[primaryKeyColumnIndex];
      if (!pkValue) continue;

      const sql = `UPDATE \`${tableName}\` SET ${changes.join(', ')} WHERE \`${primaryKey}\` = '${pkValue.replace(/'/g, "''")}'`;
      console.log('[LazyLoadDataTable] Executing update:', sql);

      const result = await executeSQL(dbKey, sql);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        toast.error(`更新失败: ${result.message}`, { closeButton: true });
      }
    }

    if (successCount > 0) {
      toast.success(`成功保存 ${successCount} 项更改`, { closeButton: true });
      // 刷新数据
      fetchData();
    }

    // 清空待保存的数据
    setNewRows([]);
    setDirtyRows(new Set());
    setSqlOutput([]);
  };

  const maxPage = Math.floor((totalCount - 1) / pageSize);

  return (
    <div className="flex flex-col h-full border rounded-md overflow-hidden">
      {/* 功能栏 */}
      <div className="flex items-center justify-between px-2 py-1 border-b bg-gray-50">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            title="上一页"
          >
            <ChevronLeft className="w-3 h-3" />
          </Button>
          <span className="text-xs text-gray-700">
            {page + 1} / {maxPage + 1}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= maxPage}
            onClick={() => setPage((p) => p + 1)}
            title="下一页"
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
        <div className="text-xs text-gray-500">
          {Object.keys(filters).length > 0 ? (
            <>显示 {filteredRows.length} / {totalCount} 条</>
          ) : (
            <>共 {totalCount} 条</>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={handleAddRow} title="添加行">
            <Plus className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleSave} title="保存">
            <Save className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDelete} title="删除选中行">
            <Trash className="w-3 h-3" />
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
                const isFilterActive = activeFilterCol === idx;
                return (
                <th
                  key={idx}
                  ref={(el) => {
                    if (isFilterActive) setFilterThRef(el);
                  }}
                  className="border px-1 py-1 text-left text-xs font-semibold text-gray-700 whitespace-nowrap relative"
                  style={{ 
                    minWidth: columnWidths[idx]?.default || 100,
                    maxWidth: columnWidths[idx]?.max || 300
                  }}
                >
                  <div className="flex items-center gap-0.5 overflow-hidden">
                    <span className="truncate">{col}</span>
                    <Filter
                      className={`w-3 h-3 flex-shrink-0 cursor-pointer ${hasFilter ? 'text-green-600 fill-green-600' : 'text-gray-400'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilterCol(activeFilterCol === idx ? null : idx);
                      }}
                    />
                  </div>
                  {/* 筛选弹窗 */}
                  {activeFilterCol === idx && (
                    <div className="absolute top-full left-0 z-20 mt-1 bg-white border rounded p-2" style={{ minWidth: 200, maxHeight: 300, overflow: 'auto' }}>
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
                  const isEditing = editingCell?.row === rowIdx && editingCell?.col === colIdx;
                  const isExpanded = expandedCell?.row === rowIdx && expandedCell?.col === colIdx;
                  const colWidth = columnWidths[colIdx];
                  const isOverflowing = colWidth && cell && cell.length * 8 > colWidth.default;

                  return (
                    <td
                      key={colIdx}
                      className={`border px-2 py-1 text-xs text-gray-800 ${isExpanded ? '' : 'whitespace-nowrap'}`}
                      style={{
                        minWidth: colWidth?.default || 100,
                        maxWidth: colWidth?.max || 300,
                        overflow: isExpanded ? 'visible' : 'hidden',
                        textOverflow: isExpanded ? 'clip' : 'ellipsis'
                      }}
                      onClick={() => {
                        if (isExpanded) {
                          setExpandedCell(null);
                        } else if (isOverflowing) {
                          setExpandedCell({ row: rowIdx, col: colIdx });
                        } else {
                          setEditingCell({ row: rowIdx, col: colIdx });
                        }
                      }}
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
