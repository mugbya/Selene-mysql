// useProjectsStore.ts
import { ExecResult } from '@/types';
import Database from '@tauri-apps/plugin-sql';
import { create } from 'zustand';
import { t } from '@/i18n';


export type Connection = {
  tabId: string;       // 连接tabId
  key?: string; // 连接key,后端根据key从连接池获取链接
  name: string;
  isDataBase: boolean;
  tabType: 'database' | 'connectionManager' | 'settings'; // tab 类型
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

  savedQueryId?: string; // 关联保存的查询
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
  updateContentTitle: (id: string, title: string) => void;
  updateContentExecResult: (id: string, execResult: ExecResult | undefined) => void;
  setContentSavedQueryId: (id: string, savedQueryId: string) => void;
  markContentAsSaved: (id: string) => void;
  setActiveContentTab: (id: string) => void;

  getActiveContent: () => ContentTab | null;
  openSettingsTab: () => void;
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
      // 如果是新连接且是数据库连接，从 localStorage 加载 displayDatabases
      if (conn.isDataBase && conn.tabId) {
        try {
          const savedNodes = JSON.parse(localStorage.getItem('db-connections-tree') || '[]');
          const savedNode = savedNodes.find((n: any) => n.id === conn.tabId);
          if (savedNode?.data?.displayDatabases !== undefined) {
            // 使用存储中的 displayDatabases，覆盖传入的值
            conn = { ...conn, displayDatabases: savedNode.data.displayDatabases };
          }
        } catch (e) {
          console.error("[openConnectionTab] 加载 displayDatabases 失败:", e);
        }
      }
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

    // 查找连接管理 tab
    const alreadyOpen = connectiontabs.find((item) => item.tabType === 'connectionManager');
    if (alreadyOpen) {
      set({ activeId: alreadyOpen.tabId });
    } else {
      const conn: Connection = {
        tabId: crypto.randomUUID(),
        name: t('connection.title'),
        isDataBase: false,
        tabType: 'connectionManager',
      }
      set({
        connectiontabs: [...connectiontabs, conn],
        activeId: conn.tabId,
      });
    }
  },

  openSettingsTab: () => {
    const { connectiontabs } = get();

    // 查找是否已有设置 tab
    const existingSettings = connectiontabs.find((tab) => tab.tabType === 'settings');
    if (existingSettings) {
      set({ activeId: existingSettings.tabId });
      return;
    }

    // 创建新的设置 tab
    const settingsTab: Connection = {
      tabId: crypto.randomUUID(),
      name: t('settings.title'),
      isDataBase: false,
      tabType: 'settings',
    };
    set({
      connectiontabs: [...connectiontabs, settingsTab],
      activeId: settingsTab.tabId,
    });
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

  updateContentTitle: (id, title) => {
    const { contentTabs } = get();
    const updated = contentTabs.map((t) =>
      t.tabId === id ? { ...t, title } : t
    );
    set({ contentTabs: updated });
  },

  setContentSavedQueryId: (id, savedQueryId) => {
    const { contentTabs } = get();
    const updated = contentTabs.map((t) =>
      t.tabId === id ? { ...t, savedQueryId, isSaved: true } : t
    );
    set({ contentTabs: updated });
  },

  updateContentExecResult: (id, execResult) => {
    const { contentTabs } = get();
    const updated = contentTabs.map((t) =>
      t.tabId === id ? { ...t, execResult } : t
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