# ==============================================================================
# throughput.awk
# Calculates Network Throughput in kbps from NS-2 trace file
# Formula: Throughput = (Total Received Bytes * 8) / (Simulation Duration * 1000)
# ==============================================================================
BEGIN {
    recvdSize = 0;
    startTime = 1e6;
    stopTime = 0;
}
{
    event = $1;
    time = $2;
    from_node = $3;
    to_node = $4;
    pkt_type = $5;
    pkt_size = $6;

    # In wired trace format:
    # event: '+' (enqueue), '-' (dequeue), 'r' (receive), 'd' (drop)
    if (event == "r") {
        if (time < startTime) startTime = time;
        if (time > stopTime) stopTime = time;
        recvdSize += pkt_size;
    }
}
END {
    simTime = stopTime - startTime;
    printf("\n========================================================\n");
    printf("         NS-2 THROUGHPUT ANALYSIS REPORT                \n");
    printf("========================================================\n");
    if (simTime > 0) {
        throughput = (recvdSize * 8) / (simTime * 1000);
        printf("Simulation Start Time   : %.4f seconds\n", startTime);
        printf("Simulation Stop Time    : %.4f seconds\n", stopTime);
        printf("Simulation Duration     : %.4f seconds\n", simTime);
        printf("Total Data Received     : %d Bytes (%.2f KB)\n", recvdSize, recvdSize / 1024.0);
        printf("Network Throughput      : %.2f kbps (%.4f Mbps)\n", throughput, throughput / 1000.0);
    } else {
        printf("Error: No packet receive events found in trace file.\n");
    }
    printf("========================================================\n\n");
}
