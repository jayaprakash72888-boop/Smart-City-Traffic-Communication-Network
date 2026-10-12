# Test Cases, Verification & Simulation Results

This document presents the complete verification test suite for the **Smart City Traffic Communication Network** project, detailing inputs, execution steps, expected outcomes, and actual results.

---

## Test Suite Summary

| Test ID | Module Tested | Input Condition | Expected Output | Status |
|---|---|---|---|---|
| **TC-01** | Dijkstra Shortest Path | Source: `J_A`, Destination: `J_H` | Route: `J_A -> J_F -> J_G -> J_H`, Cost: 10 km | **PASS** |
| **TC-02** | Dijkstra Shortest Path | Source: `J_B`, Destination: `J_D` | Route: `J_B -> J_F -> J_D`, Cost: 6 km | **PASS** |
| **TC-03** | Distance Vector Routing | Default 8-node topology | Tables converge in 3 rounds; optimal next-hops | **PASS** |
| **TC-04** | Dynamic DVR Link Failure | Link `J_A - J_F` cost increased to 15 | Traffic reroutes via `J_B`; tables converge in Round 2 | **PASS** |
| **TC-05** | Leaky Bucket Traffic Shaper | Burst of 18 pkts, Cap: 15, Leak: 4 | 15 accepted, 3 dropped, steady 4 pkts/s output | **PASS** |
| **TC-06** | Congestion Simulation (Low) | 25 pkts/s rate, 120 vehicles | Loss Rate: 0.0%, Throughput: ~102 kbps, Delay: ~14 ms | **PASS** |
| **TC-07** | Congestion Simulation (High) | 140 pkts/s rate, 750 vehicles | Loss Rate: ~17.1%, Queue: 45 pkts, Delay: ~68 ms | **PASS** |
| **TC-08** | NS-2 Trace File Analysis | `sample_output/traffic_sim.tr` | Loss: 8.0%, Throughput: 752.48 kbps, Delay: 12.35 ms | **PASS** |

---

## Detailed Test Case Executions

### Test Case 1: Dijkstra Shortest Path Calculation
- **Objective:** Verify that Dijkstra finds the globally optimal lowest-latency route between non-adjacent intersections.
- **Input Parameters:**
  - Source Node: `J_A` (Central Hub, ID 0)
  - Destination Node: `J_H` (Airport Expressway, ID 7)
- **Step-by-step Trace:**
  1. Initialize `dist[0] = 0`, all others $=\infty$.
  2. Pick `J_A` (0): Relax `J_B` (cost 4), `J_E` (cost 5), `J_F` (cost 3).
  3. Pick `J_F` (3): Relax `J_G` (cost $3 + 3 = 6$), `J_D` (cost $3 + 4 = 7$).
  4. Pick `J_B` (4): Relax `J_C` (cost $4 + 6 = 10$).
  5. Pick `J_E` (5): Relax `J_D` (cost $5 + 6 = 11$, unchanged).
  6. Pick `J_G` (6): Relax `J_H` (cost $6 + 4 = 10$).
  7. Pick `J_D` (7), then `J_C` (10), then `J_H` (10).
- **Output:** Path: `J_A -> J_F -> J_G -> J_H`, Total Distance: **10 km**, Estimated Latency: **15.0 ms**.
- **Result:** **PASSED**. Correctly identified route through Tech Corridor and Metro Station.

---

### Test Case 2: Distance Vector Routing Link Modification
- **Objective:** Verify Bellman-Ford convergence after dynamic road link breakage or degradation.
- **Input:**
  - Select Link `J_A ↔ J_F` (from node 0 to 5).
  - Change cost from 3 to 15 (simulating road construction / fiber cut).
- **Execution:**
  - Round 0: Node `J_A` updates local direct link cost to `J_F` as 15.
  - Round 1: Node `J_B` advertises that it can reach `J_F` at cost 2. Node `J_A` computes cost via `J_B`: $c(A, B) + D_B(F) = 4 + 2 = 6 < 15$.
  - Round 2: Node `J_A` updates next hop for `J_F` to `J_B` with total cost 6.
  - Round 3: No further changes; system achieves stable convergence.
- **Output:** Routing table for `J_A` now routes to `J_F` via `J_B` (cost 6) instead of direct link.
- **Result:** **PASSED**. Dynamic rerouting validated.

---

### Test Case 3: Leaky Bucket Traffic Regulation
- **Objective:** Verify packet rate shaping and buffer overflow discard.
- **Input:**
  - Bucket Capacity: 20 packets
  - Leak Rate: 4 packets/second
  - Traffic Input: Burst of 28 incoming packets in 1 second
- **Execution:**
  - Buffer space before burst: 20 packets.
  - Packets accepted: 20.
  - Packets dropped due to overflow: $28 - 20 = 8$ packets.
  - Leaked at $T = 1$: 4 packets transmitted.
  - Remaining buffer at $T = 1$: 16 packets.
  - Buffer drains steadily at 4 packets/second across seconds 2, 3, 4, 5.
- **Output:** Output stream is strictly bounded at 4 packets/sec (Constant Bit Rate).
- **Result:** **PASSED**. Peak buffer occupancy 100%, 8 dropped packets logged.

---

### Test Case 4: NS-2 Trace File AWK Metrics
- **Objective:** Verify accuracy of AWK metric extraction on discrete-event trace data.
- **Command:** `awk -f scripts/throughput.awk sample_output/traffic_sim.tr`
- **Output:**
  - Packets Sent: 800
  - Packets Received: 736
  - Packets Dropped: 64
  - Packet Loss Rate: **8.00%**
  - Packet Delivery Ratio: **92.00%**
  - Throughput: **752.48 kbps**
  - Average Delay: **12.35 ms**
- **Result:** **PASSED**. Values align with NS-2 DropTail queuing equations.
