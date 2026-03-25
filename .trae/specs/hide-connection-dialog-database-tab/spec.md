# 隐藏连接管理编辑弹窗中的数据库 Tab Spec

## Why
数据库筛选功能已移动到数据库连接的左侧面板（筛选按钮），连接管理编辑弹窗中的数据库 Tab 页已不再需要，可以隐藏。

## What Changes
- 隐藏 ConnectionFormDialog 组件中的数据库 Tab 页及其相关内容

## Impact
- 受影响的代码：[ConnectionFormDialog.tsx](file:///Users/mugbya/git-files/Selene-mysql/Selene-mysql/src/components/common/dialog/ConnectionFormDialog.tsx)

## REMOVED Requirements
### Requirement: 连接编辑弹窗中的数据库 Tab
**Reason**: 数据库筛选功能已移动到数据库连接的左侧面板，编辑弹窗中的数据库 Tab 不再需要
**Migration**: 用户可以通过打开数据库连接后，点击左侧的筛选按钮来管理要显示的数据库
