# CNIP Viva Voce Preparation Guide & Top 15 Questions

This guide prepares students for oral project examinations (Viva Voce) for the **Smart City Traffic Communication Network** Computer Networks & Internet Protocols (CNIP) project.

---

### Q1: What is the main objective of this project?
**Answer:** The objective is to design, model, and simulate an intelligent communication network connecting 8 smart traffic signal intersections. It demonstrates:
1. Finding the lowest-latency communication routes for traffic signals using **Dijkstra's Algorithm**.
2. Distributed routing table exchange and link failure recovery using **Distance Vector Routing (Bellman-Ford)**.
3. Preventing buffer overflow from bursty vehicular telemetry using **Leaky Bucket Traffic Shaping**.
4. Analyzing real-time network performance metrics (Packet Loss Rate, Throughput, PDR, Delay) under varying vehicular loads.
5. Evaluating discrete-event network behavior using **NS-2 (Network Simulator 2)** with Tcl and AWK.

---

### Q2: Why is Dijkstra's algorithm preferred over Bellman-Ford for centralized SDN controllers, and vice versa?
**Answer:**
- **Dijkstra's algorithm** is a Link-State algorithm with $O((V+E)\log V)$ complexity. It requires complete global network topology knowledge, making it ideal for centralized Traffic Management Centers or Software-Defined Networking (SDN) controllers.
- **Bellman-Ford (Distance Vector)** is decentralized. Each intersection only needs to communicate with direct physical neighbors, making it fault-tolerant if the central server disconnects.

---

### Q3: What is the Bellman-Ford equation used in Distance Vector Routing?
**Answer:**
$$D_x(y) = \min_{v \in N(x)} \{ c(x, v) + D_v(y) \}$$
It states that node $x$'s minimum cost to reach destination $y$ is the minimum over all neighbors $v$ of the cost to reach neighbor $v$ plus neighbor $v$'s advertised cost to reach destination $y$.

---

### Q4: What is the "Count-to-Infinity" problem in Distance Vector Routing and how is it addressed?
**Answer:**
When a link breaks, neighboring nodes can create a routing loop where each node increments the metric by 1 during each vector exchange until reaching infinity.
Mitigations include:
1. **Split Horizon:** Do not advertise routes back to the neighbor they were learned from.
2. **Poison Reverse:** Advertise unreachable routes back to the source neighbor with an infinite metric ($\infty = 16$).
3. **Hold-Down Timers:** Wait a predetermined time before accepting new updates for a degraded route.

---

### Q5: How does the Leaky Bucket algorithm differ from the Token Bucket algorithm?
**Answer:**
- **Leaky Bucket:** Regulates traffic into a strictly constant output rate (CBR). It absorbs bursts into a buffer and leaks at a fixed rate; excess packets are dropped. It does not allow bursts through.
- **Token Bucket:** Collects tokens at a fixed rate. When a burst arrives, if enough tokens are accumulated, the burst can pass through at full line rate. It regulates average rate while permitting bounded bursts.

---

### Q6: What formulas define the key CNIP performance metrics?
**Answer:**
1. **Packet Loss Rate (%):** $(\text{Packets Lost} / \text{Packets Sent}) \times 100$.
2. **Throughput (kbps):** $(\text{Successfully Received Bits}) / (\text{Simulation Duration in Seconds} \times 1000)$.
3. **Packet Delivery Ratio (PDR %):** $(\text{Packets Received} / \text{Packets Sent}) \times 100$.
4. **Average Delay (ms):** $(\sum \text{End-to-End Latency for Received Packets}) / \text{Received Packets count}$.

---

### Q7: Why use both TCP and UDP in this traffic network?
**Answer:**
- **UDP (User Datagram Protocol):** Connectionless, zero-handshake, low overhead. Ideal for high-frequency vehicle telemetry (speed, location) where lost packets are quickly superseded by the next telemetry sample.
- **TCP (Transmission Control Protocol):** Connection-oriented, guarantees delivery through sequence numbers, acknowledgments, and retransmissions. Required for safety-critical traffic signal control commands (e.g., emergency vehicle preemption).

---

### Q8: What does a DropTail queue do when buffer capacity is exceeded?
**Answer:**
DropTail is a simple FIFO queue management policy. When a new packet arrives and the queue buffer is at capacity, the newly arrived packet is dropped immediately from the tail of the queue.

---

