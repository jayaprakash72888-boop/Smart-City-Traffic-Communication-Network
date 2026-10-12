package com.smartcity.traffic;

import java.util.*;

/**
 * Simulates network congestion and performance under varying traffic loads.
 * Calculates exact CNIP metrics:
 *  - Packet Loss Rate = (Packets Lost / Packets Sent) * 100
 *  - Throughput = (Successfully Received Bits / Time in Seconds)
 *  - Packet Delivery Ratio (PDR) = (Packets Received / Packets Sent) * 100
 *  - Average Delay = Total Queuing + Transmission + Propagation Latency
 */
public class CongestionSimulator {

    public static class CongestionReport {
        public String trafficLevel; // LOW, MEDIUM, HIGH, EXTREME
        public int vehicleCount;
        public int packetGenerationRate; // packets/sec per node
        public int packetsSent;
        public int packetsReceived;
        public int packetsLost;
        public double packetLossRatePercent;
        public double packetDeliveryRatioPercent;
        public double throughputKbps;
        public double throughputBps;
        public double averageDelayMs;
        public int queueOccupancyPercent;
        public String bottleneckNode;
        public String congestionState; // OPTIMAL, MODERATE, CONGESTED, CRITICAL_COLLAPSE
        public List<TimeSeriesPoint> history = new ArrayList<>();

        public String toJson() {
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            sb.append("\"trafficLevel\":\"").append(trafficLevel).append("\",");
            sb.append("\"vehicleCount\":").append(vehicleCount).append(",");
            sb.append("\"packetGenerationRate\":").append(packetGenerationRate).append(",");
            sb.append("\"packetsSent\":").append(packetsSent).append(",");
            sb.append("\"packetsReceived\":").append(packetsReceived).append(",");
            sb.append("\"packetsLost\":").append(packetsLost).append(",");
            sb.append(String.format(Locale.US, "\"packetLossRatePercent\":%.2f,", packetLossRatePercent));
            sb.append(String.format(Locale.US, "\"packetDeliveryRatioPercent\":%.2f,", packetDeliveryRatioPercent));
            sb.append(String.format(Locale.US, "\"throughputKbps\":%.2f,", throughputKbps));
            sb.append(String.format(Locale.US, "\"throughputBps\":%.2f,", throughputBps));
            sb.append(String.format(Locale.US, "\"averageDelayMs\":%.2f,", averageDelayMs));
            sb.append("\"queueOccupancyPercent\":").append(queueOccupancyPercent).append(",");
            sb.append("\"bottleneckNode\":\"").append(bottleneckNode).append("\",");
            sb.append("\"congestionState\":\"").append(congestionState).append("\",");
            sb.append("\"history\":[");
            for (int i = 0; i < history.size(); i++) {
                sb.append(history.get(i).toJson());
                if (i < history.size() - 1) sb.append(",");
            }
            sb.append("]}");
            return sb.toString();
        }
    }

    public static class TimeSeriesPoint {
        public int timeSec;
        public int sent;
        public int received;
        public int lost;
        public double throughputKbps;
        public double delayMs;
        public int queueLength;

        public TimeSeriesPoint(int timeSec, int sent, int received, int lost, double throughputKbps, double delayMs, int queueLength) {
            this.timeSec = timeSec;
            this.sent = sent;
            this.received = received;
            this.lost = lost;
            this.throughputKbps = throughputKbps;
            this.delayMs = delayMs;
            this.queueLength = queueLength;
        }

        public String toJson() {
            return String.format(Locale.US,
                "{\"time\":%d,\"sent\":%d,\"received\":%d,\"lost\":%d,\"throughput\":%.2f,\"delay\":%.2f,\"queue\":%d}",
                timeSec, sent, received, lost, throughputKbps, delayMs, queueLength);
        }
    }

