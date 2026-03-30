import "./App.css";
import "./index.css"
import Layout from "./Layout";
import { useEffect } from "react";
// import { ThemeProvider } from "@/lib/theme-provider";
// import { initProjectsStoreFromElectronStore } from "./store/useProjectStore";
// import { useElectronEvents } from './useElectronEvents';

// 应用保存的主题
const applySavedTheme = () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.classList.remove('dark');
  document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-blue', 'theme-green', 'theme-purple', 'theme-orange');
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (['blue', 'green', 'purple', 'orange'].includes(savedTheme)) {
    document.documentElement.classList.add(`theme-${savedTheme}`);
  }
};

function App() {
  useEffect(() => {
    // 应用保存的主题
    applySavedTheme();
    // initProjectsStoreFromElectronStore();
  }, []);

  console.log("[App]  NODE_ENV: ", import.meta.env.MODE);
  // useElectronEvents(); // 👈 只在应用初始化时注册

  return (
    // <ThemeProvider>
      <Layout />
    // </ThemeProvider>
  );
}

export default App;
