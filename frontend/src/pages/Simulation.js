import { useEffect, useState } from "react"
import Navbar from "../components/Navbar"
import TrendChart from "../components/TrendChart"
import AlertBox from "../components/AlertBox"
import { getLatest, simulateStrategy } from "../services/api"
import SessionControls from "../components/SessionControls"
import { getStoredSessionType, getStoredUserId, saveSessionContext } from "../services/sessionContext"

const activityLoadOptions = [
  { value: 10, label: "Rest, very light walking", accent: "var(--option-green-bg)", accentBorder: "var(--option-green-border)" },
  { value: 30, label: "Light activity", accent: "var(--option-blue-bg)", accentBorder: "var(--option-blue-border)" },
  { value: 50, label: "Moderate workout", accent: "var(--option-amber-bg)", accentBorder: "var(--option-amber-border)" },
  { value: 70, label: "Hard training", accent: "var(--option-rose-bg)", accentBorder: "var(--option-rose-border)" },
  { value: 90, label: "Very intense session or heavy fatigue", accent: "var(--option-violet-bg)", accentBorder: "var(--option-violet-border)" },
]

const stressLevelOptions = [
  { value: 10, label: "Very calm", accent: "var(--option-green-bg)", accentBorder: "var(--option-green-border)" },
  { value: 30, label: "Normal", accent: "var(--option-blue-bg)", accentBorder: "var(--option-blue-border)" },
  { value: 50, label: "Somewhat stressed", accent: "var(--option-amber-bg)", accentBorder: "var(--option-amber-border)" },
  { value: 70, label: "High stress", accent: "var(--option-rose-bg)", accentBorder: "var(--option-rose-border)" },
  { value: 90, label: "Very high stress", accent: "var(--option-violet-bg)", accentBorder: "var(--option-violet-border)" },
]

const strategyOptions = [
  { key: "exercise", label: "Light Exercise", detail: "Low-risk progression", accent: "var(--option-blue-bg)", accentBorder: "var(--option-blue-border)" },
  { key: "interval", label: "Interval Training", detail: "Highest upside, highest strain", accent: "var(--option-rose-bg)", accentBorder: "var(--option-rose-border)" },
  { key: "breathing", label: "Breathing Practice", detail: "Stress and recovery support", accent: "var(--option-green-bg)", accentBorder: "var(--option-green-border)" },
  { key: "recovery", label: "Recovery Optimization", detail: "Restore before pushing harder", accent: "var(--option-violet-bg)", accentBorder: "var(--option-violet-border)" },
]

