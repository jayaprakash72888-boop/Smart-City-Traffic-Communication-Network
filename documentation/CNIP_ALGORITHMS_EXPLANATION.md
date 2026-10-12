# CNIP Core Algorithms & Mathematical Formulations

This document provides in-depth technical and algorithmic explanations of the four foundational computer networking algorithms implemented in the **Smart City Traffic Communication Network** project.

---

## 1. Dijkstra's Shortest Path Algorithm

### Purpose
Calculates the lowest-latency communication route between traffic signal controller intersections to ensure critical priority commands (e.g., green-corridor ambulance requests) reach target intersections with minimal delay.

### Working Principle
Dijkstra's algorithm operates on a weighted graph $G = (V, E)$ with non-negative edge costs $w(u, v) \ge 0$.
1. **Initialization:**
   - Set tentative distance to source $s$: $\text{dist}[s] = 0$.
   - Set tentative distance to all other vertices $v \in V \setminus \{s\}$: $\text{dist}[v] = \infty$.
   - Initialize unvisited set $Q = V$.
2. **Iteration:**
   - Select vertex $u \in Q$ with minimum tentative distance $\text{dist}[u]$.
   - Remove $u$ from unvisited set $Q$.
   - For each neighbor $v$ of $u$ still in $Q$:
     $$\text{newDist} = \text{dist}[u] + w(u, v)$$
     $$\text{If } \text{newDist} < \text{dist}[v], \text{ then } \text{dist}[v] \leftarrow \text{newDist}, \text{ parent}[v] \leftarrow u$$
3. **Termination:** When destination $t$ is removed from $Q$ or $Q$ becomes empty.

### Complexity
- **Time Complexity:** $O(V^2)$ with adjacency matrix representation; $O((V + E)\log V)$ with a binary heap or priority queue.
- **Space Complexity:** $O(V)$ for distance and parent arrays.

---

## 2. Distance Vector Routing (Bellman-Ford Algorithm)

### Purpose
Provides distributed, decentralized route discovery where each smart traffic signal controller communicates exclusively with its direct physical neighbors. Automatically recalculates alternate paths when an arterial link fails.

### Bellman-Ford Equation
Each router node $x$ calculates its estimated distance $D_x(y)$ to destination $y$ via neighboring router $v$:
$$D_x(y) = \min_{v \in N(x)} \{ c(x, v) + D_v(y) \}$$
Where:
- $c(x, v)$ is the physical link cost between node $x$ and neighbor $v$.
- $D_v(y)$ is neighbor $v$'s current cost estimate to reach destination $y$.
- $N(x)$ is the set of direct neighbors of node $x$.

### Routing Table Structure
Each router stores a routing table tuple for every destination in the network:
$$\langle \text{Destination}, \text{Next Hop}, \text{Minimum Cost} \rangle$$

### Count-to-Infinity Problem & Mitigations
In Distance Vector Routing, bad news travels slowly (e.g., link breakages can cause routing loops). Mitigations include:
1. **Split Horizon:** A router never advertises a route back onto the interface from which it learned it.
2. **Poison Reverse:** A router advertises routes learned from a neighbor back to that neighbor with an infinite metric ($\infty = 16$).
3. **Maximum Metric Ceiling:** Sets a hard hop ceiling to break loops early.

---

## 3. Leaky Bucket Algorithm (Traffic Shaping)

### Purpose
Converts bursty vehicle telemetry transmissions (e.g., hundreds of vehicles transmitting simultaneously upon entering an intersection) into a constant bit rate (CBR) stream to protect downstream network routers from buffer exhaustion.

### Mechanics
1. **Bucket Structure:** A finite First-In-First-Out (FIFO) buffer of capacity $C$ packets.
2. **Packet Inflow:** When $k$ packets arrive at time $t$:
   - If current buffer occupancy + $k \le C$: all $k$ packets are enqueued.
   - If current buffer occupancy + $k > C$: the buffer accepts up to $C - \text{occupancy}$, and the excess packets are discarded (**Overflow Drop**).
3. **Constant Leak Outflow:** At every second or clock tick, up to $L$ packets (the leak rate) are dequeued and forwarded onto the physical link.
4. **Result:** Output rate never exceeds $L$ packets/second regardless of input burstiness.

---

## 4. Network Performance Evaluation Metrics

### 1. Packet Loss Rate (%)
$$\text{Packet Loss Rate} = \left(\frac{P_{\text{lost}}}{P_{\text{sent}}}\right) \times 100$$
- Evaluates queue buffer overflow severity. A loss rate $< 2\%$ is acceptable for telemetry; mission-critical control requires $< 0.1\%$.

### 2. Network Throughput
$$\text{Throughput (bps)} = \frac{\text{Successfully Received Data Bits}}{\text{Simulation Duration (seconds)}}$$
$$\text{Throughput (kbps)} = \frac{\text{Throughput (bps)}}{1000}$$

### 3. Packet Delivery Ratio (PDR %)
$$\text{PDR} = \left(\frac{P_{\text{received}}}{P_{\text{sent}}}\right) \times 100 = 100 - \text{Packet Loss Rate}$$

### 4. Average End-to-End Latency
$$\text{Average Delay} = \frac{\sum_{i=1}^{N} (t_{\text{arrival}, i} - t_{\text{transmit}, i})}{N}$$
Composed of four components:
$$\text{Delay}_{\text{total}} = d_{\text{proc}} + d_{\text{queue}} + d_{\text{trans}} + d_{\text{prop}}$$
- **Queuing Delay ($d_{\text{queue}}$):** Dominates during congestion as packets wait in router buffer queues.
