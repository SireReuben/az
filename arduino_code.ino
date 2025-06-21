#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <SPI.h>
#include <LoRa.h>
#include <FS.h>
#include <EEPROM.h>

// LCD setup
#define SDA_PIN 0  // D3
#define SCL_PIN 2  // D4
#define LCD_ADDRESS 0x27
#define LCD_COLUMNS 20
#define LCD_ROWS 4

// LoRa pins
#define LORA_SS 15     // D8
#define LORA_RST 16    // D0
#define LORA_DIO0 5    // D1

LiquidCrystal_I2C lcd(LCD_ADDRESS, LCD_COLUMNS, LCD_ROWS);

// Wi-Fi settings optimized for Android APK
const char* ssid = "AEROSPIN CONTROL";
const char* password = "12345678";

// Motor control states
enum BrakeState { BRAKE_PULL = 0, BRAKE_PUSH = 1, BRAKE_NONE = 3 };
enum Direction { DIR_NONE, DIR_FORWARD, DIR_REVERSE };

// Current state
int speed = 0;
BrakeState brakeStatus = BRAKE_NONE;
Direction currentDirection = DIR_NONE;
int MotorDirection = 0;  // 0=None, 1=Forward, 2=Reverse

// LoRa variables
String receivedData = "";
bool newDataReceived = false;

// Session variables
bool sessionActive = false;
String sessionLog = "";
unsigned long sessionStartTime = 0;
ESP8266WebServer server(80);

// EEPROM address for brakeStatus
#define EEPROM_BRAKE_ADDR 0

// Enhanced CORS headers specifically for Android APK
void setCORSHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cache-Control, Pragma, Expires, User-Agent, Accept, X-Requested-With, X-Android-APK");
  server.sendHeader("Access-Control-Max-Age", "86400");
  server.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  server.sendHeader("Pragma", "no-cache");
  server.sendHeader("Expires", "0");
  server.sendHeader("Connection", "close"); // Force connection close for Android APK
  server.sendHeader("Content-Type", "text/plain; charset=utf-8");
  server.sendHeader("Server", "AEROSPIN-ESP8266/1.0");
  server.sendHeader("X-Arduino-Response", "true");
}

// Handle preflight OPTIONS requests (critical for Android APK)
void handleOptions() {
  setCORSHeaders();
  server.send(200, "text/plain", "OK");
  Serial.println("OPTIONS request handled for Android APK");
}

// Enhanced ping handler specifically for Android APK
void handlePing() {
  setCORSHeaders();
  
  // Enhanced response specifically for Android APK detection
  String response = "pong\n";
  response += "Device: AEROSPIN Controller\n";
  response += "Platform: ESP8266\n";
  response += "Status: Ready for Android APK\n";
  response += "Version: 1.0.0-Android-Optimized\n";
  response += "Time: " + String(millis()) + "ms\n";
  response += "Session: " + String(sessionActive ? "Active" : "Inactive") + "\n";
  response += "WiFi: AP Mode Active\n";
  response += "AndroidClients: " + String(WiFi.softAPgetStationNum()) + "\n";
  response += "FreeHeap: " + String(ESP.getFreeHeap()) + " bytes\n";
  response += "IP: " + WiFi.softAPIP().toString() + "\n";
  response += "SSID: " + String(ssid) + "\n";
  response += "AndroidCompatible: YES\n";
  response += "HTTPServer: Running\n";
  response += "CORSEnabled: YES\n";
  
  server.send(200, "text/plain", response);
  
  // Log ping requests
  if (sessionActive) {
    sessionLog += String(millis() - sessionStartTime) + "ms: Android APK ping received\n";
  }
  
  Serial.println("Android APK ping handled - Enhanced response sent");
  
  // Update LCD to show Android connection
  lcd.setCursor(0, 3);
  lcd.print("Android HTTP OK     ");
}

// Enhanced status handler for Android APK
void handleStatus() {
  setCORSHeaders();
  
  String status = "Direction: ";
  switch(currentDirection) {
    case DIR_FORWARD: status += "Forward"; break;
    case DIR_REVERSE: status += "Reverse"; break;
    default: status += "None"; break;
  }
  
  status += "\nBrake: ";
  switch(brakeStatus) {
    case BRAKE_PULL: status += "Pull"; break;
    case BRAKE_PUSH: status += "Push"; break;
    default: status += "None"; break;
  }
  
  status += "\nSpeed: " + String(speed);
  status += "\nSession: " + String(sessionActive ? "Active" : "Inactive");
  status += "\nUptime: " + String(millis() / 1000) + "s";
  status += "\nFreeHeap: " + String(ESP.getFreeHeap()) + " bytes";
  status += "\nAndroidClients: " + String(WiFi.softAPgetStationNum());
  status += "\nWiFiStatus: AP_ACTIVE";
  status += "\nAPIP: " + WiFi.softAPIP().toString();
  status += "\nSSID: " + String(ssid);
  status += "\nHTTPServer: Running";
  status += "\nAndroidOptimized: YES";
  
  Serial.println("Android APK status request handled");
  server.send(200, "text/plain", status);
}

