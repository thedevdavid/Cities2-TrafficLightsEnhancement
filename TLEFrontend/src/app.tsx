import { useEffect, useState, useMemo } from "react";

import engine from "cohtml/cohtml";
import { bindValue, useValue } from "cs2/api";

import { CityConfigurationContext, defaultCityConfiguration, LocaleContext } from "./context";
import { defaultLocale } from "./localisations";

import MainPanel from "./components/main-panel";
import CustomPhaseTool from "./components/custom-phase-tool";

// Create bindings outside component to avoid recreation on each render
const localeBinding = bindValue("C2VM.TLE", "GetLocale", "{}");
const cityConfigBinding = bindValue("C2VM.TLE", "GetCityConfiguration", JSON.stringify(defaultCityConfiguration));

export default function App() {
  const [locale, setLocale] = useState(defaultLocale);

  const localeValue = useValue(localeBinding);
  const cityConfigurationJson = useValue(cityConfigBinding);

  // Parse locale with error handling, memoized to avoid re-parsing on every render
  const parsedLocale = useMemo(() => {
    try {
      return JSON.parse(localeValue);
    } catch (e) {
      console.error("Failed to parse locale:", e);
      return {};
    }
  }, [localeValue]);

  // Update locale in useEffect, not during render (fixes React render loop)
  useEffect(() => {
    if (parsedLocale.locale && parsedLocale.locale !== locale) {
      setLocale(parsedLocale.locale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedLocale.locale]); // Intentionally excluding `locale` to prevent loops

  // Parse city configuration with error handling, memoized
  const cityConfiguration = useMemo(() => {
    try {
      return JSON.parse(cityConfigurationJson);
    } catch (e) {
      console.error("Failed to parse city configuration:", e);
      return defaultCityConfiguration;
    }
  }, [cityConfigurationJson]);

  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "S") {
        engine.call("C2VM.TLE.CallKeyPress", JSON.stringify({ctrlKey: event.ctrlKey, key: event.key}));
      }
    };
    document.addEventListener("keydown", keyDownHandler);
    return () => document.removeEventListener("keydown", keyDownHandler);
  }, []);

  return (
    <CityConfigurationContext.Provider value={cityConfiguration}>
      <LocaleContext.Provider value={locale}>
        <MainPanel />
        <CustomPhaseTool />
      </LocaleContext.Provider>
    </CityConfigurationContext.Provider>
  );
}