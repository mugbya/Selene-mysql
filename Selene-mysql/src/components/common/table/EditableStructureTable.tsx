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
import { Trash2, Plus, Save } from "lucide-react";
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
      { "字段名": "", "类型": "varchar", "长度": "255", "可空": "YES", "默认值": "", "注释": "" },
    ]);
  };

  const handleRemoveNewRow = (rowIndex: number) => {
    setNewRows((prev) => prev.filter((_, i) => i !== rowIndex));
  };

  // 生成修改列的 SQL
  const generateAlterSQL = useMemo(() => {
    const sqls: string[] = [];

    // 处理修改的列
    Object.entries(editedRows).forEach(([rowIndexStr, edits]) => {
      const rowIndex = parseInt(rowIndexStr);
      if (deletedRows.has(rowIndex)) return;

      const row = result.rows[rowIndex];
      const getVal = (colName: string) => row[result.columns.indexOf(colName)];

      const columnName = getVal("字段名");
      const type = edits["类型"] ?? getVal("类型");
      const length = edits["长度"] ?? getVal("长度");
      const isNullableRaw = edits["可空"] ?? getVal("可空");
      const defaultVal = edits["默认值"] ?? getVal("默认值");
      const comment = edits["注释"] ?? getVal("注释");

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
      const isNullable = newRow["可空"] === "YES";
      const defaultVal = newRow["默认值"];
      const comment = newRow["注释"];

      let typeSQL = type.toUpperCase();
      if (length && (type.toLowerCase().includes("char") || type.toLowerCase().includes("int") || type.toLowerCase().includes("decimal"))) {
        typeSQL = `${type.toUpperCase()}(${length})`;
      }

      let sql = `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${typeSQL} ${isNullable ? "NULL" : "NOT NULL"}`;
      if (defaultVal) sql += ` DEFAULT '${defaultVal.replace(/'/g, "''")}'`;
      sql += ";";
      sqls.push(sql);

      if (comment) {
        sqls.push(`ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${columnName}\` ${typeSQL} ${isNullable ? "NULL" : "NOT NULL"} COMMENT '${comment.replace(/'/g, "''")}';`);
      }
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          表名: <span className="font-medium">{tableName}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAddNewRow}>
            <Plus className="w-4 h-4 mr-1" /> 添加列
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || generateAlterSQL.length === 0}>
            <Save className="w-4 h-4 mr-1" />
            {saving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="overflow-auto">
          <table className="min-w-full table-auto text-sm">
            <colgroup>
              <col style={{ width: '30px' }} />
              <col style={{ width: '180px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '80px' }} />
              <col style={{ width: '60px' }} />
              <col style={{ width: '100px' }} />
              <col style={{ width: '150px' }} />
            </colgroup>
            <thead>
              <tr className="bg-gray-300">
                <th className="px-2 py-2 text-center border-b font-medium">操作</th>
                {result.columns.map((col) => (
                  <th
                    key={col}
                    className="px-2 py-2 text-left border-b font-medium"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {displayRows.map((row, rowIndex) => (
                <tr key={rowIndex} className="bg-gray-50 border-b hover:bg-gray-100">
                  <td className="px-2 py-1 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteRow(rowIndex)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                  {row.map((cell, colIndex) => {
                    const column = result.columns[colIndex];

                    if (column === "类型") {
                      const editedValue = editedRows[rowIndex]?.[column] ?? cell;
                      return (
                        <td key={`${rowIndex}-${colIndex}`} className="px-2 py-1">
                          <Select
                            value={editedValue?.toString() || "varchar"}
                            onValueChange={(value) =>
                              handleChange(rowIndex, column, value)
                            }
                          >
                            <SelectTrigger className="w-[120px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {sqlDataTypes.map((type) => (
                                <SelectItem key={type} value={type}>
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
                        <td key={`${rowIndex}-${colIndex}`} className="px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4"
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

                    const editedValue = editedRows[rowIndex]?.[column];
                    const displayValue = editedValue !== undefined ? editedValue : cell;

                    return (
                      <td key={`${rowIndex}-${colIndex}`} className="px-2 py-1">
                        <Input
                          className="h-8"
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
                  <td className="px-2 py-1 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      onClick={() => handleRemoveNewRow(rowIndex)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                  {result.columns.map((column, colIndex) => {
                    if (column === "类型") {
                      return (
                        <td key={`new-${rowIndex}-${colIndex}`} className="px-2 py-1">
                          <Select
                            value={newRow[column] || "varchar"}
                            onValueChange={(value) =>
                              handleNewRowChange(rowIndex, column, value)
                            }
                          >
                            <SelectTrigger className="w-[120px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {sqlDataTypes.map((type) => (
                                <SelectItem key={type} value={type}>
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
                        <td key={`new-${rowIndex}-${colIndex}`} className="px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4"
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

                    return (
                      <td key={`new-${rowIndex}-${colIndex}`} className="px-2 py-1">
                        <Input
                          className="h-8"
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
            <div className="text-xs font-medium text-gray-700 mb-2">
              生成的 SQL ({generateAlterSQL.length} 条):
            </div>
            {generateAlterSQL.map((sql, i) => (
              <div key={i} className="text-xs font-mono mb-1 text-gray-600">
                {sql}
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
