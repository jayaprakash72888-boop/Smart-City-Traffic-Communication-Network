package com.smartcity.traffic;

/**
 * Generator and provider for NS-2 (Network Simulator 2) Tcl scripts.
 * Creates standard wired and wireless (VANET) Tcl simulation scripts.
 */
public class Ns2ScriptGenerator {

    public static String getWiredScript(int nodeCount, String bandwidth, String delay, int queueLimit, String trafficType) {
        if (nodeCount <= 0 || nodeCount > 10) nodeCount = 8;
        if (bandwidth == null || bandwidth.isEmpty()) bandwidth = "10Mb";
        if (delay == null || delay.isEmpty()) delay = "5ms";
        if (queueLimit <= 0) queueLimit = 25;
        if (trafficType == null || trafficType.isEmpty()) trafficType = "CBR";

        StringBuilder sb = new StringBuilder();
        sb.append("# =====================================================================\n");
        sb.append("# Smart City Traffic Communication Network - NS-2 Simulation Script\n");
        sb.append("# Course: Computer Networks & Internet Protocols (CNIP)\n");
        sb.append("# Simulates: Multi-intersection traffic signal communication, queues, & loss\n");
        sb.append("# =====================================================================\n\n");

        sb.append("# Step 1: Create a Simulator Object\n");
        sb.append("set ns [new Simulator]\n\n");

        sb.append("# Step 2: Define Color Palette for NAM (Network Animator)\n");
        sb.append("$ns color 1 Blue\n");
        sb.append("$ns color 2 Red\n");
        sb.append("$ns color 3 Green\n\n");

        sb.append("# Step 3: Open Trace file and NAM animation trace file\n");
        sb.append("set tracefile [open \"traffic_sim.tr\" w]\n");
        sb.append("$ns trace-all $tracefile\n\n");
        sb.append("set namfile [open \"traffic_sim.nam\" w]\n");
        sb.append("$ns namtrace-all $namfile\n\n");

        sb.append("# Step 4: Finish Procedure called at the end of simulation\n");
        sb.append("proc finish {} {\n");
        sb.append("    global ns tracefile namfile\n");
        sb.append("    $ns flush-trace\n");
        sb.append("    close $tracefile\n");
        sb.append("    close $namfile\n");
        sb.append("    puts \"[+] NS-2 Simulation Finished Successfully!\"\n");
        sb.append("    puts \"[+] Trace file saved to: traffic_sim.tr\"\n");
        sb.append("    puts \"[+] NAM file saved to:   traffic_sim.nam\"\n");
        sb.append("    # Uncomment to launch NAM visualizer automatically:\n");
        sb.append("    # exec nam traffic_sim.nam &\n");
        sb.append("    exit 0\n");
        sb.append("}\n\n");

        sb.append("# Step 5: Create ").append(nodeCount).append(" Smart Traffic Signal Nodes\n");
        for (int i = 0; i < nodeCount; i++) {
            sb.append("set n").append(i).append(" [$ns node]\n");
            sb.append("$n").append(i).append(" label \"Junction_").append((char)('A' + i)).append("\"\n");
        }
        sb.append("\n");

        sb.append("# Step 6: Create Duplex Links between Intersections\n");
        sb.append("# Format: $ns duplex-link <node1> <node2> <bandwidth> <delay> <queue_type>\n");
        sb.append("$ns duplex-link $n0 $n1 ").append(bandwidth).append(" ").append(delay).append(" DropTail\n");
        sb.append("$ns duplex-link $n0 $n4 5Mb 8ms DropTail\n");
        sb.append("$ns duplex-link $n0 $n5 ").append(bandwidth).append(" 4ms DropTail\n");
        sb.append("$ns duplex-link $n1 $n2 ").append(bandwidth).append(" 6ms DropTail\n");
        sb.append("$ns duplex-link $n1 $n5 ").append(bandwidth).append(" 3ms DropTail\n");
        sb.append("$ns duplex-link $n2 $n6 5Mb 7ms DropTail\n");
        sb.append("$ns duplex-link $n2 $n7 ").append(bandwidth).append(" 5ms DropTail\n");
        sb.append("$ns duplex-link $n3 $n4 5Mb 9ms DropTail\n");
        sb.append("$ns duplex-link $n3 $n5 ").append(bandwidth).append(" 5ms DropTail\n");
        sb.append("$ns duplex-link $n3 $n6 ").append(bandwidth).append(" 4ms DropTail\n");
        sb.append("$ns duplex-link $n5 $n6 ").append(bandwidth).append(" 3ms DropTail\n");
        sb.append("$ns duplex-link $n6 $n7 ").append(bandwidth).append(" 4ms DropTail\n\n");

        sb.append("# Step 7: Configure Queue Buffer Limits (Buffer Management)\n");
        sb.append("$ns queue-limit $n0 $n5 ").append(queueLimit).append("\n");
        sb.append("$ns queue-limit $n5 $n6 ").append(queueLimit).append("\n");
        sb.append("$ns queue-limit $n6 $n7 ").append(queueLimit).append("\n\n");

        sb.append("# Step 8: Setup Transport Protocols & Traffic Sources\n");
        sb.append("# Flow 1: High-Rate Vehicle Telemetry (UDP + Constant Bit Rate CBR)\n");
        sb.append("set udp0 [new Agent/UDP]\n");
        sb.append("$udp0 set fid_ 1; # Blue packets\n");
        sb.append("$ns attach-agent $n0 $udp0\n");
        sb.append("set null0 [new Agent/Null]\n");
        sb.append("$ns attach-agent $n7 $null0\n");
        sb.append("$ns connect $udp0 $null0\n\n");

        sb.append("set cbr0 [new Application/Traffic/CBR]\n");
        sb.append("$cbr0 set packetSize_ 512\n");
        sb.append("$cbr0 set interval_ 0.005; # 200 packets/sec transmission\n");
        sb.append("$cbr0 set random_ 1\n");
        sb.append("$cbr0 attach-agent $udp0\n\n");

        sb.append("# Flow 2: Critical Traffic Control Signals (TCP + FTP Flow)\n");
        sb.append("set tcp0 [new Agent/TCP]\n");
        sb.append("$tcp0 set fid_ 2; # Red packets\n");
        sb.append("$ns attach-agent $n1 $tcp0\n");
        sb.append("set sink0 [new Agent/TCPSink]\n");
        sb.append("$ns attach-agent $n6 $sink0\n");
        sb.append("$ns connect $tcp0 $sink0\n\n");

        sb.append("set ftp0 [new Application/FTP]\n");
        sb.append("$ftp0 attach-agent $tcp0\n\n");

        sb.append("# Step 9: Schedule Simulation Events (in seconds)\n");
        sb.append("$ns at 0.5 \"$cbr0 start\"\n");
        sb.append("$ns at 1.0 \"$ftp0 start\"\n");
        sb.append("$ns at 4.0 \"$ftp0 stop\"\n");
        sb.append("$ns at 4.5 \"$cbr0 stop\"\n");
        sb.append("$ns at 5.0 \"finish\"\n\n");

        sb.append("# Step 10: Start Simulation\n");
        sb.append("$ns run\n");

        return sb.toString();
    }

