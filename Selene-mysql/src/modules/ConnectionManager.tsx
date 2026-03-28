import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { useConnectionStore } from '@/store/useConnectionStore';
import ConnectionTestView from '@/components/common/connectionManager/ConnectionTestView';
import { DBConnectionPersisted, DBConnectionRuntime } from '@/types';
import ConnectionFormDialog from '@/components/common/dialog/ConnectionFormDialog';
import { connectDatabase, fetchDatabases, disconnectDatabase } from '@/db/msyql-client';
import { useConnectionList } from '@/hooks/useConnectionList';
import { Plus, Link, Pencil, Copy, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'db-connections';
const loadFromStorage = (): DBConnectionPersisted[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
};

// const STORAGE_KEY = 'db-connections';

export default function ConnectionManager() {
  const [editing, setEditing] = useState<DBConnectionPersisted | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { connections, removeConnection, addConnection, updateConnection } = useConnectionList();

  const openConnectionTab = useConnectionStore((state) => state.openConnectionTab);
  const connectiontabs = useConnectionStore((state) => state.connectiontabs);
  const updateConnectionDisplayDatabases = useConnectionStore((state) => state.updateConnectionDisplayDatabases);

  // useEffect(() => {
  //   // const saved = localStorage.getItem(STORAGE_KEY);
  //   // if (saved) {
  //   //   setConnections(JSON.parse(saved));
  //   // }
  //   // setConnections(loadFromStorage());
  // }, []);

  // const saveToStorage = (updated: DBConnectionPersisted[]) => {
  //   localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  //   setConnections(updated);
  // };

  const handleAdd = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (conn: DBConnectionPersisted) => {
    setEditing(conn);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    // const updated = connections.filter((c) => c.id !== id);
    // saveToStorage(updated);
    removeConnection(id)
    disconnectDatabase(id)
  };

  const handleCopy = (conn: DBConnectionPersisted) => {
    const copied = { ...conn, id: nanoid(), name: conn.name + ' (副本)' };
    // saveToStorage([...connections, copied]);
    addConnection(copied);
  };

  const handleSubmit = (conn: DBConnectionPersisted) => {
    console.log("[ConnectionManager] 提交的连接信息:", conn);
    if (editing) {
      updateConnection(conn.id, conn);
      const openConn = connectiontabs.find((c) => c.tabId === conn.id);
      if (openConn) {
        updateConnectionDisplayDatabases(conn.id, conn.displayDatabases ?? []);
      }
    } else {
      const newConn = { ...conn, id: nanoid() };
      addConnection(newConn);
    }
    setDialogOpen(false);
  };

  const handleConnect = async(conn: DBConnectionRuntime) => {

    // const tabId = crypto.randomUUID();
    let displayDatabases = conn.displayDatabases ?? null;

    // 连接前先从 localStorage 加载最新的 displayDatabases（确保使用用户保存的过滤设置）
    const savedConnections = loadFromStorage();
    console.log("[ConnectionManager] loadFromStorage:", savedConnections);
    const savedConn = savedConnections.find(c => c.id === conn.id);
    console.log("[ConnectionManager] savedConn:", savedConn);
    if (savedConn && savedConn.displayDatabases) {
      displayDatabases = savedConn.displayDatabases;
    }
    console.log("[ConnectionManager] displayDatabases after load:", displayDatabases);

    await connectDatabase(conn);
   
    let databases: string[] = [];
    
    console.log("[ConnectionManager] 用户要展示的数据库列表:", conn.displayDatabases);

    const result = await fetchDatabases(conn.id)
    console.log("读取连接下的所有数据库列表:", result);
    if (!result) {
      toast.error("连接失败");
      return;
    }
    const realDatabases = result ?? [];

    if (!displayDatabases || displayDatabases.length === 0) {
       displayDatabases = null;
       databases = realDatabases;
     } else {
       databases = displayDatabases.filter(db => realDatabases.includes(db));
       if (databases.length !== displayDatabases.length) {
         const missingDbs = displayDatabases.filter(db => !realDatabases.includes(db));
         toast.warning(`以下数据库不存在，已过滤: ${missingDbs.join(', ')}`);
         displayDatabases = databases;
       }
     }

     const connInfo = {
       tabId: conn.id, // conn 的唯一ID，也用于 tabId 用作标签切换
       key: conn.id,
       name: conn.name,
       isDataBase: true,
       databases: realDatabases,
       displayDatabases,
     };
     openConnectionTab(connInfo);
  };

  return (
    <div className="w-280">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">数据库连接管理</h2>
        <button onClick={handleAdd} className="p-1 hover:bg-gray-100 rounded" title="新建连接">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <ul className="space-y-2">
        {connections.map((conn) => (
          <li
            key={conn.id}
            className="border p-3 rounded flex justify-between items-center"
          >
            <div>
              <div className="font-medium text-sm">{conn.name}</div>
              <div className="text-xs text-gray-500">
              {conn.type}://{conn.host}:{conn.port}/mysql
              </div>
            </div>
            <div className="flex items-center gap-1">

              <ConnectionTestView key={conn.id} conn={conn}/>

              <button
                className="p-1 hover:bg-green-100 rounded text-green-600"
                onClick={() => handleConnect(conn)}
                title="连接"
              >
                <Link className="w-3 h-3" />
              </button>
              <button
                className="p-1 hover:bg-yellow-100 rounded text-yellow-600"
                onClick={() => handleEdit(conn)}
                title="编辑"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                className="p-1 hover:bg-gray-100 rounded text-gray-600"
                onClick={() => handleCopy(conn)}
                title="复制"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                className="p-1 hover:bg-red-100 rounded text-red-600"
                onClick={() => handleDelete(conn.id)}
                title="删除"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {dialogOpen && (
        <ConnectionFormDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSubmit={handleSubmit}
          defaultValue={editing || undefined}
        />
      )}
    </div>
  );
}