import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/ui.css";
import App from "./App.jsx";
import { AppPreferencesProvider } from "./context/AppPreferencesContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <AppPreferencesProvider>
        <App />
      </AppPreferencesProvider>
    </AuthProvider>
  </StrictMode>
);