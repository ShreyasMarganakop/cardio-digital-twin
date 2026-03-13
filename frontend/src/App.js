import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { useEffect, useState } from "react"

import Home from "./pages/Home"
import HeartRate from "./pages/HeartRate"
import Recovery from "./pages/Recovery"
import CardiacScore from "./pages/CardiacScore"
import Simulation from "./pages/Simulation"
import { ThemeContext } from "./components/ThemeContext"

function getAutoTheme() {
  const hour = new Date().getHours()
  return hour >= 6 && hour < 18 ? "light" : "dark"
}

function App() {
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem("cardio_theme_mode") || "auto")
  const [theme, setTheme] = useState(() => {
    const savedMode = localStorage.getItem("cardio_theme_mode") || "auto"
    return savedMode === "auto" ? getAutoTheme() : savedMode
  })

  useEffect(() => {
    localStorage.setItem("cardio_theme_mode", themeMode)
    setTheme(themeMode === "auto" ? getAutoTheme() : themeMode)
  }, [themeMode])

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
  }, [theme])

  useEffect(() => {
    if (themeMode !== "auto") {
      return
    }

    const syncThemeWithTime = () => {
      setTheme(getAutoTheme())
    }

    syncThemeWithTime()
    const intervalId = window.setInterval(syncThemeWithTime, 60000)

    return () => window.clearInterval(intervalId)
  }, [themeMode])

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode }}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/heart-rate" element={<HeartRate />} />
          <Route path="/recovery" element={<Recovery />} />
          <Route path="/cardiac-score" element={<CardiacScore />} />
          <Route path="/simulation" element={<Simulation />} />
        </Routes>
      </Router>
    </ThemeContext.Provider>

  )

}

export default App
