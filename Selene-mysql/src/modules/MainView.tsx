import { useConnectionStore } from "@/store/useConnectionStore";
import ConnectionManager from "./ConnectionManager";
import DataBaseView from "./DataBaseView";

export default function MainView({ tabId }: { tabId: string | null }) {
  if (!tabId) {
    return null;
  }
  const store = useConnectionStore.getState();

  const conn = store.getActiveTab();
  if (!conn) {
    return null;
  }
  const isDataBase = conn.isDataBase;
  const databases = conn.displayDatabases ?? conn.databases?? [];
  const allDatabases = conn.databases ?? []; // 所有数据库
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
