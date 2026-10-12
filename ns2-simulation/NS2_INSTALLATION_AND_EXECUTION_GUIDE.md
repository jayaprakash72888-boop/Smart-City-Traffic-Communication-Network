# NS-2 (Network Simulator 2) Complete Installation & Execution Guide

## 1. Overview
**Network Simulator 2 (NS-2)** is an open-source, discrete-event network simulator widely utilized in academia and industry to evaluate computer networks, routing protocols, and traffic congestion control algorithms.

In this project (**Smart City Traffic Communication Network**), NS-2 is used to model:
- 8 Smart City Intersection Traffic Signal Nodes (`Junction_A` to `Junction_H`).
- High-rate Vehicle-to-Infrastructure (V2I) telemetry using **UDP / CBR**.
- Mission-critical Traffic Signal Synchronization using **TCP / FTP**.
- Queuing buffers (DropTail) and packet drop under high vehicle density.

---

## 2. Installation Instructions

### Option A: Installing on Ubuntu / Debian Linux
Run the following commands in terminal:
```bash
# Update package repositories
sudo apt-get update

# Install NS-2 and NAM (Network Animator)
sudo apt-get install -y ns2 nam

# Install Tcl/Tk development libraries
sudo apt-get install -y tcl tk tcl-dev tk-dev gawk

# Verify installation
ns -version
```

### Option B: Installing on Windows 11 using WSL 2 (Recommended for Windows)
Windows 11 supports native Linux through WSL 2:
1. Open PowerShell as Administrator and run:
   ```powershell
   wsl --install -d Ubuntu
   ```
2. Restart your computer if prompted, then launch **Ubuntu** from the Start Menu.
3. In the Ubuntu shell, install NS-2:
   ```bash
   sudo apt update && sudo apt install -y ns2 nam gawk x11-apps
   ```
4. Navigate to your project directory inside WSL:
   ```bash
   cd /mnt/c/Users/Lenovo/Desktop/traffic/ns2-simulation
   ```

### Option C: Standalone Building from Source (ns-allinone-2.35)
```bash
wget https://sourceforge.net/projects/nsnam/files/allinone/ns-allinone-2.35/ns-allinone-2.35.tar.gz
tar -zxvf ns-allinone-2.35.tar.gz
cd ns-allinone-2.35
./install
```

---

## 3. How to Execute the Simulation

Navigate to the `ns2-simulation` folder:
```bash
cd ns2-simulation
```

### Step 1: Run the Wired Smart City Traffic Simulation
```bash
ns traffic_smart_city_wired.tcl
```
**Output:**
```
==========================================================
  [+] NS-2 Simulation Completed Successfully!
  [+] Trace File generated: sample_output/traffic_sim.tr
  [+] NAM File generated:   sample_output/traffic_sim.nam
==========================================================
```

### Step 2: Launch the Network Animator (NAM) GUI
```bash
nam sample_output/traffic_sim.nam
```
*Use the NAM playback controls to watch blue (UDP) and red (TCP) packets moving between smart traffic intersections, filling queues and being forwarded or dropped.*

### Step 3: Run the Wireless VANET Simulation (802.11 / AODV)
```bash
ns traffic_smart_city_wireless.tcl
```

---

## 4. Performance Metrics Analysis using AWK Scripts

Trace files (`.tr`) contain event-by-event network logs. We analyze these logs using specialized AWK scripts located in `scripts/`:

### 1. Calculate Network Throughput (kbps / Mbps)
```bash
awk -f scripts/throughput.awk sample_output/traffic_sim.tr
```
**Expected Output:**
```
========================================================
         NS-2 THROUGHPUT ANALYSIS REPORT                
========================================================
Simulation Start Time   : 0.5000 seconds
Simulation Stop Time    : 4.5062 seconds
Simulation Duration     : 4.0062 seconds
Total Data Received     : 376832 Bytes (368.00 KB)
Network Throughput      : 752.48 kbps (0.7525 Mbps)
========================================================
```

### 2. Calculate Packet Loss Rate and Delivery Ratio (PDR)
```bash
awk -f scripts/packet_loss.awk sample_output/traffic_sim.tr
```
**Expected Output:**
```
========================================================
     NS-2 PACKET LOSS & DELIVERY RATIO (PDR) REPORT     
========================================================
Total Packets Sent      : 800
Total Packets Received  : 736
Total Packets Dropped   : 64
Packet Loss Rate        : 8.00 %
Packet Delivery Ratio   : 92.00 %
========================================================
```

### 3. Calculate Average End-to-End Latency / Delay
```bash
awk -f scripts/delay.awk sample_output/traffic_sim.tr
```
**Expected Output:**
```
========================================================
         NS-2 END-TO-END DELAY ANALYSIS REPORT          
========================================================
Packets Successfully Delivered : 736
Cumulative Transmission Delay  : 9.0896 seconds
Average End-to-End Delay       : 12.35 ms
========================================================
```

---

## 5. Trace File Format Anatomy (For Viva Defense)

Each row in an NS-2 wired trace file has 12 fields:
```
+ 0.500000 0 5 cbr 512 ------- 1 0.0 7.0 0 0
|    |     | |  |    |     |    |  |   |  | |
1    2     3 4  5    6     7    8  9  10 11 12
```

| Field # | Parameter | Description |
|---|---|---|
| **1** | Event Type | `+` (enqueue), `-` (dequeue), `r` (receive), `d` (drop) |
| **2** | Timestamp | Simulation time in seconds |
| **3** | From Node | Source node ID of the link |
| **4** | To Node | Destination node ID of the link |
| **5** | Packet Type | `cbr` (UDP telemetry), `tcp`, `ack` |
| **6** | Packet Size | Size in bytes (e.g. 512 bytes) |
| **7** | Flags | Congestion or priority flags (`-------`) |
| **8** | Flow ID | `1` (Blue telemetry flow), `2` (Red control flow) |
| **9** | Source Address | IP-like addressing format (`0.0` = Node 0, Port 0) |
| **10** | Destination Address | IP-like destination (`7.0` = Node 7, Port 0) |
| **11** | Sequence Number | Packet sequence number |
| **12** | Unique Packet ID | Global unique identifier for the packet |
