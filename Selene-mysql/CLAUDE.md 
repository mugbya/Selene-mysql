

# CLAUDE.md - Selene Mysql 项目规范

## 项目模块架构

```
Selene-mysql/
├── src/                    # 前端代码 (React/Vue/Svelte)
├── src-tauri/              # Rust 后端
│   ├── src/
│   │   ├── lib.rs          # 主入口
│   │   ├── commands.rs     # IPC 命令
│   │   └── state.rs        # 状态管理
│   ├── Cargo.toml
│   ├── tauri.conf.json     # Tauri 配置
│   └── capabilities/       # 权限配置 (v2 新特性)
├── CLAUDE.md               # ← 关键！项目规范文档
└── plans/                  # ← Plan Mode 输出目录 (建议)
```

## 技术栈
- 前端: React 19 + TypeScript + Vite 7 + Tailwind CSS 4
- 后端: Rust + Tauri v2 + Tokio
- 状态管理: Zustand (前端), tauri::State (后端)

## 架构约定
### IPC 通信规范
- 所有命令使用 #[tauri::command] 宏
- 前端通过 invoke('command_name') 调用
- 复杂数据流使用事件通道 (Event Channel)

### 文件组织
- 命令处理器放在 src-tauri/src/commands/
- 共享类型放在 src/types/ (前端) 和 src-tauri/src/models/ (后端)
- 能力配置 (capabilities) 按功能模块分离

### 安全规范
- 最小权限原则：capabilities/*.json 中只声明必要权限
- 敏感操作必须通过 Rust 层，禁止前端直接访问 OS API
- 使用 CSP (Content Security Policy) 限制资源加载

## 测试策略
- Rust: 单元测试 + cargo test
- 前端: Vitest + React Testing Library
- E2E: WebDriver 或 Playwright (测试打包后的应用)

## 构建流程
1. pnpm tauri dev (开发)
2. pnpm tauri build (生产构建)
3. 代码签名和公证 (发布时)


