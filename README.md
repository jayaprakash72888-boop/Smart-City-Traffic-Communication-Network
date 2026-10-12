# Smart City Traffic Communication Network

A complete, functional, and visually attractive engineering college project built for the **Computer Networks and Internet Protocols (CNIP)** curriculum.

The project models an intelligent communication network connecting **8 Smart Traffic Signal Intersections** (`Junction_A` through `Junction_H`) in a metropolitan environment. It demonstrates packet forwarding, shortest-path calculation, distributed routing table convergence, traffic shaping, network congestion under varying vehicular loads, and discrete-event network simulation using **NS-2 (Network Simulator 2)**.

---

## 1. Key Features

### A. Smart City Traffic Dashboard
- Modern, high-performance HTML5 Canvas dashboard with dark navy aesthetic, glassmorphism cards, and neon cyan indicators.
- Displays 8 smart traffic intersections with active signal light cycles (Red, Yellow, Green), vehicle density counters, and queue occupancy.
- Animated packets and vehicles moving across arterial links and bridges.
- Real-time telemetry cards: Active Vehicles, Packets Sent/Delivered, Delivery Ratio, Throughput, and Latency.

### B. Dijkstra's Shortest Path Algorithm
- Calculates the lowest-latency communication route between any source and destination traffic intersection.
- Highlights the selected shortest path on the visual network graph in glowing neon cyan.
- Displays step-by-step trace tables detailing node selection, visited sets, tentative distance relaxation, and $O((V+E)\log V)$ time complexity.

### C. Distance Vector Routing (Bellman-Ford Algorithm)
- Generates distributed routing tables ($\langle \text{Destination}, \text{Next Hop}, \text{Cost} \rangle$) for all 8 nodes.
- Interactive link cost modifier and link failure simulator to trigger and observe iterative routing table convergence.
- Demonstrates iterative convergence rounds and explains the Bellman-Ford equation: $D_x(y) = \min_v \{ c(x, v) + D_v(y) \}$.

### D. Leaky Bucket Traffic Shaper
- Simulates buffering and rate-limiting bursty Vehicle-to-Infrastructure (V2I) telemetry packets.
- Interactive visual bucket container with animated water/packet fill levels, inflow faucet, constant leak spout, and overflow alert.
- Live counters for Arrived, Accepted, Dropped packets, and Buffer Occupancy %.
- Real-time comparison chart displaying bursty input vs constant bit rate (CBR) output stream.

### E. Network Congestion & Performance Simulation
- Simulates Low, Medium, High, and Extreme vehicular traffic conditions.
- Demonstrates queue buildup, buffer overflow, and congestion collapse.
- Evaluates exact CNIP mathematical formulas:
  - **Packet Loss Rate (%)** $= (\text{Packets Lost} / \text{Packets Sent}) \times 100$
  - **Throughput (kbps)** $= (\text{Successfully Received Bits} / \text{Simulation Time}) / 1000$
  - **Packet Delivery Ratio (PDR %)** $= (\text{Packets Received} / \text{Packets Sent}) \times 100$
  - **Average End-to-End Delay (ms)**
- Live interactive charts (Throughput vs Time, Queue & Loss vs Time, Latency vs Traffic) and CSV export.

### F. NS-2 Simulation Center & Scripts
- Complete, runnable NS-2 Tcl simulation scripts:
  - `traffic_smart_city_wired.tcl`: 8-intersection wired network with DropTail queues, UDP/CBR telemetry flow, and TCP/FTP signal control flow.
  - `traffic_smart_city_wireless.tcl`: Wireless VANET (Vehicular Ad-Hoc Network) with mobile vehicles, roadside units, IEEE 802.11 MAC, and AODV routing protocol.
- AWK analysis scripts: `throughput.awk`, `packet_loss.awk`, and `delay.awk`.
- Pre-generated sample trace file (`traffic_sim.tr`) and NAM animation file (`traffic_sim.nam`).
- In-browser Trace File Analyzer that parses `.tr` files and extracts AWK metrics directly in the web UI.

---

## 2. Technology Stack

- **Frontend:** HTML5, CSS3 (Vanilla CSS, custom design system), JavaScript (Vanilla ES6+).
- **Backend:** Java (JDK 17/21/25) with zero external dependencies (built with native `com.sun.net.httpserver.HttpServer`), Maven build setup (`pom.xml`).
- **Simulation:** NS-2 (Network Simulator 2 v2.35), NAM (Network Animator), AWK text processing.

---

## 3. Project Directory Structure

