use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPool, mysql::MySqlPool, sqlite::SqlitePool, Row, Column, Executor}; // 添加 Column
use std::collections::HashMap;
use std::fmt;
use urlencoding::encode;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DatabaseType {
    PostgreSQL,
    MySQL,
    SQLite,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionConfig {
    pub db_type: DatabaseType,
    pub host: Option<String>,
    pub port: Option<u16>,
    pub username: Option<String>,
    pub password: Option<String>,
    pub database: String,
    pub file_path: Option<String>, // For SQLite
}

#[derive(Debug)]
pub enum DatabaseConnection {
    PostgreSQL(PgPool),
    MySQL(MySqlPool),
    SQLite(SqlitePool),
}

#[derive(Debug, Serialize)]
pub struct QueryResult {
    pub columns: Vec<String>,
    pub rows: Vec<Vec<serde_json::Value>>,
    pub rows_affected: Option<u64>,
}

#[derive(Debug)]
pub enum DatabaseError {
    ConnectionFailed(String),
    QueryFailed(String),
    NotConnected,
    UnsupportedOperation(String),
}

impl fmt::Display for DatabaseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            DatabaseError::ConnectionFailed(msg) => write!(f, "Connection failed: {}", msg),
            DatabaseError::QueryFailed(msg) => write!(f, "Query failed: {}", msg),
            DatabaseError::NotConnected => write!(f, "Not connected to database"),
            DatabaseError::UnsupportedOperation(msg) => write!(f, "Unsupported operation: {}", msg),
        }
    }
}

impl std::error::Error for DatabaseError {}

pub struct DatabaseManager {
    connections: HashMap<String, DatabaseConnection>,
    configs: HashMap<String, ConnectionConfig>,
}

impl DatabaseManager {
    pub fn new() -> Self {
        Self {
            connections: HashMap::new(),
            configs: HashMap::new(),
        }
    }

    pub async fn connect(&mut self, name: String, config: ConnectionConfig) -> Result<(), DatabaseError> {
        let connection_string = self.build_connection_string(&config)?;
        
        let connection = match config.db_type {
            DatabaseType::PostgreSQL => {
                let pool = PgPool::connect(&connection_string).await
                    .map_err(|e| DatabaseError::ConnectionFailed(e.to_string()))?;
                DatabaseConnection::PostgreSQL(pool)
            }
            DatabaseType::MySQL => {
                let pool = MySqlPool::connect(&connection_string).await
                    .map_err(|e| DatabaseError::ConnectionFailed(e.to_string()))?;
                DatabaseConnection::MySQL(pool)
            }
            DatabaseType::SQLite => {
                let pool = SqlitePool::connect(&connection_string).await
                    .map_err(|e| DatabaseError::ConnectionFailed(e.to_string()))?;
                DatabaseConnection::SQLite(pool)
            }
        };

        self.connections.insert(name.clone(), connection);
        self.configs.insert(name, config);
        Ok(())
    }

    pub async fn disconnect(&mut self, name: &str) -> Result<(), DatabaseError> {
        if let Some(connection) = self.connections.remove(name) {
            match connection {
                DatabaseConnection::PostgreSQL(pool) => pool.close().await,
                DatabaseConnection::MySQL(pool) => pool.close().await,
                DatabaseConnection::SQLite(pool) => pool.close().await,
            }
        }
        self.configs.remove(name);
        Ok(())
    }

    pub async fn execute_query(&self, connection_name: &str, query: &str) -> Result<QueryResult, DatabaseError> {
        let connection = self.connections.get(connection_name)
            .ok_or(DatabaseError::NotConnected)?;

        match connection {
            DatabaseConnection::PostgreSQL(pool) => {
                self.execute_postgres_query(pool, query).await
            }
            DatabaseConnection::MySQL(pool) => {
                self.execute_mysql_query(pool, query).await
            }
            DatabaseConnection::SQLite(pool) => {
                self.execute_sqlite_query(pool, query).await
            }
        }
    }

