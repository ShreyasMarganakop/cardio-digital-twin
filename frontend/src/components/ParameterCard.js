import { Link } from "react-router-dom"

function ParameterCard({ title, value, status, link }) {

  return (

    <Link to={link} style={{textDecoration:"none"}}>

      <div style={{
        width:"200px",
        padding:"20px",
        borderRadius:"12px",
        background:"var(--surface)",
        boxShadow:"var(--shadow)",
        border:"1px solid var(--border)",
        textAlign:"center"
      }}>

        <h3 style={{color:"var(--text-main)"}}>{title}</h3>

        <h2 style={{color:"#2563EB"}}>{value}</h2>

        <p style={{color:"#16A34A"}}>{status}</p>

      </div>

    </Link>

  )

}

export default ParameterCard
