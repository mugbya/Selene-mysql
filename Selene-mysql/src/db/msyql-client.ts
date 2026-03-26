
import { DBConnectionPersisted, ExecResult } from '@/types';
import { invoke } from '@tauri-apps/api/core';

// 执行SQL查询的函数
async function executeSQL(connectionKey: string, sqlQuery: string) {
    try {
        const result: ExecResult = await invoke('execute_query', {
            connectionName: connectionKey,
            query: sqlQuery
        });
        console.log('SQL执行成功:', result);
        return { success: true, data: result };
    } catch (error) {
        console.error('SQL执行失败:', sqlQuery, error);
        return { success: false, message: String(error) };
    }
}

// 连接数据库
async function connectDatabase(connectionConfig: DBConnectionPersisted) {
    try {
        console.log('开始连接数据库:', connectionConfig);
        const result = await invoke('connect_database', {
            name: connectionConfig.id,
            config: connectionConfig
        });
        
        console.log('连接成功:', result);
        return { success: true, message: result };
    } catch (error) {
        console.error('连接失败:', error);
        return { success: false, message: error };
    }
}

async function disconnectDatabase(connectionKey:string) {
    try {
        const result = await invoke('disconnect_database', {
            connectionName: connectionKey
        });
        return { success: true, message: result };
    } catch (error) {
        return { success: false, message: error };
    }
}

// 测试连接
async function testConnection(connectionConfig: DBConnectionPersisted) {
    try {
        const result = await invoke('test_connection', {
            config: connectionConfig
        });
        return { success: true, message: result };
    } catch (error) {
        return { success: false, message: error };
    }
}

// 获取表列表
async function getTables(connectionKey:string, connectionConfig: DBConnectionPersisted) {
    try {
        const tables = await invoke('get_tables', {
            connectionName: connectionKey,
            config: connectionConfig
        });
        
        return { success: true, data: tables };
    } catch (error) {
        return { success: false, message: error };
    }
}

async function fetchDatabases(connectionKey:string) {
    try {
        const result: ExecResult = await invoke('execute_query', {
            connectionName: connectionKey,
            // query: "SELECT CAST(SCHEMA_NAME AS CHAR) as name FROM INFORMATION_SCHEMA.SCHEMATA;"
            query: "show databases;"
        });
        // console.log('SQL执行成功:', result);
        const dbNames: string[] = result.rows.map(row => row[0]);
        return dbNames;
    } catch (error) {
        console.error('SQL执行失败:', error);
        return undefined;
    }
}

async function fetchTables(connectionKey:string, dbName:string) {
    try {
        // 先切换到目标数据库
        await invoke('execute_query', {
            connectionName: connectionKey,
            query: `USE \`${dbName}\``
        });

        // const query = `show tables from ${dbName};`;
        const query = `SELECT TABLE_NAME AS name FROM information_schema.tables WHERE table_schema = '${dbName}'`;
        console.log('SQL执行获取tables:', query);
        const result: ExecResult = await invoke('execute_query', {
            connectionName: connectionKey,
            query: query
        });
        console.log('SQL执行成功:', result);
        const tableNames: string[] = result.rows.map(row => row[0]);
        return tableNames;
    }
    catch (error) {
        console.error('SQL执行失败:', error);
        return undefined;
    }
}

export {
    connectDatabase,
    testConnection,
    // getTables,
    executeSQL,
    fetchDatabases,
    fetchTables,
    disconnectDatabase
}