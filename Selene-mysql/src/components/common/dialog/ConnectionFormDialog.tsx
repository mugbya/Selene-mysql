import { useState, useEffect } from 'react';
import { SiMysql } from 'react-icons/si';
import { DBConnectionPersisted, DBConnectionRuntime } from '@/types';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';

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


  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (defaultValue) {
      setForm(defaultValue);
      console.log("[ConnectionFormDialog] 回显表单数据:", defaultValue);
    }
  }, [defaultValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  if (!open) return null;

  const handleSubmit = () => {
    console.log("[ConnectionFormDialog] 提交连接信息:", form);
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 ">
      <div className="bg-white p-6 rounded !w-[800px] !h-[600px] !max-w-none !min-w-0 border flex flex-col">
        <div className='flex gap-2 pb-3'>
          <SiMysql className="text-yellow-600 w-10 h-10 " />
          <h3 className="text-lg font-bold mt-2"> 数据库连接</h3>
        </div>

        <div className="flex-1 overflow-auto space-y-4">
          <div className="space-y-3">
            <div className="flex gap-6">
              <Input name="name" value={form.name} onChange={handleChange} placeholder="名称" className="w-full" />
            </div>
            <div className="flex gap-6">
              <Input name="host" value={form.host} onChange={handleChange} placeholder="localhost" className="w-full" />
              <Input name="port" type="number" value={form.port} onChange={handleChange} placeholder="Port" className="w-full" />
            </div>
            <Input name="username" value={form.username} onChange={handleChange} placeholder="用户名" className="w-full" />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="密码"
                className="w-full pr-6"
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="px-3 py-1 bg-gray-400 text-white rounded" onClick={onClose}>
            取消
          </button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={handleSubmit}>
            保存
          </button>
        </div>

      </div>
    </div>
  );
}
