import { Button } from "@/components/ui/button";
import { ExecResult } from "@/types";
import LazyLoadDataTable from "./table/LazyLoadDataTable";
import { executeSQL } from "@/db/msyql-client";
import { toast } from "sonner";
import { useEffect, useState } from "react";

// 筛选条件类型
type FilterCondition = {
  columnIndex: number;
  value: string;
};

export const TableViewTab = ({
  dbkey,
  dbName,
  tableName,
}: {
  dbkey: string | null;
  dbName: string;
  tableName: string;
}) => {

  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  // 构建带筛选条件的 WHERE 子句
  const buildWhereClause = (filterList: FilterCondition[], columns: string[]) => {
    if (filterList.length === 0) return '';

    // 按列分组
    const colFilters: Record<number, string[]> = {};
    filterList.forEach(f => {
      if (!colFilters[f.columnIndex]) {
        colFilters[f.columnIndex] = [];
      }
      colFilters[f.columnIndex].push(f.value);
    });

    // 为每列生成条件
    const conditions = Object.entries(colFilters).map(([colIdx, values]) => {
      const colName = columns[parseInt(colIdx)] || `column_${colIdx}`;
      if (values.length === 1) {
        return `\`${colName}\` = '${values[0].replace(/'/g, "''")}'`;
      } else {
        const inValues = values.map(v => `'${v.replace(/'/g, "''")}'`).join(', ');
        return `\`${colName}\` IN (${inValues})`;
      }
    });

    return 'WHERE ' + conditions.join(' AND ');
  };

  // 获取总数（带筛选）
  const getTotal = async (filterList: FilterCondition[] = []): Promise<void> => {
    if (!dbkey) return;

    let sql = `SELECT count(*) FROM \`${dbName}\`.${tableName}`;

    if (filterList.length > 0) {
      // 先获取列名
      const colsResult = await executeSQL(dbkey, `SELECT * FROM \`${dbName}\`.${tableName} LIMIT 1`);
      if (colsResult.success && colsResult.data) {
        sql += ' ' + buildWhereClause(filterList, colsResult.data.columns);
      }
    }

    const result = await executeSQL(dbkey, sql);
    if (!result.success || !result.data) {
      return;
    }
    const total = result.data.rows[0][0];
    setTotalCount(Number(total));
  };

  useEffect(() => {
    getTotal();
    setCurrentPage(0);
  }, [dbName, tableName]);

  // 筛选变化时重新查询
  const handleFilterChange = (newFilters: FilterCondition[]) => {
    console.log('[TableViewTab] handleFilterChange:', newFilters);
    setFilters(newFilters);
    getTotal(newFilters);
    setCurrentPage(0);
  };

  const loadData = async (offset: number, limit: number): Promise<ExecResult> => {
    if (!dbkey) {
      throw new Error('数据库连接失败');
    }

    // 使用当前最新的 filters
    const currentFilters = filters;

    let sql = `SELECT * FROM \`${dbName}\`.${tableName}`;

    // 添加筛选条件
    if (currentFilters.length > 0) {
      // 先获取列名
      const colsResult = await executeSQL(dbkey, `SELECT * FROM \`${dbName}\`.${tableName} LIMIT 1`);
      if (colsResult.success && colsResult.data) {
        sql += ' ' + buildWhereClause(currentFilters, colsResult.data.columns);
      }
    }

    sql += ` order by id desc limit ${limit} offset ${offset};`;
    console.log('[TableViewTab] loadData sql:', sql);
    const result = await executeSQL(dbkey, sql);
    if (!result.success) {
      toast.error(`查询失败 ${result.message}`, { closeButton: true });
      throw new Error(`查询失败 ${result.message}`);
    }
    if (!result.data) {
      toast.error(`查询未返回数据`, { closeButton: true });
      throw new Error('查询未返回数据');
    }
    return result.data;
  };

  // 获取所有数据用于分组统计
  const fetchAllData = async (): Promise<string[][]> => {
    if (!dbkey) return [];
    const sql = `SELECT * FROM \`${dbName}\`.${tableName};`;
    const result = await executeSQL(dbkey, sql);
    if (result.success && result.data) {
      return result.data.rows;
    }
    return [];
  };

  // 刷新
  const handleRefresh = () => {
    getTotal(filters);
  };

  // 清空所有筛选
  const handleClearFilters = () => {
    setFilters([]);
    getTotal([]);
    // 通知子组件清空筛选状态并重新加载
    setTimeout(() => {
      const clearEvent = new CustomEvent('clear-table-filters', { detail: { reload: true } });
      window.dispatchEvent(clearEvent);
    }, 100);
  };

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{tableName}</h2>
        <div className="flex gap-2">
          {filters.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              清空筛选
            </Button>
          )}
          <Button variant="outline" onClick={handleRefresh}>刷新</Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <LazyLoadDataTable
          dbKey={dbkey}
          dbName={dbName}
          tableName={tableName}
          totalCount={totalCount}
          loadData={loadData}
          fetchAllData={fetchAllData}
          onFilterChange={handleFilterChange}
          pageSize={20}
        />
      </div>
    </div>
  );
};