// Comprehensive health check for Android APK troubleshooting
void handleHealth() {
  setCORSHeaders();
  
  String health = "OK\n";
  health += "System: Operational\n";
  health += "Platform: ESP8266 for Android APK\n";
  health += "Uptime: " + String(millis() / 1000) + "s\n";
  health += "FreeHeap: " + String(ESP.getFreeHeap()) + " bytes\n";
  health += "AndroidClients: " + String(WiFi.softAPgetStationNum()) + "\n";
  health += "Session: " + String(sessionActive ? "Active" : "Inactive") + "\n";
  health += "WiFi: AP Mode Active\n";
  health += "SSID: " + String(ssid) + "\n";
  health += "IP: " + WiFi.softAPIP().toString() + "\n";
  health += "MAC: " + WiFi.softAPmacAddress() + "\n";
  health += "Channel: 6\n";
  health += "Security: WPA2\n";
  health += "AndroidCompatible: YES\n";
  health += "HTTPServer: Running\n";
  health += "CORSEnabled: YES\n";
  health += "ConnectionOptimized: Android APK\n";
  
  server.send(200, "text/plain", health);
  Serial.println("Android APK health check completed");
}

// Enhanced device info for Android APK
void handleDeviceInfo() {
  setCORSHeaders();
  
  String info = "Device: AEROSPIN Controller\n";
  info += "Version: 1.0.0-Android-APK-Optimized\n";
  info += "Platform: ESP8266\n";
  info += "Chip ID: " + String(ESP.getChipId(), HEX) + "\n";
  info += "Flash Size: " + String(ESP.getFlashChipSize()) + " bytes\n";
  info += "CPU Frequency: " + String(ESP.getCpuFreqMHz()) + " MHz\n";
  info += "SDK Version: " + String(ESP.getSdkVersion()) + "\n";
  info += "Boot Version: " + String(ESP.getBootVersion()) + "\n";
  info += "WiFi Mode: Access Point\n";
  info += "SSID: " + String(ssid) + "\n";
  info += "IP: " + WiFi.softAPIP().toString() + "\n";
  info += "MAC: " + WiFi.softAPmacAddress() + "\n";
  info += "AndroidSupport: Enhanced\n";
  info += "CORSEnabled: YES\n";
  info += "HTTPOptimized: Android APK\n";
  
  server.send(200, "text/plain", info);
}

