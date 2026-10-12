package com.smartcity.traffic;

import java.util.*;

/**
 * Represents the Smart City Traffic Communication Network Topology.
 * Contains 8 Smart Traffic Signal Intersection Nodes (A-H) connected
 * via Road & Fiber/Wireless Communication Links.
 */
public class NetworkTopology {

    public static class Node {
        public int id;
        public String name;
        public String code;
        public String type; // Hub, Intersection, Gateway, Expressway
        public int x;
        public int y;
        public int vehicleCount;
        public String signalStatus; // RED, YELLOW, GREEN

        public Node(int id, String name, String code, String type, int x, int y, int vehicleCount, String signalStatus) {
            this.id = id;
            this.name = name;
            this.code = code;
            this.type = type;
            this.x = x;
            this.y = y;
            this.vehicleCount = vehicleCount;
            this.signalStatus = signalStatus;
        }

        public String toJson() {
            return String.format(Locale.US,
                "{\"id\":%d,\"name\":\"%s\",\"code\":\"%s\",\"type\":\"%s\",\"x\":%d,\"y\":%d,\"vehicleCount\":%d,\"signalStatus\":\"%s\"}",
                id, name, code, type, x, y, vehicleCount, signalStatus);
        }
    }

    public static class Link {
        public int from;
        public int to;
        public int cost; // distance or link metric in km / cost
        public int bandwidth; // in Mbps
        public int delay; // base latency in ms
        public boolean active;

        public Link(int from, int to, int cost, int bandwidth, int delay) {
            this.from = from;
            this.to = to;
            this.cost = cost;
            this.bandwidth = bandwidth;
            this.delay = delay;
            this.active = true;
        }

        public String toJson() {
            return String.format(Locale.US,
                "{\"from\":%d,\"to\":%d,\"cost\":%d,\"bandwidth\":%d,\"delay\":%d,\"active\":%b}",
                from, to, cost, bandwidth, delay, active);
        }
    }

    public List<Node> nodes = new ArrayList<>();
    public List<Link> links = new ArrayList<>();
    public int[][] adjacencyMatrix;
    public static final int INF = 999999;

    public NetworkTopology() {
        initDefaultTopology();
    }

    private void initDefaultTopology() {
        nodes.clear();
        links.clear();

        // 8 Intersections across the smart city
        nodes.add(new Node(0, "Junction A - Central Hub", "J_A", "Central Hub", 160, 150, 45, "GREEN"));
        nodes.add(new Node(1, "Junction B - North Cross", "J_B", "Crossroad", 380, 80, 32, "RED"));
        nodes.add(new Node(2, "Junction C - East Gateway", "J_C", "Commercial Gateway", 640, 100, 28, "GREEN"));
        nodes.add(new Node(3, "Junction D - South Terminal", "J_D", "Transit Terminal", 420, 390, 52, "GREEN"));
        nodes.add(new Node(4, "Junction E - West Bridge", "J_E", "Bridge Overpass", 140, 360, 22, "YELLOW"));
        nodes.add(new Node(5, "Junction F - Tech Corridor", "J_F", "Smart Junction", 400, 230, 60, "GREEN"));
        nodes.add(new Node(6, "Junction G - Metro Station", "J_G", "Metro Exchange", 650, 320, 40, "RED"));
        nodes.add(new Node(7, "Junction H - Airport Expressway", "J_H", "Expressway Gateway", 850, 220, 35, "GREEN"));

        // Bidirectional communication links
        addLink(0, 1, 4, 100, 5);
        addLink(0, 4, 5, 54, 8);
        addLink(0, 5, 3, 100, 4);
        addLink(1, 2, 6, 100, 6);
        addLink(1, 5, 2, 100, 3);
        addLink(2, 6, 4, 54, 7);
        addLink(2, 7, 5, 100, 5);
        addLink(3, 4, 6, 54, 9);
        addLink(3, 5, 4, 100, 5);
        addLink(3, 6, 3, 100, 4);
        addLink(5, 6, 3, 100, 3);
        addLink(6, 7, 4, 100, 4);

        buildAdjacencyMatrix();
    }

    private void addLink(int u, int v, int cost, int bw, int delay) {
        links.add(new Link(u, v, cost, bw, delay));
    }

    public void buildAdjacencyMatrix() {
        int n = nodes.size();
        adjacencyMatrix = new int[n][n];
        for (int i = 0; i < n; i++) {
            Arrays.fill(adjacencyMatrix[i], INF);
            adjacencyMatrix[i][i] = 0;
        }

        for (Link link : links) {
            if (link.active) {
                adjacencyMatrix[link.from][link.to] = link.cost;
                adjacencyMatrix[link.to][link.from] = link.cost;
            }
        }
    }

    public void updateLinkCost(int u, int v, int newCost, boolean active) {
        for (Link link : links) {
            if ((link.from == u && link.to == v) || (link.from == v && link.to == u)) {
                link.cost = newCost;
                link.active = active;
            }
        }
        buildAdjacencyMatrix();
    }

    public String toJson() {
        StringBuilder sb = new StringBuilder();
        sb.append("{\"nodes\":[");
        for (int i = 0; i < nodes.size(); i++) {
            sb.append(nodes.get(i).toJson());
            if (i < nodes.size() - 1) sb.append(",");
        }
        sb.append("],\"links\":[");
        for (int i = 0; i < links.size(); i++) {
            sb.append(links.get(i).toJson());
            if (i < links.size() - 1) sb.append(",");
        }
        sb.append("],\"adjacencyMatrix\":[");
        for (int i = 0; i < adjacencyMatrix.length; i++) {
            sb.append("[");
            for (int j = 0; j < adjacencyMatrix[i].length; j++) {
                sb.append(adjacencyMatrix[i][j] >= INF ? -1 : adjacencyMatrix[i][j]);
                if (j < adjacencyMatrix[i].length - 1) sb.append(",");
            }
            sb.append("]");
            if (i < adjacencyMatrix.length - 1) sb.append(",");
        }
        sb.append("]}");
        return sb.toString();
    }
}
