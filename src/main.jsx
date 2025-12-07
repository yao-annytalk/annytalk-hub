import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import "./index.css";
import "./ui/ui.css";       // NEW
import "./ui/bridge.js";    // NEW
import { UIProvider } from "./ui/UIProvider"; // NEW

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UIProvider>
      <App />
    </UIProvider>
  </React.StrictMode>
);
