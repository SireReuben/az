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

// Wi-Fi settings
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

// CORS headers for mobile app compatibility
void setCORSHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  server.sendHeader("Access-Control-Max-Age", "86400");
  server.sendHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  server.sendHeader("Pragma", "no-cache");
  server.sendHeader("Expires", "0");
}

// Handle preflight OPTIONS requests
void handleOptions() {
  setCORSHeaders();
  server.send(200, "text/plain", "OK");
}

// Enhanced ping handler for better connectivity detection
void handlePing() {
  setCORSHeaders();
  
  // Add device info to ping response for better detection
  String response = "pong";
  response += "\nDevice: AEROSPIN";
  response += "\nStatus: Ready";
  response += "\nTime: " + String(millis());
  response += "\nSession: " + String(sessionActive ? "Active" : "Inactive");
  
  server.send(200, "text/plain", response);
  
  // Log ping requests if session is active
  if (sessionActive) {
    sessionLog += String(millis() - sessionStartTime) + "ms: Ping request received\n";
  }
}

// Enhanced status handler
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
  status += "\nFreeHeap: " + String(ESP.getFreeHeap());
  status += "\nConnectedClients: " + String(WiFi.softAPgetStationNum());
  
  Serial.println("Sending status: " + status);
  server.send(200, "text/plain", status);
}

