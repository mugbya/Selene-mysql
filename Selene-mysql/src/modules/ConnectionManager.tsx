import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { useConnectionStore } from '@/store/useConnectionStore';
import { useI18n } from '@/i18n';
import ConnectionTestView from '@/components/common/connectionManager/ConnectionTestView';
import { DBConnectionPersisted, DBConnectionRuntime } from '@/types/connection';
import ConnectionFormDialog from '@/components/common/dialog/ConnectionFormDialog';
import { connectDatabase, fetchDatabases, disconnectDatabase } from '@/db/msyql-client';
import {
  Plus, Link, Pencil, Copy, Trash2, FolderOpen, FolderClosed, ChevronRight, ChevronDown,
  Database, FolderPlus, Check, X
} from 'lucide-react';
import { Input } from '@/components/ui/input';

const STORAGE_KEY = 'db-connections-tree';
const EXPANDED_FOLDERS_KEY = 'db-connections-expanded-folders';

// 树节点结构
export interface TreeNode {
  id: string;
  name: string;
  type: 'folder' | 'connection';
  parentId: string | null;
  data?: DBConnectionPersisted;
}

const loadFromStorage = (): TreeNode[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
};

const saveToStorage = (nodes: TreeNode[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
};

// 加载展开的文件夹状态
const loadExpandedFolders = (): Set<string> => {
  const raw = localStorage.getItem(EXPANDED_FOLDERS_KEY);
  if (raw) {
    try {
      return new Set(JSON.parse(raw));
    } catch {
      return new Set();
    }
  }
  return new Set();
};

// 保存展开的文件夹状态
const saveExpandedFolders = (folders: Set<string>) => {
  localStorage.setItem(EXPANDED_FOLDERS_KEY, JSON.stringify([...folders]));
};

/**
 * 连接管理
 */
export default function ConnectionManager() {
  const { t } = useI18n();

  const [editing, setEditing] = useState<DBConnectionPersisted | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(loadExpandedFolders);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: TreeNode } | null>(null);

  // 文件夹名称编辑状态
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');

  const openConnectionTab = useConnectionStore((state) => state.openConnectionTab);
  const connectiontabs = useConnectionStore((state) => state.connectiontabs);
  const updateConnectionDisplayDatabases = useConnectionStore((state) => state.updateConnectionDisplayDatabases);

  // 初始加载
  useEffect(() => {
    const loaded = loadFromStorage();
    setNodes(loaded);
  }, []);

  // 获取同级的子节点
  const getChildren = (parentId: string | null) => nodes.filter(n => n.parentId === parentId);

  // 检查同级是否有重复名称
  const isNameDuplicate = (name: string, parentId: string | null, excludeId?: string) => {
    return getChildren(parentId).some(n => n.id !== excludeId && n.name === name);
  };

  // 开始编辑文件夹名称
  const startEditFolderName = (node: TreeNode) => {
    setEditingFolderId(node.id);
    setEditingFolderName(node.name);
  };

  // 取消编辑文件夹名称
  const cancelEditFolderName = () => {
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  // 保存文件夹名称
  const saveEditFolderName = () => {
    if (!editingFolderId) return;

    const trimmedName = editingFolderName.trim();
    if (!trimmedName) {
      toast.error(t('common.folderNameRequired'));
      return;
    }

    const node = nodes.find(n => n.id === editingFolderId);
    if (!node) return;

    if (isNameDuplicate(trimmedName, node.parentId, editingFolderId)) {
      toast.error(t('common.folderNameDuplicate'));
      return;
    }

    const updated = nodes.map(n =>
      n.id === editingFolderId ? { ...n, name: trimmedName } : n
    );
    setNodes(updated);
    saveToStorage(updated);
    cancelEditFolderName();
  };

  // 构建树形结构
  interface TreeItem {
    node: TreeNode;
    children: TreeItem[];
  }

  const buildTree = (parentId: string | null): TreeItem[] => {
    return getChildren(parentId).map(node => ({
      node,
      children: node.type === 'folder' ? buildTree(node.id) : []
    }));
  };

  // 切换文件夹展开/折叠
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      // 保存到 localStorage
      saveExpandedFolders(next);
      return next;
    });
  };

  // 创建文件夹（开始编辑名称）
  const handleCreateFolder = (parentId: string | null = null) => {
    // 生成临时名称
    let newName = t('connection.newFolder');
    let counter = 1;
    while (isNameDuplicate(newName, parentId)) {
      newName = `${t('connection.newFolder')} (${counter})`;
      counter++;
    }

    const newFolder: TreeNode = {
      id: nanoid(),
      name: newName,
      type: 'folder',
      parentId,
    };
    const updated = [...nodes, newFolder];
    setNodes(updated);
    saveToStorage(updated);

    // 立即进入编辑状态
    setEditingFolderId(newFolder.id);
    setEditingFolderName(newName);
    setContextMenu(null);

    // 如果有父文件夹，自动展开父文件夹
    if (parentId && !expandedFolders.has(parentId)) {
      setExpandedFolders(prev => {
        const next = new Set(prev);
        next.add(parentId);
        saveExpandedFolders(next);
        return next;
      });
    }
  };

  // 创建连接
  const handleAddConnection = (parentId: string | null = null) => {
    setEditing(null);
    setDialogOpen(true);
    localStorage.setItem('pending-connection-parent', parentId || '');
    setContextMenu(null);

    // 如果有父文件夹，自动展开父文件夹
    if (parentId && !expandedFolders.has(parentId)) {
      setExpandedFolders(prev => {
        const next = new Set(prev);
        next.add(parentId);
        saveExpandedFolders(next);
        return next;
      });
    }
  };

  // 编辑连接
  const handleEdit = (node: TreeNode) => {
    if (node.type !== 'connection') return;
    setEditing(node.data || null);
    setEditingNodeId(node.id);
    setDialogOpen(true);
    setContextMenu(null);
  };

  // 删除节点
  const handleDelete = (nodeId: string) => {
    // 递归删除所有子节点
    const idsToDelete = new Set<string>();
    const collectIds = (id: string) => {
      idsToDelete.add(id);
      getChildren(id).forEach(child => collectIds(child.id));
    };
    collectIds(nodeId);

    // 删除连接
    idsToDelete.forEach(id => {
      const node = nodes.find(n => n.id === id);
      if (node?.type === 'connection') {
        disconnectDatabase(id);
      }
    });

    const updated = nodes.filter(n => !idsToDelete.has(n.id));
    setNodes(updated);
    saveToStorage(updated);
    setContextMenu(null);
    if (selectedNodeId && idsToDelete.has(selectedNodeId)) {
      setSelectedNodeId(null);
    }
  };

  // 复制连接
  const handleCopy = (node: TreeNode) => {
    if (node.type !== 'connection' || !node.data) return;
    const copied: TreeNode = {
      id: nanoid(),
      name: node.name + ' (' + t('connection.copy') + ')',
      type: 'connection',
      parentId: node.parentId,
      data: { ...node.data, id: nanoid() }
    };
    const updated = [...nodes, copied];
    setNodes(updated);
    saveToStorage(updated);
    setContextMenu(null);
  };

  // 提交连接表单
  const handleSubmit = (conn: DBConnectionPersisted & { parentId?: string | null }) => {
    const pendingParentId = localStorage.getItem('pending-connection-parent') || null;
    localStorage.removeItem('pending-connection-parent');

    if (editingNodeId) {
      // 编辑模式：更新现有节点（包括父文件夹）
      const updated = nodes.map(n =>
        n.id === editingNodeId && n.type === 'connection'
          ? { ...n, name: conn.name, parentId: conn.parentId ?? null, data: { ...conn, id: editingNodeId } }
          : n
      );
      setNodes(updated);
      saveToStorage(updated);

      // 更新连接标签页的显示数据库
      const openConn = connectiontabs.find((c) => c.tabId === editingNodeId);
      if (openConn) {
        updateConnectionDisplayDatabases(editingNodeId, conn.displayDatabases ?? []);
      }

      setEditing(null);
      setEditingNodeId(null);
    } else {
      // 新建模式
      const connId = nanoid();
      const newNode: TreeNode = {
        id: connId,
        name: conn.name,
        type: 'connection',
        parentId: pendingParentId || conn.parentId || null,
        data: { ...conn, id: connId }
      };
      const updated = [...nodes, newNode];
      setNodes(updated);
      saveToStorage(updated);
      setEditing(null);
    }
    setDialogOpen(false);
  };

  // 连接数据库
  const handleConnect = async (node: TreeNode) => {
    if (node.type !== 'connection' || !node.data) return;

    const conn = { ...node.data, id: node.id } as DBConnectionRuntime;
    let displayDatabases = conn.displayDatabases ?? null;

    // 从 storage 加载 displayDatabases
    const allNodes = loadFromStorage();
    const savedNode = allNodes.find(n => n.id === conn.id);
    if (savedNode?.data?.displayDatabases) {
      displayDatabases = savedNode.data.displayDatabases;
    }

    await connectDatabase(conn);

    const result = await fetchDatabases(conn.id);
    if (!result) {
      toast.error(t('connection.failed'));
      return;
    }
    const realDatabases = result ?? [];

    if (!displayDatabases || displayDatabases.length === 0) {
      displayDatabases = null;
    } else {
        const filtered = displayDatabases.filter(db => realDatabases.includes(db));
        if (filtered.length !== displayDatabases.length) {
          const notFound = displayDatabases.filter(db => !realDatabases.includes(db)).join(', ');
          toast.warning(t('connection.filteredDatabases') + ': ' + notFound);
          displayDatabases = filtered;
        }
    }

    const connInfo = {
      tabId: conn.id,
      key: conn.id,
      name: conn.name,
      isDataBase: true,
      tabType: 'database' as const,
      databases: realDatabases,
      displayDatabases,
    };
    openConnectionTab(connInfo);
    setContextMenu(null);
  };

  // 右键菜单
  const handleContextMenu = (e: React.MouseEvent, node: TreeNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
    setSelectedNodeId(node.id);
  };

  // 关闭右键菜单
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // 渲染树节点
  const renderNode = (item: TreeItem, depth = 0) => {
    const { node, children } = item;
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedNodeId === node.id;
    const isEditing = editingFolderId === node.id;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer hover:bg-accent ${isSelected ? 'bg-accent' : ''}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (isEditing) return;
            setSelectedNodeId(node.id);
            if (node.type === 'folder') {
              toggleFolder(node.id);
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, node)}
        >
          {/* 连接节点需要一个占位空间，与文件夹的 Chevron 对齐 */}
          {node.type === 'connection' && (
            <span className="w-3" />
          )}
          {node.type === 'folder' && (
            isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
          {node.type === 'folder' ? (
            isExpanded ? <FolderOpen className="w-4 h-4 text-yellow-500" /> : <FolderClosed className="w-4 h-4 text-yellow-500" />
          ) : (
            <Database className="w-4 h-4 text-primary" />
          )}

          {isEditing ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                className="h-5 text-xs py-0 px-1 flex-1"
                value={editingFolderName}
                onChange={(e) => setEditingFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEditFolderName();
                  if (e.key === 'Escape') cancelEditFolderName();
                }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
              <Check
                className="w-3 h-3 text-green-600 cursor-pointer hover:text-green-700"
                onClick={(e) => {
                  e.stopPropagation();
                  saveEditFolderName();
                }}
              />
              <X
                className="w-3 h-3 text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  cancelEditFolderName();
                }}
              />
            </div>
          ) : (
            <span className="text-sm truncate flex-1">{node.name}</span>
          )}

          {!isEditing && node.type === 'connection' && (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              {/* 连接按钮 */}
              <div
                className="p-0.5 hover:bg-green-100 rounded cursor-pointer"
                title={t('connection.connect')}
                onClick={() => handleConnect(node)}
              >
                <Link className="w-4 h-4 text-green-600" />
              </div>
              {/* 测试连接 */}
              <ConnectionTestView conn={node.data!} />
            </div>
          )}
        </div>

        {node.type === 'folder' && isExpanded && children.map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

  const rootItems = buildTree(null);

  return (
    <div className="w-80 h-full flex flex-col border-r border-border">
      {/* 头部 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
        <span className="text-sm font-medium text-foreground">{t('connection.title')}</span>
        <div className="flex items-center gap-1">
          <div
            onClick={() => handleCreateFolder(null)}
            className="p-1 hover:bg-accent rounded cursor-pointer"
            title={t('connection.newFolder')}
          >
            <FolderPlus className="w-4 h-4 text-muted-foreground" />
          </div>
          <div
            onClick={() => handleAddConnection(null)}
            className="p-1 hover:bg-accent rounded cursor-pointer"
            title={t('connection.new')}
          >
            <Plus className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* 树形列表 */}
      <div className="flex-1 overflow-auto py-2">
        {rootItems.length === 0 ? (
          <div className="text-center text-muted-foreground text-xs py-8">
            {t('common.noData')}
          </div>
        ) : (
          rootItems.map(item => renderNode(item))
        )}
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="fixed bg-background border rounded shadow-lg py-1 z-50 min-w-32"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.node.type === 'folder' && (
            <>
              <div
                className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent cursor-pointer"
                onClick={() => {
                  startEditFolderName(contextMenu.node);
                  setContextMenu(null);
                }}
              >
                <Pencil className="w-3 h-3" /> {t('connection.rename')}
              </div>
              <div
                className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent cursor-pointer"
                onClick={() => handleAddConnection(contextMenu.node.id)}
              >
                <Plus className="w-3 h-3" /> {t('connection.new')}
              </div>
              <div
                className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent cursor-pointer"
                onClick={() => handleCreateFolder(contextMenu.node.id)}
              >
                <FolderPlus className="w-3 h-3" /> {t('connection.newFolder')}
              </div>
            </>
          )}

          {contextMenu.node.type === 'connection' && (
            <>
              <div
                className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent cursor-pointer text-green-600"
                onClick={() => handleConnect(contextMenu.node)}
              >
                <Link className="w-3 h-3" /> {t('connection.connect')}
              </div>
              <div
                className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent cursor-pointer"
                onClick={() => handleEdit(contextMenu.node)}
              >
                <Pencil className="w-3 h-3" /> {t('connection.editConnection')}
              </div>
              <div
                className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent cursor-pointer"
                onClick={() => handleCopy(contextMenu.node)}
              >
                <Copy className="w-3 h-3" /> {t('connection.copyConnection')}
              </div>
            </>
          )}

          <div className="border-t my-1" />
          <div
            className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent cursor-pointer text-destructive"
            onClick={() => handleDelete(contextMenu.node.id)}
          >
            <Trash2 className="w-3 h-3" /> {t('common.delete')}
          </div>
        </div>
      )}

      {/* 连接表单弹窗 */}
      {dialogOpen && (
        <ConnectionFormDialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); setEditing(null); setEditingNodeId(null); }}
          onSubmit={handleSubmit}
          defaultValue={editing || undefined}
          folders={nodes.filter(n => n.type === 'folder')}
          currentParentId={editing?.parentId}
          editingNodeId={editingNodeId}
        />
      )}
    </div>
  );
}