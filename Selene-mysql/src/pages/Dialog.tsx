import { useEffect } from 'react';
import { emit } from '@tauri-apps/api/event';

export default function Dialog() {
  useEffect(() => {
    console.log('Dialog window mounted');
  }, []);

  const handleConfirm = () => {
    // 可以通过事件通知主窗口
    emit('dialog-confirmed', { ok: true });
    window.close(); // 关闭当前窗口
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-white">
      <div className="p-6 border rounded shadow-md bg-gray-100">
        <h2 className="text-xl font-bold mb-4">确认操作</h2>
        <p>你确认要执行该操作吗？</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => window.close()} className="px-4 py-2 bg-gray-300 rounded">
            取消
          </button>
          <button onClick={handleConfirm} className="px-4 py-2 bg-blue-500 text-white rounded">
            确认
          </button>
        </div>
      </div>
    </div>
  );
}