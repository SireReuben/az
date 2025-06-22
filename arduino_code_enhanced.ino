#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <SPI.h>
#include <LoRa.h>
#include <FS.h>
#include <EEPROM.h>
#include <ArduinoJson.h>

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

// EEPROM addresses for persistent storage
#define EEPROM_BRAKE_ADDR 0
#define EEPROM_SESSION_ADDR 1
#define EEPROM_SPEED_ADDR 2
#define EEPROM_DIRECTION_ADDR 3

// Enhanced offline data structure
struct OfflineData {
  bool sessionActive;
  int speed;
  BrakeState brakeStatus;
  Direction currentDirection;
  unsigned long lastUpdate;
  char sessionId[32];
};

OfflineData offlineData;

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
  server.sendHeader("Content-Type", "application/json; charset=utf-8");
  server.sendHeader("Server", "AEROSPIN-ESP8266/1.0");
  server.sendHeader("X-Arduino-Response", "true");
  server.sendHeader("X-APK-Compatible", "YES");
  server.sendHeader("X-Offline-Ready", "YES");
}

// Handle preflight OPTIONS requests (critical for Android APK)
void handleOptions() {
  setCORSHeaders();
  server.send(200, "application/json", "{\"status\":\"OK\",\"message\":\"CORS preflight handled\"}");
  Serial.println("OPTIONS request handled for Android APK");
}

// Enhanced ping handler with JSON response for better APK parsing
void handlePing() {
  setCORSHeaders();
  
  // JSON response for better APK compatibility
  DynamicJsonDocument doc(1024);
  doc["status"] = "pong";
  doc["device"] = "AEROSPIN Controller";
  doc["platform"] = "ESP8266";
  doc["version"] = "1.0.0-Android-Optimized";
  doc["uptime"] = millis();
  doc["session"] = sessionActive ? "Active" : "Inactive";
  doc["wifi"] = "AP_ACTIVE";
  doc["clients"] = WiFi.softAPgetStationNum();
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["ip"] = WiFi.softAPIP().toString();
  doc["ssid"] = ssid;
  doc["androidCompatible"] = true;
  doc["offlineReady"] = true;
  doc["timestamp"] = millis();
  
  String response;
  serializeJson(doc, response);
  
  server.send(200, "application/json", response);
  
  // Log ping requests
  if (sessionActive) {
    sessionLog += String(millis() - sessionStartTime) + "ms: Android APK ping received\n";
  }
  
  Serial.println("Android APK ping handled - JSON response sent");
  
  // Update LCD to show Android connection
  lcd.setCursor(0, 3);
  lcd.print("Android JSON OK     ");
}

// Enhanced status handler with JSON response for Android APK
void handleStatus() {
  setCORSHeaders();
  
  DynamicJsonDocument doc(1024);
  doc["direction"] = (currentDirection == DIR_FORWARD) ? "Forward" : 
                    (currentDirection == DIR_REVERSE) ? "Reverse" : "None";
  doc["brake"] = (brakeStatus == BRAKE_PULL) ? "Pull" : 
                 (brakeStatus == BRAKE_PUSH) ? "Push" : "None";
  doc["speed"] = speed;
  doc["sessionActive"] = sessionActive;
  doc["uptime"] = millis() / 1000;
  doc["freeHeap"] = ESP.getFreeHeap();
  doc["clients"] = WiFi.softAPgetStationNum();
  doc["wifiStatus"] = "AP_ACTIVE";
  doc["ip"] = WiFi.softAPIP().toString();
  doc["ssid"] = ssid;
  doc["androidOptimized"] = true;
  doc["offlineCapable"] = true;
  doc["lastUpdate"] = millis();
  
  // Add session info if active
  if (sessionActive) {
    doc["sessionStartTime"] = sessionStartTime;
    doc["sessionDuration"] = millis() - sessionStartTime;
    doc["sessionEvents"] = sessionLog.length() > 0 ? sessionLog.substring(sessionLog.length() - 200) : "No events";
  }
  
  String response;
  serializeJson(doc, response);
  
  Serial.println("Android APK status request handled - JSON response");
  server.send(200, "application/json", response);
}

