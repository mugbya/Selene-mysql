import Database from "@tauri-apps/plugin-sql";

export type ConnectionType = 'mysql' | 'pgsql' | 'sqlite';



export interface DBConnectionPersisted {
  id: string; // 连接唯一值，相当于key
  name: string;
  // type: ConnectionType; // 可扩展
  type: string; // 可扩展
  db_type: string; // 可扩展
  host: string;
  port: number;
  username: string;
  password: string;
  database?: string; // 用户填写的连接的数据库
  databases: string[]; // 连接下的所有数据库列表
  displayDatabases?: string[]  | null; // 连接后 用户选择要展示的数据库列表
}

export interface DBConnectionRuntime extends DBConnectionPersisted {
  dbConn?: Database;
}

export type DatabaseTree = {
  name: string;
  expanded: boolean;
  tables?: string[];
  views?: string[];
  functions?: string[];
  events?: string[];
  // 其他子分类也可以加
};

export type TableTree = {
  name: string;
  expanded: boolean;
  // tables?: string[];
  views?: string[];
  functions?: string[];
  events?: string[];
  // 其他子分类也可以加
};


export type ExecResult = {
  columns: string[];
  rows: string[][]
  rows_affected: number;
  hasMore?: boolean;
};

export interface EditableTableProps {
  result: ExecResult;
}


export interface ExecResultProps {
  dbKey: string | null;
  onExecResult?: (result: ExecResult) => void;
}


export interface ColumnSchema {
  name: string;
  type: string;        // e.g. "varchar"
  length?: number;     // e.g. 255
  precision?: number;  // e.g. 10
  scale?: number;      // e.g. 2 (for decimal)
  nullable: boolean;
  default?: string;
}