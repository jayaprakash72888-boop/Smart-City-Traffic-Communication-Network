package com.smartcity.traffic;

import java.util.*;

/**
 * Distance Vector Routing (Bellman-Ford based) for Smart City Traffic Nodes.
 * Maintains distributed routing tables: [Destination, Next Hop, Minimum Cost].
 * Simulates iterative table exchange and convergence after link cost changes.
 */
public class DistanceVectorRouting {

    public static class RouteEntry {
        public int destination;
        public String destinationCode;
        public int nextHop;
        public String nextHopCode;
        public int cost;

        public RouteEntry(int destination, String destinationCode, int nextHop, String nextHopCode, int cost) {
            this.destination = destination;
            this.destinationCode = destinationCode;
            this.nextHop = nextHop;
            this.nextHopCode = nextHopCode;
            this.cost = cost;
        }

        public String toJson() {
            return String.format(Locale.US,
                "{\"destination\":%d,\"destinationCode\":\"%s\",\"nextHop\":%d,\"nextHopCode\":\"%s\",\"cost\":%d}",
                destination, destinationCode, nextHop, nextHopCode, cost >= NetworkTopology.INF ? -1 : cost);
        }
    }

    public static class NodeRoutingTable {
        public int nodeId;
        public String nodeCode;
        public String nodeName;
        public List<RouteEntry> routes = new ArrayList<>();

        public NodeRoutingTable(int nodeId, String nodeCode, String nodeName) {
            this.nodeId = nodeId;
            this.nodeCode = nodeCode;
            this.nodeName = nodeName;
        }

        public String toJson() {
            StringBuilder sb = new StringBuilder();
            sb.append("{\"nodeId\":").append(nodeId).append(",");
            sb.append("\"nodeCode\":\"").append(nodeCode).append("\",");
            sb.append("\"nodeName\":\"").append(nodeName).append("\",");
            sb.append("\"routes\":[");
            for (int i = 0; i < routes.size(); i++) {
                sb.append(routes.get(i).toJson());
                if (i < routes.size() - 1) sb.append(",");
            }
            sb.append("]}");
            return sb.toString();
        }
    }

    public static class DVRResult {
        public int roundsToConverge;
        public boolean converged;
        public List<NodeRoutingTable> routingTables = new ArrayList<>();
        public List<String> convergenceLog = new ArrayList<>();
        public String bellmanFordEquation = "D_x(y) = min_v { c(x, v) + D_v(y) }";

        public String toJson() {
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            sb.append("\"roundsToConverge\":").append(roundsToConverge).append(",");
            sb.append("\"converged\":").append(converged).append(",");
            sb.append("\"equation\":\"").append(bellmanFordEquation).append("\",");
            sb.append("\"routingTables\":[");
            for (int i = 0; i < routingTables.size(); i++) {
                sb.append(routingTables.get(i).toJson());
                if (i < routingTables.size() - 1) sb.append(",");
            }
            sb.append("],\"convergenceLog\":[");
            for (int i = 0; i < convergenceLog.size(); i++) {
                sb.append("\"").append(convergenceLog.get(i).replace("\"", "\\\"")).append("\"");
                if (i < convergenceLog.size() - 1) sb.append(",");
            }
            sb.append("]}");
            return sb.toString();
        }
    }

    public static DVRResult compute(NetworkTopology topology) {
        int n = topology.nodes.size();
        int[][] graph = topology.adjacencyMatrix;

        // distanceVector[i][j] = current estimated cost from node i to node j
        int[][] dist = new int[n][n];
        // nextHop[i][j] = next hop node from i to reach destination j
        int[][] nextHop = new int[n][n];

        // Initialization step (Round 0: Local knowledge only)
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                dist[i][j] = graph[i][j];
                if (i == j) {
                    nextHop[i][j] = i;
                } else if (graph[i][j] < NetworkTopology.INF && graph[i][j] > 0) {
                    nextHop[i][j] = j; // direct neighbor
                } else {
                    nextHop[i][j] = -1; // unreachable directly
                }
            }
        }

        DVRResult result = new DVRResult();
        result.convergenceLog.add("Round 0: Each traffic node initializes distance vectors with direct physical neighbors.");

        boolean updated;
        int maxRounds = n * 2;
        int round = 0;

        // Iterative Bellman-Ford algorithm exchange
        do {
            round++;
            updated = false;
            int updatesInRound = 0;

            int[][] nextDist = new int[n][n];
            int[][] nextHopCopy = new int[n][n];

            for (int i = 0; i < n; i++) {
                System.arraycopy(dist[i], 0, nextDist[i], 0, n);
                System.arraycopy(nextHop[i], 0, nextHopCopy[i], 0, n);
            }

            for (int i = 0; i < n; i++) { // For each router node i
                for (int j = 0; j < n; j++) { // For each destination j
                    if (i == j) continue;

                    // Check all neighbors k of i
                    for (int k = 0; k < n; k++) {
                        if (k != i && graph[i][k] < NetworkTopology.INF && graph[i][k] > 0) {
                            int costViaK = graph[i][k] + dist[k][j];
                            if (dist[k][j] < NetworkTopology.INF && costViaK < nextDist[i][j]) {
                                nextDist[i][j] = costViaK;
                                nextHopCopy[i][j] = k;
                                updated = true;
                                updatesInRound++;
                            }
                        }
                    }
                }
            }

            dist = nextDist;
            nextHop = nextHopCopy;

            if (updated) {
                result.convergenceLog.add(String.format("Round %d: Nodes exchanged routing vectors. %d routing paths were updated/optimized.", round, updatesInRound));
            } else {
                result.convergenceLog.add(String.format("Round %d: No path costs changed. Distance Vector Routing achieved stable convergence.", round));
            }

        } while (updated && round < maxRounds);

        result.roundsToConverge = round;
        result.converged = !updated;

        // Build routing tables output
        for (int i = 0; i < n; i++) {
            NodeRoutingTable table = new NodeRoutingTable(i, topology.nodes.get(i).code, topology.nodes.get(i).name);
            for (int j = 0; j < n; j++) {
                int hop = nextHop[i][j];
                String hopCode = (hop >= 0 && hop < n) ? topology.nodes.get(hop).code : "NONE";
                table.routes.add(new RouteEntry(j, topology.nodes.get(j).code, hop, hopCode, dist[i][j]));
            }
            result.routingTables.add(table);
        }

        return result;
    }
}
