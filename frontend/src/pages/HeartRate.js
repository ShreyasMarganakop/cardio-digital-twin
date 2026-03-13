import Navbar from "../components/Navbar"
import TrendChart from "../components/TrendChart"
import { useEffect, useState } from "react"
import { getHistoryRange, getLatest } from "../services/api"
import SessionControls from "../components/SessionControls"
import { getStoredSessionType, getStoredUserId, saveSessionContext } from "../services/sessionContext"

function HeartRate(){
  const [userId, setUserId] = useState(getStoredUserId())
  const [sessionType, setSessionType] = useState(getStoredSessionType())
  const [history, setHistory] = useState([])
  const [labels, setLabels] = useState([])
  const [heartRate, setHeartRate] = useState(null)
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
      const hrValues = response.data.map(item => item.heart_rate)
      const timeLabels = formatLabels(response.data, range)

      setHistory(hrValues)
      setLabels(timeLabels)
      setError("")
    } catch (fetchError) {
      setError("Unable to load heart rate history")
    }
  }

  useEffect(() => {
    async function fetchData() {
      try {
        saveSessionContext(userId, sessionType)
        const latestResponse = await getLatest({ user_id: userId, session_type: sessionType })
        if (!latestResponse.data.error) {
          setHeartRate(latestResponse.data.heart_rate)
          setError("")
        } else {
          setHeartRate(null)
          setError(latestResponse.data.error)
        }
      } catch (fetchError) {
        setError("Unable to load latest heart rate")
      }

      try {
        const response = await getHistoryRange("daily", { user_id: userId, session_type: sessionType })
        const hrValues = response.data.map(item => item.heart_rate)
        const timeLabels = formatLabels(response.data, "daily")

        setHistory(hrValues)
        setLabels(timeLabels)
      } catch (fetchError) {
        setError("Unable to load heart rate history")
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

        <h1>Heart Rate</h1>

        <h2>{heartRate == null ? "--" : `${heartRate} BPM`}</h2>

        <p style={{color:"var(--text-muted)"}}>
          {heartRate == null
            ? error || "Heart rate will appear after the backend stores a measurement."
            : heartRate > 100
              ? "Your latest reading is elevated. Reduce intensity and reassess recovery."
              : "Your latest reading is within a manageable range."}
        </p>

        <h3 style={{marginTop:"30px"}}>Trend</h3>

        <TrendChart
          dataPoints={history}
          labels={labels}
          onRangeChange={fetchHistory}
          title="Heart Rate"
          yAxisLabel="Heart rate (beats per minute)"
          valueSuffix=" bpm"
          helperText="Lower resting heart rate often suggests better cardiovascular efficiency, but sudden jumps deserve attention."
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
            {heartRate == null
              ? "Collect a few readings across the week to establish a useful baseline."
              : heartRate > 100
                ? "Prioritize recovery, hydration, and lower-intensity work before interval sessions."
                : "Maintain regular activity and sleep to keep heart rate stable over time."}
          </p>

        </div>

      </div>

    </div>

  )

}

export default HeartRate
