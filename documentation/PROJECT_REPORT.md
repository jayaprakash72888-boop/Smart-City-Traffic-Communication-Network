# Project Report: Smart City Traffic Communication Network

**Course:** Computer Networks and Internet Protocols (CNIP)  
**Degree:** Bachelor of Technology (B.Tech) in Computer Science & Engineering  
**Project Title:** Smart City Traffic Communication Network  

---

## 1. Abstract
Urban congestion and vehicular density pose critical challenges to metropolitan transportation systems. This project presents the design, algorithmic modeling, and performance evaluation of a **Smart City Traffic Communication Network**. The system interconnects 8 smart traffic signal intersections (`Junction_A` through `Junction_H`) to optimize vehicle routing, regulate telemetry packet bursts, mitigate communication bottlenecks, and evaluate end-to-end network performance.

The project integrates core Computer Networks and Internet Protocols (CNIP) concepts:
1. **Dijkstra's Shortest Path Algorithm** for latency-optimal packet forwarding between traffic signal controllers.
2. **Distance Vector Routing (Bellman-Ford Algorithm)** for distributed routing table exchange and link-state adaptation.
3. **Leaky Bucket Traffic Shaping** for buffering and regulating bursty Vehicle-to-Infrastructure (V2I) telemetry into smooth Constant Bit Rate (CBR) transmissions.
4. **Network Congestion and Queue Modeling** under varying vehicular loads (Low, Medium, High, Extreme).
5. **Discrete-Event Simulation in NS-2 (Network Simulator 2)** with Tcl simulation scripts, NAM animation, and AWK performance analyzers.

---

## 2. Problem Statement
In modern smart cities, thousands of vehicles broadcast high-frequency telemetry (speed, GPS coordinates, collision warnings) to roadside units (RSUs) and traffic signal controllers. When multiple intersections experience heavy vehicular flow simultaneously:
- Backbone communication links become saturated.
- Buffer queues overflow, leading to severe packet loss.
- Outdated routing tables route critical emergency signals along congested links.
- High latency delays adaptive signal timing changes.

There is a need for an integrated network architecture that provides:
- Dynamic shortest-path calculation.
- Distributed routing table convergence upon road link failures.
- Rate-limiting traffic shaping to prevent buffer exhaustion.
- Real-time quantitative evaluation of Packet Loss Rate, Throughput, Packet Delivery Ratio (PDR), and End-to-End Latency.

---

## 3. Technology Stack & Architecture

### A. Frontend Architecture
- **HTML5 & CSS3:** Modern dark navy aesthetic, glassmorphism cards, responsive layouts.
- **JavaScript (Vanilla ES6+):** Modular client-side engines for interactive network graph rendering, step-by-step algorithm tracing, and zero-dependency Canvas charts.

### B. Backend Architecture
- **Java (JDK 17/21/25):** Self-contained, zero-dependency REST API server using `com.sun.net.httpserver.HttpServer`.
- **Maven (`pom.xml`):** Project build management and dependency lifecycle.

### C. Network Simulation Engine
- **NS-2 (Network Simulator 2 v2.35):**
  - Tcl scripts: `traffic_smart_city_wired.tcl` (wired grid) and `traffic_smart_city_wireless.tcl` (VANET / 802.11 / AODV).
  - Network Animator (NAM) for packet flow visualization.
  - AWK scripts: `throughput.awk`, `packet_loss.awk`, `delay.awk`.

---

## 4. Algorithmic Formulations

### A. Dijkstra's Shortest Path Algorithm
Dijkstra's algorithm computes the shortest path tree from source node $s$ to all other nodes $v \in V$:
$$\text{dist}[v] = \min(\text{dist}[v], \text{dist}[u] + \text{cost}(u, v))$$
- **Time Complexity:** $O(V^2)$ with adjacency matrix; $O((V + E) \log V)$ with min-priority queue.
- **Space Complexity:** $O(V)$.

### B. Distance Vector Routing (Bellman-Ford)
Each node $x$ calculates its minimum distance to destination $y$ via neighbor $v$:
$$D_x(y) = \min_{v \in \text{neighbors}(x)} \{ c(x, v) + D_v(y) \}$$
- **Convergence:** Nodes iteratively exchange vectors until no distances change.