    public static String getThroughputAwkScript() {
        return "# ==========================================================\n" +
               "# throughput.awk - Calculates Network Throughput from NS-2 Trace\n" +
               "# Throughput (kbps) = (Total Bytes Received * 8) / (Time * 1000)\n" +
               "# ==========================================================\n" +
               "BEGIN {\n" +
               "    recvdSize = 0;\n" +
               "    startTime = 1e6;\n" +
               "    stopTime = 0;\n" +
               "}\n" +
               "{\n" +
               "    event = $1;\n" +
               "    time = $2;\n" +
               "    node_id = $3;\n" +
               "    pkt_size = $6;\n" +
               "    pkt_type = $5;\n" +
               "    dest_node = $4;\n\n" +
               "    # Look for successfully received packets at destination (+: enqueue, -: dequeue, r: receive, d: drop)\n" +
               "    if (event == \"r\") {\n" +
               "        if (time < startTime) startTime = time;\n" +
               "        if (time > stopTime) stopTime = time;\n" +
               "        recvdSize += pkt_size;\n" +
               "    }\n" +
               "}\n" +
               "END {\n" +
               "    simTime = stopTime - startTime;\n" +
               "    if (simTime > 0) {\n" +
               "        throughput = (recvdSize * 8) / (simTime * 1000);\n" +
               "        printf(\"\\n--- NS-2 THROUGHPUT ANALYSIS ---\\n\");\n" +
               "        printf(\"Simulation Start Time:  %.4f s\\n\", startTime);\n" +
               "        printf(\"Simulation Stop Time:   %.4f s\\n\", stopTime);\n" +
               "        printf(\"Total Data Received:    %d Bytes\\n\", recvdSize);\n" +
               "        printf(\"Effective Duration:     %.4f s\\n\", simTime);\n" +
               "        printf(\"Calculated Throughput:  %.2f kbps\\n\", throughput);\n" +
               "        printf(\"--------------------------------\\n\");\n" +
               "    } else {\n" +
               "        print \"No received packets found in trace file.\";\n" +
               "    }\n" +
               "}\n";
    }

