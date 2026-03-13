function AlertBox({ message, type }) {

  let color = "#22C55E"

  if (type === "warning") color = "#F59E0B"
  if (type === "danger") color = "#EF4444"

  return (

    <div style={{
      marginTop:"20px",
      padding:"15px",
      borderRadius:"8px",
      background:"var(--surface-muted)",
      borderLeft:`6px solid ${color}`,
      boxShadow:"var(--shadow)",
      color:"var(--text-main)"
    }}>

      <strong>{message}</strong>

    </div>

  )

}

export default AlertBox
