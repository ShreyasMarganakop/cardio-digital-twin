import { Link } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import { useTheme } from "./ThemeContext"

function Navbar(){
  const { themeMode, setThemeMode } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (

    <div style={{
      display:"flex",
      justifyContent:"space-between",
      alignItems:"center",
      padding:"12px 24px",
      background:"var(--navbar-bg)",
      color:"var(--navbar-text)",
      borderBottom:"1px solid var(--border)"
    }}>

      <h2 style={{margin:0, fontSize:"1.75rem"}}>Cardio Digital Twin</h2>

      <div style={{display:"flex", gap:"20px", alignItems:"center"}}>

        <Link to="/" style={{color:"var(--navbar-text)", textDecoration:"none"}}>Home</Link>
        <Link to="/simulation" style={{color:"var(--navbar-text)", textDecoration:"none"}}>Simulation</Link>
        <div ref={menuRef} style={{position:"relative"}}>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            style={{
              padding:"7px 11px",
              borderRadius:"999px",
              border:"1px solid var(--navbar-button-border)",
              background:"var(--navbar-button-bg)",
              color:"var(--navbar-text)",
              cursor:"pointer"
            }}
          >
            Theme
          </button>

          {menuOpen && (
            <div style={{
              position:"absolute",
              right:0,
              top:"calc(100% + 8px)",
              minWidth:"140px",
              background:"var(--surface)",
              color:"var(--text-main)",
              border:"1px solid var(--border)",
              borderRadius:"12px",
              boxShadow:"var(--shadow)",
              padding:"8px",
              zIndex:10
            }}>
              {["auto", "dark", "light"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setThemeMode(mode)
                    setMenuOpen(false)
                  }}
                  style={{
                    width:"100%",
                    textAlign:"left",
                    padding:"10px 12px",
                    borderRadius:"8px",
                    border: themeMode === mode
                      ? `1px solid ${mode === "auto" ? "var(--option-blue-border)" : mode === "dark" ? "var(--option-violet-border)" : "var(--option-amber-border)"}`
                      : "1px solid transparent",
                    background: themeMode === mode
                      ? mode === "auto"
                        ? "var(--option-blue-bg)"
                        : mode === "dark"
                          ? "var(--option-violet-bg)"
                          : "var(--option-amber-bg)"
                      : "transparent",
                    color:"var(--text-main)",
                    cursor:"pointer",
                    textTransform:"capitalize"
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>

  )

}

export default Navbar
