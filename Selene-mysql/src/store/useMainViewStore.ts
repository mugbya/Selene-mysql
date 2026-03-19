// stores/useMainViewStore.ts
import { create } from 'zustand';

type MainView = 'connection-manager' | 'project-tabs';

// export type MainView = 'connection-manager' | 'project-tabs';

interface MainViewStore {
    view: MainView;
    showConnectionView: boolean;
    showMainView: boolean;
    setView: (v: MainView) => void;
    toggleConnectionView: () => void;
    toggleMainView: () => void;
}

// export const useMainViewStore = create((set) => ({
//   view: 'project-tabs' as MainView,
//   setView: (v: MainView) => set({ view: v }),
// }));

export const useMainViewStore = create<MainViewStore>((set) => ({
    view: 'project-tabs',
    showConnectionView: false,
    showMainView: false,

    setView: (v) => set({ view: v }),

    toggleConnectionView: () =>
        set((state) => ({
            // showConnectionView: !state.showConnectionView
            
        })
    ),

    toggleMainView: () =>
        set((state) => ({
            showMainView: !state.showMainView
        })
    ),

}));