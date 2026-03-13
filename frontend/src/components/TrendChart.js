import { useState } from "react"
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

function TrendChart({
  dataPoints = [],
  labels = [],
  onRangeChange,
  showRangeSelector = true,
  title = "Trend",
  yAxisLabel = "Value",
  xAxisLabel = "Date of measurement",
  valueSuffix = "",
  helperText = "",
  tooltipLabelPrefix,
  pointRadius = 2
}){

  const [range,setRange] = useState("daily")
  const chartData = dataPoints.length > 0 ? dataPoints : [0]
  const chartLabels = labels.length === chartData.length
    ? labels
    : chartData.map((_, i) => i + 1)
  const styles = getComputedStyle(document.documentElement)
  const textColor = styles.getPropertyValue("--text-main").trim() || "#0f172a"
  const mutedColor = styles.getPropertyValue("--text-muted").trim() || "#64748b"
  const borderColor = styles.getPropertyValue("--border").trim() || "#dbe4ee"

  const handleRangeChange = (nextRange) => {
    setRange(nextRange)
    if (onRangeChange) {
      onRangeChange(nextRange)
    }
  }

  const data = {

    labels: chartLabels,

    datasets:[{
      label:title,
      data: chartData,
      borderColor:"#2563EB",
      borderWidth:2,
      tension:0.4,
      pointRadius
    }]

  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: `${title} Trend`,
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
          title: (items) => `${xAxisLabel}: ${items[0].label}`,
          label: (item) => `${tooltipLabelPrefix || yAxisLabel}: ${Number(item.raw).toFixed(2)}${valueSuffix}`
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: xAxisLabel,
          color: mutedColor
        },
        ticks: {
          color: mutedColor,
          maxTicksLimit: 6
        },
        grid: {
          color: borderColor
        }
      },
      y: {
        title: {
          display: true,
          text: yAxisLabel,
          color: mutedColor
        },
        ticks: {
          color: mutedColor,
          callback: (value) => `${Number(value).toFixed(0)}${valueSuffix}`
        },
        grid: {
          color: borderColor
        }
      }
    }
  }

  return(

    <div style={{
      background:"var(--surface)",
      padding:"20px",
      borderRadius:"10px",
      boxShadow:"var(--shadow)",
      border:"1px solid var(--border)"
    }}>

      {showRangeSelector && (
      <div style={{marginBottom:"15px"}}>

        <button
          onClick={()=>handleRangeChange("daily")}
          disabled={range === "daily"}
          style={{
            padding:"8px 12px",
            borderRadius:"999px",
            border: range === "daily" ? "1px solid var(--button-selected-border)" : "1px solid var(--button-border)",
            background: range === "daily" ? "var(--button-selected-bg)" : "var(--button-bg)",
            color:"var(--button-text)",
            cursor:"pointer"
          }}
        >
          Daily
        </button>
        <button
          onClick={()=>handleRangeChange("weekly")}
          disabled={range === "weekly"}
          style={{
            marginLeft:"10px",
            padding:"8px 12px",
            borderRadius:"999px",
            border: range === "weekly" ? "1px solid var(--button-selected-border)" : "1px solid var(--button-border)",
            background: range === "weekly" ? "var(--button-selected-bg)" : "var(--button-bg)",
            color:"var(--button-text)",
            cursor:"pointer"
          }}
        >
          Weekly
        </button>
        <button
          onClick={()=>handleRangeChange("monthly")}
          disabled={range === "monthly"}
          style={{
            marginLeft:"10px",
            padding:"8px 12px",
            borderRadius:"999px",
            border: range === "monthly" ? "1px solid var(--button-selected-border)" : "1px solid var(--button-border)",
            background: range === "monthly" ? "var(--button-selected-bg)" : "var(--button-bg)",
            color:"var(--button-text)",
            cursor:"pointer"
          }}
        >
          Monthly
        </button>

      </div>
      )}

      <div style={{height:"280px"}}>

        {dataPoints.length === 0 && (
          <p style={{color:"var(--text-muted)", marginTop:0}}>
            No historical measurements available for this range.
          </p>
        )}

        <Line data={data} options={options}/>
      </div>

      {helperText && (
        <p style={{color:"var(--text-muted)", fontSize:"13px", marginBottom:0}}>
          {helperText}
        </p>
      )}

    </div>

  )

}

export default TrendChart
