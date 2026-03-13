#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include "MAX30105.h"

MAX30105 particleSensor;

const char *WIFI_SSID = "YOUR_WIFI_NAME";
const char *WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char *BACKEND_URL = "http://YOUR_COMPUTER_IP:8000/api/ppg";

const char *USER_ID = "default-user";
const char *SESSION_TYPE = "resting";
const int ACTIVITY_LOAD = 15;
const int STRESS_LEVEL = 25;

const int SAMPLE_RATE_HZ = 100;
const int BUFFER_SIZE = 500;

uint32_t signalBuffer[BUFFER_SIZE];
int sampleIndex = 0;
unsigned long lastSampleMs = 0;

bool connectToWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startMs = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startMs < 15000) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi connected. IP: ");
    Serial.println(WiFi.localIP());
    return true;
  }

  Serial.println("WiFi connection failed.");
  return false;
}

bool setupSensor() {
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 not found. Check wiring.");
    return false;
  }

  byte ledBrightness = 0x1F;
  byte sampleAverage = 4;
  byte ledMode = 2;
  int sampleRate = SAMPLE_RATE_HZ;
  int pulseWidth = 411;
  int adcRange = 16384;

  particleSensor.setup(
    ledBrightness,
    sampleAverage,
    ledMode,
    sampleRate,
    pulseWidth,
    adcRange
  );

  particleSensor.setPulseAmplitudeRed(0x1F);
  particleSensor.setPulseAmplitudeGreen(0);
  return true;
}

String buildPayload() {
  String payload = "{";
  payload += "\"signal\":[";

  for (int i = 0; i < BUFFER_SIZE; i++) {
    payload += String(signalBuffer[i]);
    if (i < BUFFER_SIZE - 1) {
      payload += ",";
    }
  }

  payload += "],";
  payload += "\"sampling_rate\":" + String(SAMPLE_RATE_HZ) + ",";
  payload += "\"user_id\":\"" + String(USER_ID) + "\",";
  payload += "\"session_type\":\"" + String(SESSION_TYPE) + "\",";
  payload += "\"activity_load\":" + String(ACTIVITY_LOAD) + ",";
  payload += "\"stress_level\":" + String(STRESS_LEVEL);
  payload += "}";

  return payload;
}

void sendBufferToBackend() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Skipping upload.");
    return;
  }

  HTTPClient http;
  http.begin(BACKEND_URL);
  http.addHeader("Content-Type", "application/json");

  String payload = buildPayload();
  int httpCode = http.POST(payload);

  Serial.print("POST status: ");
  Serial.println(httpCode);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.println(response);
  } else {
    Serial.print("HTTP error: ");
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  if (!connectToWiFi()) {
    Serial.println("Continuing without WiFi. Reboot after fixing credentials.");
  }

  if (!setupSensor()) {
    Serial.println("Sensor setup failed. Halting.");
    while (true) {
      delay(1000);
    }
  }

  Serial.println("Hardware integration starter is running.");
}

void loop() {
  unsigned long nowMs = millis();
  if (nowMs - lastSampleMs < (1000 / SAMPLE_RATE_HZ)) {
    return;
  }

  lastSampleMs = nowMs;
  uint32_t irValue = particleSensor.getIR();
  signalBuffer[sampleIndex] = irValue;
  sampleIndex++;

  if (sampleIndex >= BUFFER_SIZE) {
    sendBufferToBackend();
    sampleIndex = 0;
  }
}
