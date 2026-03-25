import { Button } from "@/components/ui/button";
import { ExecResult } from "@/types";
import LazyLoadDataTable from "./table/LazyLoadDataTable";
import { executeSQL } from "@/db/msyql-client";
import { toast } from "sonner";
import { useEffect, useState } from "react";

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

  const getTotal = async(): Promise<void> =>{
      if (!dbkey) {
      throw new Error('数据库连接失败'); // 💥 主动抛出错误，避免 undefined 返回
    }
    const sql = `SELECT count(*) FROM \`${dbName}\`.${tableName};`;
      const result = await executeSQL(dbkey, sql);
      if (!result.success) {
        toast.error(`查询失败 ${result.message}`, { closeButton: true });
        throw new Error(`查询失败 ${result.message}`); // 💥 主动抛出错误，避免 undefined 返回
      }
      if (!result.data) {
        toast.error(`查询未返回数据`, { closeButton: true });
        throw new Error('查询未返回数据'); // 💥 避免返回 undefined
      }
      console.log('result.data', result.data);
      const total = result.data.rows[0][0];
      setTotalCount(Number(total)); 
  }

  useEffect(() => {
    getTotal();
  }, [dbName, tableName]);

  const loadData = async (offset: number, limit: number): Promise<ExecResult> => {
    if (!dbkey) {
      throw new Error('数据库连接失败'); // 💥 主动抛出错误，避免 undefined 返回
    }

    const sql = `SELECT * FROM \`${dbName}\`.${tableName} order by id desc limit ${limit} offset ${offset};`;
    console.log('sql', sql);
    const result = await executeSQL(dbkey, sql);
    if (!result.success) {
      toast.error(`查询失败 ${result.message}`, { closeButton: true });
      throw new Error(`查询失败 ${result.message}`); // 💥 主动抛出错误，避免 undefined 返回
    }
    if (!result.data) {
      toast.error(`查询未返回数据`, { closeButton: true });
      throw new Error('查询未返回数据'); // 💥 避免返回 undefined
    }
    return result.data;
  };

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{tableName}</h2>
        <div className="flex gap-2">
          <Button variant="outline">刷新</Button>
          <Button variant="default">新增数据</Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {/* <EditableDataTable result={execResult} /> */}
        <LazyLoadDataTable dbName={dbName} tableName={tableName} totalCount={totalCount} loadData={loadData} pageSize={20}/>
      </div>
    </div>
  );
};