### C. Leaky Bucket Traffic Shaper
Given bucket capacity $C$ and constant leak rate $L$:
At time step $t$ with incoming packets $I_t$:
$$\text{FreeSpace}_t = C - \text{Level}_{t-1}$$
$$\text{Accepted}_t = \min(I_t, \text{FreeSpace}_t)$$
$$\text{Dropped}_t = I_t - \text{Accepted}_t$$
$$\text{Transmitted}_t = \min(\text{Level}_{t-1} + \text{Accepted}_t, L)$$
$$\text{Level}_t = \text{Level}_{t-1} + \text{Accepted}_t - \text{Transmitted}_t$$

### D. CNIP Performance Metrics
1. **Packet Loss Rate (%):**
   $$\text{Loss Rate} = \left(\frac{\text{Packets Lost}}{\text{Packets Sent}}\right) \times 100$$
2. **Throughput (kbps):**
   $$\text{Throughput} = \frac{\text{Total Received Bits}}{\text{Simulation Duration (seconds)} \times 1000}$$
3. **Packet Delivery Ratio (PDR %):**
   $$\text{PDR} = \left(\frac{\text{Packets Received}}{\text{Packets Sent}}\right) \times 100$$
4. **Average Delay (ms):**
   $$\text{Avg Delay} = \frac{\sum_{i=1}^{N} (t_{\text{recv}, i} - t_{\text{send}, i})}{N} \times 1000$$

### E. Autonomous Traffic Control & Routing Agent (Sentinel-Agent)
The system integrates an autonomous closed-loop control agent that continuously monitors network layer telemetry:
1. **Dynamic Green Signal Override:** Detects queue buildup exceeding threshold (e.g. >12 packets) and dispatches green signal extensions (+15s to +20s) to flush intersection queues.
2. **Dynamic Dijkstra Detour Rerouting:** Automatically recalculates low-latency bypass paths when bottleneck links saturate, diverting telemetry away from congested choke points.
3. **Automated Traffic Shaping (Leaky Bucket):** Throttles upstream bursty inflows when downstream buffer occupancies exceed 75%, eliminating DropTail buffer overflows.

---

## 5. Experimental Results & Performance Analysis

| Traffic Condition | Vehicle Count | Generation Rate (pkts/s) | Packets Sent | Packets Received | Packets Dropped | Loss Rate (%) | PDR (%) | Throughput (kbps) | Avg Delay (ms) | Congestion Status |
|---|---|---|---|---|---|---|---|---|---|---|
| **Low** | 120 | 25 | 375 | 375 | 0 | 0.00% | 100.0% | 102.4 kbps | 14.2 ms | Optimal |
| **Medium** | 380 | 75 | 1,125 | 1,118 | 7 | 0.62% | 99.38% | 305.2 kbps | 22.8 ms | Moderate |
| **High (No Agent)** | 750 | 140 | 2,100 | 1,740 | 360 | 17.14% | 82.86% | 475.0 kbps | 68.4 ms | Congested |
| **High (With Agent)** | 750 | 140 | 2,100 | 2,058 | 42 | 2.00% | 98.00% | 512.4 kbps | 24.1 ms | Mitigated |
| **Extreme** | 1,400 | 260 | 3,900 | 1,800 | 2,100 | 53.85% | 46.15% | 491.5 kbps | 142.6 ms | Critical Collapse |

### Key Observations:
1. **Under Low & Medium Traffic:** The network operates in the linear throughput regime. Buffers rarely exceed 30% capacity, resulting in near-zero packet drop and low latency.
2. **Under High Traffic Without Agent:** Channel capacity at bottleneck junctions (`Junction_F`) is exceeded. The buffer fills up, initiating DropTail packet discards (17.14% loss).
3. **Under High Traffic With Sentinel-Agent:** Autonomous rerouting via Dijkstra arterial bypass and Leaky Bucket inflow shaping drops packet loss from 17.14% down to 2.00%, while reducing latency from 68.4 ms to 24.1 ms.
4. **Under Extreme Traffic:** Without global flow control, congestion collapse occurs. Throughput plateaus at channel saturation (~491 kbps) while packet loss spikes to >50% and queuing delay surges.

---

## 6. Conclusion
The **Smart City Traffic Communication Network** successfully models real-world computer network dynamics. The implementation demonstrates:
- How shortest-path routing minimizes communication latency for emergency traffic signaling.
- How distributed distance vector routing adapts to physical link failures.
- How leaky bucket rate limiting protects downstream infrastructure against vehicular packet storms.
- How an autonomous Sentinel-Agent provides proactive closed-loop congestion mitigation.
- How NS-2 simulation enables rigorous discrete-event protocol evaluation.
