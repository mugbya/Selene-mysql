// // import { appWindow, WebviewWindow } from '@tauri-apps/api/window';
// // import { WebviewWindow, appWindow } from '@tauri-apps/api/window';
// // import { WebviewWindow } from '@tauri-apps/api/window';
// // import { appWindow } from '@tauri-apps/api/window'; // ✅ 这样写是对的

// import { WebviewWindow } from '@tauri-apps/api/webview';
// import { appWindow } from '@tauri-apps/api';

// function ConnectionWindow() {
//   const dialog = new WebviewWindow('dialog', {
//     // url: '/dialog.html', // 或者 'dialog.html'，取决于你前端构建输出
//     url: '/dialog', // 跳转的是 Vite 编译后的 /dialog 路由
//     width: 400,
//     height: 300,
//     title: '模态对话框',
//     resizable: false,
//     focus: true,
//     alwaysOnTop: true,
//     visible: true,
//     decorations: true,
//     // ✅ 重点参数
//     modal: true, // 设置为模态窗口（会锁住主窗口）
//     parent: appWindow, // 设置主窗口为 parent
//   });

//   dialog.once('tauri://created', () => {
//     console.log('Dialog window created');
//   });

//   dialog.once('tauri://error', (e) => {
//     console.error('Failed to create window', e);
//   });
// }