import { useEffect, useState, useRef } from "react";
import { ExecResult } from "@/types";
import { ChevronLeft, ChevronRight, Plus, Save, Trash, Filter } from "lucide-react";
import { executeSQL } from "@/db/msyql-client";
import { toast } from "sonner";
import { useI18n } from "@/i18n";

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
  const { t } = useI18n();
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

  // 记录原始数据用于对比（只在首次加载时更新）
  const initialLoadDone = useRef(false);

  const fetchData = async () => {
    console.log('[LazyLoadDataTable] fetchData 开始');
    setLoading(true);
    // 在获取新数据前重置状态
    setDirtyRows(new Set());
    setNewRows([]);
    initialLoadDone.current = false;

    const result = await loadData(offset, pageSize);
    console.log('[LazyLoadDataTable] fetchData result:', result);
    if (result) {
      console.log('[LazyLoadDataTable] fetchData 设置 columns:', result.columns, 'rows:', result.rows.length);
      setColumns(result.columns);
      setDataRows(result.rows);
    }
    setLoading(false);
  };

  // 在 dataRows 更新后保存原始数据（只在首次加载后保存）
  useEffect(() => {
    if (!initialLoadDone.current && dataRows.length > 0) {
      originalDataRef.current = dataRows.map(row => [...row]);
      initialLoadDone.current = true;
      console.log('[LazyLoadDataTable] 首次加载数据，保存原始数据');
    }
  }, [dataRows]);

  useEffect(() => {
    console.log('[LazyLoadDataTable] useEffect - dbName:', dbName, 'tableName:', tableName, 'page:', page);
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
        // 使用反引号转义数据库名和表名
        const sql = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = '${dbName.replace(/'/g, "''")}' AND TABLE_NAME = '${tableName.replace(/'/g, "''")}' AND CONSTRAINT_NAME = 'PRIMARY'`;
        console.log('[LazyLoadDataTable] 查询主键 SQL:', sql);
        const result = await executeSQL(dbKey, sql);
        console.log('[LazyLoadDataTable] 主键查询结果:', result);
        if (result.success && result.data && result.data.rows.length > 0) {
          const pk = result.data.rows[0][0];
          console.log('[LazyLoadDataTable] 设置主键:', pk, '当前 columns:', columns);
          setPrimaryKey(pk);

          // 如果 columns 已经加载，立即设置主键列索引
          if (columns.length > 0) {
            const idx = columns.indexOf(pk);
            if (idx >= 0) {
              console.log('[LazyLoadDataTable] 直接设置主键列索引:', idx);
              setPrimaryKeyColumnIndex(idx);
            }
          }
        } else {
          console.log('[LazyLoadDataTable] 未找到主键');
        }
      } catch (err) {
        console.error('[LazyLoadDataTable] Failed to get primary key:', err);
      }
    };

    fetchPrimaryKey();
  }, [dbKey, dbName, tableName]);

  // 当 columns 变化时，查找主键列的索引
  useEffect(() => {
    console.log('[LazyLoadDataTable] columns 更新:', columns, 'primaryKey:', primaryKey, 'columns.length:', columns.length);
    // 延迟一点执行，确保 primaryKey 已经更新
    if (primaryKey && columns.length > 0) {
      const idx = columns.indexOf(primaryKey);
      console.log('[LazyLoadDataTable] 直接查找主键列索引:', idx);
      if (idx >= 0) {
        setPrimaryKeyColumnIndex(idx);
      } else {
        // 可能是大小写问题，尝试不区分大小写匹配
        const lowerIdx = columns.findIndex(col => col.toLowerCase() === primaryKey.toLowerCase());
        console.log('[LazyLoadDataTable] 不区分大小写查找:', lowerIdx);
        if (lowerIdx >= 0) {
          setPrimaryKeyColumnIndex(lowerIdx);
        }
      }
    }
  }, [primaryKey, columns]);

  // 单独监听 columns 更新，确保设置主键索引
  useEffect(() => {
    if (!primaryKey) return;
    if (columns.length === 0) return;

    const idx = columns.indexOf(primaryKey);
    if (idx >= 0 && primaryKeyColumnIndex !== idx) {
      console.log('[LazyLoadDataTable] 通过 columns 更新设置主键索引:', idx);
      setPrimaryKeyColumnIndex(idx);
    }
  }, [columns, primaryKey]);

  const handleAddRow = () => {
    console.log('[LazyLoadDataTable] handleAddRow - columns:', columns, 'columns.length:', columns.length, 'loading:', loading);
    // 如果数据还没加载完成或者 columns 为空，不允许添加
    if (loading) {
      toast.warning(t('error.loadingData'));
      return;
    }
    if (columns.length === 0) {
      toast.warning(t('error.dataNotLoaded'));
      return;
    }

    // 检查主键是否已获取
    if (!primaryKey) {
      toast.warning(t('error.fetchingPK'));
      return;
    }

    const emptyRow = new Array(columns.length).fill("");
    console.log('[LazyLoadDataTable] 创建空行，长度:', emptyRow.length);
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
    console.log('[LazyLoadDataTable] handleCellChange - rowIdx:', rowIdx, 'colIdx:', colIdx, 'value:', value);
    console.log('[LazyLoadDataTable] handleCellChange - primaryKey:', primaryKey, 'primaryKeyColumnIndex:', primaryKeyColumnIndex);
    if (!primaryKey || primaryKeyColumnIndex === null) {
      toast.error(t('error.noPK'));
      return;
    }

    const key = `${rowIdx}-${colIdx}`;
    setEditState((prev) => ({ ...prev, [key]: value }));

    // 深拷贝整个 dataRows，确保不修改原始数据
    const newDataRows = dataRows.map(row => [...row]);
    newDataRows[rowIdx][colIdx] = value;
    setDataRows(newDataRows);

    // 标记该行为脏行（已编辑）
    setDirtyRows(prev => new Set(prev).add(rowIdx));

    // 获取主键值
    const pkValue = newDataRows[rowIdx][primaryKeyColumnIndex];
    if (!pkValue) {
      toast.error(t('error.noPKValue'));
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
      toast.error(t('error.selectRow'));
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
        toast.error(t('error.cannotDelete'));
        return;
      }

      // 收集要删除的行
      const rowsToDelete = existingRowIndices.map(rowIdx => ({
        rowIdx,
        pkValue: dataRows[rowIdx]?.[primaryKeyColumnIndex]
      })).filter(row => row.pkValue);

      if (rowsToDelete.length === 0) {
        toast.error(t('error.cannotDeletePK'));
        return;
      }

      // 执行删除
      let successCount = 0;
      for (const { pkValue } of rowsToDelete) {
        const sql = `DELETE FROM \`${dbName}\`.\`${tableName}\` WHERE \`${primaryKey}\` = '${pkValue.replace(/'/g, "''")}'`;
        console.log('[LazyLoadDataTable] Executing delete:', sql);
        const result = await executeSQL(dbKey!, sql);
        if (result.success) {
          successCount++;
        } else {
          toast.error(t('error.deleteFailed', { message: String(result.message) }));
        }
      }

      if (successCount > 0) {
        toast.success(`成功删除 ${successCount} 行`);
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
    console.log('[LazyLoadDataTable] handleSave - dbKey:', dbKey, 'dirtyRows:', dirtyRows, 'newRows:', newRows);
    if (!dbKey) {
      toast.error(t('error.noConnection'));
      return;
    }

    if (newRows.length === 0 && dirtyRows.size === 0) {
      console.log('[LazyLoadDataTable] 没有需要保存的更改');
      toast.info(t('error.noChanges'));
      return;
    }

    console.log('[LazyLoadDataTable] 开始处理保存, dirtyRows size:', dirtyRows.size, 'newRows length:', newRows.length);

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

      const sql = `INSERT INTO \`${dbName}\`.\`${tableName}\` (${columnsList}) VALUES (${valuesList})`;
      console.log('[LazyLoadDataTable] Executing insert:', sql);

      const result = await executeSQL(dbKey, sql);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        toast.error(t('error.insertFailed', { message: String(result.message) }));
      }
    }

    // 处理更新（编辑过的行）
    for (const rowIdx of dirtyRows) {
      console.log('[LazyLoadDataTable] 处理更新, rowIdx:', rowIdx);
      const row = dataRows[rowIdx];
      const originalRow = originalDataRef.current[rowIdx];
      console.log('[LazyLoadDataTable] row:', row);
      console.log('[LazyLoadDataTable] originalRow:', originalRow);
      if (!row || !originalRow) {
        console.log('[LazyLoadDataTable] 跳过: row 或 originalRow 不存在');
        continue;
      }

      // 找出变更的列
      const changes: string[] = [];
      for (let i = 0; i < columns.length; i++) {
        console.log(`[LazyLoadDataTable] 比较列 ${i}: "${row[i]}" vs "${originalRow[i]}" - 相等: ${row[i] === originalRow[i]}`);
        if (row[i] !== originalRow[i]) {
          const colName = columns[i];
          const newValue = row[i] || '';
          changes.push(`\`${colName}\` = '${newValue.replace(/'/g, "''")}'`);
        }
      }

      console.log('[LazyLoadDataTable] changes:', changes);

      if (changes.length === 0) {
        console.log('[LazyLoadDataTable] 跳过: 没有变更');
        continue;
      }

      // 获取主键值
      console.log('[LazyLoadDataTable] primaryKeyColumnIndex:', primaryKeyColumnIndex, 'primaryKey:', primaryKey);
      const pkValue = row[primaryKeyColumnIndex];
      console.log('[LazyLoadDataTable] pkValue:', pkValue);
      if (!pkValue) {
        console.log('[LazyLoadDataTable] 跳过: 主键值为空');
        continue;
      }

      const sql = `UPDATE \`${dbName}\`.\`${tableName}\` SET ${changes.join(', ')} WHERE \`${primaryKey}\` = '${pkValue.replace(/'/g, "''")}'`;
      console.log('[LazyLoadDataTable] Executing update:', sql);

      const result = await executeSQL(dbKey, sql);
      console.log('[LazyLoadDataTable] update result:', result);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        toast.error(t('error.updateFailed', { message: String(result.message) }));
      }
    }

    if (successCount > 0) {
      toast.success(`成功保存 ${successCount} 项更改`);
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
      <div className="flex items-center justify-between px-2 py-1 border-b bg-muted">
        <div className="flex items-center gap-1">
          <div
            className={`p-1 rounded cursor-pointer ${page === 0 ? 'opacity-50' : 'hover:bg-accent'}`}
            onClick={() => page > 0 && setPage((p) => Math.max(0, p - 1))}
            title={t('pagination.prev')}
          >
            <ChevronLeft className="w-4 h-4" />
          </div>
          <span className="text-xs text-foreground">
            {page + 1} / {maxPage + 1}
          </span>
          <div
            className={`p-1 rounded cursor-pointer ${page >= maxPage ? 'opacity-50' : 'hover:bg-accent'}`}
            onClick={() => page < maxPage && setPage((p) => p + 1)}
            title={t('pagination.next')}
          >
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {Object.keys(filters).length > 0 ? (
            <>{t('pagination.totalRows', { show: filteredRows.length, total: totalCount })}</>
          ) : (
            <>{t('pagination.totalRecords', { total: totalCount })}</>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div onClick={handleAddRow} className="p-1 hover:bg-accent rounded cursor-pointer" title={t('common.add')}>
            <Plus className="w-4 h-4" />
          </div>
          <div onClick={handleSave} className="p-1 hover:bg-accent rounded cursor-pointer" title={t('common.save')}>
            <Save className="w-4 h-4" />
          </div>
          <div onClick={handleDelete} className="p-1 hover:bg-accent rounded cursor-pointer" title={t('common.delete')}>
            <Trash className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 表格内容 */}
      <div className="overflow-auto flex-1 font-mono-tight">
        <table className="min-w-full table-fixed border-collapse">
          <thead className="bg-muted sticky top-0 z-10">
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
                  className="border px-1 py-1 text-left text-xs font-semibold text-foreground whitespace-nowrap relative"
                  style={{ 
                    minWidth: columnWidths[idx]?.default || 100,
                    maxWidth: columnWidths[idx]?.max || 300
                  }}
                >
                  <div className="flex items-center gap-0.5 overflow-hidden">
                    <span className="truncate">{col}</span>
                    <Filter
                      className={`w-3 h-3 flex-shrink-0 cursor-pointer ${hasFilter ? 'text-green-600 fill-green-600' : 'text-muted-foreground'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilterCol(activeFilterCol === idx ? null : idx);
                      }}
                    />
                  </div>
                  {/* 筛选弹窗 */}
                  {activeFilterCol === idx && (
                    <div className="absolute top-full left-0 z-20 mt-1 bg-background border border-border rounded p-2" style={{ minWidth: 200, maxHeight: 300, overflow: 'auto' }}>
                      <div className="flex items-center justify-between mb-1 pb-1 border-b">
                        <span className="text-xs font-medium">{col}</span>
                        {hasFilter && (
                          <button
                            className="text-xs text-primary hover:underline"
                            onClick={() => clearFilter(idx)}
                          >
                            清除
                          </button>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        {colValues.map(([value, count]) => (
                          <label key={value} className="flex items-center gap-1 cursor-pointer hover:bg-accent py-0.5">
                            <input
                              type="checkbox"
                              className="w-3 h-3"
                              checked={filters[idx]?.has(value) || false}
                              onChange={() => toggleFilterValue(idx, value)}
                            />
                            <span className="text-xs truncate flex-1" title={value}>{value}</span>
                            <span className="text-xs text-muted-foreground">({count})</span>
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
                className={`even:bg-muted ${selectedRows.has(rowIdx) ? 'bg-primary/10' : ''}`}
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
                      className={`border px-2 py-1 text-xs text-foreground ${isExpanded ? '' : 'whitespace-nowrap'}`}
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
                  className="text-center text-xs text-muted-foreground py-6"
                >
                  {t('common.noData')}
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="text-center text-xs text-muted-foreground py-6"
                >
                  {t('common.loading')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* SQL 编辑区 */}
      {sqlOutput.length > 0 && (
        <div className="border-t bg-muted p-2 text-xs">
          <label className="block font-medium text-foreground mb-1">
            生成的 SQL：
          </label>
          <textarea
            value={sqlOutput.join("\n")}
            onChange={(e) => setSqlOutput(e.target.value.split("\n"))}
            rows={6}
            className="w-full border rounded p-2 font-mono text-xs text-foreground"
          />
        </div>
      )}
    </div>
  );
}
