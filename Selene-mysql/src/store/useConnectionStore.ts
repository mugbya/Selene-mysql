// useProjectsStore.ts
import { ExecResult } from '@/types';
import Database from '@tauri-apps/plugin-sql';
import { create } from 'zustand';


export type Connection = {
  tabId: string;       // 连接tabId
  key?: string; // 连接key,后端根据key从连接池获取链接
  name: string;
  isDataBase: boolean;
  databases?: string[]; // 当前连接的所有数据库
  displayDatabases?: string[] | null; // 用户自定义要展示的数据库
  currentDb?: string; // 当前激活的数据库
  dbConn?: Database | null
};

// 内容区域 标签页
export type ContentTab = {
  tabId: string;
  title: string;
  tabType: 'query' | 'tableView' | 'tableStructure' | 'tableExport' | 'createTable'; // 新增类型字段
  content?: string;
  // content: React.ReactNode;
  dbKey?: string;
  databaseName?: string;
  tableName?: string;

  // columns?: string[],
  // rows?: string[][]
  // rows_affected?: number;
  execResult?: ExecResult,

  // queryId?: string; // 如果是已有的查询，可保存其 ID
  isSaved?: boolean;
};


type ConnectionState = {
  connectiontabs: Connection[];
  activeId: string | null;

  contentTabs: ContentTab[];
  activeContentId: string | null;

  openConnectionTab: (conn: Connection) => void;
  closeConnectionTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  getActiveTab: () => Connection | null;
  toggleConnectionButton: () => void;
  updateConnectionDisplayDatabases: (tabId: string, displayDatabases: string[]) => void;
  updateConnectionDatabases: (tabId: string, databases: string[]) => void;
  updateCurrentDb: (tabId: string, currentDb: string) => void;

  openContentTab: (tab: ContentTab) => void;
  closeContentTab: (id: string) => void;
  updateContentContent: (id: string, content: string) => void;
  markContentAsSaved: (id: string) => void;
  setActiveContentTab: (id: string) => void;

  getActiveContent: () => ContentTab | null;
};

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  connectiontabs: [],
  activeId: null,

  contentTabs: [],
  activeContentId: null,

  openConnectionTab: (conn) => {
    const { connectiontabs } = get();

    const alreadyOpen = connectiontabs.find((p) => p.tabId === conn.tabId);
    if (!alreadyOpen) {
      set({
        connectiontabs: [...connectiontabs, conn],
        activeId: conn.tabId,
      });
    } else {
      set({ activeId: conn.tabId });
    }
  },

  closeConnectionTab: (id) => {
    const { connectiontabs, activeId } = get();
    const filtered = connectiontabs.filter((p) => p.tabId !== id);

    const newActiveId =
      activeId === id ? (filtered.length ? filtered[0].tabId : null) : activeId;

    set({
      connectiontabs: filtered,
      activeId: newActiveId,
    });
  },

  getActiveTab: () => {
    const { connectiontabs, activeId } = get();
    return connectiontabs.find((p) => p.tabId === activeId) || null;
  },

  setActiveTab: (id) => set({ activeId: id }),

  // setDBConn: (tabId, dbConn) => {
  //   const { connectiontabs } = get();
  //   const newTabs = connectiontabs.map((tab) => {
  //     if (tab.tabId === tabId) {
  //       return { ...tab, dbConn };
  //     }
  //     return tab;
  //   });
  //   set({ connectiontabs: newTabs });
  // },

  toggleConnectionButton: () => {
    const { connectiontabs } = get();

    // const alreadyOpen = connectiontabs.find((p) => p.name === "连接管理");
    const alreadyOpen = connectiontabs.find((item) => !item.isDataBase);
    if (alreadyOpen) {
      set({ activeId: alreadyOpen.tabId });
    } else {
      const conn: Connection = {
        tabId: crypto.randomUUID(),
        name: "连接管理",
        isDataBase: false,
      }
      set({
        connectiontabs: [...connectiontabs, conn],
        activeId: conn.tabId,
      });
    }
  },

  openContentTab: (tab) => {
    const { contentTabs } = get();
    const exists = contentTabs.find((t) => t.tabId === tab.tabId);
    if (!exists) {
      set({
        contentTabs: [...contentTabs, tab],
        activeContentId: tab.tabId,
      });
    } else {
      set({ activeContentId: tab.tabId });
    }
  },

  closeContentTab: (id) => {
    const { contentTabs, activeContentId } = get();
    const updated = contentTabs.filter((t) => t.tabId !== id);
    set({
      contentTabs: updated,
      activeContentId: activeContentId === id ? (updated[0]?.tabId ?? null) : activeContentId,
    });
  },

  updateContentContent: (id, content) => {
    const { contentTabs } = get();
    const updated = contentTabs.map((t) =>
      t.tabId === id ? { ...t, content, isSaved: false } : t
    );
    set({ contentTabs: updated });
  },

  markContentAsSaved: (id) => {
    const { contentTabs } = get();
    const updated = contentTabs.map((t) =>
      t.tabId === id ? { ...t, isSaved: true } : t
    );
    set({ contentTabs: updated });
  },

  setActiveContentTab: (id) => set({ activeContentId: id }),

  updateConnectionDisplayDatabases: (tabId, displayDatabases) => {
    const { connectiontabs } = get();
    const updated = connectiontabs.map((conn) =>
      conn.tabId === tabId ? { ...conn, displayDatabases } : conn
    );
    set({ connectiontabs: updated });
  },

  updateConnectionDatabases: (tabId, databases) => {
    const { connectiontabs } = get();
    const updated = connectiontabs.map((conn) =>
      conn.tabId === tabId ? { ...conn, databases } : conn
    );
    set({ connectiontabs: updated });
  },

  updateCurrentDb: (tabId, currentDb) => {
    const { connectiontabs } = get();
    const updated = connectiontabs.map((conn) =>
      conn.tabId === tabId ? { ...conn, currentDb } : conn
    );
    set({ connectiontabs: updated });
  },

  getActiveContent: () => {
    const { contentTabs, activeContentId } = get();
    return contentTabs.find((t) => t.tabId === activeContentId) ?? null;
  },

}));