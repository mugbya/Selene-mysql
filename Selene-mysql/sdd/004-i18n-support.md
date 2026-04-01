# 需求文档

## 编号
sdd-004

## 标题
中英文语言切换功能

## 背景
用户需要应用支持中英文切换，切换语言后所有界面文字都需要显示对应的语言版本。

## 需求描述
实现完整的国际化(i18n)功能，支持简体中文和 English 两种语言。

## 详细需求

### 1. 语言切换机制
- 在设置页面提供语言选择（简体中文 / English）
- 切换语言后保存到 localStorage
- 触发 language-changed 事件通知所有组件
- 刷新页面后保持语言设置

### 2. 需要国际化的文本位置
- 左侧数据库树形面板
- Tab 标题（如 "新建查询"、"打开表"、"设计表" 等）
- 工具栏按钮提示
- 对话框标题和内容
- 错误提示消息
- 设置页面
- 其他所有硬编码的中文文本

### 3. 实现方案
- 创建 i18n 配置文件，定义中英文对照表
- 创建 useTranslation hook 获取当前语言文本
- 组件中使用 hook 获取翻译后的文本
- 监听 language-changed 事件动态更新

## 验收标准
1. 设置页面可以选择中英文
2. 切换语言后，所有界面文字立即更新
3. 刷新页面后语言设置保持
4. 无遗漏的中文硬编码文本

## 相关文件（预计需要修改）
- `src/modules/settings/BaseSettings.tsx` - 语言设置 ✅
- `src/components/common/dialog/TableVisibilityDialog.tsx` - 表显示控制 ✅
- `src/i18n/index.ts` - 国际化配置 ✅
- 其他包含硬编码中文的组件

## 进度
- [x] i18n 基础框架搭建
- [x] 设置页面语言切换
- [x] 表显示控制对话框
- [x] SqlToolbar 工具栏
- [x] WorkSpaceTreePanel 树形面板
- [x] TableTreeLeaf 表节点
- [x] ContentTabManager 内容Tab管理
- [x] LazyLoadDataTable 懒加载表格
- [x] TableViewTab 表视图
- [x] EditableStructureTable 可编辑结构表
- [x] CreateTableTab 新建表
- [x] ConnectionManager 连接管理
- [x] 对话框组件 (ConnectionFormDialog, SaveQueryDialog, CreateDatabaseDialog, ExportWizardDialog)
- [x] MenuPanel, MainView, About 设置
- [x] EditTabs 编辑器标签
- [x] ExecResultTable 执行结果表格

## 待处理文件（影响较小）
- constants/theme.ts - 主题配置
- db/*.ts - 后端消息
- mock/data.ts - 测试数据
- types/connection.ts - 类型定义
- parts/*.tsx - 布局组件

## 创建时间
2026-04-01