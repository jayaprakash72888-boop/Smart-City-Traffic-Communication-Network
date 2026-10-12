# ==============================================================================
# Project: Smart City Traffic Communication Network
# Course: Computer Networks and Internet Protocols (CNIP)
# Simulation: Wireless VANET (Vehicular Ad-Hoc Network) Simulation in NS-2
# File: traffic_smart_city_wireless.tcl
# ==============================================================================
# Description:
# Simulates mobile vehicles communicating with Road-Side Infrastructure Units (RSUs).
# Uses IEEE 802.11 MAC, TwoRayGround Radio Propagation, and AODV Routing Protocol.
# ==============================================================================

# Simulation Parameters
set val(chan)       Channel/WirelessChannel
set val(prop)       Propagation/TwoRayGround
set val(netif)      Phy/WirelessPhy
set val(mac)        Mac/802_11
set val(ifq)        Queue/DropTail/PriQueue
set val(ll)         LL
set val(ant)        Antenna/OmniAntenna
set val(ifqlen)     50
set val(nn)         6               ;# 6 wireless mobile nodes (vehicles + RSUs)
set val(rp)         AODV            ;# Routing Protocol: Ad hoc On-Demand Distance Vector
set val(x)          1000            ;# Topography Width
set val(y)          800             ;# Topography Height
set val(stop)       10.0            ;# Simulation duration

# 1. Initialize Simulator
set ns [new Simulator]

# 2. Setup Trace and NAM Files
set tracefile [open "sample_output/wireless_traffic.tr" w]
$ns trace-all $tracefile

set namfile [open "sample_output/wireless_traffic.nam" w]
$ns namtrace-all-wireless $namfile $val(x) $val(y)

# 3. Create Topography
set topo [new Topography]
$topo load_flatgrid $val(x) $val(y)

# 4. Create General Operations Director (GOD)
create-god $val(nn)

# 5. Configure Node Architecture
$ns node-config -adhocRouting $val(rp) \
                -llType $val(ll) \
                -macType $val(mac) \
                -ifqType $val(ifq) \
                -ifqLen $val(ifqlen) \
                -antType $val(ant) \
                -propType $val(prop) \
                -phyType $val(netif) \
                -channelType $val(chan) \
                -topoInstance $topo \
                -agentTrace ON \
                -routerTrace ON \
                -macTrace ON \
                -movementTrace ON

# 6. Instantiate 6 Wireless Nodes
# Nodes 0, 1: Road-Side Infrastructure Units (RSUs at Intersections)
# Nodes 2, 3, 4, 5: Mobile Smart Vehicles
for {set i 0} {$i < $val(nn)} {incr i} {
    set node_($i) [$ns node]
    $node_($i) random-motion 0       ;# Disable random motion
}

# Initial Positions
# RSU 1 (Stationary)
$node_(0) set X_ 200.0
$node_(0) set Y_ 400.0
$node_(0) set Z_ 0.0

# RSU 2 (Stationary)
$node_(1) set X_ 700.0
$node_(1) set Y_ 400.0
$node_(1) set Z_ 0.0

# Vehicle 1 (Moving Eastward)
$node_(2) set X_ 100.0
$node_(2) set Y_ 400.0
$node_(2) set Z_ 0.0
$ns at 1.0 "$node_(2) setdest 800.0 400.0 25.0"

# Vehicle 2 (Moving Westward)
$node_(3) set X_ 800.0
$node_(3) set Y_ 420.0
$node_(3) set Z_ 0.0
$ns at 1.5 "$node_(3) setdest 100.0 420.0 20.0"

# Vehicle 3 & 4
$node_(4) set X_ 300.0
$node_(4) set Y_ 350.0
$node_(4) set Z_ 0.0

$node_(5) set X_ 600.0
$node_(5) set Y_ 450.0
$node_(5) set Z_ 0.0

# 7. Setup V2I Traffic Stream (Vehicle 2 -> RSU 0)
set udp0 [new Agent/UDP]
$ns attach-agent $node_(2) $udp0

set null0 [new Agent/Null]
$ns attach-agent $node_(0) $null0
$ns connect $udp0 $null0

set cbr0 [new Application/Traffic/CBR]
$cbr0 set packetSize_ 256
$cbr0 set interval_ 0.02
$cbr0 attach-agent $udp0

$ns at 2.0 "$cbr0 start"
$ns at 8.0 "$cbr0 stop"

# 8. Finish Procedure
proc finish {} {
    global ns tracefile namfile
    $ns flush-trace
    close $tracefile
    close $namfile
    puts "=========================================================="
    puts "  [+] Wireless VANET NS-2 Simulation Finished!"
    puts "  [+] Output trace: sample_output/wireless_traffic.tr"
    puts "=========================================================="
    exit 0
}

# 9. Schedule End
for {set i 0} {$i < $val(nn)} {incr i} {
    $ns at $val(stop) "$node_($i) reset"
}
$ns at $val(stop) "finish"

$ns run
