package com.smartcity.traffic;

import java.util.*;

/**
 * Leaky Bucket Algorithm Simulator for Traffic Shaping and Congestion Control.
 * Regulates bursty vehicle-to-infrastructure (V2I) communication packets into
 * a smooth constant bit rate (CBR) output stream.
 */
public class LeakyBucketSimulator {

    public static class TimeStep {
        public int time;
        public int incomingPackets;
        public int acceptedPackets;
        public int droppedPackets;
        public int bucketBeforeLeak;
        public int leakedPackets;
        public int bucketAfterLeak;
        public double bufferOccupancyPercent;
        public String status; // NORMAL, OVERFLOW_DROP, LEAKING, EMPTY

        public String toJson() {
            return String.format(Locale.US,
                "{\"time\":%d,\"incoming\":%d,\"accepted\":%d,\"dropped\":%d,\"beforeLeak\":%d,\"leaked\":%d,\"afterLeak\":%d,\"occupancy\":%.1f,\"status\":\"%s\"}",
                time, incomingPackets, acceptedPackets, droppedPackets, bucketBeforeLeak, leakedPackets, bucketAfterLeak, bufferOccupancyPercent, status);
        }
    }

    public static class SimulationResult {
        public int capacity;
        public int leakRate;
        public int totalArrived;
        public int totalAccepted;
        public int totalDropped;
        public int totalTransmitted;
        public double dropRatePercent;
        public double peakBufferOccupancy;
        public List<TimeStep> timeline = new ArrayList<>();
        public String trafficShapingSummary;

        public String toJson() {
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            sb.append("\"capacity\":").append(capacity).append(",");
            sb.append("\"leakRate\":").append(leakRate).append(",");
            sb.append("\"totalArrived\":").append(totalArrived).append(",");
            sb.append("\"totalAccepted\":").append(totalAccepted).append(",");
            sb.append("\"totalDropped\":").append(totalDropped).append(",");
            sb.append("\"totalTransmitted\":").append(totalTransmitted).append(",");
            sb.append(String.format(Locale.US, "\"dropRatePercent\":%.2f,", dropRatePercent));
            sb.append(String.format(Locale.US, "\"peakBufferOccupancy\":%.1f,", peakBufferOccupancy));
            sb.append("\"summary\":\"").append(trafficShapingSummary.replace("\"", "\\\"")).append("\",");
            sb.append("\"timeline\":[");
            for (int i = 0; i < timeline.size(); i++) {
                sb.append(timeline.get(i).toJson());
                if (i < timeline.size() - 1) sb.append(",");
            }
            sb.append("]}");
            return sb.toString();
        }
    }

    public static SimulationResult simulate(int capacity, int leakRate, int[] arrivals) {
        if (capacity <= 0) capacity = 10;
        if (leakRate <= 0) leakRate = 3;
        if (arrivals == null || arrivals.length == 0) {
            arrivals = new int[]{ 5, 8, 12, 18, 4, 2, 14, 20, 6, 2, 0, 1 };
        }

        SimulationResult res = new SimulationResult();
        res.capacity = capacity;
        res.leakRate = leakRate;

        int currentLevel = 0;
        double maxOcc = 0;

        for (int t = 0; t < arrivals.length; t++) {
            TimeStep step = new TimeStep();
            step.time = t + 1;
            step.incomingPackets = arrivals[t];
            res.totalArrived += step.incomingPackets;

            int freeSpace = capacity - currentLevel;
            if (step.incomingPackets <= freeSpace) {
                step.acceptedPackets = step.incomingPackets;
                step.droppedPackets = 0;
                step.status = (step.incomingPackets > 0) ? "NORMAL" : "IDLE";
            } else {
                step.acceptedPackets = Math.max(0, freeSpace);
                step.droppedPackets = step.incomingPackets - step.acceptedPackets;
                step.status = "OVERFLOW_DROP";
            }

            res.totalAccepted += step.acceptedPackets;
            res.totalDropped += step.droppedPackets;

            step.bucketBeforeLeak = currentLevel + step.acceptedPackets;

            // Output/leak phase
            step.leakedPackets = Math.min(step.bucketBeforeLeak, leakRate);
            res.totalTransmitted += step.leakedPackets;

            step.bucketAfterLeak = step.bucketBeforeLeak - step.leakedPackets;
            currentLevel = step.bucketAfterLeak;

            step.bufferOccupancyPercent = (currentLevel * 100.0) / capacity;
            if (step.bufferOccupancyPercent > maxOcc) {
                maxOcc = step.bufferOccupancyPercent;
            }

            res.timeline.add(step);
        }

        res.dropRatePercent = (res.totalArrived > 0) ? ((double) res.totalDropped / res.totalArrived) * 100.0 : 0.0;
        res.peakBufferOccupancy = maxOcc;

        res.trafficShapingSummary = String.format(Locale.US,
            "Leaky Bucket regulated %d bursty incoming packets into a constant %d pkts/sec transmission. Dropped: %d packets (%.1f%%). Smooth CBR output achieved.",
            res.totalArrived, leakRate, res.totalDropped, res.dropRatePercent);

        return res;
    }
}
