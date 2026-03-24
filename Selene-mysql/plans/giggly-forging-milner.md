# 计划：新建表功能

## Context
用户希望在数据库管理界面中实现右键"新建表"功能，能够通过对话框创建新的 MySQL 表。

## 关键文件
- `src/components/common/dialog/CreateTableDialog.tsx` - 新建（需创建）
- `src/modules/WorkSpaceTreePanel.tsx` - 添加新建表对话框调用和回调

## 实现方案

### 1. 创建 CreateTableDialog 组件
- 位置：`src/components/common/dialog/CreateTableDialog.tsx`
- 功能：
  - 表名输入
  - 动态添加/删除字段
  - 每个字段包含：字段名、类型、长度、主键、自增、允许空、默认值、注释

### 2. MySQL 字段类型选项
常用类型：
- INT, BIGINT, SMALLINT, TINYINT
- VARCHAR, CHAR, TEXT, LONGTEXT
- DATETIME, DATE, TIME, TIMESTAMP
- DECIMAL, FLOAT, DOUBLE
- BLOB

### 3. 字段行结构
```
{
  name: string,      // 字段名
  type: string,      // 类型
  length: string,    // 长度
  primaryKey: boolean,
  autoIncrement: boolean,
  notNull: boolean,
  default: string,   // 默认值
  comment: string   // 注释
}
```

### 4. 实现步骤

#### 4.1 创建 CreateTableDialog.tsx
- 使用 shadcn/ui 的 Dialog, Input, Select 组件
- 字段列表使用动态数组管理
- 生成 CREATE TABLE SQL 并执行

#### 4.2 修改 WorkSpaceTreePanel.tsx
- 添加状态管理 `createTableDialogOpen`, `createTableDbName`
- 在 handleGroupAction 中处理 "create" 动作
- 传递 dbKey, dbName 给对话框
- 创建成功后刷新表列表

### 5. SQL 生成逻辑
```sql
CREATE TABLE `${tableName}` (
  `${fieldName}` ${type}${length}${notNull}${autoIncrement}${default}${comment},
  ...
  PRIMARY KEY (...)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 验证方法
1. 右键某个数据库的"表"分类
2. 选择"新建表"
3. 输入表名，添加字段
4. 点击创建
5. 验证表出现在左侧列表中