### Q9: How is an NS-2 simulation trace file structured?
**Answer:**
A standard NS-2 wired trace file contains 12 fields per event line:
1. Event type (`+` enqueue, `-` dequeue, `r` receive, `d` drop)
2. Time (seconds)
3. Source node ID
4. Destination node ID
5. Packet type (`cbr`, `tcp`, `ack`)
6. Packet size (bytes)
7. Flags
8. Flow ID
9. Source address (IP/port)
10. Destination address (IP/port)
11. Sequence number
12. Unique packet ID

---

### Q10: How do AWK scripts process trace files in NS-2?
**Answer:**
AWK is a pattern-scanning and text-processing language. It reads trace files line-by-line:
- In `throughput.awk`, whenever column `$1 == "r"`, it accumulates the byte size `$6` and tracks the minimum and maximum timestamps `$2`. In the `END` block, it computes $(\text{recvdSize} \times 8) / (\text{duration} \times 1000)$.
- In `packet_loss.awk`, it counts `$1 == "+"` as sent and `$1 == "d"` as dropped, then computes $(\text{dropped} / \text{sent}) \times 100$.

---

### Q11: What is the significance of the 8 nodes in the smart city topology?
**Answer:**
The 8 nodes represent major city intersections with varied traffic characteristics:
- Central Hub (`J_A`), Crossroad (`J_B`), Commercial Gateway (`J_C`), Transit Terminal (`J_D`), Bridge (`J_E`), Tech Corridor (`J_F`), Metro Interchange (`J_G`), and Airport Expressway (`J_H`).
They feature multiple alternate paths so that Dijkstra and Distance Vector algorithms have realistic routing choices.

---

### Q12: What happens during network congestion collapse?
**Answer:**
When vehicle transmission rates exceed link capacities, queues saturate. DropTail discards packets, causing TCP retransmissions that further increase load. Latency spikes and effective throughput decreases significantly even though transmission attempts remain high.

---

### Q13: What is the role of the Java backend server?
**Answer:**
The Java server (`TrafficServer.java`) acts as a centralized traffic management backend providing REST APIs:
- `/api/dijkstra` for shortest-path calculation.
- `/api/distance-vector` and `/api/distance-vector/update-link` for distributed routing matrix calculation.
- `/api/leaky-bucket` for traffic shaping simulation.
- `/api/congestion` for network load evaluation.
- `/api/ns2/script` for dynamic Tcl script generation.

---

### Q14: How does the system handle backend disconnection?
**Answer:**
The web frontend includes a dual-mode fallback engine. If the Java backend is not active, the browser automatically executes the exact same algorithms using client-side JavaScript and displays a status badge: `Client Engine Active (Start Java Backend on :8080)`.

---

### Q15: What is VANET and how is it simulated in this project?
**Answer:**
VANET (Vehicular Ad-Hoc Network) is a wireless communication network where vehicles communicate with one another (V2V) and with roadside infrastructure (V2I). In this project, `traffic_smart_city_wireless.tcl` models VANET using IEEE 802.11 MAC, TwoRayGround radio propagation, and the AODV (Ad hoc On-Demand Distance Vector) ad-hoc routing protocol.

---

### Q16: What is the Autonomous Traffic Control & Routing Agent (Sentinel-Agent)?
**Answer:**
The Sentinel-Agent is an autonomous software supervisor that closes the feedback loop between network telemetry and traffic management:
1. **Dynamic Green Signal Override:** Continuously monitors intersection queues; if an intersection has >12 queued packets, it dispatches green light extensions (+15s to +20s) to clear the backlog.
2. **Dynamic Dijkstra Detour Rerouting:** When a primary corridor (such as Junction A to Junction F) saturates, it recalculates an alternate high-bandwidth arterial path (e.g. A ➔ B ➔ C ➔ H) to bypass the congestion choke point.
3. **Automated Leaky Bucket Shaping:** When downstream buffers reach >75% capacity, it dynamically engages inflow rate limiting at entrance nodes, smoothing bursts into 4 pkts/s and preventing DropTail buffer collapse.

---

### Q17: How is security and access control handled in the dashboard?
**Answer:**
The application features a secure role-based authentication portal (`login.html`) and session guard:
- Authentication is verified against the Java backend via `/api/login` (with credential pairs such as `admin` / `admin123` or `student` / `password123`).
- On successful authentication, a session token and user profile are persisted in web storage.
- A client-side route guard in `index.html` intercepts unauthenticated visitors and redirects them to `login.html`, while allowing signed-in operators to view telemetry and sign out safely.

