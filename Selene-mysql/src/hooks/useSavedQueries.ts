// hooks/useSavedQueries.ts
import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import type { SavedQuery } from '../types/connection';

const STORAGE_KEY = 'saved-queries';

// 全局订阅者存储
type Listener = () => void;
const listeners = new Set<Listener>();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const loadFromStorage = (): SavedQuery[] => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
};

const saveToStorage = (queries: SavedQuery[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queries));
};

// 共享状态
let sharedQueries: SavedQuery[] = loadFromStorage();

const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useSavedQueries = (dbKey?: string) => {
    // 使用 useSyncExternalStore 实现跨组件共享状态
    const savedQueries = useSyncExternalStore(
      subscribe,
      () => sharedQueries,
      () => sharedQueries
    );

    // 根据 dbKey 过滤查询
    const filteredQueries = dbKey
        ? savedQueries.filter(q => q.dbKey === dbKey)
        : savedQueries;

    const addSavedQuery = useCallback((query: Omit<SavedQuery, 'id' | 'createdAt' | 'updatedAt'>) => {
        const now = Date.now();
        const newQuery: SavedQuery = {
            ...query,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        };
        sharedQueries = [...sharedQueries, newQuery];
        saveToStorage(sharedQueries);
        notifyListeners();
        return newQuery;
    }, []);

    const updateSavedQuery = useCallback((id: string, patch: Partial<Omit<SavedQuery, 'id' | 'createdAt'>>) => {
        sharedQueries = sharedQueries.map(q =>
            q.id === id ? { ...q, ...patch, updatedAt: Date.now() } : q
        );
        saveToStorage(sharedQueries);
        notifyListeners();
    }, []);

    const deleteSavedQuery = useCallback((id: string) => {
        sharedQueries = sharedQueries.filter(q => q.id !== id);
        saveToStorage(sharedQueries);
        notifyListeners();
    }, []);

    const getSavedQueryById = useCallback((id: string): SavedQuery | undefined => {
        return savedQueries.find(q => q.id === id);
    }, [savedQueries]);

    // 刷新查询列表
    const refreshQueries = useCallback(() => {
        sharedQueries = loadFromStorage();
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
