import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface ExecResult {
  columns: string[];
  rows: string[][];
  rows_affected: number;
}

export interface EditableTableProps {
  result: ExecResult;
  dbName: string;
  tableName: string;
}

const sqlDataTypes = [
  "int",
  "bit",
  "varchar",
  "text",
  "date",
  "datetime",
  "float",
  "double",
  "boolean",
  "bigint",
  "decimal",
];

export const EditableStructureTable: React.FC<EditableTableProps> = ({
  result,
  dbName,
  tableName,
}) => {
  const [editedRows, setEditedRows] = useState<
    Record<number, Record<string, string>>
  >({});

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

    // const generateAlterSQL = useMemo(() => {
    // return Object.entries(editedRows).flatMap(([rowIndexStr, edits]) => {
    //     const rowIndex = parseInt(rowIndexStr);
    //     const row = result.rows[rowIndex];
    //     const getVal = (colName: string) => row[result.columns.indexOf(colName)];

    //     const columnName = getVal("字段名");
    //     const originalType = getVal("类型"); // 例："VARCHAR(50)"
    //     const isNullable = edits["可空"] ?? getVal("可空"); // "YES" | "NO"
    //     const newDefault = edits["默认值"] ?? getVal("默认值");

    //     // 获取修改后的类型
    //     let newType = edits["类型"] ?? originalType;

    //     // 重构 nullable 和 default 子句
    //     const nullableSQL = isNullable === "YES" ? "NULL" : "NOT NULL";

    //     const defaultSQL =
    //     newDefault !== undefined && newDefault !== null && newDefault !== ""
    //         ? `DEFAULT '${newDefault}'`
    //         : "";

    //     const columnDefParts = [newType, nullableSQL, defaultSQL].filter(Boolean).join(" ");

    //     return [`ALTER TABLE \`${dbName}\`.\`${tableName}\` MODIFY COLUMN \`${columnName}\` ${columnDefParts};`];
    // });
    // }, [editedRows, result, dbName, tableName]);

const generateAlterSQL = useMemo(() => {
  return Object.entries(editedRows).map(([rowIndexStr, edits]) => {
    const rowIndex = parseInt(rowIndexStr);
    const row = result.rows[rowIndex];
    const getVal = (colName: string) => row[result.columns.indexOf(colName)];

    const columnName = getVal("字段名");
    const type = edits["类型"] ?? getVal("类型"); // 如 varchar、int
    const length = edits["长度"] ?? getVal("长度"); // 如 255
    // const isNullableRaw = edits["可空"] ?? getVal("可空"); // YES/NO or boolean

    // const isNullable = isNullableRaw === "YES";
    // const nullableSQL = isNullable ? "NULL" : "NOT NULL";

    let nullableSQL = "";
    if ("可空" in edits) {
        const isNullableRaw = edits["可空"];
        const isNullable = isNullableRaw === "YES";
        nullableSQL = isNullable ? "NULL" : "NOT NULL";
    }

    const defaultVal = edits["默认值"] ?? getVal("默认值");
    const defaultSQL = defaultVal != null && defaultVal !== ""
      ? `DEFAULT '${defaultVal}'`
      : "";

    const typeSQL = length && type.toLowerCase().includes("char")
      ? `${type}(${length})`
      : type;

    return `ALTER TABLE \`${dbName}\`.\`${tableName}\` MODIFY COLUMN \`${columnName}\` ${typeSQL} ${nullableSQL} ${defaultSQL};`;
  });
}, [editedRows, result, dbName, tableName]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="overflow-auto">
          <table className="min-w-full table-auto text-sm">
            <colgroup>
                <col style={{ width: '200px' }} />  {/* 第1列 */}
                <col style={{ width: '140px' }}/>                             {/* 第2列，不设宽 */}
                <col style={{ width: '120px' }} />  {/* 第3列 */}
                <col style={{ width: '60px' }}/>
                <col style={{ width: '100px' }}/>
                <col />
            </colgroup>
            <thead>
              <tr className="bg-gray-300">
                {result.columns.map((col) => (
                  <th
                    key={col}
                    className="px-2 py-1 text-left border-b font-medium"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {result.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="bg-gray-100 border-b">
                  {row.map((cell, colIndex) => {
                    const column = result.columns[colIndex];
                    const isEditable = column !== "COLUMN_NAME";

                    if (column === "类型") {
                      return (
                        <td
                          key={`${rowIndex}-${colIndex}`}
                          className="px-2 py-1"
                        >
                          <Select
                            defaultValue={cell}
                            onValueChange={(value) =>
                              handleChange(rowIndex, column, value)
                            }
                          >
                            <SelectTrigger className="w-[140px] h-8">
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
                        <td key={`${rowIndex}-${colIndex}`} className="px-2 py-1">
                          <input
                            type="checkbox"
                            style={{
                              border: "2px solid red",
                              width: "18px",
                              height: "18px",
                            }}
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

                    return (
                      <td key={`${rowIndex}-${colIndex}`} className="px-2 py-1">
                        {isEditable ? (
                          <Input
                            className="h-8"
                            defaultValue={cell || ""}
                            onChange={(e) =>
                              handleChange(rowIndex, column, e.target.value)
                            }
                          />
                        ) : (
                          <span>{cell}</span>
                        )}
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
            {generateAlterSQL.map((sql, i) => (
              <div key={i} className="text-xs font-mono mb-1">
                {sql}
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
