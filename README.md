# Cardio-Fitness Digital Twin

A system that models heart performance using physiological signals such as heart rate (HR) and heart rate variability (HRV). The project analyzes cardiac signals and predicts improvements in heart performance based on training and recovery strategies.

---

## Project Objective

To design a **Cardio-Performance Digital Twin** that simulates how the heart responds to:

- Exercise
- Stress
- Recovery

The system analyzes heart signals and provides **explainable insights** and a **Cardiac Enhancement Score** to track cardiovascular performance over time.

---

## System Architecture

PPG Sensor (MAX30102)  
↓  
ESP32 Microcontroller  
↓  
WiFi Data Transmission  
↓  
FastAPI Backend (Signal Processing)  
↓  
MongoDB Database  
↓  
React Frontend Dashboard  

---

## Backend Features

- FastAPI backend for biomedical signal processing
- PPG signal preprocessing
- Bandpass filtering
- Peak detection
- Heart Rate (HR) calculation
- Heart Rate Variability (RMSSD)
- Cardiac Enhancement Score
- MongoDB data storage
- History API for tracking progress

---

## Backend API

### Analyze PPG Signal

POST `/api/ppg`

Input:
{
“signal”: [52345, 52340, 52360, …]
}
Output:
{
“heart_rate”: 72,
“rmssd”: 0.52,
“cardiac_score”: 1,
“signal_length”: 500
}
---

### Get History

GET `/api/history`

Returns previous cardiac measurements stored in MongoDB.

---

## Hardware

Sensor: **MAX30102 PPG Sensor**

Microcontroller: **ESP32**

Measures:

- Blood volume pulse
- Heart rate
- Heart rate variability

---

## Technologies Used

Backend:

- FastAPI
- Python
- NumPy
- SciPy
- MongoDB

Frontend:

- React
- Chart.js
- Axios

Hardware:

- ESP32
- MAX30102 sensor

---

## Signal Processing Pipeline

1. Signal normalization
2. Bandpass filtering
3. Peak detection
4. RR interval computation
5. HR calculation
6. HRV (RMSSD) calculation
7. Cardiac score modeling

---

## Future Improvements

- Noise reduction for PPG signals
- Motion artifact removal
- Training strategy simulation
- Overtraining safety alerts
- Personalized cardiac optimization

---

## Authors

Shreyas Marganakop