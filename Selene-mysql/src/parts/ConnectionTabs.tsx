import { useConnectionStore, Connection } from "@/store/useConnectionStore";
import { X, Settings as SettingsIcon } from "lucide-react";

/**
 * 连接tab页
 */
export default function ConnectionTabs() {
  const connectiontabs = useConnectionStore((s) => s.connectiontabs);
  const activeId = useConnectionStore((s) => s.activeId);
  const setActiveTab = useConnectionStore((s) => s.setActiveTab);
  const closeConnectionTab = useConnectionStore((s) => s.closeConnectionTab);

  return (
    <div className="flex items-end border-b border-border bg-muted h-[42px]">
      {connectiontabs.map((tab) => {
        const isActive = tab.tabId === activeId;

        return (
          <div
            key={tab.tabId}
            className={`relative flex items-center px-4 py-2 mr-1 rounded-t-lg transition-all duration-150 cursor-pointer
            ${
              isActive
                ? "bg-background border border-b-0 border-border z-10"
                : "bg-muted text-muted-foreground"
            }
            `}
            onClick={() => setActiveTab(tab.tabId)}
          >
            {tab.tabType === 'settings' && (
              <SettingsIcon className="w-4 h-4 mr-1" />
            )}
            <span className="text-sm truncate max-w-[120px]">{tab.name}</span>

            <X
              className="ml-2 w-4 h-4 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                closeConnectionTab(tab.tabId);
              }}
            />
          </div>
        );
      })}

      <div className="flex-1 h-full bg-muted"></div>
    </div>
  );
}