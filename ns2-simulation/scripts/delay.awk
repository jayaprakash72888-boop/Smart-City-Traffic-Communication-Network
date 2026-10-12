# ==============================================================================
# delay.awk
# Calculates Average End-to-End Latency/Delay across the Smart City network
# Formula: Average Delay = (Sum of [ReceiveTime - SendTime] for all pkts) / Count
# ==============================================================================
BEGIN {
    totalDelay = 0;
    count = 0;
}
{
    event = $1;
    time = $2;
    pkt_id = $12;

    # Enqueue at origin
    if (event == "+") {
        sendTime[pkt_id] = time;
    }
    # Reception at terminal node
    else if (event == "r") {
        if (sendTime[pkt_id] > 0) {
            delay = time - sendTime[pkt_id];
            totalDelay += delay;
            count++;
        }
    }
}
END {
    printf("\n========================================================\n");
    printf("         NS-2 END-TO-END DELAY ANALYSIS REPORT          \n");
    printf("========================================================\n");
    printf("Packets Successfully Delivered : %d\n", count);
    if (count > 0) {
        avgDelaySec = totalDelay / count;
        avgDelayMs = avgDelaySec * 1000.0;
        printf("Cumulative Transmission Delay  : %.4f seconds\n", totalDelay);
        printf("Average End-to-End Delay       : %.2f ms\n", avgDelayMs);
    } else {
        printf("Error: Zero delivered packets tracked for delay.\n");
    }
    printf("========================================================\n\n");
}