// HTML page with Android APK optimization notice
const char htmlPage[] PROGMEM = R"=====(
<!DOCTYPE html>
<html>
<head>
  <title>AEROSPIN Motor Control - Android APK Optimized</title>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <meta http-equiv='Cache-Control' content='no-cache, no-store, must-revalidate'>
  <meta http-equiv='Pragma' content='no-cache'>
  <meta http-equiv='Expires' content='0'>
  <link href='https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap' rel='stylesheet'>
  <style>
    body {
      font-family: 'Orbitron', sans-serif;
      text-align: center;
      padding: 30px;
      background: linear-gradient(135deg, #e0f7fa, #b2ebf2, #80deea);
      color: #1a1e1a;
      margin: 0;
      animation: gradientShift 8s ease infinite;
    }
    .android-notice {
      background: #e3f2fd;
      border: 3px solid #2196f3;
      border-radius: 12px;
      padding: 20px;
      margin: 20px auto;
      max-width: 600px;
      color: #1565c0;
      font-size: 18px;
      font-weight: bold;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    .status-indicator {
      background: #4caf50;
      color: white;
      padding: 10px 20px;
      border-radius: 25px;
      display: inline-block;
      margin: 10px;
      font-size: 16px;
    }
    h1 { color: #ff1744; font-size: 36px; text-shadow: 3px 3px 6px rgba(0,0,0,0.4); }
  </style>
</head>
<body>
  <h1>AEROSPIN GLOBAL</h1>
  <div class='android-notice'>
    <strong>🤖 Android APK Optimized Version</strong><br>
    Enhanced HTTP communication for Android tablet compatibility<br>
    <div class='status-indicator'>✓ WiFi Connected</div>
    <div class='status-indicator'>✓ HTTP Server Running</div>
    <div class='status-indicator'>✓ CORS Enabled</div>
  </div>
  <div id='status'>
    <h2>Machine Status</h2>
    <p>System ready for Android APK control</p>
  </div>
</body>
</html>
)=====";

void setupLoRa() {
  Serial.println("Starting LoRa initialization...");
  SPI.begin();
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(433E6)) {
    Serial.println("LoRa init failed! Continuing without LoRa...");
    lcd.setCursor(0, 3);
    lcd.print("LoRa Init Failed");
    delay(2000);
    return;
  }
  Serial.println("LoRa initialized successfully");
  LoRa.onReceive(onReceive);
  LoRa.receive();
}

void onReceive(int packetSize) {
  if (packetSize == 0) return;
  receivedData = "";
  while (LoRa.available()) {
    receivedData += (char)LoRa.read();
  }
  newDataReceived = true;
  Serial.println("Received: " + receivedData);
  if (sessionActive) {
    sessionLog += String(millis() - sessionStartTime) + "ms: LoRa RX: " + receivedData + "\n";
  }
}

void sendLoRaData() {
  LoRa.beginPacket();
  String data = String(MotorDirection) + "," + String(brakeStatus) + "," + String(speed);
  LoRa.print(data);
  LoRa.endPacket();
  Serial.println("Sent: " + data);
  LoRa.receive();
}

void updateLCD() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("AEROSPIN GLOBAL");
  lcd.setCursor(0, 1);
  lcd.print("D:");
  lcd.print(currentDirection == DIR_FORWARD ? "FWD" : 
            currentDirection == DIR_REVERSE ? "REV" : "OFF");
  lcd.setCursor(8, 1);
  lcd.print("B:");
  lcd.print(brakeStatus == BRAKE_PULL ? "PULL" :
            brakeStatus == BRAKE_PUSH ? "PUSH" : "OFF");
  lcd.setCursor(0, 2);
  lcd.print("Speed: ");
  lcd.print(speed);
  lcd.print("%");
  lcd.setCursor(0, 3);
  if (newDataReceived) {
    lcd.print("RX:");
    lcd.print(receivedData.substring(0, LCD_COLUMNS-4));
    newDataReceived = false;
  } else {
    lcd.print(sessionActive ? "Session: ON" : "Android APK Ready");
  }
}

void saveBrakeStatus() {
  EEPROM.write(EEPROM_BRAKE_ADDR, (uint8_t)brakeStatus);
  EEPROM.commit();
  Serial.println("Saved brakeStatus to EEPROM: " + String(brakeStatus));
}

void loadBrakeStatus() {
  uint8_t storedStatus = EEPROM.read(EEPROM_BRAKE_ADDR);
  if (storedStatus == BRAKE_PULL || storedStatus == BRAKE_PUSH || storedStatus == BRAKE_NONE) {
    brakeStatus = (BrakeState)storedStatus;
    Serial.println("Loaded brakeStatus from EEPROM: " + String(brakeStatus));
  } else {
    brakeStatus = BRAKE_NONE;
    Serial.println("Invalid brakeStatus in EEPROM, defaulting to NONE");
    saveBrakeStatus();
  }
}

void handleRoot() {
  if (WiFi.softAPgetStationNum() > 4) {
    setCORSHeaders();
    server.send(403, "text/plain", "Too many devices connected. Disconnect others.");
    return;
  }
  setCORSHeaders();
  server.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  server.sendHeader("Pragma", "no-cache");
  server.sendHeader("Expires", "-1");
  server.send_P(200, "text/html", htmlPage);
}

void handleDirection() {
  setCORSHeaders();
  if (!server.hasArg("state")) {
    server.send(400, "text/plain", "Missing state parameter");
    return;
  }
  String state = server.arg("state");
  if (state == "forward") {
    currentDirection = DIR_FORWARD;
    MotorDirection = 1;
  } else if (state == "reverse") {
    currentDirection = DIR_REVERSE;
    MotorDirection = 2;
  } else {
    currentDirection = DIR_NONE;
    MotorDirection = 0;
  }
  Serial.printf("Direction: %s (%d)\n", state.c_str(), MotorDirection);
  sendLoRaData();
  updateLCD();
  if (sessionActive) {
    sessionLog += String(millis() - sessionStartTime) + "ms: Direction set to " + state + "\n";
  }
  server.send(200, "text/plain", "Direction set to " + state);
}

