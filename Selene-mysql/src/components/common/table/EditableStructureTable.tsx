import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Trash2, Plus, Save, Undo2 } from "lucide-react";
import { executeSQL } from "@/db/msyql-client";

export interface ExecResult {
  columns: string[];
  rows: string[][];
  rows_affected: number;
}

export interface EditableTableProps {
  result: ExecResult;
  dbName: string;
  tableName: string;
  dbKey: string;
}

const sqlDataTypes = [
  "int",
  "bigint",
  "smallint",
  "tinyint",
  "bit",
  "varchar",
  "char",
  "text",
  "date",
  "datetime",
  "timestamp",
  "float",
  "double",
  "decimal",
  "json",
];

export const EditableStructureTable: React.FC<EditableTableProps> = ({
  result,
  dbName,
  tableName,
  dbKey,
}) => {
  const [editedRows, setEditedRows] = useState<
    Record<number, Record<string, string>>
  >({});
  const [deletedRows, setDeletedRows] = useState<Set<number>>(new Set());
  const [newRows, setNewRows] = useState<Record<string, string>[]>([]);
  const [saving, setSaving] = useState(false);

  const handleChange = (
    rowIndex: number,
    columnName: string,
    value: string
  ) => {
    setEditedRows((prev) => ({
      ...prev,
      [rowIndex]: {
        ...prev[rowIndex],
        [columnName]: value,
      },
    }));
  };

  const handleNewRowChange = (
    rowIndex: number,
    columnName: string,
    value: string
  ) => {
    setNewRows((prev) => {
      const updated = [...prev];
      updated[rowIndex] = {
        ...updated[rowIndex],
        [columnName]: value,
      };
      return updated;
    });
  };

  const handleDeleteRow = (rowIndex: number) => {
    setDeletedRows((prev) => new Set(prev).add(rowIndex));
  };

  const handleAddNewRow = () => {
    setNewRows((prev) => [
      ...prev,
      { "字段名": "", "类型": "varchar", "长度": "255", "主键": "", "唯一键": "", "可空": "YES", "默认值": "", "注释": "" },
    ]);
  };

  const handleRemoveNewRow = (rowIndex: number) => {
    setNewRows((prev) => prev.filter((_, i) => i !== rowIndex));
  };

  // 生成修改列的 SQL
  const generateAlterSQL = useMemo(() => {
    const sqls: string[] = [];

    // 用于收集需要添加/删除的主键和唯一键
    const addPrimaryKeys: string[] = [];
    const dropPrimaryKeys: string[] = [];
    const addUniqueKeys: string[] = [];
    const dropUniqueKeys: string[] = [];

    // 处理修改的列
    Object.entries(editedRows).forEach(([rowIndexStr, edits]) => {
      const rowIndex = parseInt(rowIndexStr);
      if (deletedRows.has(rowIndex)) return;

      const row = result.rows[rowIndex];
      const getVal = (colName: string) => row[result.columns.indexOf(colName)];

      const columnName = getVal("字段名");
      const type = edits["类型"] ?? getVal("类型");
      const length = edits["长度"] ?? getVal("长度");
      const isPK = edits["主键"] ?? getVal("主键");
      const isUK = edits["唯一键"] ?? getVal("唯一键");
      const isNullableRaw = edits["可空"] ?? getVal("可空");
      const defaultVal = edits["默认值"] ?? getVal("默认值");
      const comment = edits["注释"] ?? getVal("注释");

      const originalIsPK = getVal("主键");
      const originalIsUK = getVal("唯一键");

      const isNullable = isNullableRaw === "YES";
      const nullableSQL = isNullable ? "NULL" : "NOT NULL";

      let defaultSQL = "";
      if (defaultVal !== undefined && defaultVal !== null && defaultVal !== "") {
        defaultSQL = `DEFAULT '${defaultVal.replace(/'/g, "''")}'`;
      }

      let typeSQL = type.toUpperCase();
      if (length && (type.toLowerCase().includes("char") || type.toLowerCase().includes("int") || type.toLowerCase().includes("decimal"))) {
        typeSQL = `${type.toUpperCase()}(${length})`;
      }

      let sql = `ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${columnName}\` ${typeSQL} ${nullableSQL}`;
      if (defaultSQL) sql += ` ${defaultSQL}`;
      sql += ";";
      sqls.push(sql);

      // 如果有注释，添加注释 SQL
      if (comment) {
        sqls.push(`ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${columnName}\` ${typeSQL} ${nullableSQL} ${defaultSQL} COMMENT '${comment.replace(/'/g, "''")}';`);
      }

      // 处理主键变更
      if (isPK === "YES" && originalIsPK !== "YES") {
        addPrimaryKeys.push(`\`${columnName}\``);
      } else if (isPK !== "YES" && originalIsPK === "YES") {
        dropPrimaryKeys.push(`\`${columnName}\``);
      }

      // 处理唯一键变更
      if (isUK === "YES" && originalIsUK !== "YES") {
        addUniqueKeys.push(`\`${columnName}\``);
      } else if (isUK !== "YES" && originalIsUK === "YES") {
        dropUniqueKeys.push(`\`${columnName}\``);
      }
    });

    // 处理删除的列
    deletedRows.forEach((rowIndex) => {
      const row = result.rows[rowIndex];
      const columnName = row[result.columns.indexOf("字段名")];
      sqls.push(`ALTER TABLE \`${tableName}\` DROP COLUMN \`${columnName}\`;`);
    });

    // 处理新增的列
    newRows.forEach((newRow) => {
      if (!newRow["字段名"]) return;

      const columnName = newRow["字段名"];
      const type = newRow["类型"] || "varchar";
      const length = newRow["长度"] || "255";
      const isPK = newRow["主键"] === "YES";
      const isUK = newRow["唯一键"] === "YES";
      const isNullable = newRow["可空"] === "YES";
      const defaultVal = newRow["默认值"];
      const comment = newRow["注释"];

      let typeSQL = type.toUpperCase();
      if (length && (type.toLowerCase().includes("char") || type.toLowerCase().includes("int") || type.toLowerCase().includes("decimal"))) {
        typeSQL = `${type.toUpperCase()}(${length})`;
      }

      let sql = `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${typeSQL} ${isNullable ? "NULL" : "NOT NULL"}`;
      if (defaultVal) sql += ` DEFAULT '${defaultVal.replace(/'/g, "''")}'`;
      if (isPK) sql += ` PRIMARY KEY`;
      sql += ";";
      sqls.push(sql);

      if (comment) {
        sqls.push(`ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${columnName}\` ${typeSQL} ${isNullable ? "NULL" : "NOT NULL"} ${isPK ? 'PRIMARY KEY' : ''} COMMENT '${comment.replace(/'/g, "''")}';`);
      }

      // 处理新增列的唯一键
      if (isUK && !isPK) {
        sqls.push(`ALTER TABLE \`${tableName}\` ADD UNIQUE (\`${columnName}\`);`);
      }
    });

    // 添加删除主键的 SQL
    if (dropPrimaryKeys.length > 0) {
      sqls.push(`ALTER TABLE \`${tableName}\` DROP PRIMARY KEY;`);
    }

    // 添加删除唯一键的 SQL（需要先获取约束名）
    if (dropUniqueKeys.length > 0) {
      // 简化处理：暂不自动删除唯一键，让用户手动处理
    }

    // 添加主键的 SQL
    if (addPrimaryKeys.length > 0) {
      sqls.push(`ALTER TABLE \`${tableName}\` ADD PRIMARY KEY (${addPrimaryKeys.join(', ')});`);
    }

    // 添加唯一键的 SQL
    addUniqueKeys.forEach(col => {
      sqls.push(`ALTER TABLE \`${tableName}\` ADD UNIQUE (\`${col}\`);`);
    });

    return sqls;
  }, [editedRows, deletedRows, newRows, result, tableName]);

  const handleSave = async () => {
    if (generateAlterSQL.length === 0) {
      toast.info("没有需要保存的更改");
      return;
    }

    setSaving(true);
    try {
      for (const sql of generateAlterSQL) {
        const result = await executeSQL(dbKey, sql);
        if (!result.success) {
          toast.error(`执行失败: ${sql}\n${result.message}`);
          setSaving(false);
          return;
        }
      }
      toast.success("表结构保存成功");
      // 清空修改状态
      setEditedRows({});
      setDeletedRows(new Set());
      setNewRows([]);
      // TODO: 刷新表结构
    } catch (error) {
      toast.error(`保存失败: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  // 过滤显示的列（排除已删除的）
  const displayRows = result.rows.filter((_, idx) => !deletedRows.has(idx));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          表名: <span className="font-medium">{tableName}</span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={handleAddNewRow} title="添加列">
            <Plus className="w-3 h-3" />
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || generateAlterSQL.length === 0} title="保存">
            <Save className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="overflow-auto p-1">
          <table className="min-w-full table-auto text-xs">
            <colgroup>
              <col style={{ width: '20px' }} />
              <col style={{ width: '140px' }} />
              <col style={{ width: '40px' }} />
              <col style={{ width: '60px' }} />
              <col style={{ width: '40px' }} />
              <col style={{ width: '40px' }} />
              <col style={{ width: '40px' }} />
              <col style={{ width: '60px' }} />
              <col style={{ width: '200px' }} />
            </colgroup>
            <thead>
              <tr className="bg-muted">
                <th className="px-1 py-1 text-center border-b font-medium"></th>
                {result.columns.map((col) => (
                  <th
                    key={col}
                    className="px-1 py-1 text-left border-b font-medium"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {displayRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="bg-muted border-b hover:bg-accent">
                  <td className="px-1 py-0.5 text-center">
                    <Trash2
                      className="w-3 h-3 text-red-400 hover:text-red-600 cursor-pointer"
                      onClick={() => handleDeleteRow(rowIndex)}
                    />
                  </td>
                  {row.map((cell, colIndex) => {
                    const column = result.columns[colIndex];

                    if (column === "类型") {
                      const editedValue = editedRows[rowIndex]?.[column] ?? cell;
                      return (
                        <td key={`${rowIndex}-${colIndex}`} className="px-1 py-0.5">
                          <Select
                            value={editedValue?.toString() || "varchar"}
                            onValueChange={(value) =>
                              handleChange(rowIndex, column, value)
                            }
                          >
                            <SelectTrigger className="w-full h-5 text-xs rounded-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {sqlDataTypes.map((type) => (
                                <SelectItem key={type} value={type} className="text-xs">
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      );
                    }

                    if (column === "可空") {
                      const editedValue = editedRows[rowIndex]?.[column] ?? cell;
                      return (
                        <td key={`${rowIndex}-${colIndex}`} className="px-1 py-0.5 text-center">
                          <input
                            type="checkbox"
                            className="w-3 h-3"
                            checked={editedValue === "YES"}
                            onChange={(e) =>
                              handleChange(
                                rowIndex,
                                column,
                                e.target.checked ? "YES" : "NO"
                              )
                            }
                          />
                        </td>
                      );
                    }

                    if (column === "主键" || column === "唯一键") {
                      // 主键和唯一键列显示为 checkbox（可编辑）
                      const editedValue = editedRows[rowIndex]?.[column] ?? cell;
                      return (
                        <td key={`${rowIndex}-${colIndex}`} className="px-1 py-0.5 text-center">
                          <input
                            type="checkbox"
                            className="w-3 h-3"
                            checked={editedValue === "YES"}
                            onChange={(e) =>
                              handleChange(
                                rowIndex,
                                column,
                                e.target.checked ? "YES" : ""
                              )
                            }
                          />
                        </td>
                      );
                    }

                    const editedValue = editedRows[rowIndex]?.[column];
                    const displayValue = editedValue !== undefined ? editedValue : cell;

                    return (
                      <td key={`${rowIndex}-${colIndex}`} className="px-1 py-0.5">
                        <Input
                          className="h-5 text-xs rounded-none"
                          value={displayValue?.toString() || ""}
                          onChange={(e) =>
                            handleChange(rowIndex, column, e.target.value)
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* 新增列 */}
              {newRows.map((newRow, rowIndex) => (
                <tr key={`new-${rowIndex}`} className="bg-green-50 border-b hover:bg-green-100">
                  <td className="px-1 py-0.5 text-center">
                    <Trash2
                      className="w-3 h-3 text-red-400 hover:text-red-600 cursor-pointer"
                      onClick={() => handleRemoveNewRow(rowIndex)}
                    />
                  </td>
                  {result.columns.map((column, colIndex) => {
                    if (column === "类型") {
                      return (
                        <td key={`new-${rowIndex}-${colIndex}`} className="px-1 py-0.5">
                          <Select
                            value={newRow[column] || "varchar"}
                            onValueChange={(value) =>
                              handleNewRowChange(rowIndex, column, value)
                            }
                          >
                            <SelectTrigger className="w-full h-5 text-xs rounded-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {sqlDataTypes.map((type) => (
                                <SelectItem key={type} value={type} className="text-xs">
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      );
                    }

                    if (column === "可空") {
                      return (
                        <td key={`new-${rowIndex}-${colIndex}`} className="px-1 py-0.5 text-center">
                          <input
                            type="checkbox"
                            className="w-3 h-3"
                            checked={newRow[column] === "YES"}
                            onChange={(e) =>
                              handleNewRowChange(
                                rowIndex,
                                column,
                                e.target.checked ? "YES" : "NO"
                              )
                            }
                          />
                        </td>
                      );
                    }

                    if (column === "主键" || column === "唯一键") {
                      // 新增行时，主键和唯一键显示为空 checkbox（可选）
                      return (
                        <td key={`new-${rowIndex}-${colIndex}`} className="px-1 py-0.5 text-center">
                          <input
                            type="checkbox"
                            className="w-3 h-3"
                            checked={newRow[column] === "YES"}
                            onChange={(e) =>
                              handleNewRowChange(
                                rowIndex,
                                column,
                                e.target.checked ? "YES" : ""
                              )
                            }
                          />
                        </td>
                      );
                    }

                    return (
                      <td key={`new-${rowIndex}-${colIndex}`} className="px-1 py-0.5">
                        <Input
                          className="h-5 text-xs rounded-none"
                          placeholder={column === "字段名" ? "必填" : ""}
                          value={newRow[column] || ""}
                          onChange={(e) =>
                            handleNewRowChange(rowIndex, column, e.target.value)
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {generateAlterSQL.length > 0 && (
        <Alert>
          <AlertDescription>
            <div className="text-xs font-medium text-foreground mb-1">
              SQL ({generateAlterSQL.length})
            </div>
            {generateAlterSQL.map((sql, i) => (
              <div key={i} className="text-xs font-mono mb-0.5 text-muted-foreground">
                {sql}
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