    async fn execute_postgres_query(&self, pool: &PgPool, query: &str) -> Result<QueryResult, DatabaseError> {
        let rows = sqlx::query(query)
            .fetch_all(pool)
            .await
            .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;

        if rows.is_empty() {
            return Ok(QueryResult {
                columns: vec![],
                rows: vec![],
                rows_affected: Some(0),
            });
        }

        let columns: Vec<String> = rows[0].columns()
            .iter()
            .map(|col| col.name().to_string())
            .collect();

        let mut result_rows = Vec::new();
        for row in rows {
            let mut result_row = Vec::new();
            for (i, column) in row.columns().iter().enumerate() {
                let value = self.extract_postgres_value(&row, i, column.type_info())?;
                result_row.push(value);
            }
            result_rows.push(result_row);
        }

        let row_count = result_rows.len() as u64;
        Ok(QueryResult {
            columns,
            rows: result_rows,
            rows_affected: Some(row_count),
        })
    }

    async fn execute_mysql_query(&self, pool: &MySqlPool, query: &str) -> Result<QueryResult, DatabaseError> {
        let query_trimmed = query.trim();
        let query_upper = query_trimmed.to_uppercase();
        
        println!("[DEBUG] SQL query: '{}', upper: '{}'", query_trimmed, query_upper);
        
        if query_upper.starts_with("USE ") || query_upper.starts_with("SET ") || query_upper.starts_with("CREATE ") || query_upper.starts_with("DROP ") || query_upper.starts_with("ALTER ") || query_upper.starts_with("INSERT ") || query_upper.starts_with("UPDATE ") || query_upper.starts_with("DELETE ") {
            println!("[DEBUG] Using execute() for: {}", query_trimmed);
            let query_clean = query_trimmed.trim_end_matches(';').trim_end_matches('；');
            
            let mut conn = pool.acquire().await.map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
            let result = conn.execute(query_clean)
                .await
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
            
            return Ok(QueryResult {
                columns: vec![],
                rows: vec![],
                rows_affected: Some(result.rows_affected()),
            });
        }

        println!("[DEBUG] Using fetch_all() for: {}", query_trimmed);
        let query_clean = query_trimmed.trim_end_matches(';').trim_end_matches('；');
        let rows = sqlx::query(query_clean)
            .fetch_all(pool)
            .await
            .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;

        // println!("-----------");
        // println!("{:#?}", query);
        // println!("{:#?}", rows);
        // println!("-----------");    
        if rows.is_empty() {
            return Ok(QueryResult {
                columns: vec![],
                rows: vec![],
                rows_affected: Some(0),
            });
        }

        let columns: Vec<String> = rows[0].columns()
            .iter()
            .map(|col| col.name().to_string())
            .collect();

        let mut result_rows = Vec::new();
        for row in rows {
            let mut result_row = Vec::new();
            for (i, column) in row.columns().iter().enumerate() {
                let value = self.extract_mysql_value(&row, i, column.type_info())?;
                result_row.push(value);
            }
            result_rows.push(result_row);
        }

        let row_count = result_rows.len() as u64;
        Ok(QueryResult {
            columns,
            rows: result_rows,
            rows_affected: Some(row_count),
        })
    }

    async fn execute_sqlite_query(&self, pool: &SqlitePool, query: &str) -> Result<QueryResult, DatabaseError> {
        let rows = sqlx::query(query)
            .fetch_all(pool)
            .await
            .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;

        if rows.is_empty() {
            return Ok(QueryResult {
                columns: vec![],
                rows: vec![],
                rows_affected: Some(0),
            });
        }

        let columns: Vec<String> = rows[0].columns()
            .iter()
            .map(|col| col.name().to_string())
            .collect();

        let mut result_rows = Vec::new();
        for row in rows {
            let mut result_row = Vec::new();
            for (i, column) in row.columns().iter().enumerate() {
                let value = self.extract_sqlite_value(&row, i, column.type_info())?;
                result_row.push(value);
            }
            result_rows.push(result_row);
        }

        let row_count = result_rows.len() as u64;
        Ok(QueryResult {
            columns,
            rows: result_rows,
            rows_affected: Some(row_count),
        })
    }

