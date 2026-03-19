// import { DBConnectionPersisted } from "@/types";
// import Database from "@tauri-apps/plugin-sql";
// import { toast } from "sonner";

// const getDBConn = async (conn: DBConnectionPersisted): Promise<Database | null> => {
//     try {
//         let dbUrl = `mysql://${encodeURIComponent(conn.username)}:${encodeURIComponent(conn.password)}@${conn.host}:${conn.port}/mysql`;
//         const db = await Database.load(dbUrl);
//         console.log("[getDBConn] typeof db:", typeof db);
//         return db;
//     } catch (err) {
//         console.error('Failed to load databases:', err);
//         return null; // 👈 明确返回 undefined
//     }
// };


// // const fetchDatabases = async (conn: DBConnection): Promise<string[] | undefined>  => {
// // const fetchDatabases = async (conn: DBConnection): Promise<{ databases: string[]; dbConn: Database; } | undefined>  => {
// const fetchDatabases = async (db: Database | undefined): Promise<string[] | undefined> => {
//     try {
//         if (!db) {
//             toast.error("数据库连接未获取", { closeButton: true });
//             return undefined;
//         }

//         const result = await db.select(`
//         SELECT CAST(SCHEMA_NAME AS CHAR) as name
//         FROM INFORMATION_SCHEMA.SCHEMATA
//       `);
//         const rows = result as { name: string }[];
//         // console.log("数据库列表:", rows);
//         if (rows.length === 0) {
//             return undefined; // 👈 明确返回 undefined
//         }
//         const dbNames: string[] = rows.map(db => db.name);
//         // const res = {
//         //     databases: dbNames,
//         //     dbConn: db
//         // }
//         console.log("[fetchDatabases]: ", dbNames);
//         return dbNames;
//     } catch (err) {
//         console.error('Failed to load databases:', err);
//         return undefined; // 👈 明确返回 undefined
//     } finally {
//     }
// };

// const fetchTablesForDatabase = async (db: Database | undefined, dbName: string): Promise<string[]> => {
//     if (!db) {
//         toast.error("[fetchTablesForDatabase] 数据库连接失败", { closeButton: true });
//         return [];
//     }
//     console.log("[fetchTablesForDatabase] typeof db.select:", typeof db.select);
//     console.log("[fetchTablesForDatabase] db: ", db);

//     const tables = await db.select(`
//         SELECT TABLE_NAME AS name
//         FROM information_schema.tables
//         WHERE table_schema = '${dbName}'
//       `) as { name: string }[];

//     const res = tables.map(t => t.name);
//     console.log('Tables:', res);
//     return res;
// };

// const execSQL = async (db: Database | undefined, sql: string): Promise<any> => {
//     if (!db) {
//         toast.error("[execSQL] 数据库连接失败", { closeButton: true });
//         return [];
//     }
//     console.log("[execSQL] typeof db.select:", typeof db.select);
//     console.log("[execSQL] db: ", db);

//         const trimmed = sql.trim().toLowerCase();
//       if (trimmed.startsWith("select")) {
//         return await db.select(sql);
//       } else {
//         await db.execute(sql);
//         return "执行成功";
//       }

//     // const dbName = extractDbNameFromPath(sql);
//     // if (!dbName) {
//     //     toast.error("无法识别数据库名称");
//     //     return [];
//     // }
//     // console.log("[execSQL] dbName: ", dbName);

//     // if (!sql.trim().toLowerCase().startsWith("select")) {
//     //     return await db.select(sql); // 非 SELECT 不处理
//     // }

//     // // 解析表名（此处仅示例处理单表）
//     // const tableMatch = sql.match(/FROM\s+(\w+)/i);
//     // const table = tableMatch?.[1];
//     // if (!table) return await db.select(sql);

//     // const columns = await getTableColumns(db, dbName, table);
//     // const rewrittenSQL = rewriteSQLWithCast(sql, columns);

//     // return await db.select(rewrittenSQL);
// };

// function extractDbNameFromPath(path: string): string | null {
//     // 例如: mysql://user:pass@host:port/database
//     const match = path.match(/\/([^/?#]+)(?:\?|#|$)/);
//     return match?.[1] ?? null;
//   }

// function rewriteSQLWithCast(sql: string, columns: Record<string, string>): string {
//     // 假设只处理 SELECT ... FROM 单表 简单语句
//     const match = sql.match(/^SELECT\s+(.*?)\s+FROM\s+(\w+)/i);
//     if (!match) return sql;

//     const fields = match[1].split(',').map(f => f.trim());
//     const rewrittenFields = fields.map(f => {
//         const field = f.includes(' AS ') ? f.split(' AS ')[0].trim() : f;
//         if (columns[field] === 'varbinary') {
//             return `CAST(${field} AS CHAR) AS ${field}`;
//         }
//         return f;
//     });

//     return sql.replace(match[1], rewrittenFields.join(', '));
// }

// async function getTableColumns(db: Database, dbName: string, table: string): Promise<Record<string, string>> {
//     const rows = await db.select(`
//       SELECT COLUMN_NAME, DATA_TYPE
//       FROM information_schema.columns
//       WHERE table_schema = '${dbName}' AND table_name = '${table}'
//     `);

//     const columns: Record<string, string> = {};
//     for (const row of rows as any[]) {
//         columns[row.COLUMN_NAME] = row.DATA_TYPE;
//     }
//     return columns;
// }

// export {
//     getDBConn,
//     fetchDatabases,
//     fetchTablesForDatabase,
//     execSQL
// }