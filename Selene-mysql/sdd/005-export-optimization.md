# 005-导出功能优化

## 需求描述

用户反馈导出功能存在以下问题：
1. 表选择区域有4列，导致部分表名显示不全
2. Extended Insert 后面的数字展示不全
3. 导出时SQL执行错误，尝试从mysql系统表查找表
4. 用户希望可以自定义保存路径和文件名

## 验收标准

1. 表选择区域改为2列，表名可以完整显示
2. Extended Insert 显示完整文本，如 "Merge every 1500 rows into one INSERT"
3. 导出功能正确从当前选择的数据库导出，而非系统数据库
4. 用户可以自定义保存路径和文件名
5. 导出流程简洁：选择表 -> 设置选项 -> 点击导出 -> 选择路径 -> 完成

## 技术实现

### 1. 导出弹窗UI优化

- 表选择区域从 `grid-cols-4` 改为 `grid-cols-2`
- Extended Insert 行显示格式优化，使用 i18n 翻译函数支持参数
- 默认值从100改为1500，输入框宽度从 `w-20` 改为 `w-24`

### 2. 修复导出SQL错误

- SHOW CREATE TABLE 添加数据库前缀：`SHOW CREATE TABLE \`${dbName}\`.\`${table}\``
- SELECT 数据添加数据库前缀：`SELECT * FROM \`${dbName}\`.\`${table}\``

### 3. 导出SQL格式

- 导出查询时使用数据库前缀确保正确查询当前数据库
- 导出的 INSERT 语句不包含数据库前缀，生成纯净的 SQL 语句
  - 正确：`INSERT INTO \`table_name\` (...) VALUES (...)`
  - 不带：`INSERT INTO \`database_name\`.\`table_name\` (...)`

### 3. 添加Tauri插件

- 添加 `tauri-plugin-dialog` - 允许用户选择文件保存路径
- 添加 `tauri-plugin-fs` - 允许读写文件系统

#### Rust 后端配置 (Cargo.toml)
```toml
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
```

#### 插件注册 (lib.rs)
```rust
.plugin(tauri_plugin_dialog::init())
.plugin(tauri_plugin_fs::init())
```

#### 前端依赖 (package.json)
```json
"@tauri-apps/plugin-dialog": "^2.6.0",
"@tauri-apps/plugin-fs": "^2.4.5"
```

#### 权限配置 (capabilities/default.json)
```json
{
  "permissions": [
    "dialog:default",
    "fs:default",
    "fs:allow-write-text-file"
  ]
}
```

### 4. 导出功能改进

#### 简化流程
- 移除 SQL 预览区域
- 直接点击"导出"按钮后，弹出系统保存对话框
- 用户选择保存路径后，自动保存文件并关闭对话框

#### 交互设计
- 默认文件名格式：`数据库名_日期.sql`（如 `ita-device_2026-04-02.sql`）
- 支持用户自定义文件名

## 关键文件

- `src/components/common/dialog/ExportWizardDialog.tsx` - 导出弹窗组件
- `src/i18n/index.ts` - 国际化翻译
- `src-tauri/Cargo.toml` - Rust 依赖
- `src-tauri/src/lib.rs` - Rust 插件注册
- `src-tauri/capabilities/default.json` - 权限配置
- `package.json` - 前端依赖

## 完成状态

- [x] 表选择区域改为2列
- [x] Extended Insert 显示优化
- [x] 默认值改为1500
- [x] 修复导出SQL错误
- [x] 添加Tauri插件
- [x] 用户可选择保存路径
- [x] 用户可自定义文件名
- [x] 简化导出流程