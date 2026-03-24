import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Copy, Download, Loader2 } from "lucide-react";
import { executeSQL } from "@/db/msyql-client";

interface ExportWizardDialogProps {
  open: boolean;
  onClose: () => void;
  dbKey: string;
  dbName: string;
  tables: string[];
}

export function ExportWizardDialog({
  open,
  onClose,
  dbKey,
  dbName,
  tables,
}: ExportWizardDialogProps) {
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [includeStructure, setIncludeStructure] = useState(true);
  const [includeData, setIncludeData] = useState(true);
  const [extendedInsert, setExtendedInsert] = useState(true);
  const [extendedInsertRows, setExtendedInsertRows] = useState(100);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<string>("");

  useEffect(() => {
    if (open) {
      // 初始化全选
      setSelectedTables(new Set(tables));
      setExportResult("");
    }
  }, [open, tables]);

  const toggleTable = (table: string) => {
    setSelectedTables((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(table)) {
        newSet.delete(table);
      } else {
        newSet.add(table);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedTables(new Set(tables));
  };

  const handleDeselectAll = () => {
    setSelectedTables(new Set());
  };

  const handleExport = async () => {
    if (selectedTables.size === 0) {
      toast.error("请至少选择一个表");
      return;
    }

    setExporting(true);
    let sqlOutput = "";

    try {
      // 导出表结构
      if (includeStructure) {
        for (const table of selectedTables) {
          const result = await executeSQL(dbKey, `SHOW CREATE TABLE \`${table}\``);
          if (result.success && result.data && result.data.rows.length > 0) {
            sqlOutput += result.data.rows[0][1] + ";\n\n";
          }
        }
      }

      // 导出表数据
      if (includeData) {
        for (const table of selectedTables) {
          // 获取表结构以便正确处理数据
          const columnsResult = await executeSQL(
            dbKey,
            `SELECT COLUMN_NAME FROM information_schema.columns WHERE table_schema = '${dbName}' AND table_name = '${table}' ORDER BY ORDINAL_POSITION`
          );

          if (!columnsResult.success || !columnsResult.data) {
            continue;
          }

          const columns = columnsResult.data.rows.map((row) => row[0]);

          // 分页获取数据
          let offset = 0;
          const pageSize = extendedInsertRows;
          let hasMore = true;

          while (hasMore) {
            const dataResult = await executeSQL(
              dbKey,
              `SELECT * FROM \`${table}\` LIMIT ${offset}, ${pageSize}`
            );

            if (!dataResult.success || !dataResult.data || dataResult.data.rows.length === 0) {
              hasMore = false;
              continue;
            }

            const rows = dataResult.data.rows;

            if (extendedInsert) {
              // Extended Insert 模式：合并多行
              const valuesList = rows
                .map((row) => {
                  const values = row
                    .map((cell) => {
                      if (cell === null || cell === undefined) {
                        return "NULL";
                      }
                      // 处理字符串值，转义单引号
                      return `'${String(cell).replace(/'/g, "''")}'`;
                    })
                    .join(", ");
                  return `(${values})`;
                })
                .join(",\n");

              if (valuesList) {
                sqlOutput += `INSERT INTO \`${table}\` (\`${columns.join("`, `")}\`) VALUES\n${valuesList};\n\n`;
              }
            } else {
              // 普通模式：每行一个 INSERT
              for (const row of rows) {
                const values = row
                  .map((cell) => {
                    if (cell === null || cell === undefined) {
                      return "NULL";
                    }
                    return `'${String(cell).replace(/'/g, "''")}'`;
                  })
                  .join(", ");
                sqlOutput += `INSERT INTO \`${table}\` (\`${columns.join("`, `")}\`) VALUES (${values});\n`;
              }
              sqlOutput += "\n";
            }

            offset += pageSize;
            hasMore = rows.length === pageSize;
          }
        }
      }

      setExportResult(sqlOutput);
      toast.success("导出完成");
    } catch (error) {
      toast.error(`导出失败: ${error}`);
    } finally {
      setExporting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(exportResult);
    toast.success("已复制到剪贴板");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>导出数据库 - {dbName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 表选择 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                选择要导出的表 ({selectedTables.size}/{tables.length})
              </span>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  全选
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                  清除
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-auto border rounded p-2">
              {tables.map((table) => (
                <label
                  key={table}
                  className="flex items-center space-x-2 p-1 rounded hover:bg-gray-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedTables.has(table)}
                    onChange={() => toggleTable(table)}
                  />
                  <span className="text-sm truncate" title={table}>
                    {table}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 选项 */}
          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={includeStructure}
                  onChange={(e) => setIncludeStructure(e.target.checked)}
                />
                <span className="text-sm">包含表结构</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={includeData}
                  onChange={(e) => setIncludeData(e.target.checked)}
                />
                <span className="text-sm">包含数据</span>
              </label>
            </div>

            {includeData && (
              <div className="flex items-center space-x-4 pl-6">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={extendedInsert}
                    onChange={(e) => setExtendedInsert(e.target.checked)}
                  />
                  <span className="text-sm">Extended Insert</span>
                </label>
                {extendedInsert && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">每</span>
                    <input
                      type="number"
                      className="w-16 h-8 border rounded px-2"
                      value={extendedInsertRows}
                      onChange={(e) => setExtendedInsertRows(parseInt(e.target.value) || 100)}
                      min={1}
                      max={1000}
                    />
                    <span className="text-sm">行合并为一个INSERT</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 导出结果 */}
          {exportResult && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">导出结果</span>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="w-4 h-4 mr-1" /> 复制
                </Button>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-auto max-h-[300px] text-xs font-mono">
                {exportResult}
              </pre>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
          <Button onClick={handleExport} disabled={exporting || selectedTables.size === 0}>
            {exporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {exporting ? "导出中..." : "导出"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
