use crate::database::{ConnectionConfig, DatabaseManager, QueryResult};
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

pub type DatabaseManagerState = Arc<Mutex<DatabaseManager>>;

#[tauri::command]
pub async fn connect_database(
    name: String,
    config: ConnectionConfig,
    state: State<'_, DatabaseManagerState>,
) -> Result<String, String> {
    let mut manager = state.lock().await;
    manager.connect(name.clone(), config).await
        .map_err(|e| e.to_string())?;
    Ok(format!("Successfully connected to database: {}", name))
}

#[tauri::command]
pub async fn disconnect_database(
    name: String,
    state: State<'_, DatabaseManagerState>,
) -> Result<String, String> {
    let mut manager = state.lock().await;
    manager.disconnect(&name).await
        .map_err(|e| e.to_string())?;
    Ok(format!("Successfully disconnected from database: {}", name))
}

#[tauri::command]
pub async fn execute_query(
    connection_name: String,
    query: String,
    state: State<'_, DatabaseManagerState>,
) -> Result<QueryResult, String> {
    let manager = state.lock().await;
    manager.execute_query(&connection_name, &query).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_tables(
    connection_name: String,
    config: ConnectionConfig,
    state: State<'_, DatabaseManagerState>,
) -> Result<Vec<String>, String> {
    let manager = state.lock().await;
    manager.get_tables(&connection_name, &config).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn test_connection(config: ConnectionConfig) -> Result<String, String> {
    let mut temp_manager = DatabaseManager::new();
    let test_name = "test_connection".to_string();
    
    match temp_manager.connect(test_name.clone(), config).await {
        Ok(_) => {
            let _ = temp_manager.disconnect(&test_name).await;
            Ok("Connection successful".to_string())
        }
        Err(e) => Err(e.to_string())
    }
}

#[tauri::command]
pub async fn get_active_connections(
    state: State<'_, DatabaseManagerState>,
) -> Result<Vec<String>, String> {
    let manager = state.lock().await;
    Ok(manager.get_connection_configs().keys().cloned().collect())
}