// Enhanced offline data sync endpoint
void handleOfflineSync() {
  setCORSHeaders();
  
  DynamicJsonDocument doc(2048);
  doc["syncStatus"] = "success";
  doc["timestamp"] = millis();
  doc["offlineData"]["sessionActive"] = offlineData.sessionActive;
  doc["offlineData"]["speed"] = offlineData.speed;
  doc["offlineData"]["brakeStatus"] = offlineData.brakeStatus;
  doc["offlineData"]["currentDirection"] = offlineData.currentDirection;
  doc["offlineData"]["lastUpdate"] = offlineData.lastUpdate;
  doc["offlineData"]["sessionId"] = String(offlineData.sessionId);
  
  // Current live data
  doc["liveData"]["direction"] = (currentDirection == DIR_FORWARD) ? "Forward" : 
                                (currentDirection == DIR_REVERSE) ? "Reverse" : "None";
  doc["liveData"]["brake"] = (brakeStatus == BRAKE_PULL) ? "Pull" : 
                            (brakeStatus == BRAKE_PUSH) ? "Push" : "None";
  doc["liveData"]["speed"] = speed;
  doc["liveData"]["sessionActive"] = sessionActive;
  
  String response;
  serializeJson(doc, response);
  
  server.send(200, "application/json", response);
  Serial.println("Offline sync data sent to Android APK");
}

// Save complete offline data to EEPROM
void saveOfflineData() {
  offlineData.sessionActive = sessionActive;
  offlineData.speed = speed;
  offlineData.brakeStatus = brakeStatus;
  offlineData.currentDirection = currentDirection;
  offlineData.lastUpdate = millis();
  
  // Generate session ID if needed
  if (sessionActive && strlen(offlineData.sessionId) == 0) {
    sprintf(offlineData.sessionId, "SES_%08X", (unsigned int)millis());
  }
  
  // Write to EEPROM
  EEPROM.put(0, offlineData);
  EEPROM.commit();
  
  Serial.println("Offline data saved to EEPROM");
}

