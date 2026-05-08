import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AppPreferencesContext = createContext(null);

export const translations = {
  "pt-PT": {
    home: "Home",
    login: "Login",
    dashboard: "Dashboard",
    messages: "Mensagens",
    notifications: "Notificações",
    profile: "Perfil",
    settings: "Definições",
    patient: "Paciente",
    therapist: "Terapeuta",
    family: "Familiar",
    hello: "Olá",
  },
  en: {
    home: "Home",
    login: "Login",
    dashboard: "Dashboard",
    messages: "Messages",
    notifications: "Notifications",
    profile: "Profile",
    settings: "Settings",
    patient: "Patient",
    therapist: "Therapist",
    family: "Family",
    hello: "Hi",
  },
};

export function AppPreferencesProvider({ children }) {
  const [theme, setThemeState] = useState(
    localStorage.getItem("rehabplay_theme") || "light"
  );

  const [language, setLanguageState] = useState(
    localStorage.getItem("rehabplay_language") || "pt-PT"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("rehabplay_theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("lang", language === "en" ? "en" : "pt");
    localStorage.setItem("rehabplay_language", language);
  }, [language]);

  function setTheme(value) {
    setThemeState(value || "light");
  }

  function setLanguage(value) {
    setLanguageState(value || "pt-PT");
  }

  function t(key) {
    return translations[language]?.[key] || translations["pt-PT"]?.[key] || key;
  }

  const value = useMemo(
    () => ({
      theme,
      language,
      setTheme,
      setLanguage,
      t,
    }),
    [theme, language]
  );

  return (
    <AppPreferencesContext.Provider value={value}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const ctx = useContext(AppPreferencesContext);
  if (!ctx) {
    throw new Error("useAppPreferences must be used inside AppPreferencesProvider");
  }
  return ctx;
}