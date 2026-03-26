# 修复查询标签默认数据库问题

## Context

用户反映的问题是：
1. 打开了多个数据库连接
2. 新建查询时，默认数据库总是 `mysql`（或其他非当前激活的数据库）
3. 执行表删除操作时找不到表

**问题根源分析**：

在 `ContentTabManager.tsx` 第32-33行：
```typescript
const activeTab = connectiontabs.find(c => c.tabId === dbKey);
const currentDbName = activeTab?.currentDb || "";
```

这里存在逻辑错误：
- `dbKey` 是连接标识符（如 `mysql-xxx`），不是 `tabId`
- `connectiontabs` 中的 `tabId` 是标签页 ID，两者不匹配
- 因此 `activeTab` 始终为 `undefined`，导致 `currentDbName` 为空字符串

**正确的逻辑**：
- 应该从当前激活的查询标签页（`activeContentTab`）获取 `databaseName`
- 或者从 `connectiontabs` 中按 `dbKey` 查找连接而非 `tabId`

## 关键文件

| 文件 | 作用 |
|------|------|
| `src/store/useConnectionStore.ts` | 连接状态管理 |
| `src/modules/ContentTabManager.tsx` | 查询标签管理器，新建查询时设置默认数据库 |
| `src/modules/WorkSpaceTreePanel.tsx` | 树形面板，双击打开查询 |

## 修复方案

修改 `ContentTabManager.tsx` 第32-33行：

**方案 A（推荐）**：从当前激活的查询标签获取数据库名
```typescript
const activeContentTab = getActiveContent();
const currentDbName = activeContentTab?.databaseName || "";
```

**方案 B**：按 dbKey 查找连接
```typescript
const activeTab = connectiontabs.find(c => c.key === dbKey);
const currentDbName = activeTab?.currentDb || "";
```

推荐使用方案 A，因为更直观——查询标签关联的数据库名就是用户当前工作的数据库上下文。

## Verification

1. 启动应用 `pnpm tauri dev`
2. 打开一个数据库连接（如 `test_db`）
3. 双击数据库名打开查询标签，确认 SQL 开头有 `use \`test_db\`;`
4. 再打开另一个数据库连接（如 `production_db`）
5. 点击顶部 "新建查询" 按钮
6. 确认新查询的 SQL 开头是 `use \`production_db\`;` 而不是空或 `mysql`
7. 执行 DROP TABLE 语句，确认使用的是正确的数据库
