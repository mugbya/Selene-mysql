# 需求文档

## 编号
sdd-002

## 标题
查询页 Tab 名称拼接数据库名

## 背景
用户需要在新打开的查询页 tab 上显示当前操作的数据库名，方便识别当前所在的数据库上下文。

## 需求描述
所有从左侧树形面板（数据库/表）触发的查询页 tab，其标题都需要拼接数据库名。

## 详细需求

### 1. 从数据库节点新建查询
- 位置：数据库右键菜单 > 新建查询
- 标题格式：`查询 - ${dbName}`
- 内容：预填充 `USE \`${dbName}\`;`

### 2. 从表节点打开表
- 位置：表右键菜单 > 打开表
- 标题格式：`${dbName} - ${tableName}`
- tabType: `tableView`

### 3. 从表节点设计表
- 位置：表右键菜单 > 设计表
- 标题格式：`设计${dbName} - ${tableName}`
- tabType: `tableStructure`

### 4. 从数据库节点新建表
- 位置：数据库右键菜单 > 新建表
- 标题格式：`新建表 - ${dbName}`
- tabType: `createTable`

### 5. 从 Tab 栏 + 按钮新建查询
- 位置：Tab 栏右侧的 + 按钮
- 行为：
  - 有当前数据库时：标题 `查询 - ${dbName}`，内容预填充 `USE \`${dbName}\`;`
  - 无当前数据库时：标题 `新建查询`，内容为空

## 验收标准
1. 从数据库节点新建查询，tab 标题显示数据库名
2. 从表节点打开表，tab 标题显示 `数据库名 - 表名`
3. 从表节点设计表，tab 标题显示 `设计表名 - 数据库名`
4. 从数据库节点新建表，tab 标题显示数据库名
5. 从 + 按钮新建查询时，根据当前数据库情况正确显示标题

## 相关文件
- `src/modules/WorkSpaceTreePanel.tsx` - openQueryTab 函数
- `src/modules/ContentTabManager.tsx` - 新建查询按钮
- `src/components/common/tree-panel/TableTreeLeaf.tsx` - openTable, modifyTableStructure 函数
- `src/components/common/CreateTableTab.tsx` - 新建表 tab

## 创建时间
2026-03-31