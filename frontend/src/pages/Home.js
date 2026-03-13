import Navbar from "../components/Navbar"
import ParameterCard from "../components/ParameterCard"
import PPGChart from "../components/PPGChart"
import AlertBox from "../components/AlertBox"
import { useEffect, useState } from "react"
import { getLatest, getRecommendation } from "../services/api"
import SessionControls from "../components/SessionControls"
import { getStoredSessionType, getStoredUserId, saveSessionContext } from "../services/sessionContext"

const DASHBOARD_POLL_MS = 3000

function getActivityLoadLabel(value) {
  if (value <= 20) return "Rest, very light walking"
  if (value <= 40) return "Light activity"
  if (value <= 60) return "Moderate workout"
  if (value <= 80) return "Hard training"
  return "Very intense session or heavy fatigue"
}

function Home(){
  const [latest, setLatest] = useState(null)
  const [recommendation, setRecommendation] = useState(null)
  const [error, setError] = useState("")
  const [recommendationError, setRecommendationError] = useState("")
  const [userId, setUserId] = useState(getStoredUserId())
  const [selectedSessionType, setSelectedSessionType] = useState(getStoredSessionType())
  const [lastUpdatedAt, setLastUpdatedAt] = useState("")

  useEffect(() => {
    let isActive = true

    async function fetchDashboardData() {
      try {
        saveSessionContext(userId, selectedSessionType)
        const latestResponse = await getLatest({ user_id: userId, session_type: selectedSessionType })
        if (!isActive) {
          return
        }

        if (latestResponse.data.error) {
          setError(latestResponse.data.error)
          setLatest(null)
          setLastUpdatedAt("")
        } else {
          setError("")
          setLatest(latestResponse.data)
          setLastUpdatedAt(latestResponse.data.timestamp || "")
        }

        const recommendationResponse = await getRecommendation({ user_id: userId, session_type: selectedSessionType })
        if (!isActive) {
          return
        }

        if (recommendationResponse.data.error) {
          setRecommendation(null)
          setRecommendationError(recommendationResponse.data.error)
        } else {
          setRecommendation(recommendationResponse.data)
          setRecommendationError("")
        }
      } catch (fetchError) {
        if (!isActive) {
          return
        }
        setError("Unable to load latest measurement")
        setRecommendationError("Unable to load recommendation")
      }
    }

    fetchDashboardData()
    const intervalId = window.setInterval(fetchDashboardData, DASHBOARD_POLL_MS)

    return () => {
      isActive = false
      window.clearInterval(intervalId)
    }
  }, [userId, selectedSessionType])

  const heartRate = latest?.heart_rate
  const rmssd = latest?.rmssd
  const score = latest?.cardiac_score
  const sessionType = latest?.session_type || "resting"
  const activityLoad = latest?.activity_load ?? 0
  const activityLoadLabel = getActivityLoadLabel(activityLoad)
  const recovery = rmssd == null
    ? "No data"
    : rmssd < 20
      ? "Low"
      : rmssd < 40
        ? "Moderate"
        : "Good"

let alertMessage = null
let alertType = "normal"

if (heartRate == null || rmssd == null) {
  alertMessage = error || "No cardiac measurement available yet."
  alertType = "warning"
}

else if (heartRate > 120) {
  alertMessage = "High heart rate detected. Please rest."
  alertType = "danger"
}

else if (heartRate < 45) {
  alertMessage = "Heart rate unusually low. Monitor carefully."
  alertType = "warning"
}

else if (rmssd < 20) {
  alertMessage = "Low recovery detected. Avoid intense exercise today."
  alertType = "warning"
}

else {
  alertMessage = "Heart condition stable."
  alertType = "normal"
}

const statusMessage = heartRate == null || rmssd == null
  ? "The dashboard is waiting for a stored measurement from the backend."
  : alertType === "danger"
    ? "Current readings suggest elevated cardiac stress. Reduce intensity and recheck."
    : alertType === "warning"
      ? "Current readings suggest caution. Favor recovery before harder sessions."
      : "Current readings are stable. Moderate activity is reasonable."

  return(

    <div style={{background:"var(--page-bg)", minHeight:"100vh", color:"var(--text-main)"}}>

      <Navbar/>

      <div style={{padding:"30px"}}>

        <SessionControls
          userId={userId}
          sessionType={selectedSessionType}
          onUserChange={setUserId}
          onSessionChange={setSelectedSessionType}
        />

        <h2 style={{marginBottom:"20px"}}>Live Heart Signal</h2>

        {lastUpdatedAt && (
          <p style={{color:"var(--text-muted)", marginTop:"-8px"}}>
            Auto-refreshing every 3 seconds. Last updated: {new Date(lastUpdatedAt).toLocaleTimeString()}
          </p>
        )}

        <PPGChart
          signal={latest?.processed_signal?.length ? latest.processed_signal : (latest?.signal || [])}
          chartKey={lastUpdatedAt}
          isProcessed={Boolean(latest?.processed_signal?.length)}
        />

        <h2 style={{marginTop:"40px"}}>Heart Parameters</h2>

        <div style={{
          display:"flex",
          gap:"20px",
          marginTop:"20px",
          flexWrap:"wrap"
        }}>

          <ParameterCard
            title="Heart Rate"
            value={heartRate == null ? "--" : `${heartRate} BPM`}
            status={heartRate == null ? "Waiting for data" : heartRate > 100 ? "Elevated" : "Measured"}
            link="/heart-rate"
          />

          <ParameterCard
            title="Recovery Level"
            value={recovery}
            status={rmssd == null ? "Waiting for data" : `RMSSD ${rmssd}`}
            link="/recovery"
          />

          <ParameterCard
            title="Cardiac Score"
            value={score == null ? "--" : `${score}/100`}
            status={score == null ? "Waiting for data" : score >= 70 ? "Strong" : "Building"}
            link="/cardiac-score"
          />

          <ParameterCard
            title="Training Simulation"
            value={sessionType}
            status={`${activityLoadLabel} (${activityLoad})`}
            link="/simulation"
          />

        </div>

        <div style={{
          marginTop:"40px",
          padding:"20px",
          background:"var(--surface-muted)",
          borderRadius:"10px",
          border:"1px solid var(--border)"
        }}>

          <h3>Status</h3>

          <p>
            {statusMessage}
          </p>
          {latest && (
            <p style={{marginBottom:0, color:"var(--text-muted)"}}>
              User: {userId} | Session: {sessionType} | Activity Load: {activityLoadLabel} ({activityLoad})
            </p>
          )}

        </div>

        <div style={{
          marginTop:"20px",
          padding:"20px",
          background:"var(--surface)",
          borderRadius:"10px",
          border:"1px solid var(--border)"
        }}>
          <h3 style={{marginTop:0}}>What To Do Today</h3>

          {recommendation ? (
            <>
              <p style={{marginBottom:"8px"}}>
                <strong>Action:</strong> {recommendation.recommended_action}
              </p>
              <p style={{marginBottom:"8px"}}>
                <strong>Safety:</strong> {recommendation.safety_status}
              </p>
              <p style={{marginBottom:"8px"}}>
                <strong>Reason:</strong> {recommendation.summary_reason?.join(" ")}
              </p>
              <p style={{marginBottom:0}}>
                <strong>Predicted Score:</strong> {recommendation.predicted_score}
              </p>
            </>
          ) : (
            <p style={{marginBottom:0}}>
              {recommendationError || "Recommendation will appear when enough data is available."}
            </p>
          )}
        </div>

        {recommendation?.safety_alerts?.length > 0 && (
          recommendation.safety_alerts.map((item, index) => (
            <AlertBox key={`rec-${index}`} message={item} type="warning"/>
          ))
        )}

        <AlertBox message={alertMessage} type={alertType}/>

      </div>

    </div>

  )

}

export default Home
