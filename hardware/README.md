# Hardware Integration

This folder contains a starter ESP32 + MAX30102 integration aligned with the
existing backend contract:

`POST /api/ppg`

## Expected payload

```json
{
  "signal": [52345, 52340, 52360],
  "sampling_rate": 100,
  "user_id": "default-user",
  "session_type": "resting",
  "activity_load": 15,
  "stress_level": 25
}
```

## Starter sketch

Use:

`hardware/esp32_max30102_sender/esp32_max30102_sender.ino`

Before flashing:

1. Set `WIFI_SSID`
2. Set `WIFI_PASSWORD`
3. Set `BACKEND_URL`
4. Adjust `USER_ID`, `SESSION_TYPE`, `ACTIVITY_LOAD`, and `STRESS_LEVEL`

## Notes

- The sketch buffers `500` IR samples and then sends them to the backend.
- This keeps compatibility with the current validation path.
- The sketch is a starter integration and may need timing/sensor tuning once
  the real hardware signal is visible.
