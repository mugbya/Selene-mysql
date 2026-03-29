import { useState, useEffect, useRef } from 'react';
import { SiMysql } from 'react-icons/si';
import { DBConnectionPersisted, DBConnectionRuntime } from '@/types';
import { TreeNode as TreeNodeType } from '@/modules/ConnectionManager';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, ChevronRight, ChevronDown, FolderClosed, FolderOpen } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (conn: DBConnectionRuntime) => void;
  defaultValue?: DBConnectionPersisted;
  folders: TreeNodeType[];
  currentParentId?: string | null;
  editingNodeId?: string | null;
}

interface FolderTreeNode extends TreeNodeType {
  children: FolderTreeNode[];
  depth: number;
}

export default function ConnectionFormDialog({
  open,
  onClose,
  onSubmit,
  defaultValue,
  folders,
  currentParentId,
  editingNodeId,
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
    parentId: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const folderPickerRef = useRef<HTMLDivElement>(null);

  // 点击下拉选之外关闭
  useEffect(() => {
    if (!folderPickerOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (folderPickerRef.current && !folderPickerRef.current.contains(e.target as Node)) {
        setFolderPickerOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [folderPickerOpen]);

  // 构建树形结构
  const buildFolderTree = (parentId: string | null): FolderTreeNode[] => {
    return folders
      .filter(f => f.parentId === parentId && f.id !== editingNodeId)
      .map(folder => ({
        ...folder,
        children: buildFolderTree(folder.id),
        depth: 0,
      }));
  };

  // 获取显示名称
  const getFolderName = (folderId: string | null): string => {
    if (!folderId) return '根目录';
    const folder = folders.find(f => f.id === folderId);
    return folder?.name || '根目录';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleFolderExpand = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const selectFolder = (folderId: string | null) => {
    setForm({ ...form, parentId: folderId });
    setFolderPickerOpen(false);
  };

  const handleToggleExpand = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFolderExpand(folderId);
  };

  const renderFolderTree = (nodes: FolderTreeNode[], depth: number = 0): React.ReactNode[] => {
    return nodes.map(node => {
      const hasChildren = node.children.length > 0;
      const isExpanded = expandedFolders.has(node.id);

      return (
        <div key={node.id}>
          <div
            className={`flex items-center gap-1 py-1 px-2 cursor-pointer hover:bg-gray-100 rounded ${
              form.parentId === node.id ? 'bg-blue-50 text-blue-600' : ''
            }`}
            style={{ paddingLeft: `${depth * 16 + 8}px` }}
            onClick={() => selectFolder(node.id)}
          >
            {/* 展开/折叠按钮 */}
            {hasChildren ? (
              <span
                className="w-3 h-3 flex items-center justify-center cursor-pointer hover:bg-gray-200 rounded"
                onClick={(e) => handleToggleExpand(e, node.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                )}
              </span>
            ) : (
              <span className="w-3" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-yellow-500" />
            ) : (
              <FolderClosed className="w-4 h-4 text-yellow-500" />
            )}
            <span className="text-sm truncate">{node.name}</span>
          </div>
          {hasChildren && isExpanded && (
            <div>{renderFolderTree(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  useEffect(() => {
    if (defaultValue) {
      setForm({ ...defaultValue, parentId: defaultValue.parentId ?? null });
      console.log("[ConnectionFormDialog] 回显表单数据:", defaultValue);
    } else {
      setForm({
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
        parentId: currentParentId || null,
      });
    }
  }, [defaultValue, currentParentId]);

  if (!open) return null;

  const handleSubmit = () => {
    console.log("[ConnectionFormDialog] 提交连接信息:", form);
    onSubmit(form);
  };

  const rootFolders = buildFolderTree(null);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded border w-[420px] flex flex-col">
        <div className='flex items-center gap-2 pb-3 border-b'>
          <SiMysql className="text-yellow-600 w-8 h-8" />
          <h3 className="text-base font-medium">数据库连接</h3>
        </div>

        <div className="py-3 space-y-2">
          {/* 文件夹选择 */}
          <div className="relative flex items-center gap-2" ref={folderPickerRef}>
            <label className="text-xs text-gray-500 w-16 shrink-0">所属文件夹</label>
            <div
              className="flex-1 flex items-center justify-between h-7 px-2 border rounded cursor-pointer hover:bg-gray-50"
              onClick={() => setFolderPickerOpen(!folderPickerOpen)}
            >
              <div className="flex items-center gap-1">
                {form.parentId ? (
                  <FolderClosed className="w-4 h-4 text-yellow-500" />
                ) : (
                  <span className="w-4" />
                )}
                <span className="text-sm">{getFolderName(form.parentId)}</span>
              </div>
              {folderPickerOpen ? (
                <ChevronDown className="w-3 h-3 text-gray-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-400" />
              )}
            </div>

            {/* 树形下拉 */}
            {folderPickerOpen && (
              <div className="absolute z-10 top-full mt-1 left-16 w-48 bg-white border rounded shadow-lg max-h-48 overflow-auto">
                {/* 根目录选项 */}
                <div
                  className={`flex items-center gap-1 py-1 px-2 cursor-pointer hover:bg-gray-100 ${
                    form.parentId === null ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                  onClick={() => selectFolder(null)}
                >
                  <span className="w-3" />
                  <FolderClosed className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">根目录</span>
                </div>
                {renderFolderTree(rootFolders)}
              </div>
            )}
          </div>

          {/* 连接名称 */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-16 shrink-0">名称</label>
            <Input name="name" value={form.name} onChange={handleChange} placeholder="连接名称" className="!h-7 flex-1" />
          </div>

          {/* 主机和端口 */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-16 shrink-0">主机</label>
            <Input name="host" value={form.host} onChange={handleChange} placeholder="localhost" className="!h-7 w-40" />
            <label className="text-xs text-gray-500 w-10 shrink-0">端口</label>
            <Input name="port" type="number" value={form.port} onChange={handleChange} className="!h-7 w-24" />
          </div>

          {/* 用户名 */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-16 shrink-0">用户名</label>
            <Input name="username" value={form.username} onChange={handleChange} placeholder="root" className="!h-7 flex-1" />
          </div>

          {/* 密码 */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-16 shrink-0">密码</label>
            <div className="flex-1 relative">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="密码"
                className="!h-7 pr-7 w-full"
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded" onClick={onClose}>
            取消
          </button>
          <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700" onClick={handleSubmit}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}