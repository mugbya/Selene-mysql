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

// 共享状态
let sharedQueryIndexes: SavedQueryIndex[] = [];

const loadIndexesFromStorage = (): SavedQueryIndex[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const queries: SavedQuery[] = JSON.parse(raw);
  // 转换为索引格式
  sharedQueryIndexes = queries.map(q => ({
    id: q.id,
    name: q.name,
    dbKey: q.dbKey,
    databaseName: q.databaseName,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
  }));
  return sharedQueryIndexes;
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
  // 初始加载
  useEffect(() => {
    loadIndexesFromStorage();
  }, []);

  // 使用 useSyncExternalStore 同步状态
  const savedQueries = useSyncExternalStore(
    subscribe,
    () => sharedQueryIndexes,
    () => sharedQueryIndexes
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

    // 更新共享索引
    const newIndex: SavedQueryIndex = {
      id: newQuery.id,
      name: newQuery.name,
      dbKey: newQuery.dbKey,
      databaseName: newQuery.databaseName,
      createdAt: newQuery.createdAt,
      updatedAt: newQuery.updatedAt,
    };
    sharedQueryIndexes = [...sharedQueryIndexes, newIndex];
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

    // 更新共享索引
    sharedQueryIndexes = sharedQueryIndexes.map(q =>
      q.id === id ? { ...q, ...patch, updatedAt: Date.now() } : q
    );
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

    // 从共享索引中删除
    sharedQueryIndexes = sharedQueryIndexes.filter(q => q.id !== id);
    notifyListeners();
  }, []);

  const getSavedQueryById = useCallback((id: string): SavedQueryIndex | undefined => {
    return savedQueries.find(q => q.id === id);
  }, [savedQueries]);

  // 刷新查询列表
  const refreshQueries = useCallback(() => {
    loadIndexesFromStorage();
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
