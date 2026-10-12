# ==============================================================================
# Project: Smart City Traffic Communication Network
# Course: Computer Networks and Internet Protocols (CNIP)
# Simulation: Wired Traffic Signal Controller Grid Simulation in NS-2
# File: traffic_smart_city_wired.tcl
# ==============================================================================
# Description:
# Simulates an 8-intersection smart city traffic network.
# Nodes represent Smart Traffic Junctions (A to H) interconnected via high-speed
# fiber and dedicated DSRC/Ethernet links.
# - Flow 1 (UDP/CBR): High-volume vehicle telemetry data from Junction A to Junction H.
# - Flow 2 (TCP/FTP): Reliable traffic signal synchronization commands from Junction B to Junction G.
# Demonstrates queue buildup (DropTail), buffer overflow, and packet drop.
# ==============================================================================

# 1. Initialize Simulator
set ns [new Simulator]

# 2. Define Colors for NAM Packet Visualization
$ns color 1 Navy        ;# CBR Telemetry (Blue)
$ns color 2 Red         ;# TCP Control Signal (Red)
$ns color 3 DarkGreen   ;# ACKs

# 3. Open Trace and NAM Animation Files
set tracefile [open "sample_output/traffic_sim.tr" w]
$ns trace-all $tracefile

set namfile [open "sample_output/traffic_sim.nam" w]
$ns namtrace-all $namfile

# 4. Procedure to Finish the Simulation
proc finish {} {
    global ns tracefile namfile
    $ns flush-trace
    close $tracefile
    close $namfile
    puts "=========================================================="
    puts "  [+] NS-2 Simulation Completed Successfully!"
    puts "  [+] Trace File generated: sample_output/traffic_sim.tr"
    puts "  [+] NAM File generated:   sample_output/traffic_sim.nam"
    puts "=========================================================="
    puts "Run the following commands to analyze metrics:"
    puts "  awk -f scripts/throughput.awk sample_output/traffic_sim.tr"
    puts "  awk -f scripts/packet_loss.awk sample_output/traffic_sim.tr"
    puts "  awk -f scripts/delay.awk sample_output/traffic_sim.tr"
    puts "  nam sample_output/traffic_sim.nam &"
    puts "=========================================================="
    exit 0
}

# 5. Define 8 Smart City Intersection Nodes
# n0: Junction A (Central Hub)
# n1: Junction B (North Cross)
# n2: Junction C (East Gateway)
# n3: Junction D (South Terminal)
# n4: Junction E (West Bridge)
# n5: Junction F (Tech Corridor)
# n6: Junction G (Metro Station)
# n7: Junction H (Airport Expressway)

for {set i 0} {$i < 8} {incr i} {
    set n($i) [$ns node]
}

$n(0) label "Junction_A (Central Hub)"
$n(1) label "Junction_B (North Cross)"
$n(2) label "Junction_C (East Gateway)"
$n(3) label "Junction_D (South Terminal)"
$n(4) label "Junction_E (West Bridge)"
$n(5) label "Junction_F (Tech Corridor)"
$n(6) label "Junction_G (Metro Station)"
$n(7) label "Junction_H (Airport Express)"

# 6. Create Communication Links (Bandwidth, Delay, Queue Mechanism)
# Primary backbone links: 10Mbps, 3-5ms latency
# Feeder/Bridge links: 5Mbps, 7-9ms latency
$ns duplex-link $n(0) $n(1) 10Mb 5ms DropTail
$ns duplex-link $n(0) $n(4) 5Mb  8ms DropTail
$ns duplex-link $n(0) $n(5) 10Mb 4ms DropTail
$ns duplex-link $n(1) $n(2) 10Mb 6ms DropTail
$ns duplex-link $n(1) $n(5) 10Mb 3ms DropTail
$ns duplex-link $n(2) $n(6) 5Mb  7ms DropTail
$ns duplex-link $n(2) $n(7) 10Mb 5ms DropTail
$ns duplex-link $n(3) $n(4) 5Mb  9ms DropTail
$ns duplex-link $n(3) $n(5) 10Mb 5ms DropTail
$ns duplex-link $n(3) $n(6) 10Mb 4ms DropTail
$ns duplex-link $n(5) $n(6) 10Mb 3ms DropTail
$ns duplex-link $n(6) $n(7) 10Mb 4ms DropTail

# 7. Configure DropTail Queue Buffer Limits (Induces realistic congestion)
$ns queue-limit $n(0) $n(5) 20
$ns queue-limit $n(5) $n(6) 20
$ns queue-limit $n(6) $n(7) 20

# 8. Setup Traffic Source 1: Vehicle Telemetry Stream (UDP + CBR)
# Source: Junction A (n0) -> Destination: Airport Expressway (n7)
set udp0 [new Agent/UDP]
$udp0 set fid_ 1
$ns attach-agent $n(0) $udp0

set null0 [new Agent/Null]
$ns attach-agent $n(7) $null0
$ns connect $udp0 $null0

set cbr0 [new Application/Traffic/CBR]
$cbr0 set packetSize_ 512
$cbr0 set interval_ 0.005; # 200 packets/sec transmission rate
$cbr0 set random_ 1
$cbr0 attach-agent $udp0

# 9. Setup Traffic Source 2: Priority Signal Control Stream (TCP + FTP)
# Source: Junction B (n1) -> Destination: Metro Station (n6)
set tcp0 [new Agent/TCP]
$tcp0 set fid_ 2
$tcp0 set window_ 32
$ns attach-agent $n(1) $tcp0

set sink0 [new Agent/TCPSink]
$ns attach-agent $n(6) $sink0
$ns connect $tcp0 $sink0

set ftp0 [new Application/FTP]
$ftp0 attach-agent $tcp0

# 10. Simulation Timetable
$ns at 0.5 "$cbr0 start"
$ns at 1.0 "$ftp0 start"
$ns at 4.0 "$ftp0 stop"
$ns at 4.5 "$cbr0 stop"
$ns at 5.0 "finish"

# 11. Run Simulation
$ns run
