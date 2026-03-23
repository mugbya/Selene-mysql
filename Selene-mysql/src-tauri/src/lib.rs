// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod database;
mod commands;

use commands::*;
use database::DatabaseManager;
use std::sync::Arc;
use tokio::sync::Mutex;

// use sqlx::mysql::MySqlDriver;
// use sqlx::postgres::PostgresDriver;
// use sqlx::sqlite::SqliteDriver;

// #[ctor::ctor]
// fn register_sqlx_any_drivers() {
//     // 这会触发 sqlx::any 的驱动注册宏
//     sqlx::any::install_driver::<MySqlDriver>();
//     sqlx::any::install_driver::<PostgresDriver>();
//     sqlx::any::install_driver::<SqliteDriver>();
// }

// #[allow(dead_code)]
// async fn _init_sqlx_any() {
//     // 这段代码永远不会运行，只是为了触发编译期注册宏
//     let _ = sqlx::AnyPool::connect("sqlite::memory:").await;
// }

// #[tauri::command]
// fn greet(name: &str) -> String {
//     format!("Hello, {}! You've been greeted from Rust!", name)
// }

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let database_manager = Arc::new(Mutex::new(DatabaseManager::new()));

    // dotenvy::dotenv().ok(); // 加这一行！
    // println!("SQLX_OFFLINE = {:?}", std::env::var("SQLX_OFFLINE"));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init()) // 让你的 Tauri 应用可以打开本地文件或 URL，比如在浏览器中打开网页、用系统默认程序打开文件等
        // .plugin(tauri_plugin_sql::Builder::default().build()) // 让你的 Tauri 应用拥有本地数据库能力，可以用 SQL 语句操作 SQLite、MySQL、PostgreSQL 等数据库
        // .invoke_handler(tauri::generate_handler![greet])
        .manage(database_manager)
        .invoke_handler(tauri::generate_handler![
            connect_database,
            disconnect_database,
            execute_query,
            get_tables,
            test_connection,
            get_active_connections
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
