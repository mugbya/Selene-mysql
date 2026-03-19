import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// import { createBrowserRouter, RouterProvider } from 'react-router-dom';
// import Dialog from "./pages/Dialog";

// const router = createBrowserRouter([
//   {
//     path: '/',
//     element: <App />
//   },
//   {
//     path: '/dialog',
//     element: <Dialog />
//   }
// ]);


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>,
);