// HTML page stored in PROGMEM (keeping original for web interface)
const char htmlPage[] PROGMEM = R"=====(
<!DOCTYPE html>
<html>
<head>
  <title>AEROSPIN Motor Control</title>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <meta http-equiv='Cache-Control' content='no-cache, no-store, must-revalidate'>
  <meta http-equiv='Pragma' content='no-cache'>
  <meta http-equiv='Expires' content='0'>
  <link href='https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap' rel='stylesheet'>
  <script>
    var script = document.createElement('script');
    script.src = '/jspdf.umd.min.js';
    script.onload = function() { console.log('jsPDF loaded from SPIFFS'); };
    script.onerror = function() {
      console.error('Failed to load jsPDF from SPIFFS, trying CDN...');
      var fallback = document.createElement('script');
      fallback.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      fallback.onload = function() { console.log('jsPDF loaded from CDN'); };
      fallback.onerror = function() { console.error('Failed to load jsPDF from CDN'); };
      document.head.appendChild(fallback);
    };
    document.head.appendChild(script);
  </script>
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
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    h1 {
      color: #ff1744;
      font-size: 36px;
      text-shadow: 3px 3px 6px rgba(0, 0,0.4);
    }
    h2 {
      color: #d81b60;
      font-size: 28px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
    }
    .button {
      padding: 20px 40px;
      font-size: 24px;
      margin: 15px;
      cursor: pointer;
      border: none;
      border-radius: 20px;
      box-shadow: 0 8px 16px rgba(0,0,0,0.4);
      transition: transform 0.2s, box-shadow 0.2s, background 0.3s;
    }
    .button:hover {
      transform: scale(1.1);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5), 0 0 10px rgba(255, 255,0.8);
    }
    .direction { background: #00e676; color: #1a1a1a; }
    .direction.active { background: #ff5722; color: #ffffff; }
    .brake { background: #18ffff; color: #1a1a1a; }
    .brake.active { background: #ffea00; color: #1a1a1a; }
    .session { background: #f50057; color: #ffffff; }
    .session:hover { background: #c51162; }
    .session.locked { background: #ff5722; }
    .session.locked:hover { background: #e64a19; }
    .speed-btn { background: #ff9100; color: #1a1a1a; }
    .speed-btn:hover { background: #ff6200; }
    .speed-adjust { background: #651fff; color: #ffffff; padding: 15px 25px; }
    .speed-adjust:hover { background: #3f1d1cb0; }
    .reset { background: #ff1744; color: #ffffff; }
    .reset:hover { background: #d81b60; }
    .report-btn { background: #00b0ff; color: #ffffff; }
    .report-btn:hover { background: #0081cb; }
    #speedBar {
      width: 80%;
      height: 25px;
      margin: 15px auto;
      background: #e0e0e0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }
    #speedFill {
      height: 100%;
      background: linear-gradient(to right, #ff1744, #ff9100);
      transition: width 0.5s ease;
      box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
    }
    #sliderValue { font-size: 34px; font-weight: bold; color: #ff1744; }
    #status {
      margin: 30px auto;
      padding: 20px;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
      max-width: 700px;
      animation: fadeIn 1s ease-in;
    }
    #report {
      margin: 30px auto;
      padding: 20px;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
      max-width: 700px;
      text-align: left;
      font-size: 18px;
      white-space: pre-line;
      max-height: 300px;
      overflow-y: auto;
      animation: fadeIn 1s ease-in;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    #status p { margin: 10px 0; font-size: 22px; }
    #speedStatus { font-size: 64px; color: #ff1744; }
    #connectionStatus {
      position: fixed;
      top: 15px;
      right: 15px;
      padding: 10px 20px;
      background: #00e676;
      color: #1a1a1a;
      border-radius: 8px;
      font-size: 20px;
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
    }
    .control-section { display: none; }
    #sessionControls { display: block; }
  </style>
</head>
<body>
  <div id='connectionStatus'>Connected</div>
  <h1>AEROSPIN GLOBAL</h1>
  <div id='status'>
    <h2>Machine Status</h2>
    <p id='directionStatus'>Direction: None</p>
    <p id='brakeStatus'>Brake: None</p>
    <p id='speedStatus'>Speed: 0</p>
    <p id='sessionStatus'>Session: Inactive</p>
  </div>
  <div id='directionControls' class='control-section'>
    <h2>Motor Direction</h2>
    <button id='forward' class='button direction' onclick='setDirection("forward")'>Forward</button>
    <button id='reverse' class='button direction' onclick='setDirection("reverse")'>Reverse</button>
  </div>
  <div id='brakeControls' class='control-section'>
    <h2>Brake Control</h2>
    <button id='push' class='button brake'>Push</button>
    <button id='pull' class='button brake'>Pull</button>
  </div>
  <div id='speedControls' class='control-section'>
    <h2>Motor Speed</h2>
    <p>Set Speed (0-100%)</p>
    <button class='button speed-btn' onclick='confirmSpeed(0)'>0%</button>
    <button class='button speed-btn' onclick='confirmSpeed(25)'>25%</button>
    <button class='button speed-btn' onclick='confirmSpeed(50)'>50%</button>
    <button class='button speed-btn' onclick='confirmSpeed(75)'>75%</button>
    <button class='button speed-btn' onclick='confirmSpeed(100)'>100%</button>
    <br>
    <button class='button speed-adjust' onclick='adjustSpeed(-5)'>-5%</button>
    <button class='button speed-adjust' onclick='adjustSpeed(5)'>+5%</button>
    <div id='speedBar'><div id='speedFill' style='width: 0%'></div></div>
    <div id='sliderValue'>0</div>
  </div>
  <div id='sessionControls'>
    <h2>Session Control</h2>
    <button id='startSession' class='button session' onclick='startSession()'>Start Session</button>
    <button id='endSession' class='button session' onclick='endSession()' style='display: none;'>End Session</button>
    <button id='lockScreen' class='button session' onclick='toggleLock()'>Lock Screen</button>
    <button id='reset' class='button reset' onclick='resetDevice()'>Reset</button>
    <button id='downloadReport' class='button report-btn' onclick='downloadReport()' style='display: none;'>Download Report</button>
  </div>
  <div id='report' class='control-section'>
    <h2>Session Report</h2>
    <p id='reportContent'>No session active</p>
  </div>
  <div id='lockOverlay' style='display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 1000;'>
    <div style='position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 24px;'>
      Screen Locked - Click to Unlock
    </div>
  </div>
  <script>
    let activeDirection = null;
    let lastBrakeAction = 'None';
    let connectionOk = true;
    let sessionActive = false;
    let brakePending = false;
    let reportInterval = null;
    let isScreenLocked = false;
    window.addEventListener('load', function() {
      if (typeof window.jspdf === 'undefined') {
        console.error('jsPDF not loaded after page load');
      } else {
        console.log('jsPDF loaded successfully');
      }
    });
    setInterval(checkConnection, 5000);
    function checkConnection() {
      fetch('/ping')
        .then(response => {
          if (!response.ok) throw new Error('Connection failed');
          connectionOk = true;
          document.getElementById('connectionStatus').style.background = '#00e676';
          document.getElementById('connectionStatus').innerText = 'Connected';
          if (!sessionActive) {
            document.getElementById('startSession').style.display = 'inline-block';
          }
        })
        .catch(error => {
          connectionOk = false;
          document.getElementById('connectionStatus').style.background = '#ff5722';
          document.getElementById('connectionStatus').innerText = 'Disconnected';
          document.getElementById('startSession').style.display = 'none';
          console.error('Connection error:', error);
        });
    }
    function updateReport() {
      if (!sessionActive || !connectionOk) return;
      fetch('/getSessionLog')
        .then(response => {
          if (!response.ok) throw new Error('Failed to fetch session log');
          return response.text();
        })
        .then(data => {
          document.getElementById('reportContent').innerText = data || 'No events logged yet';
        })
        .catch(error => {
          console.error('Failed to update report:', error);
          document.getElementById('reportContent').innerText = 'Error fetching report';
        });
    }
    function setDirection(dir) {
      if (!connectionOk || isScreenLocked) return;
      if (!confirm(`Are you sure you want to set direction to ${dir}?`)) return;
      fetch('/direction?state=' + dir)
        .then(response => {
          if (!response.ok) throw new Error('Direction set failed');
          document.getElementById('forward').classList.remove('active');
          document.getElementById('reverse').classList.remove('active');
          if (dir === 'forward' || dir === 'reverse') {
            document.getElementById(dir).classList.add('active');
            activeDirection = dir;
            document.getElementById('directionStatus').innerText = 'Direction: ' + dir.charAt(0).toUpperCase() + dir.slice(1);
          } else {
            activeDirection = null;
            document.getElementById('directionStatus').innerText = 'Direction: None';
          }
        })
        .catch(error => {
          connectionOk = false;
          console.error('Failed to set direction:', error);
        });
    }
    function setBrake(action, state) {
      if (!connectionOk || brakePending || isScreenLocked) return;
      if (state === 'on' && !confirm(`Are you sure you want to ${action} brake to ${state}?`)) return;
      brakePending = true;
      fetch('/brake?action=' + action + '&state=' + state)
        .then(response => {
          if (!response.ok) throw new Error('Brake set failed');
          const pushBtn = document.getElementById('push');
          const pullBtn = document.getElementById('pull');
          pushBtn.classList.remove('active');
          pullBtn.classList.remove('active');
          if (state === 'on') {
            document.getElementById(action).classList.add('active');
            lastBrakeAction = action.charAt(0).toUpperCase() + action.slice(1) + ' On';
          } else {
            lastBrakeAction = 'None';
          }
          document.getElementById('brakeStatus').innerText = 'Brake: ' + lastBrakeAction;
        })
        .catch(error => {
          connectionOk = false;
          console.error('Failed to set brake:', error);
          document.getElementById('brakeStatus').innerText = 'Brake: Error';
        })
        .finally(() => {
          setTimeout(() => { brakePending = false; }, 500);
        });
    }
    function confirmSpeed(value) {
      if (!connectionOk || isScreenLocked) return;
      const newValue = Math.max(0, Math.min(100, parseInt(value)));
      if (!confirm(`Are you sure you want to set speed to ${newValue}%?`)) return;
      updateSlider(newValue);
    }
    function adjustSpeed(delta) {
      if (!connectionOk || isScreenLocked) return;
      const currentValue = parseInt(document.getElementById('sliderValue').innerText) || 0;
      const newValue = Math.max(0, Math.min(100, currentValue + delta));
      if (!confirm(`Are you sure you want to set speed to ${newValue}%?`)) return;
      updateSlider(newValue);
    }
    function updateSlider(value) {
      if (!connectionOk || isScreenLocked) return;
      const newValue = Math.max(0, Math.min(100, parseInt(value)));
      document.getElementById('sliderValue').innerText = newValue;
      document.getElementById('speedStatus').innerText = 'Speed: ' + newValue;
      document.getElementById('speedFill').style.width = newValue + '%';
      fetch('/speed?value=' + newValue)
        .catch(error => {
          connectionOk = false;
          console.error('Failed to set speed:', error);
        });
    }
    function startSession() {
      if (!connectionOk || isScreenLocked) return;
      fetch('/startSession')
        .then(response => {
          if (!response.ok) throw new Error('Start session failed');
          sessionActive = true;
          document.getElementById('sessionStatus').innerText = 'Session: Active';
          document.getElementById('startSession').style.display = 'none';
          document.getElementById('endSession').style.display = 'inline-block';
          document.getElementById('downloadReport').style.display = 'inline-block';
          document.getElementById('directionControls').style.display = 'block';
          document.getElementById('brakeControls').style.display = 'block';
          document.getElementById('speedControls').style.display = 'block';
          document.getElementById('report').style.display = 'block';
          reportInterval = setInterval(updateReport, 2000);
          updateReport();
        })
        .catch(error => {
          connectionOk = false;
          console.error('Failed to start session:', error);
        });
    }
    function endSession() {
      if (!connectionOk || !sessionActive || isScreenLocked) return;
      fetch('/endSession')
        .then(response => {
          if (!response.ok) throw new Error('End session failed');
          return response.text();
        })
        .then(data => {
          sessionActive = false;
          document.getElementById('sessionStatus').innerText = 'Session: Inactive';
          document.getElementById('startSession').style.display = 'inline-block';
          document.getElementById('endSession').style.display = 'none';
          document.getElementById('downloadReport').style.display = 'none';
          document.getElementById('directionControls').style.display = 'none';
          document.getElementById('brakeControls').style.display = 'none';
          document.getElementById('speedControls').style.display = 'none';
          document.getElementById('report').style.display = 'none';
          document.getElementById('forward').classList.remove('active');
          document.getElementById('reverse').classList.remove('active');
          document.getElementById('push').classList.remove('active');
          document.getElementById('pull').classList.remove('active');
          document.getElementById('directionStatus').innerText = 'Direction: None';
          document.getElementById('brakeStatus').innerText = 'Brake: None';
          document.getElementById('speedStatus').innerText = 'Speed: 0';
          document.getElementById('sliderValue').innerText = '0';
          document.getElementById('speedFill').style.width = '0%';
          document.getElementById('reportContent').innerText = 'No session active';
          activeDirection = null;
          lastBrakeAction = 'None';
          clearInterval(reportInterval);
          alert('Session ended. Log data: \n' + data + '\nCopy this log or download the report.');
        })
        .catch(error => {
          connectionOk = false;
          console.error('Failed to end session:', error);
        });
    }
    function downloadReport() {
      if (!connectionOk || !sessionActive || isScreenLocked) return;
      if (typeof window.jspdf === 'undefined') {
        console.error('jsPDF library not loaded');
        alert('Error: jsPDF library not loaded. Please ensure the file is available or check your internet connection, then reload the page.');
        return;
      }
      const { jsPDF } = window.jspdf;
      fetch('/getSessionLog')
        .then(response => {
          if (!response.ok) throw new Error('Failed to fetch session log');
          return response.text();
        })
        .then(data => {
          const doc = new jsPDF();
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(18);
          doc.text('AEROSPIN Session Report', 10, 10);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(data || 'No events logged yet', 190);
          doc.text(lines, 10, 20);
          doc.save('AEROSPIN_Session_Report.pdf');
        })
        .catch(error => {
          console.error('Failed to download report:', error);
          alert('Error generating report: ' + error.message);
        });
    }
    function resetDevice() {
      if (!connectionOk || isScreenLocked) return;
      if (!confirm('Are you sure you want to reset all values and restart the device? Brake position will be preserved.')) return;
      fetch('/reset')
        .then(response => {
          if (!response.ok) throw new Error('Reset failed');
          document.getElementById('forward').classList.remove('active');
          document.getElementById('reverse').classList.remove('active');
          document.getElementById('push').classList.remove('active');
          document.getElementById('pull').classList.remove('active');
          document.getElementById('directionStatus').innerText = 'Direction: None';
          document.getElementById('brakeStatus').innerText = 'Brake: None';
          document.getElementById('speedStatus').innerText = 'Speed: 0';
          document.getElementById('sliderValue').innerText = '0';
          document.getElementById('speedFill').style.width = '0%';
          activeDirection = null;
          lastBrakeAction = 'None';
          if (sessionActive) {
            document.getElementById('sessionStatus').innerText = 'Session: Inactive';
            document.getElementById('startSession').style.display = 'inline-block';
            document.getElementById('endSession').style.display = 'none';
            document.getElementById('downloadReport').style.display = 'none';
            document.getElementById('directionControls').style.display = 'none';
            document.getElementById('brakeControls').style.display = 'none';
            document.getElementById('speedControls').style.display = 'none';
            document.getElementById('report').style.display = 'none';
            document.getElementById('reportContent').innerText = 'No session active';
            sessionActive = false;
            clearInterval(reportInterval);
          }
          syncUIWithServer(3, 3000); // Retry 3 times, start after 3s
        })
        .catch(error => {
          connectionOk = false;
          console.error('Failed to reset:', error);
          alert('Error resetting device: ' + error.message);
        });
    }
    function syncUIWithServer(retries = 3, delay = 3000) {
      if (retries <= 0) {
        console.error('Failed to sync UI after retries');
        alert('Failed to sync with device after reset. Please refresh the page.');
        return;
      }
      setTimeout(() => {
        fetch('/status')
          .then(response => {
            if (!response.ok) throw new Error('Status fetch failed');
            return response.text();
          })
          .then(data => {
            console.log('Status received:', data);
            const lines = data.split('\n');
            lines.forEach(line => {
              if (line.startsWith('Brake: ')) {
                const brakeState = line.replace('Brake: ', '');
                document.getElementById('brakeStatus').innerText = 'Brake: ' + brakeState;
                if (brakeState === 'Pull On') {
                  document.getElementById('pull').classList.add('active');
                  lastBrakeAction = 'Pull On';
                } else if (brakeState === 'Push On') {
                  document.getElementById('push').classList.add('active');
                  lastBrakeAction = 'Push On';
                } else {
                  document.getElementById('push').classList.remove('active');
                  document.getElementById('pull').classList.remove('active');
                  lastBrakeAction = 'None';
                }
              }
            });
          })
          .catch(error => {
            console.error('Sync attempt failed, retries left:', retries - 1);
            syncUIWithServer(retries - 1, delay + 1000); // Retry with increased delay
          });
      }, delay);
    }
    function toggleLock() {
      isScreenLocked = !isScreenLocked;
      const overlay = document.getElementById('lockOverlay');
      const lockBtn = document.getElementById('lockScreen');
      if (isScreenLocked) {
        overlay.style.display = 'block';
        lockBtn.innerText = 'Unlock Screen';
        lockBtn.classList.add('locked');
      } else {
        overlay.style.display = 'none';
        lockBtn.innerText = 'Lock Screen';
        lockBtn.classList.remove('locked');
      }
    }
    document.getElementById('lockOverlay').addEventListener('click', () => {
      if (isScreenLocked) {
        toggleLock();
      }
    });
    window.onbeforeunload = function() {
      if (sessionActive || isScreenLocked) {
        return 'Session is active or screen is locked. Are you sure you want to leave?';
      }
    };
    const pushBtn = document.getElementById('push');
    const pullBtn = document.getElementById('pull');
    pushBtn.addEventListener('mousedown', () => setBrake('push', 'on'));
    pushBtn.addEventListener('mouseup', () => setBrake('push', 'off'));
    pushBtn.addEventListener('touchstart', () => setBrake('push', 'on'));
    pushBtn.addEventListener('touchend', () => setBrake('push', 'off'));
    pullBtn.addEventListener('mousedown', () => setBrake('pull', 'on'));
    pullBtn.addEventListener('mouseup', () => setBrake('pull', 'off'));
    pullBtn.addEventListener('touchstart', () => setBrake('pull', 'on'));
    pullBtn.addEventListener('touchend', () => setBrake('pull', 'off'));
    checkConnection();
  </script>
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
    lcd.print(sessionActive ? "Session: ON" : "Session: OFF");
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

void handleJSPDF() {
  setCORSHeaders();
  File file = SPIFFS.open("/jspdf.umd.min.js", "r");
  if (!file) {
    Serial.println("Failed to open /jspdf.umd.min.js from SPIFFS");
    server.send(404, "text/plain", "jsPDF file not found");
    return;
  }
  Serial.println("Serving /jspdf.umd.min.js from SPIFFS");
  server.streamFile(file, "application/javascript");
  file.close();
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
  
  saveBrakeStatus(); // Save to EEPROM
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
  
  // Reset motor controls but preserve brake position
  speed = 0;
  currentDirection = DIR_NONE;
  MotorDirection = 0;
  // brakeStatus is preserved
  
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
  
  // Reset motor controls but preserve brake position
  speed = 0;
  currentDirection = DIR_NONE;
  MotorDirection = 0;
  // brakeStatus is preserved in EEPROM
  
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

// Add a health check endpoint
void handleHealth() {
  setCORSHeaders();
  
  String health = "OK";
  health += "\nUptime: " + String(millis() / 1000) + "s";
  health += "\nFreeHeap: " + String(ESP.getFreeHeap()) + " bytes";
  health += "\nClients: " + String(WiFi.softAPgetStationNum());
  health += "\nSession: " + String(sessionActive ? "Active" : "Inactive");
  
  server.send(200, "text/plain", health);
}

// Add device info endpoint
void handleDeviceInfo() {
  setCORSHeaders();
  
  String info = "Device: AEROSPIN Controller";
  info += "\nVersion: 1.0.0";
  info += "\nChip ID: " + String(ESP.getChipId(), HEX);
  info += "\nFlash Size: " + String(ESP.getFlashChipSize());
  info += "\nCPU Frequency: " + String(ESP.getCpuFreqMHz()) + " MHz";
  info += "\nSDK Version: " + String(ESP.getSdkVersion());
  info += "\nBoot Version: " + String(ESP.getBootVersion());
  
  server.send(200, "text/plain", info);
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== AEROSPIN Motor Controller Starting ===");
  yield();

  // Initialize EEPROM
  Serial.println("Initializing EEPROM...");
  EEPROM.begin(512); // Allocate 512 bytes
  loadBrakeStatus(); // Load brakeStatus from EEPROM
  yield();

  // Initialize LCD
  Serial.println("Initializing LCD...");
  Wire.begin(SDA_PIN, SCL_PIN);
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Initializing...");
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
    Dir dir = SPIFFS.openDir("/");
    Serial.println("SPIFFS contents:");
    while (dir.next()) {
      Serial.println("File: " + dir.fileName());
    }
    if (SPIFFS.exists("/jspdf.umd.min.js")) {
      Serial.println("jsPDF file found in SPIFFS");
    } else {
      Serial.println("jsPDF file NOT found in SPIFFS! Check SPIFFS upload.");
    }
  }
  yield();

  // Initialize LoRa
  Serial.println("Setting up LoRa...");
  setupLoRa();
  yield();

  // Start WiFi AP
  Serial.println("Starting WiFi AP...");
  WiFi.mode(WIFI_AP);
  if (!WiFi.softAP(ssid, password, 1, 0, 1)) { // Max 4 connections
    Serial.println("WiFi AP setup failed!");
    lcd.setCursor(0, 3);
    lcd.print("WiFi AP Failed");
    delay(2000);
  } else {
    IPAddress ip = WiFi.softAPIP();
    Serial.println("AP IP: " + ip.toString());
    Serial.println("AP SSID: " + String(ssid));
    Serial.println("AP Password: " + String(password));
  }
  yield();

  // Set up server routes with enhanced error handling
  Serial.println("Starting HTTP server...");
  
  // Main routes
  server.on("/", handleRoot);
  server.on("/index.html", handleRoot);
  server.on("/jspdf.umd.min.js", handleJSPDF);
  
  // API routes
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
  
  // Handle OPTIONS requests for CORS preflight
  server.onNotFound([]() {
    if (server.method() == HTTP_OPTIONS) {
      handleOptions();
    } else {
      setCORSHeaders();
      String message = "File Not Found\n\n";
      message += "URI: " + server.uri();
      message += "\nMethod: " + (server.method() == HTTP_GET ? "GET" : "POST");
      message += "\nArguments: " + String(server.args());
      for (uint8_t i = 0; i < server.args(); i++) {
        message += "\n " + server.argName(i) + ": " + server.arg(i);
      }
      server.send(404, "text/plain", message);
    }
  });
  
  server.begin();
  Serial.println("HTTP server started successfully");
  Serial.println("Available endpoints:");
  Serial.println("  GET  /           - Web interface");
  Serial.println("  GET  /ping       - Connection test");
  Serial.println("  GET  /status     - Device status");
  Serial.println("  GET  /health     - Health check");
  Serial.println("  GET  /info       - Device info");
  Serial.println("  GET  /direction  - Set motor direction");
  Serial.println("  GET  /brake      - Control brake");
  Serial.println("  GET  /speed      - Set motor speed");
  Serial.println("  GET  /startSession - Start session");
  Serial.println("  GET  /endSession - End session");
  Serial.println("  GET  /reset      - Reset device");
  yield();

  updateLCD();
  Serial.println("=== AEROSPIN Controller Ready ===");
}

void loop() {
  server.handleClient();
  MDNS.update();
  
  if (newDataReceived) {
    updateLCD();
  }
  
  // Watchdog and status updates
  static unsigned long lastStatusUpdate = 0;
  if (millis() - lastStatusUpdate > 30000) { // Every 30 seconds
    lastStatusUpdate = millis();
    Serial.println("Status: Running, Clients: " + String(WiFi.softAPgetStationNum()) + 
                   ", Session: " + String(sessionActive ? "Active" : "Inactive") +
                   ", Free Heap: " + String(ESP.getFreeHeap()));
  }
  
  delay(10);
  yield();
}