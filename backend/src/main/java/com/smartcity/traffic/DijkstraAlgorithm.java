package com.smartcity.traffic;

import java.util.*;

/**
 * Dijkstra's Shortest Path Algorithm for Smart City Traffic Routing.
 * Calculates optimal low-latency communication path between traffic nodes.
 */
public class DijkstraAlgorithm {

    public static class StepTrace {
        public int stepNumber;
        public int currentNode;
        public String currentNodeName;
        public int[] distances;
        public boolean[] visited;
        public String description;

        public StepTrace(int stepNumber, int currentNode, String currentNodeName, int[] distances, boolean[] visited, String description) {
            this.stepNumber = stepNumber;
            this.currentNode = currentNode;
            this.currentNodeName = currentNodeName;
            this.distances = distances.clone();
            this.visited = visited.clone();
            this.description = description;
        }

        public String toJson() {
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            sb.append("\"stepNumber\":").append(stepNumber).append(",");
            sb.append("\"currentNode\":").append(currentNode).append(",");
            sb.append("\"currentNodeName\":\"").append(currentNodeName).append("\",");
            sb.append("\"distances\":[");
            for (int i = 0; i < distances.length; i++) {
                sb.append(distances[i] >= NetworkTopology.INF ? -1 : distances[i]);
                if (i < distances.length - 1) sb.append(",");
            }
            sb.append("],\"visited\":[");
            for (int i = 0; i < visited.length; i++) {
                sb.append(visited[i]);
                if (i < visited.length - 1) sb.append(",");
            }
            sb.append("],\"description\":\"").append(description.replace("\"", "\\\"")).append("\"");
            sb.append("}");
            return sb.toString();
        }
    }

    public static class DijkstraResult {
        public int source;
        public int destination;
        public String sourceName;
        public String destinationName;
        public int totalDistance;
        public List<Integer> path = new ArrayList<>();
        public List<String> pathNames = new ArrayList<>();
        public List<StepTrace> trace = new ArrayList<>();
        public String complexity = "O(V^2) with Adjacency Matrix / O((V+E)log V) with Min-Heap";

        public String toJson() {
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            sb.append("\"source\":").append(source).append(",");
            sb.append("\"destination\":").append(destination).append(",");
            sb.append("\"sourceName\":\"").append(sourceName).append("\",");
            sb.append("\"destinationName\":\"").append(destinationName).append("\",");
            sb.append("\"totalDistance\":").append(totalDistance).append(",");
            sb.append("\"complexity\":\"").append(complexity).append("\",");
            sb.append("\"path\":[");
            for (int i = 0; i < path.size(); i++) {
                sb.append(path.get(i));
                if (i < path.size() - 1) sb.append(",");
            }
            sb.append("],\"pathNames\":[");
            for (int i = 0; i < pathNames.size(); i++) {
                sb.append("\"").append(pathNames.get(i)).append("\"");
                if (i < pathNames.size() - 1) sb.append(",");
            }
            sb.append("],\"trace\":[");
            for (int i = 0; i < trace.size(); i++) {
                sb.append(trace.get(i).toJson());
                if (i < trace.size() - 1) sb.append(",");
            }
            sb.append("]}");
            return sb.toString();
        }
    }

    public static DijkstraResult calculate(NetworkTopology topology, int src, int dest) {
        int n = topology.nodes.size();
        int[][] graph = topology.adjacencyMatrix;

        int[] dist = new int[n];
        boolean[] visited = new boolean[n];
        int[] parent = new int[n];

        Arrays.fill(dist, NetworkTopology.INF);
        Arrays.fill(visited, false);
        Arrays.fill(parent, -1);

        dist[src] = 0;

        DijkstraResult result = new DijkstraResult();
        result.source = src;
        result.destination = dest;
        result.sourceName = topology.nodes.get(src).name;
        result.destinationName = topology.nodes.get(dest).name;

        int stepCounter = 1;
        result.trace.add(new StepTrace(stepCounter++, src, topology.nodes.get(src).name, dist, visited,
                "Initialized distance table with 0 for Source node " + topology.nodes.get(src).code + " and INFINITY for all other nodes."));

        for (int i = 0; i < n; i++) {
            // Find unvisited node with minimum distance
            int u = -1;
            int minDist = NetworkTopology.INF;
            for (int j = 0; j < n; j++) {
                if (!visited[j] && dist[j] < minDist) {
                    minDist = dist[j];
                    u = j;
                }
            }

            if (u == -1 || dist[u] == NetworkTopology.INF) {
                break; // remaining vertices are unreachable
            }

            visited[u] = true;

            StringBuilder relaxationLog = new StringBuilder("Selected Node " + topology.nodes.get(u).code +
                    " (Distance: " + dist[u] + "). Relaxing adjacent communication links: ");
            boolean relaxedAny = false;

            // Relax adjacent vertices
            for (int v = 0; v < n; v++) {
                if (!visited[v] && graph[u][v] != NetworkTopology.INF && graph[u][v] > 0) {
                    if (dist[u] + graph[u][v] < dist[v]) {
                        dist[v] = dist[u] + graph[u][v];
                        parent[v] = u;
                        relaxedAny = true;
                        relaxationLog.append("Updated ")
                                .append(topology.nodes.get(v).code)
                                .append(" to ")
                                .append(dist[v])
                                .append("; ");
                    }
                }
            }

            if (!relaxedAny) {
                relaxationLog.append("No shorter path found to adjacent nodes.");
            }

            result.trace.add(new StepTrace(stepCounter++, u, topology.nodes.get(u).name, dist, visited, relaxationLog.toString()));

            if (u == dest) {
                // Shortest path to destination determined
                break;
            }
        }

        result.totalDistance = (dist[dest] >= NetworkTopology.INF) ? -1 : dist[dest];

        // Reconstruct path
        if (dist[dest] < NetworkTopology.INF) {
            List<Integer> pathRev = new ArrayList<>();
            int curr = dest;
            while (curr != -1) {
                pathRev.add(curr);
                curr = parent[curr];
            }
            Collections.reverse(pathRev);
            result.path = pathRev;
            for (int nodeIdx : pathRev) {
                result.pathNames.add(topology.nodes.get(nodeIdx).code);
            }
        }

        return result;
    }
}
