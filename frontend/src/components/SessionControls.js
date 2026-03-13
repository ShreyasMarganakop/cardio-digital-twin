import { sessionOptions } from "../services/sessionContext"

function SessionControls({ userId, sessionType, onUserChange, onSessionChange, compact = false }) {
  return (
    <div style={{
      display: "flex",
      gap: compact ? "12px" : "18px",
      flexWrap: "wrap",
      alignItems: "end",
      marginBottom: compact ? "18px" : "24px",
      background: "var(--surface)",
      padding: compact ? "12px 14px" : "18px",
      borderRadius: compact ? "12px" : "14px",
      border: "1px solid var(--border)",
      boxShadow: "var(--shadow)"
    }}>
      <div style={{display: "flex", flexDirection: "column", gap: compact ? "2px" : "4px", minWidth: compact ? "180px" : "220px", flex: "1 1 220px"}}>
        <span style={{color: "var(--text-main)", fontSize: compact ? "12px" : "13px", fontWeight: 600, letterSpacing: "0.02em"}}>
          User ID
        </span>
        {!compact && (
          <span style={{color: "var(--text-muted)", fontSize: "12px"}}>
            Select whose measurements you want to view.
          </span>
        )}
        <input
          value={userId}
          onChange={(event) => onUserChange(event.target.value)}
          placeholder="default-user"
          style={{
            marginTop: compact ? "2px" : "4px",
            padding: compact ? "10px 12px" : "12px 14px",
            borderRadius: "10px",
            border: "1px solid var(--button-border)",
            background: "var(--button-bg)",
            color: "var(--button-text)",
            outline: "none",
            fontSize: compact ? "13px" : "14px"
          }}
        />
      </div>

      <div style={{display: "flex", flexDirection: "column", gap: compact ? "2px" : "4px", minWidth: compact ? "180px" : "220px", flex: "1 1 200px"}}>
        <span style={{color: "var(--text-main)", fontSize: compact ? "12px" : "13px", fontWeight: 600, letterSpacing: "0.02em"}}>
          Session Type
        </span>
        {!compact && (
          <span style={{color: "var(--text-muted)", fontSize: "12px"}}>
            Filter the data by measurement context.
          </span>
        )}
        <select
          value={sessionType}
          onChange={(event) => onSessionChange(event.target.value)}
          style={{
            marginTop: compact ? "2px" : "4px",
            padding: compact ? "10px 12px" : "12px 14px",
            borderRadius: "10px",
            border: "1px solid var(--button-border)",
            background: "var(--button-bg)",
            color: "var(--button-text)",
            outline: "none",
            fontSize: compact ? "13px" : "14px",
            appearance: "none"
          }}
        >
          {sessionOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default SessionControls