```
traffic/
├── backend/
│   ├── pom.xml                                      # Maven build configuration
│   ├── run-backend.bat                              # Batch script to launch Java backend
│   └── src/main/java/com/smartcity/traffic/
│       ├── TrafficServer.java                       # Main HTTP Server & REST API Controller
│       ├── NetworkTopology.java                     # 8-node Smart City network model
│       ├── DijkstraAlgorithm.java                   # Dijkstra shortest path engine & trace
│       ├── DistanceVectorRouting.java               # Bellman-Ford routing table generator
│       ├── LeakyBucketSimulator.java                # Leaky Bucket traffic shaper engine
│       ├── CongestionSimulator.java                 # Congestion & CNIP formula calculator
│       └── Ns2ScriptGenerator.java                  # NS-2 Tcl and AWK script generator
├── frontend/
│   ├── index.html                                   # Main dashboard application UI
│   ├── css/
│   │   └── style.css                                # Design system & glassmorphism styling
│   └── js/
│       ├── app.js                                   # Application orchestrator
│       ├── network-canvas.js                        # HTML5 Canvas network visualizer
│       ├── dijkstra.js                              # Dijkstra module & trace tables
│       ├── distance-vector.js                       # Distance Vector Routing module
│       ├── leaky-bucket.js                          # Leaky bucket visualizer & chart
│       ├── congestion.js                            # Congestion simulation & CSV export
│       ├── charts.js                                # Zero-dependency Canvas chart engine
│       └── ns2-module.js                            # NS-2 script viewer & trace analyzer
├── ns2-simulation/
│   ├── traffic_smart_city_wired.tcl                 # Wired 8-node NS-2 simulation script
│   ├── traffic_smart_city_wireless.tcl              # Wireless VANET / AODV NS-2 script
│   ├── scripts/
│   │   ├── throughput.awk                           # AWK throughput calculator
│   │   ├── packet_loss.awk                          # AWK loss rate & PDR calculator
│   │   └── delay.awk                                # AWK end-to-end delay calculator
│   ├── sample_output/
│   │   ├── traffic_sim.tr                           # Sample generated trace file
│   │   └── traffic_sim.nam                          # Sample Network Animator trace file
│   └── NS2_INSTALLATION_AND_EXECUTION_GUIDE.md      # Step-by-step NS-2 install & run guide
├── documentation/
│   ├── PROJECT_REPORT.md                            # Complete formal BTech project report
│   ├── SYSTEM_ARCHITECTURE.md                       # Architecture & protocol mapping
│   ├── CNIP_ALGORITHMS_EXPLANATION.md               # Detailed theoretical explanations
│   ├── TEST_CASES_AND_RESULTS.md                    # Verification test suite & outputs
│   └── VIVA_QUESTIONS_AND_ANSWERS.md                # Top 15 viva voce questions with answers
├── run.bat                                          # One-click Windows runner
└── README.md                                        # Project overview and instructions
```

---

## 4. Default Login Credentials

| Role | Username | Password | Access Level |
|---|---|---|---|
| **Administrator / Controller** | `admin` | `admin123` | Full Traffic Network Control |
| **Student / Evaluator** | `student` | `password123` | Standard Evaluation Mode |
| **Field Operator** | `operator` | `traffic2026` | Live Telemetry & Shaper |

*(The login page also includes a **"⚡ Quick Fill"** button for instant one-click login).*

---

## 5. How to Run the Project

### Option A: One-Click Quickstart (Windows)
Double-click [`run.bat`](file:///c:/Users/Lenovo/Desktop/traffic/run.bat) in the project root.
- It automatically compiles the Java backend with `javac`.
- Starts the REST API server on `http://localhost:8085/`.
- Opens `http://localhost:8085/login.html` in your default browser.

### Option B: Running with Maven
```bash
cd backend
mvn compile exec:java
```
Then open `http://localhost:8085/login.html` in your web browser.

### Option C: Standalone Client Mode (Offline / Direct File)
If Java is not available on a lab computer, open `frontend/login.html` directly in any modern browser (Chrome, Edge, Firefox). The frontend will automatically authenticate with built-in credentials and run all algorithms locally.

---

## 5. How to Run the NS-2 Simulation

On Ubuntu Linux or Windows 11 with WSL 2:
```bash
# Navigate to simulation folder
cd ns2-simulation

# 1. Run the wired smart city simulation
ns traffic_smart_city_wired.tcl

# 2. View animated packet playback in NAM
nam sample_output/traffic_sim.nam &

# 3. Analyze throughput, loss, and latency using AWK
awk -f scripts/throughput.awk sample_output/traffic_sim.tr
awk -f scripts/packet_loss.awk sample_output/traffic_sim.tr
awk -f scripts/delay.awk sample_output/traffic_sim.tr
```

---

## 6. College Viva Demonstration Script

1. **Topology Overview:** Show the live Canvas network with 8 intersections, vehicle counts, and traffic signal cycles.
2. **Dijkstra SPF:** Select Source `Junction A` and Destination `Junction H`. Click "Compute Shortest Route". Point out the highlighted glowing path on the canvas, the total distance (10 km), and the step-by-step trace table.
3. **Distance Vector Routing:** Navigate to the DVR tab. Show the routing tables. Change the cost of link `J_A - J_F` from 3 to 15, click "Apply Link Change", and show how the tables adaptively converge in Round 2.
4. **Leaky Bucket:** Navigate to the Leaky Bucket tab. Click "Send Bursty Traffic". Point out the physical bucket filling, the overflow warning for excess packets, and the smooth constant-rate output chart.
5. **Congestion Simulation:** Select "High Traffic", click "Start Run". Point out how the queue buffer fills up, packet loss rate climbs to ~17%, and throughput reaches channel capacity.
6. **NS-2 Simulation:** Show the Tcl script, the AWK formulas, and click "Evaluate Pre-generated Sample Trace" in the trace analyzer to show parsed NS-2 metrics.
