import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { useConnectionStore } from '@/store/useConnectionStore';
import ConnectionTestView from '@/components/common/connectionManager/ConnectionTestView';
import { DBConnectionPersisted, DBConnectionRuntime } from '@/types';
import ConnectionFormDialog from '@/components/common/dialog/ConnectionFormDialog';
import { connectDatabase, fetchDatabases, disconnectDatabase } from '@/db/msyql-client';
import { useConnectionList } from '@/hooks/useConnectionList';

// const STORAGE_KEY = 'db-connections';

export default function ConnectionManager() {
  const [editing, setEditing] = useState<DBConnectionPersisted | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { connections, removeConnection, addConnection, updateConnection } = useConnectionList();

  const openConnectionTab = useConnectionStore((state) => state.openConnectionTab);

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
    // const updated = editing
    //   ? connections.map((c) => (c.id === conn.id ? conn : c))
    //   : [...connections, { ...conn, id: nanoid() }];
    // saveToStorage(updated);
    console.log("[ConnectionManager] 提交的连接信息:", conn);
    if (editing) {
      updateConnection(conn.id, conn); // 直接更新已有连接
    } else {
      const newConn = { ...conn, id: nanoid() };
      addConnection(newConn); // 添加新连接并持久化
    }
    setDialogOpen(false);
  };

  const handleConnect = async(conn: DBConnectionRuntime) => {
  
    // const tabId = crypto.randomUUID();
    let displayDatabases = conn.displayDatabases ?? null;
    await connectDatabase(conn);
   
    let databases: string[] = [];
    
    console.log("[ConnectionManager] 用户要展示的数据库列表:", conn.displayDatabases);

    if (!displayDatabases || displayDatabases.length === 0) {
      displayDatabases = null;
      const result = await fetchDatabases(conn.id)
      console.log("数据库列表:", result);
      if (!result) {
        toast.error("连接失败");
        return;
      }
      databases = result ?? [];
    }

    const connInfo = {
      tabId: conn.id, // conn 的唯一ID，也用于 tabId 用作标签切换
      key: conn.id,
      name: conn.name,
      isDataBase: true,
      databases,
      displayDatabases,
    };
    openConnectionTab(connInfo);
  };

  return (
    <div className="w-280">
      <h2 className="text-xl font-bold mb-4">数据库连接管理</h2>
      <button onClick={handleAdd} className="px-3 py-1 bg-blue-500 text-white rounded">
        新建连接
      </button>

      <ul className="mt-4 space-y-2">
        {connections.map((conn) => (
          <li
            key={conn.id}
            className="border p-4 rounded flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">{conn.name}</div>
              <div className="text-sm text-gray-500">
              {/* <strong className="font-semibold">{conn.name}</strong>  */}
              {/* {conn.type}://{conn.host}:{conn.port}/{conn.database} */}
              {conn.type}://{conn.host}:{conn.port}/mysql
              </div>
            </div>
            <div className="space-x-2">


              <ConnectionTestView key={conn.id} conn={conn}/>

              <button
                className="px-2 py-1 text-sm bg-green-600 text-white rounded"
                onClick={() => handleConnect(conn)}
              >
                连接
              </button>
              <button
                className="px-2 py-1 text-sm bg-yellow-500 text-white rounded"
                onClick={() => handleEdit(conn)}
              >
                编辑
              </button>
              <button
                className="px-2 py-1 text-sm bg-gray-500 text-white rounded"
                onClick={() => handleCopy(conn)}
              >
                复制
              </button>
              <button
                className="px-2 py-1 text-sm bg-red-600 text-white rounded"
                onClick={() => handleDelete(conn.id)}
              >
                删除
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