import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { executeSQL } from "@/db/msyql-client";
import { fetchTables } from "@/db/msyql-client";
import { nanoid } from "nanoid";
import { Trash2, Plus, Play } from "lucide-react";

interface Column {
  id: string;
  name: string;
  type: string;
  length: string;
  primaryKey: boolean;
  autoIncrement: boolean;
  notNull: boolean;
  default: string;
  comment: string;
}

interface CreateTableTabProps {
  dbKey: string;
  dbName: string | undefined;
  tableName?: string | undefined;
}

const COLUMN_TYPES = [
  "INT",
  "BIGINT",
  "SMALLINT",
  "TINYINT",
  "VARCHAR",
  "CHAR",
  "TEXT",
  "LONGTEXT",
  "DATETIME",
  "DATE",
  "TIME",
  "TIMESTAMP",
  "DECIMAL",
  "FLOAT",
  "DOUBLE",
  "BLOB",
];

const DEFAULT_COLUMN: Column = {
  id: "",
  name: "",
  type: "VARCHAR",
  length: "255",
  primaryKey: false,
  autoIncrement: false,
  notNull: true,
  default: "",
  comment: "",
};

export function CreateTableTab({ dbKey, dbName, tableName }: CreateTableTabProps) {
  const effectiveDbName = dbName || "";
  const [tableNameInput, setTableNameInput] = useState(tableName || "");
  const [columns, setColumns] = useState<Column[]>([
    { ...DEFAULT_COLUMN, id: nanoid() },
  ]);
  const [loading, setLoading] = useState(false);

  const addColumn = () => {
    setColumns([...columns, { ...DEFAULT_COLUMN, id: nanoid() }]);
  };

  const removeColumn = (id: string) => {
    if (columns.length <= 1) {
      toast.error("至少需要一个字段");
      return;
    }
    setColumns(columns.filter((col) => col.id !== id));
  };

  const updateColumn = (id: string, field: keyof Column, value: string | boolean) => {
    setColumns(
      columns.map((col) =>
        col.id === id ? { ...col, [field]: value } : col
      )
    );
  };

  const generateSQL = (): string => {
    // 收集主键字段
    const primaryKeys = columns.filter((col) => col.primaryKey);
    const hasAutoIncrement = columns.some((col) => col.autoIncrement);

    // 检查是否有自增字段但没有主键
    const autoIncrementWithoutPK = hasAutoIncrement && primaryKeys.length === 0;
    const pkCount = primaryKeys.length + (autoIncrementWithoutPK ? 1 : 0);

    const columnDefs: string[] = [];

    columns.forEach((col) => {
      const parts: string[] = [];

      // 字段名
      parts.push(`\`${col.name}\``);

      // 类型和长度
      if (col.type === "VARCHAR" || col.type === "CHAR" || col.type === "DECIMAL") {
        parts.push(`${col.type}(${col.length || "255"})`);
      } else {
        parts.push(col.type);
      }

      // 判断这个字段是否是主键
      const isAutoIncWithoutPK = col.autoIncrement && autoIncrementWithoutPK;
      const isPK = col.primaryKey || isAutoIncWithoutPK;

      // 处理 NOT NULL
      if (isPK || col.notNull) {
        parts.push("NOT NULL");
      } else {
        parts.push("NULL");
      }

      // 处理默认值（主键字段不应该有默认值）
      if (!isPK && col.default && col.default.trim() !== "") {
        if (col.default.toUpperCase() === "NULL") {
          parts.push("DEFAULT NULL");
        } else if (!isNaN(Number(col.default))) {
          parts.push(`DEFAULT ${col.default}`);
        } else {
          parts.push(`DEFAULT '${col.default.replace(/'/g, "''")}'`);
        }
      }

      // 处理注释
      if (col.comment && col.comment.trim() !== "") {
        parts.push(`COMMENT '${col.comment.replace(/'/g, "''")}'`);
      }

      // 处理主键和自增
      // 规则：
      // 1. 单一主键：PRIMARY KEY 或 PRIMARY KEY AUTO_INCREMENT
      // 2. 复合主键：不在字段中定义PRIMARY KEY，单独添加
      if (isPK) {
        if (pkCount === 1 && col.autoIncrement) {
          // 单一主键且自增
          parts.push("PRIMARY KEY AUTO_INCREMENT");
        } else if (pkCount === 1) {
          // 单一主键
          parts.push("PRIMARY KEY");
        }
        // 多主键不在这里处理，后面单独添加
      }

      columnDefs.push(parts.join(" "));
    });

    // 添加复合主键约束
    if (pkCount > 1) {
      const pkFieldNames = [
        ...primaryKeys.map((col) => `\`${col.name}\``),
        ...(autoIncrementWithoutPK ? [columns.find((c) => c.autoIncrement)].filter(Boolean).map((c) => `\`${c!.name}\``) : []),
      ];
      columnDefs.push(`PRIMARY KEY (${pkFieldNames.join(", ")})`);
    }

    return `CREATE TABLE \`${tableNameInput}\` (
  ${columnDefs.join(",\n  ")}
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
  };

  const validateColumns = (): boolean => {
    if (!tableNameInput.trim()) {
      toast.error("请输入表名");
      return false;
    }
    const namePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    for (const col of columns) {
      if (!col.name.trim()) {
        toast.error("请填写所有字段名");
        return false;
      }
      if (!namePattern.test(col.name)) {
        toast.error(`字段名 "${col.name}" 格式不正确`);
        return false;
      }
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateColumns()) return;

    setLoading(true);
    try {
      await executeSQL(dbKey, `USE \`${effectiveDbName}\``);
      const sql = generateSQL();
      console.log("[CreateTableTab] 执行 SQL:", sql);

      const result = await executeSQL(dbKey, sql);

      if (result.success) {
        toast.success(`表 ${tableNameInput} 创建成功`);
        // 刷新表列表
        await fetchTables(dbKey, effectiveDbName);
        // 发送事件通知刷新表列表
        window.dispatchEvent(new CustomEvent('table-created', { detail: { dbKey, dbName: effectiveDbName } }));
      } else {
        toast.error("创建失败: " + result.message);
      }
    } catch (error) {
      toast.error(`创建失败: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      <div className="flex items-center gap-4 p-2 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">表名:</span>
          <Input
            placeholder="请输入表名"
            value={tableNameInput}
            onChange={(e) => setTableNameInput(e.target.value)}
            className="w-48 h-8"
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>
        <Button onClick={addColumn} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          添加字段
        </Button>
        <Button onClick={handleCreate} disabled={loading} size="sm">
          <Play className="w-4 h-4 mr-1" />
          {loading ? "创建中..." : "执行创建"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(generateSQL());
            toast.success("SQL 已复制到剪贴板");
          }}
        >
          复制 SQL
        </Button>
      </div>

      {/* 字段列表 */}
      <div className="flex-1 overflow-auto p-2">
        <div className="border rounded-md">
          {/* 表头 */}
          <div className="grid grid-cols-12 gap-2 p-2 bg-gray-50 text-xs font-medium text-gray-600">
            <div className="col-span-2">字段名</div>
            <div className="col-span-2">类型</div>
            <div className="col-span-1">长度</div>
            <div className="col-span-1 text-center">主键</div>
            <div className="col-span-1 text-center">自增</div>
            <div className="col-span-1 text-center">非空</div>
            <div className="col-span-2">默认值</div>
            <div className="col-span-1">注释</div>
            <div className="col-span-1"></div>
          </div>

          {/* 字段行 */}
          {columns.map((col) => (
            <div
              key={col.id}
              className="grid grid-cols-12 gap-2 p-2 border-t items-center"
            >
              <div className="col-span-2">
                <Input
                  placeholder="字段名"
                  value={col.name}
                  onChange={(e) => updateColumn(col.id, "name", e.target.value)}
                  className="h-8"
                  autoCapitalize="off"
                  autoCorrect="off"
                />
              </div>
              <div className="col-span-2">
                <Select
                  value={col.type}
                  onValueChange={(value) => updateColumn(col.id, "type", value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMN_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <Input
                  placeholder="长度"
                  value={col.length}
                  onChange={(e) => updateColumn(col.id, "length", e.target.value)}
                  disabled={!["VARCHAR", "CHAR", "DECIMAL"].includes(col.type)}
                  className="h-8"
                />
              </div>
              <div className="col-span-1 flex justify-center">
                <input
                  type="checkbox"
                  checked={col.primaryKey}
                  onChange={(e) => updateColumn(col.id, "primaryKey", e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
              <div className="col-span-1 flex justify-center">
                <input
                  type="checkbox"
                  checked={col.autoIncrement}
                  onChange={(e) => updateColumn(col.id, "autoIncrement", e.target.checked)}
                  disabled={!["INT", "BIGINT", "SMALLINT", "TINYINT"].includes(col.type)}
                  className="w-4 h-4"
                />
              </div>
              <div className="col-span-1 flex justify-center">
                <input
                  type="checkbox"
                  checked={col.notNull}
                  onChange={(e) => updateColumn(col.id, "notNull", e.target.checked)}
                  className="w-4 h-4"
                />
              </div>
              <div className="col-span-2">
                <Input
                  placeholder="默认值"
                  value={col.default}
                  onChange={(e) => updateColumn(col.id, "default", e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="col-span-1">
                <Input
                  placeholder="注释"
                  value={col.comment}
                  onChange={(e) => updateColumn(col.id, "comment", e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="col-span-1 flex justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-500 hover:text-red-600"
                  onClick={() => removeColumn(col.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SQL 预览 */}
      <div className="border-t p-2 bg-gray-50">
        <div className="text-xs font-medium text-gray-600 mb-1">SQL 预览:</div>
        <pre className="text-xs bg-white p-2 border rounded overflow-x-auto whitespace-pre-wrap">
          {generateSQL()}
        </pre>
      </div>
    </div>
  );
}
