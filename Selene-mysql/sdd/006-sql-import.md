# 006-SQL导入功能

## 需求描述

用户需要能够将外部的 SQL 文件导入到当前选择的数据库中。

## 验收标准

1. 用户可以通过右键数据库 -> "导入SQL" 打开导入对话框
2. 选择 SQL 文件后自动开始导入
3. 导入完成后显示成功/失败提示
4. 导入过程中显示进度状态
5. 导入完成后自动关闭对话框

## 技术实现

### 1. 创建导入对话框组件

- `src/components/common/dialog/ImportDialog.tsx`
- 使用 `@tauri-apps/plugin-dialog` 的 `open` 函数选择文件
- 使用 `@tauri-apps/plugin-fs` 的 `readTextFile` 读取文件内容

### 2. 权限配置

- `src-tauri/capabilities/default.json` 添加权限：
  - `fs:allow-read-text-file` - 允许读取文本文件
  - `dialog:default` - 允许打开文件对话框

### 3. 国际化

中英文支持：
- `import.title`: 导入SQL / Import SQL
- `import.selectFile`: 选择SQL文件 / Select SQL File
- `import.change`: 更换 / Change
- `import.importing`: 导入中... / Importing...
- `import.success`: 导入成功，共执行 {count} 条SQL / Import successful, {count} SQL statements executed
- `import.failed`: 导入失败 / Import failed
- `import.partialSuccess`: 部分成功：成功 {success} 条，失败 {failed} 条 / Partial success: {success} succeeded, {failed} failed

### 4. UI 设计

- 简洁的对话框，显示选中的文件名
- 导入过程中显示状态，用户无法取消
- 导入完成后自动关闭

### 5. SQL 执行逻辑

- 按分号分割 SQL 语句
- 逐条执行，记录成功/失败数量
- 显示部分成功或完全成功的提示

## 关键文件

- `src/components/common/dialog/ImportDialog.tsx` - 导入对话框组件
- `src/modules/WorkSpaceTreePanel.tsx` - 添加导入菜单项
- `src/i18n/index.ts` - 国际化翻译
- `src-tauri/capabilities/default.json` - 权限配置

## 完成状态

- [x] 创建导入对话框组件
- [x] 支持选择 SQL 文件
- [x] 自动开始导入
- [x] 显示导入结果
- [x] 添加右键菜单入口
- [x] 中英文支持