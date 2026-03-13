import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend
} from "chart.js"

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Legend)

function PPGChart({ signal = [], chartKey = "", isProcessed = false }){
  const chartSignal = signal.length > 0 ? signal : [0]
  const styles = getComputedStyle(document.documentElement)
  const textColor = styles.getPropertyValue("--text-main").trim() || "#0f172a"
  const mutedColor = styles.getPropertyValue("--text-muted").trim() || "#64748b"
  const borderColor = styles.getPropertyValue("--border").trim() || "#dbe4ee"

  const data = {

    labels: chartSignal.map((_,i)=>i + 1),

    datasets:[{
      label:"Live PPG Signal",
      data: chartSignal,
      borderColor:"#EF4444",
      borderWidth:2,
      pointRadius:0,
      tension:0.4
    }]

  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 500,
      easing: "easeOutQuart"
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: "Live PPG Waveform",
        color: textColor,
        font: {
          size: 16,
          weight: "600"
        },
        padding: {
          bottom: 12
        }
      },
      tooltip: {
        callbacks: {
          title: (items) => `Sample ${items[0].label}`,
          label: (item) => `${isProcessed ? "Processed level" : "Signal level"}: ${Number(item.raw).toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Sample number",
          color: mutedColor
        },
        ticks: {
          color: mutedColor,
          maxTicksLimit: 8
        },
        grid: {
          color: borderColor
        }
      },
      y: {
        title: {
          display: true,
          text: isProcessed ? "Normalized pulse waveform" : "Relative pulse signal",
          color: mutedColor
        },
        ticks: {
          color: mutedColor,
          callback: (value) => Number(value).toFixed(1)
        },
        grid: {
          color: borderColor
        }
      }
    }
  }

  return(

    <div style={{
      width:"90%",
      margin:"auto",
      background:"var(--surface)",
      padding:"20px",
      borderRadius:"10px",
      boxShadow:"var(--shadow)",
      border:"1px solid var(--border)"
    }}>
      <div style={{height:"280px"}}>

        {signal.length === 0 && (
          <p style={{color:"var(--text-muted)", marginTop:0}}>
            No signal available yet. Send a PPG sample to the backend to populate this chart.
          </p>
        )}

        <Line key={chartKey} data={data} options={options}/>
      </div>

      <p style={{color:"var(--text-muted)", fontSize:"13px", marginBottom:0}}>
        {isProcessed
          ? "This is the cleaned waveform used for analysis, so it should look closer to a real repeating PPG pulse pattern."
          : "This is the raw sensor waveform. It refreshes automatically when a new sensor batch reaches the backend."}
      </p>

    </div>

  )

}

export default PPGChart