    fn extract_postgres_value(&self, row: &sqlx::postgres::PgRow, index: usize, type_info: &sqlx::postgres::PgTypeInfo) -> Result<serde_json::Value, DatabaseError> {
        use sqlx::TypeInfo;
        
        let type_name = type_info.name();
        match type_name {
            "INT4" | "INT2" | "INT8" => {
                if let Ok(val) = row.try_get::<Option<i64>, _>(index) {
                    Ok(val.map(serde_json::Value::from).unwrap_or(serde_json::Value::Null))
                } else {
                    Ok(serde_json::Value::Null)
                }
            }
            "TEXT" | "VARCHAR" => {
                if let Ok(val) = row.try_get::<Option<String>, _>(index) {
                    Ok(val.map(serde_json::Value::from).unwrap_or(serde_json::Value::Null))
                } else {
                    Ok(serde_json::Value::Null)
                }
            }
            "BOOL" => {
                if let Ok(val) = row.try_get::<Option<bool>, _>(index) {
                    Ok(val.map(serde_json::Value::from).unwrap_or(serde_json::Value::Null))
                } else {
                    Ok(serde_json::Value::Null)
                }
            }
            _ => {
                if let Ok(val) = row.try_get::<Option<String>, _>(index) {
                    Ok(val.map(serde_json::Value::from).unwrap_or(serde_json::Value::Null))
                } else {
                    Ok(serde_json::Value::Null)
                }
            }
        }
    }

