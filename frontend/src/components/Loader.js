function Loader(){

  return(

    <div style={{textAlign:"center", marginTop:"20px"}}>

      <div style={{
        fontSize:"40px",
        animation:"heartbeat 1s infinite"
      }}>
        ❤️
      </div>

      <p>Analyzing heart signal...</p>

      <style>
      {`
        @keyframes heartbeat {
          0% { transform: scale(1); }
          25% { transform: scale(1.2); }
          50% { transform: scale(1); }
          75% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}
      </style>

    </div>

  )

}

export default Loader