void handleBrake() {
  setCORSHeaders();
  if (!server.hasArg("action") || !server.hasArg("state")) {
    server.send(400, "text/plain", "Missing action or state parameter");
    return;
  }
  String action = server.arg("action");
  String state = server.arg("state");
  
  if (action == "pull" && state == "on") brakeStatus = BRAKE_PULL;
  else if (action == "push" && state == "on") brakeStatus = BRAKE_PUSH;
  else brakeStatus = BRAKE_NONE;
  
  saveBrakeStatus();
  Serial.printf("Brake: %s %s (brakeStatus: %d)\n", action.c_str(), state.c_str(), brakeStatus);
  sendLoRaData();
  updateLCD();
  if (sessionActive) {
    sessionLog += String(millis() - sessionStartTime) + "ms: Brake " + action + " " + state + "\n";
  }
  server.send(200, "text/plain", "Brake " + action + " " + state + " applied");
}

void handleSpeed() {
  setCORSHeaders();
  if (!server.hasArg("value")) {
    server.send(400, "text/plain", "Missing value parameter");
    return;
  }
  speed = constrain(server.arg("value").toInt(), 0, 100);
  Serial.println("Speed: " + String(speed));
  sendLoRaData();
  updateLCD();
  if (sessionActive) {
    sessionLog += String(millis() - sessionStartTime) + "ms: Speed set to " + String(speed) + "\n";
  }
  server.send(200, "text/plain", "Speed set to " + String(speed) + "%");
}

void handleStartSession() {
  setCORSHeaders();
  if (sessionActive) {
    server.send(400, "text/plain", "Session already active");
    return;
  }
  sessionActive = true;
  sessionStartTime = millis();
  sessionLog = "Session Started: " + String(millis()) + "ms\n";
  updateLCD();
  Serial.println("Session started");
  server.send(200, "text/plain", "Session started successfully");
}

void handleEndSession() {
  setCORSHeaders();
  if (!sessionActive) {
    server.send(400, "text/plain", "No active session");
    return;
  }
  sessionActive = false;
  sessionLog += "Session Ended: " + String(millis()) + "ms\n";
  sessionLog += "Duration: " + String(millis() - sessionStartTime) + "ms\n";
  
  speed = 0;
  currentDirection = DIR_NONE;
  MotorDirection = 0;
  
  sendLoRaData();
  updateLCD();
  String log = sessionLog;
  sessionLog = "";
  Serial.println("Session ended");
  server.send(200, "text/plain", log);
}

void handleGetSessionLog() {
  setCORSHeaders();
  if (!sessionActive) {
    server.send(400, "text/plain", "No active session");
    return;
  }
  server.send(200, "text/plain", sessionLog);
}