function Simulation(){
  const [userId, setUserId] = useState(getStoredUserId())
  const [sessionType, setSessionType] = useState(getStoredSessionType())
  const [currentScore, setCurrentScore] = useState(null)
  const [baselineScore, setBaselineScore] = useState(null)
  const [baselineHr, setBaselineHr] = useState(null)
  const [baselineRmssd, setBaselineRmssd] = useState(null)
  const [selected, setSelected] = useState("")
  const [predicted, setPredicted] = useState(null)
  const [activityLoad, setActivityLoad] = useState(50)
  const [stressLevel, setStressLevel] = useState(50)
  const [explanation, setExplanation] = useState([])
  const [safetyAlerts, setSafetyAlerts] = useState([])
  const [recommendation, setRecommendation] = useState("")
  const [contextSummary, setContextSummary] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchLatest() {
      try {
        saveSessionContext(userId, sessionType)
        const response = await getLatest({ user_id: userId, session_type: sessionType })
        if (response.data.error) {
          setError("No measurement available yet for simulation.")
          setCurrentScore(null)
          setPredicted(null)
          return
        }

        setError("")
        setCurrentScore(response.data.cardiac_score)
        setPredicted(response.data.cardiac_score)
        setBaselineScore(null)
        setBaselineHr(null)
        setBaselineRmssd(null)
        setExplanation([])
        setSafetyAlerts([])
        setRecommendation("")
        setContextSummary("")
      } catch (fetchError) {
        setError("Unable to load current score for simulation.")
      }
    }

    fetchLatest()
  }, [userId, sessionType])

  const simulate = async (type) => {
    setSelected(type)
  }

  useEffect(() => {
    if (!selected) {
      return
    }

    let isActive = true

    async function refreshSelectedSimulation() {
      setError("")

      try {
        const response = await simulateStrategy({
          strategy: selected,
          user_id: userId,
          session_type: sessionType,
          activity_load: Number(activityLoad),
          stress_level: Number(stressLevel),
        })

        if (!isActive) {
          return
        }

        if (response.data.error) {
          setError(response.data.error)
          return
        }

        setCurrentScore(response.data.current_score)
        setBaselineScore(response.data.baseline_score)
        setBaselineHr(response.data.baseline_hr)
        setBaselineRmssd(response.data.baseline_rmssd)
        setPredicted(response.data.predicted_score)
        setExplanation(response.data.explanation || [])
        setSafetyAlerts(response.data.safety_alerts || [])
        setRecommendation(response.data.recommendation || "")
        setContextSummary(response.data.context_summary || "")
      } catch (fetchError) {
        if (!isActive) {
          return
        }
        setError("Unable to run simulation.")
      }
    }

    refreshSelectedSimulation()

    return () => {
      isActive = false
    }
  }, [selected, activityLoad, stressLevel, userId, sessionType])

  const trend = currentScore == null || predicted == null ? [] : [currentScore, predicted]
  const trendLabels = ["Current", "Predicted"]
  const selectedActivity = activityLoadOptions.find((option) => option.value === Number(activityLoad))
  const selectedStress = stressLevelOptions.find((option) => option.value === Number(stressLevel))

  return(

    <div style={{background:"var(--page-bg)",minHeight:"100vh", color:"var(--text-main)"}}>

      <Navbar/>

      <div style={{padding:"24px", maxWidth:"1180px", margin:"0 auto"}}>

        <SessionControls
          userId={userId}
          sessionType={sessionType}
          onUserChange={setUserId}
          onSessionChange={setSessionType}
          compact
        />

        <div style={{marginBottom:"24px"}}>
          <div style={{
            color:"#ef4444",
            fontSize:"13px",
            fontWeight:700,
            letterSpacing:"0.12em",
            textTransform:"uppercase",
            marginBottom:"10px"
          }}>
            Active Simulation Mode
          </div>
          <h1 style={{fontSize:"52px", lineHeight:1, margin:"0 0 14px 0"}}>
            Heart Performance Simulator
          </h1>

          <p style={{
            maxWidth:"760px",
            fontSize:"18px",
            lineHeight:1.55,
            color:"var(--text-muted)",
            margin:0
          }}>
            Simulate how different habits may influence your heart performance using your current twin state and baseline.
          </p>
        </div>

        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))",
          gap:"14px",
          alignItems:"stretch"
        }}>
          <div>
            <h3 style={{marginTop:0, marginBottom:"10px"}}>Activity Load</h3>
            <div style={{display:"flex", flexDirection:"column", gap:"10px"}}>
              {activityLoadOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setActivityLoad(option.value)}
                  style={{
                    padding:"11px 12px",
                    borderRadius:"10px",
                    border: Number(activityLoad) === option.value ? `1px solid ${option.accentBorder}` : "1px solid var(--button-border)",
                    background: Number(activityLoad) === option.value ? option.accent : "var(--button-bg)",
                    color:"var(--button-text)",
                    cursor:"pointer",
                    textAlign:"left",
                    boxShadow: Number(activityLoad) === option.value ? "var(--button-selected-shadow)" : "none"
                  }}
                >
                  <strong style={{fontSize:"15px"}}>{option.label}</strong>
                  <div style={{fontSize:"12px", marginTop:"4px", color:"var(--button-muted)"}}>Load value {option.value}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{marginTop:0, marginBottom:"10px"}}>Stress Level</h3>
            <div style={{display:"flex", flexDirection:"column", gap:"10px"}}>
              {stressLevelOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStressLevel(option.value)}
                  style={{
                    padding:"11px 12px",
                    borderRadius:"10px",
                    border: Number(stressLevel) === option.value ? `1px solid ${option.accentBorder}` : "1px solid var(--button-border)",
                    background: Number(stressLevel) === option.value ? option.accent : "var(--button-bg)",
                    color:"var(--button-text)",
                    cursor:"pointer",
                    textAlign:"left",
                    boxShadow: Number(stressLevel) === option.value ? "var(--button-selected-shadow)" : "none"
                  }}
                >
                  <strong style={{fontSize:"15px"}}>{option.label}</strong>
                  <div style={{fontSize:"12px", marginTop:"4px", color:"var(--button-muted)"}}>Stress value {option.value}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          marginTop:"14px",
          padding:"12px 14px",
          background:"var(--surface)",
          borderRadius:"10px",
          border:"1px solid var(--border)"
        }}>
          <strong>Selected Context:</strong> {selectedActivity?.label} | {selectedStress?.label}
        </div>

        <h2 style={{margin:"28px 0 14px 0"}}>Select Active Strategy</h2>
        <div style={{
          display:"grid",
          gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))",
          gap:"14px"
        }}>
          {strategyOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => simulate(option.key)}
              style={{
                padding:"18px",
                borderRadius:"12px",
                border: selected === option.key ? `1px solid ${option.accentBorder}` : "1px solid var(--button-border)",
                background: selected === option.key ? option.accent : "var(--button-bg)",
                color:"var(--button-text)",
                cursor:"pointer",
                textAlign:"left",
                boxShadow: selected === option.key ? "var(--button-selected-shadow)" : "none",
                minHeight:"132px"
              }}
            >
              <div style={{
                width:"42px",
                height:"42px",
                borderRadius:"12px",
                background:selected === option.key ? "rgba(255,255,255,0.55)" : "var(--surface-muted)",
                marginBottom:"18px"
              }}/>
              <strong style={{fontSize:"18px"}}>{option.label}</strong>
              <div style={{fontSize:"15px", marginTop:"8px", color:"var(--button-muted)", lineHeight:1.45}}>
                {option.detail}
              </div>
              <div style={{marginTop:"18px", fontSize:"14px", fontWeight:600, color:selected === option.key ? "#ef4444" : "#7c8aa5"}}>
                {selected === option.key ? "Selected" : "Select strategy"}
              </div>
            </button>
          ))}

        </div>

        <div style={{
          marginTop:"28px",
          display:"grid",
          gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",
          gap:"14px"
        }}>
          <div style={{
            background:"var(--surface)",
            padding:"18px",
            borderRadius:"12px",
            border:"1px solid var(--border)"
          }}>
            <div style={{fontSize:"13px", color:"var(--text-muted)", marginBottom:"8px"}}>Current Score</div>
            <div style={{fontSize:"42px", fontWeight:800}}>{currentScore == null ? "--" : currentScore}</div>
          </div>

          <div style={{
            background:"var(--surface)",
            padding:"18px",
            borderRadius:"12px",
            border:"1px solid var(--border)"
          }}>
            <div style={{fontSize:"13px", color:"var(--text-muted)", marginBottom:"8px"}}>Predicted Score</div>
            <div style={{fontSize:"42px", fontWeight:800, color:"#16A34A"}}>{predicted == null ? "--" : predicted}</div>
          </div>

          <div style={{
            background:"var(--surface)",
            padding:"18px",
            borderRadius:"12px",
            border:"1px solid var(--border)"
          }}>
            <div style={{fontSize:"13px", color:"var(--text-muted)", marginBottom:"8px"}}>Recommendation</div>
            <div style={{fontSize:"22px", fontWeight:700}}>{recommendation || "--"}</div>
          </div>
        </div>

        <div style={{
          marginTop:"14px",
          background:"var(--surface)",
          padding:"16px",
          borderRadius:"10px",
          border:"1px solid var(--border)"
        }}>
          <h3 style={{marginTop:0}}>Recent Baseline</h3>
          <p style={{marginBottom:"8px"}}>Score: {baselineScore == null ? "--" : baselineScore}</p>
          <p style={{marginBottom:"8px"}}>Heart Rate: {baselineHr == null ? "--" : baselineHr} BPM</p>
          <p style={{marginBottom:0}}>RMSSD: {baselineRmssd == null ? "--" : baselineRmssd}</p>
        </div>

        <h3 style={{marginTop:"26px"}}>Predicted Trend</h3>

        <TrendChart
          dataPoints={trend}
          labels={trendLabels}
          showRangeSelector={false}
          title="Simulation Trend"
          xAxisLabel="Comparison point"
          yAxisLabel="Cardiac score"
          valueSuffix="/100"
          tooltipLabelPrefix="Score"
          pointRadius={4}
          helperText="This chart compares your current cardiac score with the predicted score for the selected strategy."
        />

        {recommendation && (
          <div style={{
            marginTop:"20px",
            background:"var(--surface)",
            padding:"16px",
            borderRadius:"10px",
            border:"1px solid var(--border)"
          }}>
            <strong>Recommendation:</strong> {recommendation}
          </div>
        )}

        {contextSummary && (
          <div style={{
            marginTop:"14px",
            background:"var(--surface-muted)",
            padding:"14px 16px",
            borderRadius:"10px",
            border:"1px solid var(--border)"
          }}>
            <strong>Context Summary:</strong> {contextSummary}
          </div>
        )}

        {selected && (

          <div style={{
            marginTop:"30px",
            background:"var(--surface)",
            padding:"20px",
            borderRadius:"10px",
            border:"1px solid var(--border)"
          }}>

            <h3>Explanation</h3>

            {explanation.length === 0 ? (
              <p>No explanation available yet.</p>
            ) : (
              explanation.map((item, index) => (
                <p key={index}>{item}</p>
              ))
            )}

          </div>

        )}

        {safetyAlerts.length > 0 && (
          <div style={{marginTop:"20px"}}>
            {safetyAlerts.map((item, index) => (
              <AlertBox key={index} message={item} type="warning"/>
            ))}
          </div>
        )}

        {error && <AlertBox message={error} type="warning"/>}

      </div>

    </div>

  )

}

export default Simulation