    public static CongestionReport evaluate(String level, int durationSeconds) {
        if (durationSeconds <= 0) durationSeconds = 15;
        CongestionReport report = new CongestionReport();
        report.trafficLevel = level.toUpperCase();

        int packetSizeBytes = 512; // 512-byte telemetry packets
        int packetSizeBits = packetSizeBytes * 8; // 4096 bits
        int channelCapacityPktsPerSec = 120; // bottleneck link capacity
        int bufferMax = 50; // router buffer capacity

        int rate;
        int vehicles;
        switch (report.trafficLevel) {
            case "LOW":
                rate = 25;
                vehicles = 120;
                report.bottleneckNode = "None (Uncongested)";
                report.congestionState = "OPTIMAL";
                break;
            case "HIGH":
                rate = 140;
                vehicles = 750;
                report.bottleneckNode = "Junction F (Tech Corridor)";
                report.congestionState = "CONGESTED";
                break;
            case "EXTREME":
                rate = 260;
                vehicles = 1400;
                report.bottleneckNode = "Junction F & Junction A";
                report.congestionState = "CRITICAL_COLLAPSE";
                break;
            case "MEDIUM":
            default:
                report.trafficLevel = "MEDIUM";
                rate = 75;
                vehicles = 380;
                report.bottleneckNode = "Junction B (North Cross)";
                report.congestionState = "MODERATE";
                break;
        }

        report.vehicleCount = vehicles;
        report.packetGenerationRate = rate;

        int totalSent = 0;
        int totalReceived = 0;
        int totalLost = 0;
        double accumulatedDelay = 0;
        int currentQueue = 0;

        Random rand = new Random(42);

        for (int t = 1; t <= durationSeconds; t++) {
            // Slight jitter in generation rate
            int generated = rate + rand.nextInt(Math.max(1, (int)(rate * 0.15))) - (int)(rate * 0.07);
            if (generated < 1) generated = 1;
            totalSent += generated;

            // Packet arrivals into buffer
            int space = bufferMax - currentQueue;
            int accepted = Math.min(generated, space);
            int lostThisSec = generated - accepted;
            totalLost += lostThisSec;

            currentQueue += accepted;

            // Service by transmission channel
            int canTransmit = Math.min(currentQueue, channelCapacityPktsPerSec);
            currentQueue -= canTransmit;
            totalReceived += canTransmit;

            // Calculate instantaneous delay (Propagation + Transmission + Queuing)
            double queuingDelay = (double) currentQueue / Math.max(1, channelCapacityPktsPerSec) * 1000.0;
            double baseDelay = 12.0 + (report.trafficLevel.equals("LOW") ? 2.0 : report.trafficLevel.equals("MEDIUM") ? 8.0 : 25.0);
            double secDelay = baseDelay + queuingDelay;
            accumulatedDelay += secDelay;

            // Throughput in bits per second and kbps
            double secThroughputBits = (double) canTransmit * packetSizeBits;
            double secThroughputKbps = secThroughputBits / 1000.0;

            report.history.add(new TimeSeriesPoint(t, totalSent, totalReceived, totalLost, secThroughputKbps, secDelay, currentQueue));
        }

        report.packetsSent = totalSent;
        report.packetsReceived = totalReceived;
        report.packetsLost = totalLost;

        report.packetLossRatePercent = (totalSent > 0) ? ((double) totalLost / totalSent) * 100.0 : 0.0;
        report.packetDeliveryRatioPercent = (totalSent > 0) ? ((double) totalReceived / totalSent) * 100.0 : 100.0;

        double totalReceivedBits = (double) totalReceived * packetSizeBits;
        report.throughputBps = totalReceivedBits / durationSeconds;
        report.throughputKbps = report.throughputBps / 1000.0;

        report.averageDelayMs = accumulatedDelay / durationSeconds;
        report.queueOccupancyPercent = (int) Math.min(100, Math.round(((double) currentQueue / bufferMax) * 100.0));

        return report;
    }
}