    public static String getPacketLossAwkScript() {
        return "# ==========================================================\n" +
               "# packet_loss.awk - Calculates Packet Delivery Ratio (PDR) & Loss Rate\n" +
               "# Loss Rate (%) = (Packets Dropped / Packets Sent) * 100\n" +
               "# PDR (%) = (Packets Received / Packets Sent) * 100\n" +
               "# ==========================================================\n" +
               "BEGIN {\n" +
               "    sent = 0;\n" +
               "    received = 0;\n" +
               "    dropped = 0;\n" +
               "}\n" +
               "{\n" +
               "    event = $1;\n" +
               "    pkt_type = $5;\n\n" +
               "    # '+' represents packet enqueued at source\n" +
               "    if (event == \"+\") {\n" +
               "        sent++;\n" +
               "    }\n" +
               "    # 'r' represents packet received at destination\n" +
               "    else if (event == \"r\") {\n" +
               "        received++;\n" +
               "    }\n" +
               "    # 'd' represents packet dropped due to queue overflow\n" +
               "    else if (event == \"d\") {\n" +
               "        dropped++;\n" +
               "    }\n" +
               "}\n" +
               "END {\n" +
               "    printf(\"\\n--- NS-2 PACKET LOSS & DELIVERY RATIO ---\\n\");\n" +
               "    printf(\"Total Packets Sent:      %d\\n\", sent);\n" +
               "    printf(\"Total Packets Received:  %d\\n\", received);\n" +
               "    printf(\"Total Packets Dropped:   %d\\n\", dropped);\n" +
               "    if (sent > 0) {\n" +
               "        lossRate = (dropped / sent) * 100;\n" +
               "        pdr = (received / sent) * 100;\n" +
               "        printf(\"Packet Loss Rate:        %.2f %%\\n\", lossRate);\n" +
               "        printf(\"Packet Delivery Ratio:   %.2f %%\\n\", pdr);\n" +
               "    }\n" +
               "    printf(\"-----------------------------------------\\n\");\n" +
               "}\n";
    }

    public static String getDelayAwkScript() {
        return "# ==========================================================\n" +
               "# delay.awk - Calculates Average End-to-End Packet Delay\n" +
               "# Delay = Time(Received) - Time(Sent)\n" +
               "# ==========================================================\n" +
               "BEGIN {\n" +
               "    totalDelay = 0;\n" +
               "    count = 0;\n" +
               "}\n" +
               "{\n" +
               "    event = $1;\n" +
               "    time = $2;\n" +
               "    pkt_id = $12;\n\n" +
               "    if (event == \"+\") {\n" +
               "        sendTime[pkt_id] = time;\n" +
               "    }\n" +
               "    else if (event == \"r\") {\n" +
               "        if (sendTime[pkt_id] > 0) {\n" +
               "            delay = time - sendTime[pkt_id];\n" +
               "            totalDelay += delay;\n" +
               "            count++;\n" +
               "        }\n" +
               "    }\n" +
               "}\n" +
               "END {\n" +
               "    printf(\"\\n--- NS-2 END-TO-END DELAY ANALYSIS ---\\n\");\n" +
               "    printf(\"Packets Evaluated:     %d\\n\", count);\n" +
               "    if (count > 0) {\n" +
               "        avgDelay = (totalDelay / count) * 1000;\n" +
               "        printf(\"Total Delay Sum:       %.4f s\\n\", totalDelay);\n" +
               "        printf(\"Average Packet Delay:  %.2f ms\\n\", avgDelay);\n" +
               "    }\n" +
               "    printf(\"---------------------------------------\\n\");\n" +
               "}\n";
    }
}
