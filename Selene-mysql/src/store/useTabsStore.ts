import { create } from "zustand";

// stores/useTabsStore.ts
interface Tab {
  id: string;
  title: string;
  type: string;
  content: React.ReactNode;
}

interface TabsState {
  tabs: Tab[];
  activeTabId: string;
  openTab: (tab: Tab) => void;
  closeTab: (id: string) => void;
}

export const useTabsStore = create<TabsState>((set) => ({
  tabs: [],
  activeTabId: '',
  openTab: (tab) => set((state) => ({
    tabs: [...state.tabs, tab],
    activeTabId: tab.id
  })),
  closeTab: (id) => set((state) => ({
    tabs: state.tabs.filter(t => t.id !== id),
    activeTabId: state.tabs[0]?.id || ''
  }))
}));