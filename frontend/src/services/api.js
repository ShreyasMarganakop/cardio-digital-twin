import axios from "axios"

const API = axios.create({
  baseURL: "http://localhost:8000/api"
})

export const getHistory = (params = {}) => API.get("/history", { params })
export const getLatest = (params = {}) => API.get("/latest", { params })
export const getHistoryRange = (range, params = {}) => API.get(`/history/${range}`, { params })
export const getRecommendation = (params = {}) => API.get("/recommendation", { params })
export const simulateStrategy = (payload) => API.post("/simulate", payload)

export default API
