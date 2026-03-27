# 查询页功能重构计划

## Context
用户需要重构查询页功能，实现更完善的查询管理体验：
1. 查询页分成两部分：查询编辑区 + 反馈区域（同 div 下，有边框）
2. 反馈区域仅在有执行结果时展示
3. 新建查询页是空白页面
4. 切换标签页时每个查询页内容都能保留
5. 删除标签页功能
6. 保存标签页（可重命名）到左侧查询列表
7. 左侧查询列表支持删除、重命名

## 问题分析
当前实现：
- `DataBaseView` 中执行结果面板和内容面板是分开的，使用 react-resizable-panels
- `SqlMonacoEditor` 组件只负责编辑，不显示结果
- 结果通过父组件的 `onExecResult` 回调传递到 `DataBaseView` 单独展示
- 没有保存查询到左侧列表的功能

## 实现方案

### 1. 修改 ContentTab 结构
在 `src/store/useConnectionStore.ts` 中扩展 ContentTab：
- 添加 `savedQueryId?: string` 用于关联保存的查询
- 添加 `isSaved?: boolean` 标记是否已保存

### 2. 新建保存的查询类型
新增 `SavedQuery` 类型，存储在 localStorage：
```typescript
interface SavedQuery {
  id: string;
  name: string;
  content: string;
  dbKey: string;
  databaseName?: string;
  createdAt: number;
  updatedAt: number;
}
```

### 3. 重构查询页布局
修改 `SqlMonacoEditor.tsx`：
- 将编辑器和结果区域放在同一个 div 中
- 接收 `execResult` 作为 props（而非通过回调）
- 条件渲染结果区域（有结果时显示）

### 4. 修改 ContentTabManager
- 为每个 query tab 维护独立的执行结果状态
- 或者将结果存储在 ContentTab 中

### 5. 左侧查询列表
在 `WorkSpaceTreePanel.tsx` 中添加：
- "查询"节点展示保存的查询列表
- 支持点击打开查询
- 支持右键菜单（删除、重命名）

### 6. 保存/删除查询功能
- 新增保存查询的弹窗（可重命名）
- 通过 localStorage 持久化存储

## 关键文件

| 文件 | 修改内容 |
|------|---------|
| `src/store/useConnectionStore.ts` | 扩展 ContentTab 类型 |
| `src/types/connection.ts` | 新增 SavedQuery 类型 |
| `src/components/common/content-viewer/SqlMonacoEditor.tsx` | 重构为编辑+结果一体化 |
| `src/modules/ContentTabManager.tsx` | 管理每个 tab 的执行结果 |
| `src/modules/DataBaseView.tsx` | 移除独立的结果面板 |
| `src/modules/WorkSpaceTreePanel.tsx` | 添加查询列表展示 |

## 验证方式
1. `pnpm tauri dev` 启动应用
2. 新建查询页，确认是空白内容
3. 输入 SQL 并执行，确认结果在同一下div展示
4. 切换标签页，验证内容保留
5. 尝试保存查询，验证左侧出现列表项
6. 点击左侧查询项，验证内容加载
7. 删除标签页和查询列表项，验证功能正常