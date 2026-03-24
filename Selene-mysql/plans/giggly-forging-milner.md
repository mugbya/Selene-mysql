# 计划：新建/删除数据库后即时更新 displayDatabases

## Context
用户希望在新建或删除数据库后：
1. 弹窗消失
2. 数据库列表即时更新
3. `DBConnectionPersisted.displayDatabases` 增加或移除对应的数据库名

当前实现：创建数据库后只是调用 `window.location.reload()` 刷新整个页面，体验不佳且没有更新 `displayDatabases`。

## 实现方案

### 关键文件
- `src/modules/WorkSpaceTreePanel.tsx` - 数据库列表展示组件
- `src/components/common/dialog/CreateDatabaseDialog.tsx` - 创建数据库对话框
- `src/store/useConnectionStore.ts` - 连接状态管理
- `src/db/msyql-client.ts` - 已有 `fetchDatabases` 函数

### 实现步骤

#### 1. 修改 WorkSpaceTreePanel 添加数据库刷新方法
- 在 WorkSpaceTreePanel 中添加 `refreshDatabases` 函数
- 调用 `fetchDatabases(dbKey)` 获取最新数据库列表
- 使用 `useConnectionStore` 的 `updateConnectionDisplayDatabases` 更新 `displayDatabases`
- 更新本地 `dbTrees` 状态

#### 2. 修改 CreateDatabaseDialog 的 onSuccess 回调
- 在 WorkSpaceTreePanel 中传递刷新函数给 CreateDatabaseDialog
- 不再使用 `window.location.reload()`，改为调用刷新函数

#### 3. 实现删除数据库功能
- 在 WorkSpaceTreePanel 的右键菜单添加"删除数据库"选项
- 执行 `DROP DATABASE \`${dbName}\``
- 删除成功后从 `displayDatabases` 移除该数据库

### 验证方法
1. 打开一个数据库连接
2. 点击"+ 新建库"，输入新库名创建
3. 验证新库立即显示在左侧列表中
4. 右键一个数据库，选择删除
5. 验证该库从列表中消失
