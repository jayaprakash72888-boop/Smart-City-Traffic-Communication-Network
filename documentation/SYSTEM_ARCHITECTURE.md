# System Architecture & Network Design

## 1. Network Topology Specification
The smart city road network comprises **8 Smart Traffic Signal Intersections** interconnected through duplex fiber and 802.11p DSRC wireless communication channels:

| Node ID | Node Code | Node Name | Intersection Type | Coordinate (X, Y) | Default Signal |
|---|---|---|---|---|---|
| **0** | `J_A` | Junction A - Central Hub | Central Metro Core | (150, 150) | GREEN |
| **1** | `J_B` | Junction B - North Cross | High-Density Crossroad | (380, 80) | RED |
| **2** | `J_C` | Junction C - East Gateway | Commercial Business District | (640, 110) | GREEN |
| **3** | `J_D` | Junction D - South Terminal | Transit Port Terminal | (420, 400) | GREEN |
| **4** | `J_E` | Junction E - West Bridge | River Overpass Bridge | (140, 370) | YELLOW |
| **5** | `J_F` | Junction F - Tech Corridor | Smart IT Corridor Junction | (400, 240) | GREEN |
| **6** | `J_G` | Junction G - Metro Station | Subway Transit Interchange | (660, 320) | RED |
| **7** | `J_H` | Junction H - Airport Express | Highway & Airport Access | (880, 220) | GREEN |

---

## 2. Communication Links & Metric Weights

| Link | Endpoints | Cost (km / metric) | Bandwidth | Propagation Delay | Queue Discipline |
|---|---|---|---|---|---|
| **L01** | `J_A` ↔ `J_B` | 4 | 100 Mbps / 10Mb (NS2) | 5 ms | DropTail |
| **L04** | `J_A` ↔ `J_E` | 5 | 54 Mbps / 5Mb (NS2) | 8 ms | DropTail |
| **L05** | `J_A` ↔ `J_F` | 3 | 100 Mbps / 10Mb (NS2) | 4 ms | DropTail |
| **L12** | `J_B` ↔ `J_C` | 6 | 100 Mbps / 10Mb (NS2) | 6 ms | DropTail |
| **L15** | `J_B` ↔ `J_F` | 2 | 100 Mbps / 10Mb (NS2) | 3 ms | DropTail |
| **L26** | `J_C` ↔ `J_G` | 4 | 54 Mbps / 5Mb (NS2) | 7 ms | DropTail |
| **L27** | `J_C` ↔ `J_H` | 5 | 100 Mbps / 10Mb (NS2) | 5 ms | DropTail |
| **L34** | `J_D` ↔ `J_E` | 6 | 54 Mbps / 5Mb (NS2) | 9 ms | DropTail |
| **L35** | `J_D` ↔ `J_F` | 4 | 100 Mbps / 10Mb (NS2) | 5 ms | DropTail |
| **L36** | `J_D` ↔ `J_G` | 3 | 100 Mbps / 10Mb (NS2) | 4 ms | DropTail |
| **L56** | `J_F` ↔ `J_G` | 3 | 100 Mbps / 10Mb (NS2) | 3 ms | DropTail |
| **L67** | `J_G` ↔ `J_H` | 4 | 100 Mbps / 10Mb (NS2) | 4 ms | DropTail |

---

## 3. Protocol Stack Mapping (OSI vs TCP/IP)

```
+-------------------------------------------------------------------------+
| OSI / TCP-IP Layer   | Implementation in This Project                   |
+----------------------+--------------------------------------------------+
| Application Layer    | - Vehicle Telemetry Streaming (CBR Traffic)       |
|                      | - Adaptive Traffic Signal Synchronization (FTP)  |
|                      | - REST API JSON Payloads (Port 8080)             |
+----------------------+--------------------------------------------------+
| Transport Layer      | - UDP (Agent/UDP) for low-overhead sensor feeds  |
|                      | - TCP (Agent/TCP) for reliable signal commands   |
|                      | - DropTail / Leaky Bucket rate limiting           |
+----------------------+--------------------------------------------------+
| Network Layer        | - Dijkstra Shortest Path First (SPF)             |
|                      | - Distance Vector Routing (Bellman-Ford)         |
|                      | - AODV Routing for mobile wireless nodes (VANET) |
+----------------------+--------------------------------------------------+
| Data Link / MAC      | - IEEE 802.3 Ethernet for wired backbone links   |
|                      | - IEEE 802.11 / 802.11p for DSRC vehicle links   |
+----------------------+--------------------------------------------------+
| Physical Layer       | - Fiber Optic & Wireless Radio Propagation       |
+-------------------------------------------------------------------------+
```

---

## 4. End-to-End Execution Flow

```
                      +-----------------------------+
                      |   User / Browser Client     |
                      |   (HTML5, CSS3, JS Engine)  |
                      +-----------------------------+
                                     |
              +----------------------+----------------------+
              |                                             |
   (HTTP POST / GET)                                 (Local Engine)
              v                                             v
+-------------------------------+             +---------------------------+
|    Java Backend Server        |             | In-Browser Fallback Engine|
|  (com.sun.net.httpserver)     |             |  - Client Dijkstra        |
|  - DijkstraAlgorithm.java     |             |  - Client Distance Vector |
|  - DistanceVectorRouting.java |             |  - Client Leaky Bucket    |
|  - LeakyBucketSimulator.java  |             |  - Client Congestion Loop |
|  - CongestionSimulator.java   |             +---------------------------+
+-------------------------------+                           |
              |                                             |
              +----------------------+----------------------+
                                     v
                      +-----------------------------+
                      | NS-2 Simulation Environment |
                      | - traffic_smart_city.tcl    |
                      | - sample_output/traffic.tr  |
                      | - scripts/throughput.awk    |
                      | - scripts/packet_loss.awk   |
                      | - scripts/delay.awk         |
                      +-----------------------------+
```
