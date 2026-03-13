import Navbar from "../components/Navbar"
import TrendChart from "../components/TrendChart"
import { useEffect, useState } from "react"
import { getHistoryRange, getLatest } from "../services/api"
import SessionControls from "../components/SessionControls"
import { getStoredSessionType, getStoredUserId, saveSessionContext } from "../services/sessionContext"

function CardiacScore(){
  const [userId, setUserId] = useState(getStoredUserId())
  const [sessionType, setSessionType] = useState(getStoredSessionType())
  const [history, setHistory] = useState([])
  const [labels, setLabels] = useState([])
  const [score, setScore] = useState(null)
  const [error, setError] = useState("")

  function formatLabels(items, range) {
    return items.map((item) => {
      const date = new Date(item.timestamp)

      if (range === "daily") {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }

      if (range === "monthly") {
        return `Week of ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`
      }

      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    })
  }

  async function fetchHistory(range) {
    try {
      const response = await getHistoryRange(range, { user_id: userId, session_type: sessionType })
      const scoreValues = response.data.map(item => item.cardiac_score)
      const timeLabels = formatLabels(response.data, range)

      setHistory(scoreValues)
      setLabels(timeLabels)
      setError("")
    } catch (fetchError) {
      setError("Unable to load cardiac score history")
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        saveSessionContext(userId, sessionType)
        const latestResponse = await getLatest({ user_id: userId, session_type: sessionType })
        if (!latestResponse.data.error) {
          setScore(latestResponse.data.cardiac_score)
          setError("")
        } else {
          setScore(null)
          setError(latestResponse.data.error)
        }
      } catch (fetchError) {
        setError("Unable to load latest cardiac score")
      }

      try {
        const response = await getHistoryRange("daily", { user_id: userId, session_type: sessionType })
        const scoreValues = response.data.map(item => item.cardiac_score)
        const timeLabels = formatLabels(response.data, "daily")

        setHistory(scoreValues)
        setLabels(timeLabels)
      } catch (fetchError) {
        setError("Unable to load cardiac score history")
      }
    }

    fetchData()
  }, [userId, sessionType])

  return(

    <div style={{background:"var(--page-bg)", minHeight:"100vh", color:"var(--text-main)"}}>

      <Navbar/>

      <div style={{padding:"30px"}}>

        <SessionControls
          userId={userId}
          sessionType={sessionType}
          onUserChange={setUserId}
          onSessionChange={setSessionType}
        />

        <h1>Cardiac Enhancement Score</h1>

        <h2>{score == null ? "--" : `${score}/100`}</h2>

        <p style={{color:"var(--text-muted)"}}>
          {score == null
            ? error || "The score will appear after the backend stores a measurement."
            : score >= 70
              ? "Your current score suggests a strong cardiac state."
              : score >= 40
                ? "Your current score is moderate and can improve with consistent recovery."
                : "Your current score is low, so prioritize stabilization before harder training."}
        </p>

        <h3 style={{marginTop:"30px"}}>Trend</h3>

        <TrendChart
          dataPoints={history}
          labels={labels}
          onRangeChange={fetchHistory}
          title="Cardiac Score"
          yAxisLabel="Cardiac score"
          valueSuffix="/100"
          helperText="This score combines heart rate, recovery, and baseline trends. A steady upward pattern is generally a positive sign."
        />

        <div style={{
          marginTop:"30px",
          background:"var(--surface-muted)",
          padding:"20px",
          borderRadius:"10px",
          border:"1px solid var(--border)"
        }}>

          <h3>Insight</h3>

          <p>
            {score == null
              ? "Use repeated measurements to build a reliable score trend."
              : score >= 70
                ? "Maintain consistent training and recovery habits to preserve this level."
                : "Improvement will depend on better recovery patterns and steadier cardiovascular load management."}
          </p>

        </div>

      </div>

    </div>

  )

}

export default CardiacScore
