// hooks/useSavedQueries.ts
import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import type { SavedQuery } from '../types/connection';

const STORAGE_KEY = 'saved-queries';

// 索引信息（不包含 content，减少内存占用）
export interface SavedQueryIndex {
  id: string;
  name: string;
  dbKey: string;
  databaseName?: string;
  createdAt: number;
  updatedAt: number;
}

// 全局订阅者存储
type Listener = () => void;
const listeners = new Set<Listener>();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

// 只保存索引，不保存 content
let sharedQueryIndexes: SavedQueryIndex[] = [];

const loadIndexesFromStorage = (): SavedQueryIndex[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const queries: SavedQuery[] = JSON.parse(raw);
  // 转换为索引格式
  return queries.map(q => ({
    id: q.id,
    name: q.name,
    dbKey: q.dbKey,
    databaseName: q.databaseName,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
  }));
};

const saveIndexesToStorage = (indexes: SavedQueryIndex[]) => {
  // 保存完整的查询数据到 localStorage（包含 content）
  // 这里需要读取现有的完整数据，只更新索引部分
  const raw = localStorage.getItem(STORAGE_KEY);
  let fullQueries: SavedQuery[] = raw ? JSON.parse(raw) : [];

  // 更新 fullQueries 中的索引信息
  fullQueries = fullQueries.map(q => {
    const idx = indexes.find(i => i.id === q.id);
    if (idx) {
      return { ...q, name: idx.name, updatedAt: idx.updatedAt };
    }
    return q;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(fullQueries));
};

const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// 根据 id 从 localStorage 读取完整查询
export const getSavedQueryContent = (id: string): SavedQuery | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const queries: SavedQuery[] = JSON.parse(raw);
  return queries.find(q => q.id === id) || null;
};

export const useSavedQueries = (dbKey?: string | null) => {
  const [queryIndexes, setQueryIndexes] = useState<SavedQueryIndex[]>([]);

  // 初始加载索引
  useEffect(() => {
    setQueryIndexes(loadIndexesFromStorage());
  }, []);

  // 使用 useSyncExternalStore 同步状态
  const savedQueries = useSyncExternalStore(
    subscribe,
    () => queryIndexes,
    () => queryIndexes
  );

  // 根据 dbKey 过滤查询
  const filteredQueries = (dbKey && dbKey.trim())
    ? savedQueries.filter(q => q.dbKey === dbKey)
    : [];

  const addSavedQuery = useCallback((query: Omit<SavedQuery, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    const newQuery: SavedQuery = {
      ...query,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    // 保存完整数据到 localStorage
    const raw = localStorage.getItem(STORAGE_KEY);
    const queries: SavedQuery[] = raw ? JSON.parse(raw) : [];
    queries.push(newQuery);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queries));

    // 更新内存中的索引
    const newIndex: SavedQueryIndex = {
      id: newQuery.id,
      name: newQuery.name,
      dbKey: newQuery.dbKey,
      databaseName: newQuery.databaseName,
      createdAt: newQuery.createdAt,
      updatedAt: newQuery.updatedAt,
    };
    setQueryIndexes(prev => [...prev, newIndex]);
    notifyListeners();

    return newQuery;
  }, []);

  const updateSavedQuery = useCallback((id: string, patch: Partial<Omit<SavedQuery, 'id' | 'createdAt'>>) => {
    // 更新 localStorage 中的完整数据
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const queries: SavedQuery[] = JSON.parse(raw);
      const updated = queries.map(q =>
        q.id === id ? { ...q, ...patch, updatedAt: Date.now() } : q
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }

    // 更新内存中的索引
    setQueryIndexes(prev => {
      const updated = prev.map(q =>
        q.id === id ? { ...q, ...patch, updatedAt: Date.now() } : q
      );
      return updated;
    });
    notifyListeners();
  }, []);

  const deleteSavedQuery = useCallback((id: string) => {
    // 从 localStorage 中删除
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const queries: SavedQuery[] = JSON.parse(raw);
      const filtered = queries.filter(q => q.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }

    // 从内存索引中删除
    setQueryIndexes(prev => prev.filter(q => q.id !== id));
    notifyListeners();
  }, []);

  const getSavedQueryById = useCallback((id: string): SavedQueryIndex | undefined => {
    return savedQueries.find(q => q.id === id);
  }, [savedQueries]);

  // 刷新查询列表
  const refreshQueries = useCallback(() => {
    setQueryIndexes(loadIndexesFromStorage());
    notifyListeners();
  }, []);

  return {
    savedQueries: filteredQueries,
    addSavedQuery,
    updateSavedQuery,
    deleteSavedQuery,
    getSavedQueryById,
    refreshQueries,
  };
};
