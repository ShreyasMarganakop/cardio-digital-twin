const USER_KEY = "cardio_user_id"
const SESSION_KEY = "cardio_session_type"

export const defaultUserId = "default-user"
export const sessionOptions = ["resting", "exercise", "recovery"]

export function getStoredUserId() {
  return localStorage.getItem(USER_KEY) || defaultUserId
}

export function getStoredSessionType() {
  return localStorage.getItem(SESSION_KEY) || "resting"
}

export function saveSessionContext(userId, sessionType) {
  localStorage.setItem(USER_KEY, userId || defaultUserId)
  localStorage.setItem(SESSION_KEY, sessionType || "resting")
}