    fn extract_mysql_value(&self, row: &sqlx::mysql::MySqlRow, index: usize, type_info: &sqlx::mysql::MySqlTypeInfo) -> Result<serde_json::Value, DatabaseError> {
        use sqlx::TypeInfo;
        let raw_type = type_info.name().to_uppercase();
        let is_unsigned = raw_type.contains("UNSIGNED");
        let cleaned = raw_type.replace("UNSIGNED", "");
        let clean_type = cleaned.trim();

        // 首先尝试 JSON 类型（因为错误提示说列是 JSON）
        if clean_type.contains("JSON") {
            let val: Result<Option<String>, _> = row.try_get(index);
            return match val {
                Ok(v) => Ok(v.map(serde_json::Value::from).unwrap_or(serde_json::Value::Null)),
                Err(_) => {
                    // 如果失败，尝试作为 bytes
                    let bytes: Result<Option<Vec<u8>>, _> = row.try_get(index);
                    match bytes {
                        Ok(opt) => Ok(match opt {
                            Some(b) => serde_json::Value::String("<json>".to_string()),
                            None => serde_json::Value::Null,
                        }),
                        Err(_) => Ok(serde_json::Value::Null),
                    }
                }
            };
        }

        // 使用?运算符直接返回错误
        match clean_type {
            "INT" | "BIGINT" | "SMALLINT" | "MEDIUMINT" | "TINYINT" => {
                if is_unsigned {
                    let val: Option<u64> = row.try_get(index).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
                    Ok(val.map(|v| v.into()).unwrap_or(serde_json::Value::Null))
                } else {
                    let val: Option<i64> = row.try_get(index).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
                    Ok(val.map(|v| v.into()).unwrap_or(serde_json::Value::Null))
                }
            }
            "DECIMAL" | "NEWDECIMAL" => {
                let val: Option<f64> = row.try_get(index).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
                Ok(val.map(serde_json::Value::from).unwrap_or(serde_json::Value::Null))
            }
            "VARCHAR" | "TEXT" | "VARSTRING" | "CHAR" | "TINYTEXT" | "MEDIUMTEXT" | "LONGTEXT" | "JSON" => {
                let val: Option<String> = row.try_get(index).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
                Ok(val.map(serde_json::Value::from).unwrap_or(serde_json::Value::Null))
            }
            "VARBINARY" | "BLOB" | "TINYBLOB" | "MEDIUMBLOB" | "LONGBLOB" => {
                let opt: Option<Vec<u8>> = row.try_get(index).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
                Ok(match opt {
                    Some(bytes) => match String::from_utf8(bytes) {
                        Ok(s) => serde_json::Value::String(s),
                        Err(_) => serde_json::Value::String("<binary>".to_string()),
                    },
                    None => serde_json::Value::Null,
                })
            }
            "BIT" => {
                let val: Option<bool> = row.try_get(index).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
                Ok(val.map(serde_json::Value::from).unwrap_or(serde_json::Value::Null))
            }
            "DATETIME" => {
                row.try_get::<Option<chrono::NaiveDateTime>, _>(index)
                    .map(|val| val.map(|v| v.to_string().into()).unwrap_or(serde_json::Value::Null))
                    .map_err(|e| DatabaseError::QueryFailed(e.to_string()))
            }
            "TIMESTAMP" => {
                row.try_get::<Option<chrono::DateTime<chrono::Utc>>, _>(index)
                    .map(|val| {
                        val.map(|dt| serde_json::Value::String(dt.naive_utc().to_string()))
                        .unwrap_or(serde_json::Value::Null)
                    })
                    .map_err(|e| DatabaseError::QueryFailed(e.to_string()))
            }
            // ✅ 添加这一段
            "DATE" => {
                row.try_get::<Option<chrono::NaiveDate>, _>(index)
                    .map(|val| {
                        val.map(|d| serde_json::Value::String(d.to_string()))
                            .unwrap_or(serde_json::Value::Null)
                    })
                    .map_err(|e| DatabaseError::QueryFailed(e.to_string()))
            }
            "ENUM" | "SET" | "SERIAL" | "YEAR" | "TIME" => {
                // 这些类型尝试当作文本处理
                row.try_get::<Option<String>, _>(index)
                    .map(|val| val.map(serde_json::Value::from).unwrap_or(serde_json::Value::Null))
                    .or_else(|_| {
                        // 如果失败，返回 Null
                        Ok(serde_json::Value::Null)
                    })
            }
            _ => {
                // fallback: 尝试多种方式读取
                // 首先尝试 JSON (因为错误提示说列是 JSON 类型)
                let json_result: Result<Option<String>, _> = row.try_get(index);
                match json_result {
                    Ok(val) => Ok(val.map(serde_json::Value::from).unwrap_or(serde_json::Value::Null)),
                    Err(_) => {
                        // 尝试 String
                        let result: Result<Option<String>, _> = row.try_get(index);
                        match result {
                            Ok(val) => Ok(val.map(serde_json::Value::from).unwrap_or(serde_json::Value::Null)),
                            Err(_) => {
                                // 尝试 bytes
                                let bytes_result: Result<Option<Vec<u8>>, _> = row.try_get(index);
                                match bytes_result {
                                    Ok(opt) => Ok(match opt {
                                        Some(bytes) => match String::from_utf8(bytes) {
                                            Ok(s) => serde_json::Value::String(s),
                                            Err(_) => serde_json::Value::String("<binary>".to_string()),
                                        },
                                        None => serde_json::Value::Null,
                                    }),
                                    Err(_) => Ok(serde_json::Value::Null),
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    fn extract_sqlite_value(&self, row: &sqlx::sqlite::SqliteRow, index: usize, type_info: &sqlx::sqlite::SqliteTypeInfo) -> Result<serde_json::Value, DatabaseError> {
        use sqlx::TypeInfo;
        
        let type_name = type_info.name();
        match type_name {
            "INTEGER" => {
                if let Ok(val) = row.try_get::<Option<i64>, _>(index) {
                    Ok(val.map(serde_json::Value::from).unwrap_or(serde_json::Value::Null))
                } else {
                    Ok(serde_json::Value::Null)
                }
            }
            "TEXT" => {
                if let Ok(val) = row.try_get::<Option<String>, _>(index) {
                    Ok(val.map(serde_json::Value::from).unwrap_or(serde_json::Value::Null))
                } else {
                    Ok(serde_json::Value::Null)
                }
            }
            "REAL" => {
                if let Ok(val) = row.try_get::<Option<f64>, _>(index) {
                    Ok(val.map(serde_json::Value::from).unwrap_or(serde_json::Value::Null))
                } else {
                    Ok(serde_json::Value::Null)
                }
            }
            _ => {
                if let Ok(val) = row.try_get::<Option<String>, _>(index) {
                    Ok(val.map(serde_json::Value::from).unwrap_or(serde_json::Value::Null))
                } else {
                    Ok(serde_json::Value::Null)
                }
            }
        }
    }

    pub async fn get_tables(&self, connection_name: &str, config: &ConnectionConfig) -> Result<Vec<String>, DatabaseError> {
        println!("-----------");
        println!("{:#?}", config);

        let connection = self.connections.get(connection_name)
            .ok_or(DatabaseError::NotConnected)?;

        match connection {
            DatabaseConnection::PostgreSQL(pool) => {
                let query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'";
                let rows = sqlx::query(query)
                    .fetch_all(pool)
                    .await
                    .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
                
                let tables: Vec<String> = rows
                    .iter()
                    .filter_map(|row| row.try_get::<String, _>(0).ok())
                    .collect();
                Ok(tables)
            }
            DatabaseConnection::MySQL(pool) => {
                let query = format!("SHOW TABLES FROM `{}`", config.database);
                let rows = sqlx::query(&query)
                    .fetch_all(pool)
                    .await
                    .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
                
                let tables: Vec<String> = rows
                    .iter()
                    .filter_map(|row| row.try_get::<String, _>(0).ok())
                    .collect();
                Ok(tables)
            }
            DatabaseConnection::SQLite(pool) => {
                let query = "SELECT name FROM sqlite_master WHERE type='table'";
                let rows = sqlx::query(query)
                    .fetch_all(pool)
                    .await
                    .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
                
                let tables: Vec<String> = rows
                    .iter()
                    .filter_map(|row| row.try_get::<String, _>(0).ok())
                    .collect();
                Ok(tables)
            }
        }
    }

    // fn build_connection_string(&self, config: &ConnectionConfig) -> Result<String, DatabaseError> {
    //     let username = encode(
    //         config
    //             .username
    //             .as_deref()
    //             .filter(|s| !s.trim().is_empty())
    //             .unwrap_or("root"),
    //     );
    //     let password = encode(config.password.as_deref().unwrap_or(""));

    //     match config.db_type {
    //         DatabaseType::PostgreSQL => {
    //             let host = config.host.as_deref().unwrap_or("localhost");
    //             let port = config.port.unwrap_or(5432);
    //             // let username = config.username.as_deref().unwrap_or("postgres");
    //             // let password = config.password.as_deref().unwrap_or("");
                
    //             Ok(format!(
    //                 "postgresql://{}:{}@{}:{}/{}",
    //                 username, password, host, port, config.database
    //             ))
    //         }
    //         DatabaseType::MySQL => {
    //             let host = config.host.as_deref().unwrap_or("localhost");
    //             let port = config.port.unwrap_or(3306);
    //             let username = config.username.as_deref().unwrap_or("root");
    //             let password = config.password.as_deref().unwrap_or("");
                
    //             Ok(format!(
    //                 "mysql://{}:{}@{}:{}/{}",
    //                 username, password, host, port, config.database
    //             ))
    //         }
    //         DatabaseType::SQLite => {
    //             if let Some(file_path) = &config.file_path {
    //                 Ok(format!("sqlite:{}", file_path))
    //             } else {
    //                 Ok(format!("sqlite:{}", config.database))
    //             }
    //         }
    //     }
    // }


    fn build_connection_string(&self, config: &ConnectionConfig) -> Result<String, DatabaseError> {
        match config.db_type {
            DatabaseType::PostgreSQL => {
                let (host, port, username, password) = self.extract_connection_params(config, 5432, "postgres");
                Ok(format!(
                    "postgresql://{}:{}@{}:{}/{}",
                    username, password, host, port, config.database
                ))
            }
            DatabaseType::MySQL => {
                let (host, port, username, password) = self.extract_connection_params(config, 3306, "root");
                Ok(format!(
                    "mysql://{}:{}@{}:{}/{}",
                    username, password, host, port, config.database
                ))
            }
            DatabaseType::SQLite => {
                if let Some(file_path) = &config.file_path {
                    Ok(format!("sqlite:{}", file_path))
                } else {
                    Ok(format!("sqlite:{}", config.database))
                }
            }
        }
    }

    fn extract_connection_params(&self, config: &ConnectionConfig, default_port: u16, default_username: &str) -> (String, u16, String, String) {
        let host = config.host.as_deref().unwrap_or("localhost").to_string();
        let port = config.port.unwrap_or(default_port);
        let username = encode(config.username.as_deref().unwrap_or(default_username)).to_string();
        let password = encode(config.password.as_deref().unwrap_or("")).to_string();
        
        (host, port, username, password)
    }

    pub fn get_connection_configs(&self) -> &HashMap<String, ConnectionConfig> {
        &self.configs
    }
}