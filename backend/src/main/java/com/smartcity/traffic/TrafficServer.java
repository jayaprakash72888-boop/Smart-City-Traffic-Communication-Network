package com.smartcity.traffic;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

/**
 * Main Java HTTP Server and REST API Controller for Smart City Traffic Communication Network.
 * Uses lightweight, native Java com.sun.net.httpserver with Zero External Dependencies.
 */
public class TrafficServer {

    private static int PORT = 8085;
    private static final NetworkTopology topology = new NetworkTopology();
    private static String frontendDir = "../frontend"; // relative to backend directory or project root

    public static void main(String[] args) throws IOException {
        if (args.length > 0) {
            try {
                PORT = Integer.parseInt(args[0]);
            } catch (Exception ignored) {}
        }

        // Resolve frontend directory path
        File f1 = new File("frontend");
        File f2 = new File("../frontend");
        File f3 = new File("../../frontend");
        if (f1.exists() && f1.isDirectory()) {
            frontendDir = f1.getAbsolutePath();
        } else if (f2.exists() && f2.isDirectory()) {
            frontendDir = f2.getAbsolutePath();
        } else if (f3.exists() && f3.isDirectory()) {
            frontendDir = f3.getAbsolutePath();
        } else {
            frontendDir = "frontend";
        }

        HttpServer server = null;
        int[] portsToTry = { PORT, 8085, 8090, 8088, 8080 };
        for (int p : portsToTry) {
            try {
                server = HttpServer.create(new InetSocketAddress(p), 0);
                PORT = p;
                break;
            } catch (IOException e) {
                // try next port
            }
        }

        if (server == null) {
            throw new IOException("Could not bind to any HTTP port (tried 8085, 8090, 8088, 8080)");
        }

        // API Endpoints
        server.createContext("/api/login", new LoginHandler());
        server.createContext("/api/agent/status", new AgentStatusHandler());
        server.createContext("/api/agent/evaluate", new AgentEvaluateHandler());
        server.createContext("/api/agent/toggle", new AgentToggleHandler());
        server.createContext("/api/health", new HealthHandler());
        server.createContext("/api/topology", new TopologyHandler());
        server.createContext("/api/dijkstra", new DijkstraHandler());
        server.createContext("/api/distance-vector", new DistanceVectorHandler());
        server.createContext("/api/distance-vector/update-link", new UpdateLinkHandler());
        server.createContext("/api/leaky-bucket", new LeakyBucketHandler());
        server.createContext("/api/congestion", new CongestionHandler());
        server.createContext("/api/ns2/script", new Ns2ScriptHandler());
        server.createContext("/api/ns2/awk", new Ns2AwkHandler());

        // Static file handler for frontend UI
        server.createContext("/", new StaticFileHandler(frontendDir));

        server.setExecutor(java.util.concurrent.Executors.newCachedThreadPool());
        server.start();

        System.out.println("==================================================================");
        System.out.println("  SMART CITY TRAFFIC COMMUNICATION NETWORK - BACKEND SERVER       ");
        System.out.println("  CNIP (Computer Networks & Internet Protocols) Project           ");
        System.out.println("==================================================================");
        System.out.println("  [+] Server Running at:    http://localhost:" + PORT + "/");
        System.out.println("  [+] Web UI Dashboard:     http://localhost:" + PORT + "/index.html");
        System.out.println("  [+] REST API Health:      http://localhost:" + PORT + "/api/health");
        System.out.println("  [+] Serving Frontend From: " + frontendDir);
        System.out.println("==================================================================");
    }

    private static void sendCors(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    private static void sendJsonResponse(HttpExchange exchange, int statusCode, String jsonResponse) throws IOException {
        sendCors(exchange);
        byte[] bytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String readBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            byte[] buf = new byte[1024];
            int len;
            while ((len = is.read(buf)) != -1) {
                baos.write(buf, 0, len);
            }
            return baos.toString(StandardCharsets.UTF_8.name());
        }
    }

