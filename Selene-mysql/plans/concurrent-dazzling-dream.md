# 数据库编辑页面样式优化计划

## Context
用户报告在 macOS 12.7.6 上运行应用时，数据库编辑页面的输入框没有边框，上下输入框之间没有间距，看起来混在一起。需要添加实线边框来改善视觉效果。

## 问题分析
1. Input 组件使用的 `border-input` 类颜色太浅（`oklch(0.922 0 0)`），几乎看不见
2. CreateTableTab.tsx 中字段行使用 grid 布局，但没有明显的边框分隔
3. EditableStructureTable.tsx 中的表格单元格内的 Input 也缺少边框

## 修改计划

### 1. CreateTableTab.tsx
- 在字段行的 Input 组件上添加 `border` 类（使用 Tailwind 默认的边框颜色）
- 可以添加 `focus:border-ring` 保持焦点时的视觉反馈

### 2. EditableStructureTable.tsx
- 在表格单元格内的 Input 组件上添加 `border` 类

## 验证方式
1. 启动应用 `pnpm tauri dev`
2. 进入数据库编辑页面（创建表页面）
3. 确认输入框有实线边框，上下字段之间有清晰的视觉分隔
