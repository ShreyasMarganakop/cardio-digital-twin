import { createContext, useContext } from "react"

export const ThemeContext = createContext({
  theme: "light",
  themeMode: "auto",
  setThemeMode: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}