    private static int extractInt(String json, String key, int defaultVal) {
        try {
            String pattern = "\"" + key + "\":";
            int idx = json.indexOf(pattern);
            if (idx == -1) {
                pattern = "\"" + key + "\" :";
                idx = json.indexOf(pattern);
            }
            if (idx == -1) return defaultVal;
            int start = idx + pattern.length();
            while (start < json.length() && Character.isWhitespace(json.charAt(start))) start++;
            int end = start;
            while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '-')) end++;
            if (start < end) {
                return Integer.parseInt(json.substring(start, end));
            }
        } catch (Exception ignored) {}
        return defaultVal;
    }

    private static String extractString(String json, String key, String defaultVal) {
        if (json == null) return defaultVal;
        try {
            String pattern = "\"" + key + "\"";
            int idx = json.indexOf(pattern);
            if (idx == -1) {
                idx = json.indexOf(key);
            }
            if (idx == -1) return defaultVal;
            int colon = json.indexOf(":", idx);
            if (colon == -1) return defaultVal;
            int start = colon + 1;
            while (start < json.length() && (Character.isWhitespace(json.charAt(start)) || json.charAt(start) == '"' || json.charAt(start) == '\'')) {
                start++;
            }
            int end = start;
            while (end < json.length() && json.charAt(end) != '"' && json.charAt(end) != '\'' && json.charAt(end) != ',' && json.charAt(end) != '}' && !Character.isWhitespace(json.charAt(end))) {
                end++;
            }
            if (start < end) {
                return json.substring(start, end).trim();
            }
        } catch (Exception ignored) {}
        return defaultVal;
    }

    // --- Handlers ---

    static class HealthHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            String resp = "{\"status\":\"UP\",\"message\":\"Smart City Traffic Server Active\",\"nodes\":8,\"timestamp\":" + System.currentTimeMillis() + "}";
            sendJsonResponse(exchange, 200, resp);
        }
    }

    static class TopologyHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            sendJsonResponse(exchange, 200, topology.toJson());
        }
    }

    static class AgentStatusHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            sendJsonResponse(exchange, 200, TrafficAgent.getStatus().toJson());
        }
    }

    static class AgentEvaluateHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            String body = readBody(exchange);
            String level = extractString(body, "level", "HIGH");
            TrafficAgent.AgentStatus res = TrafficAgent.triggerAutonomousEvaluation(topology, level);
            sendJsonResponse(exchange, 200, res.toJson());
        }
    }

    static class AgentToggleHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            String body = readBody(exchange);
            boolean enabled = !body.contains("\"enabled\":false");
            TrafficAgent.AgentStatus res = TrafficAgent.toggleMode(enabled);
            sendJsonResponse(exchange, 200, res.toJson());
        }
    }

    static class DijkstraHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            String body = readBody(exchange);
            int src = extractInt(body, "source", 0);
            int dest = extractInt(body, "destination", 7);
            if (src < 0 || src >= topology.nodes.size()) src = 0;
            if (dest < 0 || dest >= topology.nodes.size()) dest = 7;

            DijkstraAlgorithm.DijkstraResult res = DijkstraAlgorithm.calculate(topology, src, dest);
            sendJsonResponse(exchange, 200, res.toJson());
        }
    }

    static class DistanceVectorHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            DistanceVectorRouting.DVRResult res = DistanceVectorRouting.compute(topology);
            sendJsonResponse(exchange, 200, res.toJson());
        }
    }

    static class UpdateLinkHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            String body = readBody(exchange);
            int from = extractInt(body, "from", 0);
            int to = extractInt(body, "to", 1);
            int cost = extractInt(body, "cost", 4);
            boolean active = !body.contains("\"active\":false");

            topology.updateLinkCost(from, to, cost, active);
            DistanceVectorRouting.DVRResult res = DistanceVectorRouting.compute(topology);
            sendJsonResponse(exchange, 200, res.toJson());
        }
    }

    static class LeakyBucketHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            String body = readBody(exchange);
            int capacity = extractInt(body, "capacity", 15);
            int leakRate = extractInt(body, "leakRate", 4);

            int[] arrivals = new int[]{ 5, 8, 14, 18, 4, 3, 16, 22, 5, 2, 0, 1 };
            // Parse arrivals array if provided
            int arrStart = body.indexOf("\"arrivals\":[");
            if (arrStart != -1) {
                int arrEnd = body.indexOf("]", arrStart);
                if (arrEnd != -1) {
                    String sub = body.substring(arrStart + 12, arrEnd).trim();
                    if (!sub.isEmpty()) {
                        String[] parts = sub.split(",");
                        arrivals = new int[parts.length];
                        for (int i = 0; i < parts.length; i++) {
                            try {
                                arrivals[i] = Integer.parseInt(parts[i].trim());
                            } catch (Exception e) {
                                arrivals[i] = 2;
                            }
                        }
                    }
                }
            }

            LeakyBucketSimulator.SimulationResult res = LeakyBucketSimulator.simulate(capacity, leakRate, arrivals);
            sendJsonResponse(exchange, 200, res.toJson());
        }
    }

    static class CongestionHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            String body = readBody(exchange);
            String level = extractString(body, "level", "MEDIUM");
            int duration = extractInt(body, "duration", 15);

            CongestionSimulator.CongestionReport report = CongestionSimulator.evaluate(level, duration);
            sendJsonResponse(exchange, 200, report.toJson());
        }
    }

    static class Ns2ScriptHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            String script = Ns2ScriptGenerator.getWiredScript(8, "10Mb", "5ms", 25, "CBR");
            String json = "{\"filename\":\"traffic_smart_city_wired.tcl\",\"script\":\"" +
                    script.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "") + "\"}";
            sendJsonResponse(exchange, 200, json);
        }
    }

    static class Ns2AwkHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            String path = exchange.getRequestURI().getPath();
            String content;
            String name;
            if (path.endsWith("throughput")) {
                content = Ns2ScriptGenerator.getThroughputAwkScript();
                name = "throughput.awk";
            } else if (path.endsWith("loss")) {
                content = Ns2ScriptGenerator.getPacketLossAwkScript();
                name = "packet_loss.awk";
            } else {
                content = Ns2ScriptGenerator.getDelayAwkScript();
                name = "delay.awk";
            }

            String json = "{\"filename\":\"" + name + "\",\"script\":\"" +
                    content.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "") + "\"}";
            sendJsonResponse(exchange, 200, json);
        }
    }

    static class LoginHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendCors(exchange);
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            String body = readBody(exchange);
            String user = extractString(body, "username", "");
            String pass = extractString(body, "password", "");

            if (("admin".equalsIgnoreCase(user) && "admin123".equals(pass)) ||
                ("student".equalsIgnoreCase(user) && "password123".equals(pass)) ||
                ("operator".equalsIgnoreCase(user) && "traffic2026".equals(pass))) {
                String resp = String.format(Locale.US,
                    "{\"status\":\"SUCCESS\",\"username\":\"%s\",\"role\":\"Traffic Operations Controller\",\"token\":\"auth_token_%d\"}",
                    user, System.currentTimeMillis());
                sendJsonResponse(exchange, 200, resp);
            } else {
                String resp = "{\"status\":\"ERROR\",\"message\":\"Invalid credentials. Default is admin / admin123\"}";
                sendJsonResponse(exchange, 401, resp);
            }
        }
    }

    static class StaticFileHandler implements HttpHandler {
        private final String baseDir;

        public StaticFileHandler(String baseDir) {
            this.baseDir = baseDir;
        }

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (path == null || path.equals("/") || path.isEmpty()) {
                path = "/login.html";
            }

            File file = new File(baseDir, path.substring(1));
            if (!file.exists() || file.isDirectory()) {
                // Try inside frontend subdirectory
                file = new File("frontend", path.substring(1));
            }

            if (!file.exists() || file.isDirectory()) {
                String notFound = "404 Not Found: " + path;
                exchange.sendResponseHeaders(404, notFound.length());
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(notFound.getBytes());
                }
                return;
            }

            String contentType = "text/html; charset=UTF-8";
            String lower = file.getName().toLowerCase();
            if (lower.endsWith(".css")) contentType = "text/css; charset=UTF-8";
            else if (lower.endsWith(".js")) contentType = "application/javascript; charset=UTF-8";
            else if (lower.endsWith(".json")) contentType = "application/json; charset=UTF-8";
            else if (lower.endsWith(".svg")) contentType = "image/svg+xml";
            else if (lower.endsWith(".png")) contentType = "image/png";

            exchange.getResponseHeaders().set("Content-Type", contentType);
            exchange.sendResponseHeaders(200, file.length());
            try (OutputStream os = exchange.getResponseBody();
                 FileInputStream fis = new FileInputStream(file)) {
                byte[] buf = new byte[4096];
                int n;
                while ((n = fis.read(buf)) != -1) {
                    os.write(buf, 0, n);
                }
            }
        }
    }
}
