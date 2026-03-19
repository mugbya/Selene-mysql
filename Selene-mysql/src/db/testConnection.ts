// 安装 Tauri v2 前端依赖
// npm install @tauri-apps/api@next

import { DBConnectionPersisted } from '@/types';
import { invoke } from '@tauri-apps/api/core';

// 执行SQL查询的函数
async function executeSQL(connectionName: string, sqlQuery: string) {
    try {
        const result = await invoke('execute_query', {
            connectionName: connectionName,
            query: sqlQuery
        });
        
        console.log('SQL执行成功:', result);
        return { success: true, data: result };
    } catch (error) {
        console.error('SQL执行失败:', error);
        return { success: false, message: error };
    }
}

// 连接数据库
async function connectDatabase(connectionName: string, connectionConfig: DBConnectionPersisted) {
    try {
        const result = await invoke('connect_database', {
            name: connectionName,
            config: connectionConfig
        });
        
        console.log('连接成功:', result);
        return { success: true, message: result };
    } catch (error) {
        console.error('连接失败:', error);
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
async function getTables(connectionName:string, connectionConfig: DBConnectionPersisted) {
    try {
        const tables = await invoke('get_tables', {
            connectionName: connectionName,
            config: connectionConfig
        });
        
        return { success: true, data: tables };
    } catch (error) {
        return { success: false, message: error };
    }
}

// 使用示例
const handleExecuteSQL = async () => {
    const connectionConfig = {
        id: '1',
        name: 'Main Connection',
        key: 'main_connection',
        type: 'mysql', // 或 'postgres', 'sqlite',
        databases: [],
        db_type: 'MySQL', // 或 'PostgreSQL', 'SQLite'
        host: '192.168.3.247',
        port: 3306,
        username: 'shimao',
        password: 'Qaz@#$5wr',
        database: 'ita-ics-platform',
        file_path: null // 仅SQLite需要
    };

    // 先连接数据库
    const connectResult = await connectDatabase('main_connection', connectionConfig);
    if (!connectResult.success) {
        alert('连接失败: ' + connectResult.message);
        return;
    }

    // 执行SQL
    const sqlQuery = 'select * from `ita-ics-platform`.project  limit 3;';
    const queryResult = await executeSQL('main_connection', sqlQuery);
    
    if (queryResult.success) {
        console.log('查询结果:', queryResult.data);
        // 处理查询结果...
    } else {
        alert('查询失败: ' + queryResult.message);
    }
};

export {
    handleExecuteSQL,
    connectDatabase,
    testConnection,
    getTables
}