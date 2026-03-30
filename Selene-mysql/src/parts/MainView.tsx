import { useConnectionStore } from "@/store/useConnectionStore";
import ConnectionManager from "@/modules/ConnectionManager";
import DataBaseView from "@/modules/DataBaseView";
import BaseSettings from "@/modules/settings/BaseSettings";

/**
 * 右边动态内容区域
 */
export default function MainView({ tabId }: { tabId: string | null }) {
  const connectiontabs = useConnectionStore((s) => s.connectiontabs);

  // 如果没有选中的 tab，显示空状态
  if (!tabId) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">暂无内容</p>
          <p className="text-sm">点击左侧菜单打开数据库连接或设置</p>
        </div>
      </div>
    );
  }

  // 获取当前 tab
  const currentTab = connectiontabs.find(t => t.tabId === tabId);

  // 如果没有找到对应的 tab，显示空状态
  if (!currentTab) {
    return (
      <div className="flex flex-1 items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">暂无内容</p>
          <p className="text-sm">点击左侧菜单打开数据库连接或设置</p>
        </div>
      </div>
    );
  }

  // 设置
  if (currentTab.tabType === 'settings') {
    return (
      <div className="flex flex-1 overflow-hidden">
        <BaseSettings />
      </div>
    );
  }

  // 连接管理
  if (currentTab.tabType === 'connectionManager') {
    return (
      <div className="flex flex-1 overflow-hidden">
        <ConnectionManager />
      </div>
    );
  }

  // 数据库连接
  const conn = currentTab;
  const isDataBase = conn.isDataBase;
  const databases = conn.displayDatabases ?? conn.databases ?? [];
  const allDatabases = conn.databases ?? [];
  const dbKey = conn.key ?? null;

  console.log("[MainView] conn.databases:", conn.databases);
  console.log("[MainView] conn.displayDatabases:", conn.displayDatabases);
  console.log("[MainView] allDatabases:", allDatabases);

  return (
    <div className="flex flex-1 overflow-hidden">
      {isDataBase ? (
        <DataBaseView tabId={tabId} dbKey={dbKey} databases={databases} allDatabases={allDatabases} />
      ) : (
        <ConnectionManager />
      )}
    </div>
  );
}