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
import { useI18n } from "@/i18n";

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
  const { t } = useI18n();

  const openTable = async () => {
    if (!dbkey) {
      console.error(t('error.noConnection'));
      return;
    }
    console.log(`[打开表] ${dbName}.${tableName}`);
    // 根据 action 执行不同操作
    const text = `SELECT * FROM \`${dbName}\`.${tableName} order by id desc limit 10;`;
    const result = await executeSQL(dbkey, text);

    if (!result.success) {
      // 查询失败，打开查询 tab 显示错误
      const errorMsg = String(result.message);
      openContentTab({
        tabId: `query_${dbName}.${tableName}`,
        title: `${dbName} - ${tableName}`,
        tabType: "query",
        content: `-- ${t('error.queryFailed')}\n-- ${errorMsg}\n\n${text}`,
        databaseName: `${dbName}`,
        tableName: `${tableName}`,
        isSaved: false,
        dbKey: dbkey,
      });
      return;
    }

    if (!result.data) {
      console.error(t('query.noResult'));
      return;
    }

    openContentTab({
      tabId: `data_${dbName}.${tableName}`,
      title: `${dbName} - ${tableName}`,
      tabType: "tableView",
      databaseName: `${dbName}`,
      tableName: `${tableName}`,
      // execResult: result.data,
      // queryId: crypto.randomUUID(), // 如果是已有的查询，可保存其 ID
      isSaved: false,
      dbKey: dbkey,
    });
  };

  const dropTable = async () => {
    console.log("[dropTable] 开始删除, dbkey:", dbkey, "dbName:", dbName, "tableName:", tableName);
    if (!dbkey) {
      toast.error(t('error.noConnection'));
      return;
    }

    // 直接删除，不使用 confirm 对话框
    console.log("[dropTable] 删除表:", dbName, tableName);
    try {
      // 使用完整的数据库.表名
      // 发送事件通知刷新表列表
      window.dispatchEvent(new CustomEvent('table-dropped', { detail: { dbKey: dbkey, dbName, tableName } }));
      const result = await executeSQL(dbkey, `DROP TABLE \`${dbName}\`.\`${tableName}\``);
      console.log("[dropTable] 删除结果:", result);
      if (result.success) {
        toast.success(t('table.deleteSuccess', { tableName }));
      } else {
        toast.error(t('table.deleteFailed', { message: result.message }));
      }
      // 发送事件通知刷新表列表（无论成功失败都发送，让前端更新状态）
      window.dispatchEvent(new CustomEvent('table-dropped', { detail: { dbKey: dbkey, dbName, tableName } }));
    } catch (error) {
      console.error("[dropTable] 错误:", error);
      toast.error(t('table.deleteFailed', { message: String(error) }));
    }
  };

  const modifyTableStructure  = async () => {
    if (!dbkey) {
      toast.error(t('error.noConnection'), { closeButton: true });
      return;
    }
    console.log(`[设计表] ${dbName}.${tableName}`);

    // 1. 查询列信息
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
      WHERE table_schema = '${dbName}' AND table_name = '${tableName}'
      ORDER BY ordinal_position;`;

    console.log(text);
    const result = await executeSQL(dbkey, text);
    if (!result.success) {
      toast.error(`${t('error.queryFailed')} ${result.message}`, { closeButton: true });
      return;
    }
    if (!result.data) {
      toast.error(t('query.noResult'), { closeButton: true });
      return;
    }

    // 2. 查询主键信息
    const pkSql = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = '${tableName}' AND CONSTRAINT_NAME = 'PRIMARY';`;
    const pkResult = await executeSQL(dbkey, pkSql);
    const primaryKeys = new Set<string>();
    if (pkResult.success && pkResult.data) {
      pkResult.data.rows.forEach(row => primaryKeys.add(row[0]));
    }

    // 3. 查询唯一键信息
    const ukSql = `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = '${tableName}' AND CONSTRAINT_NAME != 'PRIMARY'
      AND CONSTRAINT_NAME IN (SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME = '${tableName}' AND CONSTRAINT_TYPE = 'UNIQUE');`;
    const ukResult = await executeSQL(dbkey, ukSql);
    const uniqueKeys = new Set<string>();
    if (ukResult.success && ukResult.data) {
      ukResult.data.rows.forEach(row => uniqueKeys.add(row[0]));
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

      const colName = row[columnIndexMap["COLUMN_NAME"]];
      const isPK = primaryKeys.has(colName) ? "YES" : "";
      const isUK = uniqueKeys.has(colName) ? "YES" : "";

      return [
        row[columnIndexMap["COLUMN_NAME"]],
        row[columnIndexMap["DATA_TYPE"]],
        length,
        isPK,
        isUK,
        row[columnIndexMap["IS_NULLABLE"]],
        row[columnIndexMap["COLUMN_DEFAULT"]],
        row[columnIndexMap["COLUMN_COMMENT"]],
      ];
    });

    const new_result = {
      columns: [
        t('table.columnName'),
        t('table.type'),
        t('table.length'),
        t('table.primary'),
        t('table.unique'),
        t('table.null'),
        t('table.default'),
        t('table.comment'),
      ],
      rows: newRows,
      rows_affected: result.data.rows_affected,
    }

    openContentTab({
      tabId: `struct_${dbName}.${tableName}`,
      title: `${t('table.design')} ${dbName} - ${tableName}`,
      tabType: "tableStructure",
      databaseName: `${dbName}`,
      tableName: `${tableName}`,
      execResult: new_result,
      // queryId: crypto.randomUUID(), // 如果是已有的查询，可保存其 ID
      isSaved: false,
      dbKey: dbkey,
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
      return `-- ${t('table.sqliteNotSupported')}`;
    }
    return '';
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent cursor-pointer"
            onDoubleClick={() => openTable()}
          >
            <Table className="w-4 h-4 text-primary" />
            <span>{tableName}</span>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-48">
          {/* <ContextMenuLabel>表操作</ContextMenuLabel> */}
          <ContextMenuItem onClick={() => openTable()}>{t('table.open')}</ContextMenuItem>
          <ContextMenuItem onClick={() => modifyTableStructure()}>{t('table.design')}</ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => { console.log("delete clicked"); dropTable(); }}>
            {t('table.delete')}
          </ContextMenuItem>
          {/* <ContextMenuItem onClick={() => openTable("truncate")}>清空表</ContextMenuItem> */}

          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => {
            if (!dbkey) {
              toast.error(t('error.noConnection'));
              return;
            }
            openContentTab({
              tabId: `export_${dbName}_${tableName}`,
              title: `${t('table.export')} ${tableName}`,
              tabType: "tableExport",
              databaseName: dbName,
              tableName: tableName,
              dbKey: dbkey,
            });
          }}>{t('table.export')}</ContextMenuItem>
          {/* <ContextMenuSeparator /> */}
          {/* <ContextMenuItem onClick={() => handleAction("control")}>表显示控制</ContextMenuItem> */}
          {/* <ContextMenuSeparator /> */}
          {/* <ContextMenuItem onClick={() => openTable("refresh")}>刷新</ContextMenuItem> */}

          {/* <ContextMenuItem onClick={() => handleAction("export")}>转储SQL文件</ContextMenuItem> */}
        </ContextMenuContent>
      </ContextMenu>
    </>
  );
}
