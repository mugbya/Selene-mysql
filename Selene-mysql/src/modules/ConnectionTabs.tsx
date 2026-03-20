import { useConnectionStore } from "@/store/useConnectionStore";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export default function ConnectionTabs() {
  const connectiontabs = useConnectionStore((s) => s.connectiontabs);
  const activeId = useConnectionStore((s) => s.activeId);
  const setActiveTab = useConnectionStore((s) => s.setActiveTab);
  const closeConnectionTab = useConnectionStore((s) => s.closeConnectionTab);

  const renderCount = useRef(0);

  useEffect(() => {
    console.log("[ConnectionTabs] 渲染次数:", renderCount.current++);
  }, []);

  const hasTabs = connectiontabs.length > 0;

  return (
    <div className="flex items-end border-b border-gray-300 bg-gray-100 h-[42px]">
      {hasTabs ? (
        <>
          {connectiontabs.map((tab) => {
            const isActive = tab.tabId === activeId;
            
            return (
              <div
                key={tab.tabId}
                className={`relative flex items-center px-4 py-2 mr-1 rounded-t-lg transition-all duration-150 cursor-pointer
                ${
                  isActive
                    ? "bg-white border border-b-0 border-gray-300 shadow-sm z-10"
                    : "bg-gray-200 text-gray-600"
                }
                `}
                onClick={() => setActiveTab(tab.tabId)}
              >
                <span className="text-sm truncate max-w-[120px]">{tab.name}</span>

                <X
                  className="ml-2 w-4 h-4 hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeConnectionTab(tab.tabId);
                  }}
                />
              </div>
            );
          })}
          <div className="flex-1 h-full bg-gray-100"></div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-100" style={{ height: '42px' }}>
          <span className="text-gray-400 text-sm">暂无连接，请先创建数据库连接</span>
        </div>
      )}
    </div>
  );
}
