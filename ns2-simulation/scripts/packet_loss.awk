# ==============================================================================
# packet_loss.awk
# Calculates Packet Loss Rate and Packet Delivery Ratio (PDR)
# Formulas:
#   Packet Loss Rate (%) = (Packets Dropped / Packets Sent) * 100
#   Packet Delivery Ratio (%) = (Packets Received / Packets Sent) * 100
# ==============================================================================
BEGIN {
    sent = 0;
    received = 0;
    dropped = 0;
}
{
    event = $1;
    pkt_type = $5;

    # '+' denotes packet enqueued at source node
    if (event == "+") {
        sent++;
    }
    # 'r' denotes packet successfully received at destination
    else if (event == "r") {
        received++;
    }
    # 'd' denotes packet dropped due to queue buffer overflow
    else if (event == "d") {
        dropped++;
    }
}
END {
    printf("\n========================================================\n");
    printf("     NS-2 PACKET LOSS & DELIVERY RATIO (PDR) REPORT     \n");
    printf("========================================================\n");
    printf("Total Packets Sent      : %d\n", sent);
    printf("Total Packets Received  : %d\n", received);
    printf("Total Packets Dropped   : %d\n", dropped);
    if (sent > 0) {
        lossRate = (dropped / sent) * 100.0;
        pdr = (received / sent) * 100.0;
        printf("Packet Loss Rate        : %.2f %%\n", lossRate);
        printf("Packet Delivery Ratio   : %.2f %%\n", pdr);
    } else {
        printf("Error: Zero packets sent.\n");
    }
    printf("========================================================\n\n");
}