// Load complete offline data from EEPROM
void loadOfflineData() {
  EEPROM.get(0, offlineData);
  
  // Validate and restore data
  if (offlineData.brakeStatus <= BRAKE_NONE) {
    brakeStatus = offlineData.brakeStatus;
    speed = constrain(offlineData.speed, 0, 100);
    currentDirection = (offlineData.currentDirection <= DIR_REVERSE) ? offlineData.currentDirection : DIR_NONE;
    
    // Don't restore session active state on boot for safety
    sessionActive = false;
    
    Serial.println("Offline data loaded from EEPROM");
    Serial.println("Brake: " + String(brakeStatus) + ", Speed: " + String(speed) + ", Direction: " + String(currentDirection));
  } else {
    // Initialize with defaults
    memset(&offlineData, 0, sizeof(offlineData));
    brakeStatus = BRAKE_NONE;
    speed = 0;
    currentDirection = DIR_NONE;
    sessionActive = false;
    saveOfflineData();
    Serial.println("Initialized default offline data");
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== AEROSPIN Motor Controller Starting ===");
  Serial.println("Android APK Optimized Version with Offline Support");
  yield();

  // Initialize EEPROM with larger size for offline data
  Serial.println("Initializing EEPROM...");
  EEPROM.begin(512);
  loadOfflineData(); // Load previous state
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
  lcd.print("APK+Offline Ready");
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
  
  if (!WiFi.softAP(ssid, password, 6, 0, 4)) { // Allow up to 4 connections
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
    lcd.print("APK+Offline Ready");
  }
  yield();

  // Set up server routes optimized for Android APK with JSON responses
  Serial.println("Starting HTTP server optimized for Android APK...");
  
  // Main routes
  server.on("/", []() {
    setCORSHeaders();
    DynamicJsonDocument doc(512);
    doc["status"] = "ready";
    doc["device"] = "AEROSPIN Controller";
    doc["message"] = "Android APK Optimized Version";
    doc["endpoints"] = "Use /ping, /status, /health for API access";
    
    String response;
    serializeJson(doc, response);
    server.send(200, "application/json", response);
  });
  
  // Enhanced API routes for Android APK with JSON responses
  server.on("/ping", HTTP_GET, handlePing);
  server.on("/status", HTTP_GET, handleStatus);
  server.on("/health", HTTP_GET, []() {
    setCORSHeaders();
    DynamicJsonDocument doc(1024);
    doc["status"] = "OK";
    doc["system"] = "Operational";
    doc["platform"] = "ESP8266 for Android APK";
    doc["uptime"] = millis() / 1000;
    doc["freeHeap"] = ESP.getFreeHeap();
    doc["androidClients"] = WiFi.softAPgetStationNum();
    doc["session"] = sessionActive ? "Active" : "Inactive";
    doc["androidCompatible"] = true;
    
    String response;
    serializeJson(doc, response);
    server.send(200, "application/json", response);
  });
  server.on("/info", HTTP_GET, []() {
    setCORSHeaders();
    DynamicJsonDocument doc(1024);
    doc["device"] = "AEROSPIN Controller";
    doc["version"] = "1.0.0-Android-APK-Optimized";
    doc["platform"] = "ESP8266";
    doc["chipId"] = String(ESP.getChipId(), HEX);
    doc["flashSize"] = ESP.getFlashChipSize();
    doc["cpuFreq"] = ESP.getCpuFreqMHz();
    doc["sdkVersion"] = ESP.getSdkVersion();
    doc["wifiMode"] = "Access Point";
    doc["ssid"] = ssid;
    doc["ip"] = WiFi.softAPIP().toString();
    doc["mac"] = WiFi.softAPmacAddress();
    doc["androidSupport"] = "Enhanced";
    doc["offlineSupport"] = true;
    doc["corsEnabled"] = true;
    doc["jsonApi"] = true;
    
    String response;
    serializeJson(doc, response);
    server.send(200, "application/json", response);
  });
  server.on("/sync", HTTP_GET, handleOfflineSync);
  
  // Handle OPTIONS requests for CORS preflight (critical for Android APK)
  server.onNotFound([]() {
    if (server.method() == HTTP_OPTIONS) {
      handleOptions();
    } else {
      setCORSHeaders();
      DynamicJsonDocument doc(512);
      doc["status"] = "error";
      doc["message"] = "Endpoint not found";
      doc["uri"] = server.uri();
      doc["method"] = (server.method() == HTTP_GET) ? "GET" : "POST";
      doc["availableEndpoints"] = "/ping, /status, /health, /info, /sync";
      
      String response;
      serializeJson(doc, response);
      server.send(404, "application/json", response);
    }
  });
  
  server.begin();
  Serial.println("HTTP server started successfully for Android APK");
  Serial.println("Android APK optimized endpoints with JSON responses:");
  Serial.println("  GET  /           - Device info (JSON)");
  Serial.println("  GET  /ping       - Enhanced connection test (JSON)");
  Serial.println("  GET  /status     - Detailed device status (JSON)");
  Serial.println("  GET  /health     - Comprehensive health check (JSON)");
  Serial.println("  GET  /info       - Device information (JSON)");
  Serial.println("  GET  /sync       - Offline data synchronization (JSON)");
  yield();

  Serial.println("=== AEROSPIN Controller Ready for Android APK with Offline Support ===");
  Serial.println("Android devices should connect to:");
  Serial.println("SSID: " + String(ssid));
  Serial.println("URL: http://192.168.4.1");
  Serial.println("Offline data persistence: ENABLED");
}

void loop() {
  server.handleClient();
  
  // Enhanced status updates for Android APK monitoring
  static unsigned long lastStatusUpdate = 0;
  if (millis() - lastStatusUpdate > 10000) { // Every 10 seconds
    lastStatusUpdate = millis();
    int clientCount = WiFi.softAPgetStationNum();
    Serial.println("Android APK Status: Running, Clients: " + String(clientCount) + 
                   ", Session: " + String(sessionActive ? "Active" : "Inactive") +
                   ", Free Heap: " + String(ESP.getFreeHeap()) + " bytes" +
                   ", WiFi Status: AP_ACTIVE" +
                   ", Offline Ready: YES");
    
    // Update LCD with Android connection info
    if (clientCount > 0) {
      lcd.setCursor(0, 3);
      lcd.print("Android Connected   ");
    } else {
      lcd.setCursor(0, 3);
      lcd.print("APK+Offline Ready   ");
    }
    
    // Periodically save state for offline recovery
    if (sessionActive) {
      saveOfflineData();
    }
  }
  
  delay(10);
  yield();
}