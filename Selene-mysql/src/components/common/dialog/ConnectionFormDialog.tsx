import { useState, useEffect } from 'react';
import { SiMysql, SiMariadb, SiMongodb, SiPostgresql } from 'react-icons/si';
import { DBConnectionPersisted, DBConnectionRuntime } from '@/types';
import { connectDatabase, fetchDatabases } from '@/db/msyql-client';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (conn: DBConnectionRuntime) => void;
  defaultValue?: DBConnectionPersisted;
}

export default function ConnectionFormDialog({
  open,
  onClose,
  onSubmit,
  defaultValue,
}: Props) {

  const [form, setForm] = useState<DBConnectionRuntime>({
    id: crypto.randomUUID(),
    name: '',
    type: 'mysql',
    db_type: 'MySQL',
    host: 'localhost',
    port: 3306,
    username: '',
    password: '',
    database: "mysql",
    databases: [],
  });


  useEffect(() => {
    // 用于回显表单数据
    if (defaultValue) {
      setForm(defaultValue);
      console.log("[ConnectionFormDialog] 回显表单数据:", defaultValue);
      if (defaultValue.displayDatabases) {
        setSelectedDBs(defaultValue.displayDatabases);
      }
    }
  }, [defaultValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  if (!open) return null;

  const [activeTab, setActiveTab] = useState<'basic' | 'databases'>('basic');
  const [dbList, setDbList] = useState<string[]>([]);
  const [selectedDBs, setSelectedDBs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  const filteredDBs = dbList.filter((name) =>
    name.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const loadDatabases = async () => {
    if (dbList.length > 0 || loading) return;
    setLoading(true);
    
    await connectDatabase(form);
    const result = await fetchDatabases(form.id); // your existing logic
    if (result) {
      setDbList(result??[]);
    }
    setLoading(false);
  };

  const toggleDb = (name: string) => {
    setSelectedDBs((prev) =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const submitWithSelectedDBs = () => {
      console.log("[submitWithSelectedDBs] displayDatabases: ", selectedDBs);
      onSubmit({ ...form, displayDatabases: selectedDBs });
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 ">
      <div className="bg-white p-6 rounded !w-[800px] !h-[600px] !max-w-none !min-w-0  shadow-lg shadow-blue-500/30 flex flex-col">
        <div className='flex gap-2 pb-3'>
          <SiMysql className="text-yellow-600 w-10 h-10 " />
          <h3 className="text-lg font-bold mt-2"> 数据库连接</h3>
        </div>

        {/* Tab Header */}
        <div className="flex border-b mb-4">
          <div
            className={`cursor-pointer px-4 py-2 -mb-[2px] border-b-2 transition-colors duration-200 text-sm font-medium
              ${activeTab === 'basic'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-blue-500'}
            `}
            onClick={() => setActiveTab('basic')}
          >
            基本信息
          </div>
          <div
            className={`cursor-pointer px-4 py-2 -mb-[2px] border-b-2 transition-colors duration-200 text-sm font-medium
              ${activeTab === 'databases'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-blue-500'}
            `}
            onClick={() => {
              setActiveTab('databases');
              loadDatabases();
            }}
          >
            数据库
          </div>
        </div>


        {/* Tab Content */}
        <div className="flex-1 overflow-auto space-y-4">
          {activeTab === 'basic' && (
            <div className="space-y-3">
              <div className="flex gap-6">
                <input name="name" value={form.name} onChange={handleChange} placeholder="名称" className="w-full p-2 border rounded" />
              </div>
              <div className="flex gap-6">
                <input name="host" value={form.host} onChange={handleChange} placeholder="localhost" className="w-full p-2 border rounded" />
                <input name="port" type="number" value={form.port} onChange={handleChange} placeholder="Port" className="w-full p-2 border rounded" />
              </div>
              <input name="username" value={form.username} onChange={handleChange} placeholder="用户名" className="w-full p-2 border rounded" />
              <input name="password" value={form.password} onChange={handleChange} placeholder="密码" className="w-full p-2 border rounded" />
              {/* <input
                name="database"
                value={form.database}
                onChange={handleChange}
                placeholder="默认数据库名"
                className="w-full p-2 border rounded"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
              /> */}
            </div>
          )}

          {activeTab === 'databases' && (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="搜索数据库..."
                className="w-full p-2 border rounded"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />

              {loading ? (
                <div className="text-gray-500">正在加载数据库列表...</div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-auto">
                  {filteredDBs.map(name => (
                    <label key={name} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedDBs.includes(name)}
                        onChange={() => toggleDb(name)}
                      />
                      <span>{name}</span>
                    </label>
                  ))}
                  {filteredDBs.length === 0 && (
                    <div className="text-gray-400 col-span-2">无匹配数据库</div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-1 bg-gray-400 text-white rounded" onClick={onClose}>
            取消
          </button>
          {/* <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={handleSubmit}> */}
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={submitWithSelectedDBs}>
            保存
          </button>
        </div>

      </div>
    </div>
  );
}