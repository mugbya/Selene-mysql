import "./App.css";
import "./index.css"
import Layout from "./Layout";
import { useEffect } from "react";
// import { ThemeProvider } from "@/lib/theme-provider";
// import { initProjectsStoreFromElectronStore } from "./store/useProjectStore";
// import { useElectronEvents } from './useElectronEvents';

function App() {
  useEffect(() => {
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
