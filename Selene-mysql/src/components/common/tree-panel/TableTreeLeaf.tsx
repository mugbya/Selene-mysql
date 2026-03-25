import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { executeSQL } from "@/db/msyql-client";
import { Table, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConnectionStore } from "@/store/useConnectionStore";
import { ColumnSchema } from "@/types";

export function TableTreeLeaf({
  dbkey,
  dbName,
  tableName,
}: {
  dbkey: string | null;
  dbName: string;
  tableName: string;
}) {
  const { openContentTab } = useConnectionStore();

  const openTable = async () => {
    if (!dbkey) {
      toast.error(`数据库连接失败`, { closeButton: true });
      return;
    }
    console.log(`[打开表] ${dbName}.${tableName}`);
    // 根据 action 执行不同操作
    const text = `SELECT * FROM \`${dbName}\`.${tableName} order by id desc limit 10;`;
    const result = await executeSQL(dbkey, text);
    if (!result.success) {
      toast.error(`查询失败 ${result.message}`, { closeButton: true });
      return;
    }
    if (!result.data) {
      toast.error(`查询未返回数据`, { closeButton: true });
      return;
    }
    openContentTab({
      tabId: `${dbName}.${tableName}`,
      title: `${tableName}`,
      tabType: "tableView",
      databaseName: `${dbName}`,
      tableName: `${tableName}`,
      // execResult: result.data,
      // queryId: crypto.randomUUID(), // 如果是已有的查询，可保存其 ID
      isSaved: false,
    });
  };

  const dropTable = async () => {
    console.log("[dropTable] 开始删除, dbkey:", dbkey, "dbName:", dbName, "tableName:", tableName);
    if (!dbkey) {
      toast.error("数据库连接失败");
      return;
    }

    // 直接删除，不使用 confirm 对话框
    console.log("[dropTable] 删除表:", dbName, tableName);
    try {
      // 使用完整的数据库.表名
      const result = await executeSQL(dbkey, `DROP TABLE \`${dbName}\`.\`${tableName}\``);
      console.log("[dropTable] 删除结果:", result);
      if (result.success) {
        toast.success(`表 ${tableName} 删除成功`);
        // 发送事件通知刷新表列表
        window.dispatchEvent(new CustomEvent('table-dropped', { detail: { dbKey: dbkey, dbName } }));
      } else {
        toast.error("删除失败: " + result.message);
      }
    } catch (error) {
      console.error("[dropTable] 错误:", error);
      toast.error("删除失败: " + error);
    }
  };

  const modifyTableStructure  = async () => {
    if (!dbkey) {
      toast.error(`数据库连接失败`, { closeButton: true });
      return;
    }
    console.log(`[设计表] ${dbName}.${tableName}`);
    const text = `SELECT
        column_name,
        data_type,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        is_nullable,
        column_default,
        column_comment
      FROM information_schema.columns
      WHERE table_schema = '${dbName}' AND table_name = '${tableName}';`;
    
      // 在 MySQL 中，information_schema.columns 有 column_comment 字段，可以直接查询：
    console.log(text);
    const result = await executeSQL(dbkey, text);
    if (!result.success) {
      toast.error(`查询失败 ${result.message}`, { closeButton: true });
      return;
    }
    if (!result.data) {
      toast.error(`查询未返回数据`, { closeButton: true });
      return;
    }
    // console.log(result.data);
    const columnIndexMap = Object.fromEntries(result.data.columns.map((col, idx) => [col, idx]));
    const newRows = result.data.rows.map((row) => {
      const charLen = row[columnIndexMap["CHARACTER_MAXIMUM_LENGTH"]];
      const numPrec = row[columnIndexMap["NUMERIC_PRECISION"]];
      const numScale = row[columnIndexMap["NUMERIC_SCALE"]];

      const length =
        charLen !== null
          ? charLen
          : numPrec !== null
          ? numScale !== null
            ? `${numPrec},${numScale}`
            : `${numPrec}`
          : "";

      return [
        row[columnIndexMap["COLUMN_NAME"]],
        row[columnIndexMap["DATA_TYPE"]],
        length,
        row[columnIndexMap["IS_NULLABLE"]],
        row[columnIndexMap["COLUMN_DEFAULT"]],
        row[columnIndexMap["COLUMN_COMMENT"]],
      ];
    });

    const new_result = {
      columns: [
        "字段名",
        "类型",
        "长度", // ← 合并字段
        "可空",
        "默认值",
        "注释"
      ],
      rows: newRows,
      rows_affected: result.data.rows_affected,
    }

    openContentTab({
      tabId: `${dbName}.${tableName}`,
      title: `设计${tableName}`,
      tabType: "tableStructure",
      databaseName: `${dbName}`,
      tableName: `${tableName}`,
      execResult: new_result,
      // queryId: crypto.randomUUID(), // 如果是已有的查询，可保存其 ID
      isSaved: false,
    });
  }

  function generateAlterSQL(dbType: 'mysql' | 'postgres' | 'sqlite' | 'mssql', table: string, column: ColumnSchema): string {
    const lengthPart = column.length ? `(${column.length})` : '';
    const typeExpr = `${column.type.toUpperCase()}${lengthPart}`;

    if (dbType === 'mysql') {
      return `ALTER TABLE ${table} MODIFY COLUMN ${column.name} ${typeExpr};`;
    } else if (dbType === 'postgres') {
      return `ALTER TABLE ${table} ALTER COLUMN ${column.name} TYPE ${typeExpr};`;
    } else if (dbType === 'mssql') {
      return `ALTER TABLE ${table} ALTER COLUMN ${column.name} ${typeExpr};`;
    } else if (dbType === 'sqlite') {
      return '-- SQLite 不支持直接修改字段，需重建表';
    }
    return '';
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <div className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer">
            <Table className="w-4 h-4 text-gray-500" />
            <span>{tableName}</span>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-48">
          {/* <ContextMenuLabel>表操作</ContextMenuLabel> */}
          <ContextMenuItem onClick={() => openTable()}>打开表</ContextMenuItem>
          <ContextMenuItem onClick={() => modifyTableStructure()}>设计表</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => { console.log("delete clicked"); dropTable(); }}>
            删除表
          </ContextMenuItem>
          {/* <ContextMenuItem onClick={() => openTable("truncate")}>清空表</ContextMenuItem> */}

          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => {
            if (!dbkey) {
              toast.error("数据库连接失败");
              return;
            }
            openContentTab({
              tabId: `export_${dbName}_${tableName}`,
              title: `导出 ${tableName}`,
              tabType: "tableExport",
              databaseName: dbName,
              tableName: tableName,
            });
          }}>导出表结构</ContextMenuItem>
          <ContextMenuSeparator />
          {/* <ContextMenuItem onClick={() => handleAction("control")}>表显示控制</ContextMenuItem> */}
          <ContextMenuSeparator />
          {/* <ContextMenuItem onClick={() => openTable("refresh")}>刷新</ContextMenuItem> */}

          {/* <ContextMenuItem onClick={() => handleAction("export")}>转储SQL文件</ContextMenuItem> */}
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
}
