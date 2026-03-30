import Header from "./parts/Header";
import Footer from "./parts/Footer";
import MenuPanel from "./parts/MenuPanel";
import { useRef } from "react";
import { Toaster } from "sonner";
import { usePanelsStore } from "./store/usePanelsStore";
import MainView from "./parts/MainView";
import { useConnectionStore } from "./store/useConnectionStore";
import ConnectionTabs from "./parts/ConnectionTabs";


export default function Layout() {
  const toggleLeftPanel = usePanelsStore((s) => s.toggleLeftPanel);
  const toggleRightPanel = usePanelsStore((s) => s.toggleRightPanel);

  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log("\n[Layout] 执行渲染 count:", renderCount.current);

  const conTabId = useConnectionStore((s) => s.activeId);

  return (
    <div className="flex flex-col h-screen bg-background text-foreground ">
      {/* <Header toggleLeft={toggleLeftPanel} toggleRight={toggleRightPanel} /> */}

      {/* 消息提示 */}
      <Toaster position="top-center" richColors duration={30000} closeButton />

      {/* 连接标签页 */}
      <ConnectionTabs />

      <div className="flex flex-1 overflow-hidden pt-2">
        {/* 最左侧菜单栏 */}
        <MenuPanel
          openSettings={() => {
            useConnectionStore.getState().openSettingsTab();
          }}
          toggleLeft={toggleLeftPanel}
        />

        {/* 右边动态内容区域 */}
        <div className="flex flex-1 overflow-hidden pt-2 pl-2 pr-2">
          <MainView tabId={conTabId ?? null} />
        </div>
      </div>

      <Footer />
    </div>
  );
}