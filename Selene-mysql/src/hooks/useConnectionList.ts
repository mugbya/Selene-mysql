// hooks/useConnectionList.ts
import { useState, useEffect } from 'react';
import type { DBConnectionPersisted, DBConnectionRuntime } from '../types/connection';

const STORAGE_KEY = 'db-connections';

const loadFromStorage = (): DBConnectionPersisted[] => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
};

const saveToStorage = (conns: DBConnectionPersisted[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conns));
};

// 运行时缓存连接对象
// const connectionCache = new Map<string, Database>();

// const buildUrl = (conn: DBConnectionPersisted): string =>
//     `${conn.db_type}://${encodeURIComponent(conn.username)}:${encodeURIComponent(conn.password)}@${conn.host}:${conn.port}/${conn.database}`;

export const useConnectionList = () => {

    const [connections, setConnections] = useState<DBConnectionRuntime[]>([]);

    // 初始加载
    useEffect(() => {
        const persisted = loadFromStorage();
        setConnections(persisted);
    }, []);

    // 获取并缓存连接
    // const getDBConnById = async (id: string): Promise<Database | undefined> => {
    //     const conn = connections.find((c) => c.id === id);
    //     if (!conn) return;

    //     const url = buildUrl(conn);
    //     if (connectionCache.has(url)) return connectionCache.get(url);

    //     const db = await Database.load(url);
    //     // const db = await connectDatabase(conn);
    //     console.log("[getDBConnById] load db: ", db);
    //     connectionCache.set(url, db);

    //     // 更新 dbConn 到运行时状态（不持久化）
    //     setConnections((prev) =>
    //         prev.map((c) => (c.id === id ? { ...c, dbConn: db } : c))
    //     );

    //     return db;
    // };

    const updateConnection = (id: string, patch: Partial<DBConnectionRuntime>) => {
        setConnections((prev) => {
            const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
            saveToStorage(next); // ✅ 持久化到存储
            return next;
        });
    };

    const addConnection = (conn: DBConnectionPersisted) => {
        setConnections((prev) => {
            const next = [...prev, conn];
            saveToStorage(next); // ✅ 只持久化必要字段
            return next;
        });
    };

    const removeConnection = (id: string) => {
        setConnections((prev) => {
            const next = prev.filter((c) => c.id !== id);
            saveToStorage(next);
            return next;
        });
    };

    return {
        connections,
        // getDBConnById,
        updateConnection,
        addConnection,
        removeConnection,
    };
};