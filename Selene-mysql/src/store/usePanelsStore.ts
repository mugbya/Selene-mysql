import { create } from 'zustand';

type RightMode = "normal" | "settings";

interface PanelsState {
  showLeftPanel: boolean;
  showRightPanel: boolean;
  rightMode: RightMode;
  setShowLeftPanel: (show: boolean) => void;
  setShowRightPanel: (show: boolean) => void;
  setRightMode: (mode: RightMode) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
}

export const usePanelsStore = create<PanelsState>((set) => ({
  showLeftPanel: true,
  showRightPanel: false,
  rightMode: "normal",

  setShowLeftPanel: (show) => set({ showLeftPanel: show }),
  setShowRightPanel: (show) => set({ showRightPanel: show }),
  setRightMode: (mode) => set({ rightMode: mode }),

  toggleLeftPanel: () =>
    set((state) => ({
      showLeftPanel: !state.showLeftPanel
     })),

  // toggleLeftPanel: () => {
  //   set((state) => {
  //     const showLeftPanel = state.showLeftPanel;
  //     console.log("[usePanelsStore] toggleLeftPanel", showLeftPanel);
  //     return {
  //       showLeftPanel: !showLeftPanel,
  //       // showRightPanel: !showLeftPanel,
  //     };
  //   });
  // },

  toggleRightPanel: () =>
    set((state) => ({
      showRightPanel: !state.showRightPanel,
      rightMode: "normal",
    })),
}));