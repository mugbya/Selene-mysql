# Selene-MySQL 功能完善计划

## 背景

Selene-MySQL 是一个基于 Tauri + React 的 MySQL 可视化管理工具。当前状态：
- **已完成**: 连接管理、数据库/表浏览、表数据增删改查（带SQL预览）
- **半成品**: 表结构设计功能
- **待实现**: 导出表结构、导出数据库（含表选择向导 + Extended Insert）

## 待实现功能分析

### 1. 设计表结构（完整实现）

**现状**: `EditableStructureTable.tsx` 已实现基本编辑功能，但存在以下问题：
- 仅支持 MODIFY COLUMN，不支持新增列、删除列
- SQL 生成逻辑可能有问题（如空值处理）
- 没有保存到数据库的功能

**需要完善** (完整实现):
- [ ] 修复现有 SQL 生成逻辑（空值处理、类型处理）
- [ ] 添加「保存」按钮，实际执行 ALTER TABLE 到数据库
- [ ] 支持新增列（ADD COLUMN）
- [ ] 支持删除列（DROP COLUMN）
- [ ] 添加撤销/重做功能（可选）

**实现细节**:
- 新增列：在表格底部添加"添加列"按钮，弹出表单填写列信息
- 删除列：每行添加删除按钮，生成 DROP COLUMN 语句
- 保存：收集所有修改，生成并执行 SQL，刷新表结构

**关键文件**:
- `src/components/common/table/EditableStructureTable.tsx`
- `src/db/mysqlConnection.ts` - 添加执行 ALTER TABLE 的 API

---

### 2. 导出表结构

**功能需求**: 导出单个表的 CREATE TABLE 语句

**实现方案**:
1. 在 `TableTreeLeaf.tsx` 右键菜单添加"导出表结构"选项
2. 调用 `SHOW CREATE TABLE table_name` 获取建表语句
3. 显示在对话框中，支持复制到剪贴板或保存为 .sql 文件

**关键文件**:
- `src/components/common/tree-panel/TableTreeLeaf.tsx` - 添加右键菜单
- `src/db/mysqlConnection.ts` - 添加获取表结构的 API
- 新增 `src/components/common/dialog/ExportStructureDialog.tsx`

---

### 3. 导出数据库（表选择向导 + Extended Insert）

**功能需求**:
- 导出向导允许选择要导出的表
- 支持 Extended Insert（多条数据合并到一个 INSERT 语句）

**实现方案**:

#### 3.1 表选择向导对话框
- 在数据库右键菜单"导出SQL"点击后弹出
- 显示该数据库所有表的复选列表
- 支持全选/取消全选
- 可配置：是否包含表结构、是否包含数据、Extended Insert 行数

#### 3.2 导出实现
- **表结构**: 循环调用 `SHOW CREATE TABLE table_name`
- **表数据**: 使用 `SELECT * FROM table_name` 获取数据
  - 普通模式: 每行一个 INSERT
  - Extended Insert 模式: 每 N 行合并为一个 INSERT

**Extended Insert 示例**:
```sql
-- 普通 (1行1条INSERT)
INSERT INTO users (id, name) VALUES (1, 'Alice');
INSERT INTO users (id, name) VALUES (2, 'Bob');

-- Extended Insert (N=2)
INSERT INTO users (id, name) VALUES (1, 'Alice'), (2, 'Bob');
```

**关键文件**:
- `src/modules/WorkSpaceTreePanel.tsx` - handleGroupAction 添加 export_all 处理
- 新增 `src/components/common/dialog/ExportWizardDialog.tsx` - 导出向导
- `src/db/mysqlConnection.ts` - 添加导出相关 API
- `src-tauri/src/commands.rs` - 后端命令支持大查询

---

## 实施步骤

### 阶段一：完善表结构设计
1. 修复 `EditableStructureTable.tsx` 的 SQL 生成逻辑
2. 添加保存按钮，实际执行 ALTER TABLE
3. 支持新增列、删除列

### 阶段二：导出表结构
1. 后端添加 `get_table_create_sql` 命令
2. 前端添加 `ExportStructureDialog` 组件
3. 在表右键菜单集成

### 阶段三：导出数据库向导
1. 创建 `ExportWizardDialog` 组件
   - 表选择列表
   - 选项配置（结构/数据/Extended Insert）
2. 实现数据导出逻辑
   - 分页获取大量数据
   - 生成 INSERT 语句
3. 集成到数据库右键菜单

### 阶段四：文件下载
1. 使用 Tauri 文件对话框保存 .sql 文件
2. 或提供复制到剪贴板功能

---

## 验证方式

1. **表结构设计**: 修改表结构后查看数据库确认变更
2. **导出表结构**: 导出后用导出的 SQL 重建表
3. **导出数据库**:
   - 选择部分表导出
   - 验证 Extended Insert 格式正确
   - 用导出的 SQL 重建数据库，数据完整

---

## 依赖

- 前端: React 19 + TypeScript + Tailwind
- 后端: Tauri v2 + Rust (sqlx)
- UI 组件: Radix UI (已有)
- 文件操作: Tauri fs/dialog 插件
