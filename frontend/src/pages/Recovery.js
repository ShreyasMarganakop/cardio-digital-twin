import Navbar from "../components/Navbar"
import TrendChart from "../components/TrendChart"
import { useEffect, useState } from "react"
import { getHistoryRange, getLatest } from "../services/api"
import SessionControls from "../components/SessionControls"
import { getStoredSessionType, getStoredUserId, saveSessionContext } from "../services/sessionContext"

function Recovery(){
  const [userId, setUserId] = useState(getStoredUserId())
  const [sessionType, setSessionType] = useState(getStoredSessionType())
  const [history, setHistory] = useState([])
  const [labels, setLabels] = useState([])
  const [rmssd, setRmssd] = useState(null)
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

  const recovery = rmssd == null
    ? "No data"
    : rmssd < 20
      ? "Low"
      : rmssd < 40
        ? "Moderate"
        : "Good"

  async function fetchHistory(range) {
    try {
      const response = await getHistoryRange(range, { user_id: userId, session_type: sessionType })
      const rmssdValues = response.data.map(item => item.rmssd)
      const timeLabels = formatLabels(response.data, range)

      setHistory(rmssdValues)
      setLabels(timeLabels)
      setError("")
    } catch (fetchError) {
      setError("Unable to load recovery history")
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        saveSessionContext(userId, sessionType)
        const latestResponse = await getLatest({ user_id: userId, session_type: sessionType })
        if (!latestResponse.data.error) {
          setRmssd(latestResponse.data.rmssd)
          setError("")
        } else {
          setRmssd(null)
          setError(latestResponse.data.error)
        }
      } catch (fetchError) {
        setError("Unable to load latest recovery value")
      }

      try {
        const response = await getHistoryRange("daily", { user_id: userId, session_type: sessionType })
        const rmssdValues = response.data.map(item => item.rmssd)
        const timeLabels = formatLabels(response.data, "daily")

        setHistory(rmssdValues)
        setLabels(timeLabels)
      } catch (fetchError) {
        setError("Unable to load recovery history")
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

        <h1>Recovery Level</h1>

        <h2>{recovery}</h2>

        <p style={{color:"var(--text-muted)"}}>
          {rmssd == null
            ? error || "Recovery status will appear after the backend stores a measurement."
            : rmssd < 20
              ? "Recovery is suppressed. Favor rest or light aerobic work."
              : rmssd < 40
                ? "Recovery is fair, but not fully restored."
                : "Recovery looks solid based on the latest RMSSD value."}
        </p>

        <h3 style={{marginTop:"30px"}}>Trend</h3>

        <TrendChart
          dataPoints={history}
          labels={labels}
          onRangeChange={fetchHistory}
          title="RMSSD"
          yAxisLabel="HRV recovery (RMSSD)"
          valueSuffix=" ms"
          helperText="Higher RMSSD usually reflects better recovery and nervous-system balance. A sustained drop can mean fatigue or stress."
        />

        <div style={{
          marginTop:"30px",
          background:"var(--surface-muted)",
          padding:"20px",
          borderRadius:"10px",
          border:"1px solid var(--border)"
        }}>

          <h3>Suggestion</h3>

          <p>
            {rmssd == null
              ? "Collect repeated morning measurements to establish a recovery baseline."
              : rmssd < 20
                ? "Avoid intense exercise today and emphasize sleep, hydration, and lower stress."
                : "Continue balanced activity and hydration to maintain recovery quality."}
          </p>

        </div>

      </div>

    </div>

  )

}

export default Recovery