void handleReset() {
  setCORSHeaders();
  
  speed = 0;
  currentDirection = DIR_NONE;
  MotorDirection = 0;
  
  Serial.println("Resetting device, preserving brakeStatus: " + String(brakeStatus));
  
  if (sessionActive) {
    sessionActive = false;
    sessionLog += String(millis() - sessionStartTime) + "ms: Device reset\n";
    sessionLog = "";
  }
  
  sendLoRaData();
  updateLCD();
  
  server.send(200, "text/plain", "Reset complete, restarting device...");
  
  Serial.println("Device reset completed");
  delay(100);
  ESP.restart();
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== AEROSPIN Motor Controller Starting ===");
  Serial.println("Android APK Optimized Version");
  yield();

  // Initialize EEPROM
  Serial.println("Initializing EEPROM...");
  EEPROM.begin(512);
  loadBrakeStatus();
  yield();

  // Initialize LCD
  Serial.println("Initializing LCD...");
  Wire.begin(SDA_PIN, SCL_PIN);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("AEROSPIN STARTING...");
  lcd.setCursor(0, 1);
  lcd.print("Android APK Ready");
  yield();

  // Initialize SPIFFS
  Serial.println("Initializing SPIFFS...");
  if (!SPIFFS.begin()) {
    Serial.println("SPIFFS init failed! Continuing without SPIFFS...");
    lcd.setCursor(0, 3);
    lcd.print("SPIFFS Init Failed");
    delay(2000);
  } else {
    Serial.println("SPIFFS initialized successfully");
  }
  yield();

  // Initialize LoRa
  Serial.println("Setting up LoRa...");
  setupLoRa();
  yield();

  // Start WiFi AP with Android APK optimizations
  Serial.println("Starting WiFi AP optimized for Android APK...");
  WiFi.mode(WIFI_AP);
  
  // Enhanced AP configuration for Android APK compatibility
  WiFi.softAPConfig(
    IPAddress(192, 168, 4, 1),    // AP IP
    IPAddress(192, 168, 4, 1),    // Gateway
    IPAddress(255, 255, 255, 0)   // Subnet mask
  );
  
  if (!WiFi.softAP(ssid, password, 6, 0, 1)) { // Channel 6, not hidden, max 1 connection
    Serial.println("WiFi AP setup failed!");
    lcd.setCursor(0, 3);
    lcd.print("WiFi AP Failed");
    delay(2000);
  } else {
    IPAddress ip = WiFi.softAPIP();
    Serial.println("WiFi AP started successfully for Android APK");
    Serial.println("AP IP: " + ip.toString());
    Serial.println("AP SSID: " + String(ssid));
    Serial.println("AP Password: " + String(password));
    Serial.println("AP Channel: 6 (Android optimized)");
    Serial.println("AP MAC: " + WiFi.softAPmacAddress());
    
    // Display connection info on LCD
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("AEROSPIN READY");
    lcd.setCursor(0, 1);
    lcd.print("SSID: " + String(ssid));
    lcd.setCursor(0, 2);
    lcd.print("IP: " + ip.toString());
    lcd.setCursor(0, 3);
    lcd.print("Waiting for Android");
  }
  yield();

  // Set up server routes optimized for Android APK
  Serial.println("Starting HTTP server optimized for Android APK...");
  
  // Main routes
  server.on("/", handleRoot);
  server.on("/index.html", handleRoot);
  
  // Enhanced API routes for Android APK
  server.on("/ping", HTTP_GET, handlePing);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/health", HTTP_GET, handleHealth);
  server.on("/info", HTTP_GET, handleDeviceInfo);
  
  // Control routes
  server.on("/direction", HTTP_GET, handleDirection);
  server.on("/brake", HTTP_GET, handleBrake);
  server.on("/speed", HTTP_GET, handleSpeed);
  
  // Session routes
  server.on("/startSession", HTTP_GET, handleStartSession);
  server.on("/endSession", HTTP_GET, handleEndSession);
  server.on("/getSessionLog", HTTP_GET, handleGetSessionLog);
  server.on("/reset", HTTP_GET, handleReset);
  
  // Handle OPTIONS requests for CORS preflight (critical for Android APK)
  server.onNotFound([]() {
    if (server.method() == HTTP_OPTIONS) {
      handleOptions();
    } else {
      setCORSHeaders();
      String message = "File Not Found\n\n";
      message += "URI: " + server.uri();
      message += "\nMethod: " + String(server.method() == HTTP_GET ? "GET" : "POST");
      message += "\nArguments: " + String(server.args());
      for (uint8_t i = 0; i < server.args(); i++) {
        message += "\n " + server.argName(i) + ": " + server.arg(i);
      }
      server.send(404, "text/plain", message);
    }
  });
  
  server.begin();
  Serial.println("HTTP server started successfully for Android APK");
  Serial.println("Android APK optimized endpoints:");
  Serial.println("  GET  /           - Web interface");
  Serial.println("  GET  /ping       - Enhanced connection test");
  Serial.println("  GET  /status     - Detailed device status");
  Serial.println("  GET  /health     - Comprehensive health check");
  Serial.println("  GET  /info       - Device information");
  Serial.println("  GET  /direction  - Set motor direction");
  Serial.println("  GET  /brake      - Control brake");
  Serial.println("  GET  /speed      - Set motor speed");
  Serial.println("  GET  /startSession - Start session");
  Serial.println("  GET  /endSession - End session");
  Serial.println("  GET  /reset      - Reset device");
  yield();

  updateLCD();
  Serial.println("=== AEROSPIN Controller Ready for Android APK ===");
  Serial.println("Android devices should connect to:");
  Serial.println("SSID: " + String(ssid));
  Serial.println("URL: http://192.168.4.1");
}

void loop() {
  server.handleClient();
  MDNS.update();
  
  if (newDataReceived) {
    updateLCD();
  }
  
  // Enhanced status updates for Android APK monitoring
  static unsigned long lastStatusUpdate = 0;
  if (millis() - lastStatusUpdate > 10000) { // Every 10 seconds
    lastStatusUpdate = millis();
    int clientCount = WiFi.softAPgetStationNum();
    Serial.println("Android APK Status: Running, Clients: " + String(clientCount) + 
                   ", Session: " + String(sessionActive ? "Active" : "Inactive") +
                   ", Free Heap: " + String(ESP.getFreeHeap()) + " bytes" +
                   ", WiFi Status: AP_ACTIVE");
    
    // Update LCD with Android connection info
    if (clientCount > 0) {
      lcd.setCursor(0, 3);
      lcd.print("Android Connected   ");
    } else {
      lcd.setCursor(0, 3);
      lcd.print("Waiting for Android ");
    }
  }
  
  delay(10);
  yield();
}