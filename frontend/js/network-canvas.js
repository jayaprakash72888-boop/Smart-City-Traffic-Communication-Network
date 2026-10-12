/**
 * Smart City Traffic Network - Interactive Canvas Topology Engine
 * Renders 8 Smart Traffic Signal Intersections, roads, animated packets,
 * and highlights Dijkstra shortest path.
 */

class NetworkCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Default 8 Traffic Intersections across the Smart City
    this.nodes = [
      { id: 0, code: 'J_A', name: 'Junction A - Central Hub', type: 'Central Hub', x: 150, y: 150, vehicles: 45, signal: 'GREEN', queue: 5 },
      { id: 1, code: 'J_B', name: 'Junction B - North Cross', type: 'Crossroad', x: 380, y: 80, vehicles: 32, signal: 'RED', queue: 14 },
      { id: 2, code: 'J_C', name: 'Junction C - East Gateway', type: 'Commercial Gateway', x: 640, y: 110, vehicles: 28, signal: 'GREEN', queue: 8 },
      { id: 3, code: 'J_D', name: 'Junction D - South Terminal', type: 'Transit Terminal', x: 420, y: 400, vehicles: 52, signal: 'GREEN', queue: 9 },
      { id: 4, code: 'J_E', name: 'Junction E - West Bridge', type: 'Bridge Overpass', x: 140, y: 370, vehicles: 22, signal: 'YELLOW', queue: 3 },
      { id: 5, code: 'J_F', name: 'Junction F - Tech Corridor', type: 'Smart Junction', x: 400, y: 240, vehicles: 60, signal: 'GREEN', queue: 18 },
      { id: 6, code: 'J_G', name: 'Junction G - Metro Station', type: 'Metro Exchange', x: 660, y: 320, vehicles: 40, signal: 'RED', queue: 12 },
      { id: 7, code: 'J_H', name: 'Junction H - Airport Express', type: 'Expressway Gateway', x: 880, y: 220, vehicles: 35, signal: 'GREEN', queue: 6 }
    ];

    // Communication & Road Links
    this.links = [
      { from: 0, to: 1, cost: 4, bw: '100M', delay: 5, active: true },
      { from: 0, to: 4, cost: 5, bw: '54M', delay: 8, active: true },
      { from: 0, to: 5, cost: 3, bw: '100M', delay: 4, active: true },
      { from: 1, to: 2, cost: 6, bw: '100M', delay: 6, active: true },
      { from: 1, to: 5, cost: 2, bw: '100M', delay: 3, active: true },
      { from: 2, to: 6, cost: 4, bw: '54M', delay: 7, active: true },
      { from: 2, to: 7, cost: 5, bw: '100M', delay: 5, active: true },
      { from: 3, to: 4, cost: 6, bw: '54M', delay: 9, active: true },
      { from: 3, to: 5, cost: 4, bw: '100M', delay: 5, active: true },
      { from: 3, to: 6, cost: 3, bw: '100M', delay: 4, active: true },
      { from: 5, to: 6, cost: 3, bw: '100M', delay: 3, active: true },
      { from: 6, to: 7, cost: 4, bw: '100M', delay: 4, active: true }
    ];

    // Shortest path node indices to highlight
    this.highlightPath = [];
    this.highlightEdges = new Set();

    // Animated packets flowing along links
    this.packets = [];
    this.initPackets();

    // Pulse animation timer
    this.animTime = 0;
    this.selectedNode = null;

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.setupInteractivity();
    this.startAnimation();
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = Math.max(480, Math.min(540, window.innerHeight * 0.55));

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(dpr, dpr);
    this.scaleNodes();
  }

  scaleNodes() {
    // Normalizes coordinate system to current canvas dimensions
    const baseW = 1000;
    const baseH = 480;
    const scaleX = (this.width - 100) / baseW;
    const scaleY = (this.height - 80) / baseH;

    const baseCoords = [
      { x: 120, y: 140 },
      { x: 360, y: 70 },
      { x: 620, y: 90 },
      { x: 380, y: 400 },
      { x: 130, y: 360 },
      { x: 380, y: 230 },
      { x: 640, y: 310 },
      { x: 860, y: 210 }
    ];

    this.nodes.forEach((n, i) => {
      n.x = 50 + baseCoords[i].x * scaleX;
      n.y = 40 + baseCoords[i].y * scaleY;
    });
  }

  initPackets() {
    this.packets = [];
    for (let i = 0; i < 16; i++) {
      const link = this.links[Math.floor(Math.random() * this.links.length)];
      if (link.active) {
        this.packets.push({
          from: link.from,
          to: link.to,
          progress: Math.random(),
          speed: 0.004 + Math.random() * 0.006,
          isTcp: Math.random() > 0.6
        });
      }
    }
  }

  setHighlightPath(pathArray) {
    this.highlightPath = pathArray || [];
    this.highlightEdges.clear();
    for (let i = 0; i < this.highlightPath.length - 1; i++) {
      const u = this.highlightPath[i];
      const v = this.highlightPath[i + 1];
      this.highlightEdges.add(`${Math.min(u, v)}-${Math.max(u, v)}`);
    }
  }

  setupInteractivity() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let found = null;
      for (const node of this.nodes) {
        const dx = mouseX - node.x;
        const dy = mouseY - node.y;
        if (Math.sqrt(dx * dx + dy * dy) <= 24) {
          found = node;
          break;
        }
      }

      this.selectedNode = found;
      if (found && window.onNodeSelected) {
        window.onNodeSelected(found);
      }
    });
  }

  startAnimation() {
    const loop = () => {
      this.animTime += 0.03;
      this.updateSimulation();
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  updateSimulation() {
    // Update simulated packets along links
    this.packets.forEach(p => {
      p.progress += p.speed;
      if (p.progress >= 1) {
        p.progress = 0;
        // Optionally reroute to random neighbor
        const availableLinks = this.links.filter(l => (l.from === p.to || l.to === p.to) && l.active);
        if (availableLinks.length > 0) {
          const nextLink = availableLinks[Math.floor(Math.random() * availableLinks.length)];
          p.from = p.to;
          p.to = (nextLink.from === p.from) ? nextLink.to : nextLink.from;
        }
      }
    });

    // Traffic light cycle toggles slowly
    if (Math.floor(this.animTime * 3) % 150 === 0) {
      const n = this.nodes[Math.floor(Math.random() * this.nodes.length)];
      n.signal = (n.signal === 'GREEN') ? 'RED' : (n.signal === 'RED') ? 'YELLOW' : 'GREEN';
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Draw Grid Background
    this.drawCityGrid();

    // Draw Links (Roads & Fiber Cables)
    this.links.forEach(link => {
      this.drawLink(link);
    });

    // Draw Moving Data Packets / Vehicles
    this.packets.forEach(p => {
      this.drawPacket(p);
    });

    // Draw Nodes (Smart Intersections)
    this.nodes.forEach(node => {
      this.drawNode(node);
    });
  }

  drawCityGrid() {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(67, 97, 238, 0.04)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < this.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawLink(link) {
    const ctx = this.ctx;
    const u = this.nodes[link.from];
    const v = this.nodes[link.to];
    if (!u || !v) return;

    const edgeKey = `${Math.min(link.from, link.to)}-${Math.max(link.from, link.to)}`;
    const isHighlighted = this.highlightEdges.has(edgeKey);

    ctx.save();

    // Road Base
    ctx.beginPath();
    ctx.moveTo(u.x, u.y);
    ctx.lineTo(v.x, v.y);

    if (!link.active) {
      // Broken / inactive link
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
    } else if (isHighlighted) {
      // Glowing Neon Cyan / Lime Highlight for Dijkstra Shortest Path
      ctx.strokeStyle = '#4CC9F0';
      ctx.lineWidth = 5;
      ctx.shadowColor = '#4CC9F0';
      ctx.shadowBlur = 18;
      ctx.stroke();

      // Inner intense core
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 0;
      ctx.stroke();
    } else {
      // Normal Link
      ctx.strokeStyle = 'rgba(67, 97, 238, 0.28)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Draw Cost & Bandwidth badge at midpoint
    const midX = (u.x + v.x) / 2;
    const midY = (u.y + v.y) / 2;

    ctx.fillStyle = '#080D21';
    ctx.strokeStyle = isHighlighted ? '#4CC9F0' : 'rgba(67, 97, 238, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.roundRect(midX - 22, midY - 11, 44, 22, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isHighlighted ? '#4CC9F0' : '#94A3B8';
    ctx.font = '600 10px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${link.cost}km`, midX, midY);

    ctx.restore();
  }

  drawPacket(p) {
    const ctx = this.ctx;
    const u = this.nodes[p.from];
    const v = this.nodes[p.to];
    if (!u || !v) return;

    const curX = u.x + (v.x - u.x) * p.progress;
    const curY = u.y + (v.y - u.y) * p.progress;

    const edgeKey = `${Math.min(p.from, p.to)}-${Math.max(p.from, p.to)}`;
    const isHighlighted = this.highlightEdges.has(edgeKey);

    ctx.save();
    ctx.beginPath();
    ctx.arc(curX, curY, isHighlighted ? 5 : 3.5, 0, Math.PI * 2);

    if (isHighlighted) {
      ctx.fillStyle = '#4CC9F0';
      ctx.shadowColor = '#4CC9F0';
      ctx.shadowBlur = 12;
    } else if (p.isTcp) {
      ctx.fillStyle = '#EF4444'; // Red TCP Control signal
      ctx.shadowColor = '#EF4444';
      ctx.shadowBlur = 6;
    } else {
      ctx.fillStyle = '#10B981'; // Green UDP telemetry
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 6;
    }

    ctx.fill();
    ctx.restore();
  }

  drawNode(node) {
    const ctx = this.ctx;
    const isSelected = this.selectedNode && this.selectedNode.id === node.id;
    const inShortestPath = this.highlightPath.includes(node.id);

    ctx.save();

    // Pulsing outer radar halo
    const pulseRadius = 24 + Math.sin(this.animTime * 3 + node.id) * 4;
    ctx.beginPath();
    ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2);
    ctx.fillStyle = inShortestPath ? 'rgba(76, 201, 240, 0.15)' : 'rgba(67, 97, 238, 0.08)';
    ctx.fill();

    // Node Outer Ring
    ctx.beginPath();
    ctx.arc(node.x, node.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? '#1E293B' : '#0B132B';
    ctx.strokeStyle = inShortestPath ? '#4CC9F0' : (isSelected ? '#FFFFFF' : 'rgba(67, 97, 238, 0.6)');
    ctx.lineWidth = inShortestPath ? 3 : 2;
    if (inShortestPath) {
      ctx.shadowColor = '#4CC9F0';
      ctx.shadowBlur = 15;
    }
    ctx.fill();
    ctx.stroke();

    // Traffic Signal Indicator Dot
    ctx.beginPath();
    ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
    let sigColor = '#10B981';
    if (node.signal === 'RED') sigColor = '#EF4444';
    else if (node.signal === 'YELLOW') sigColor = '#F59E0B';
    ctx.fillStyle = sigColor;
    ctx.shadowColor = sigColor;
    ctx.shadowBlur = 8;
    ctx.fill();

    // Junction Code Label
    ctx.shadowBlur = 0;
    ctx.fillStyle = inShortestPath ? '#4CC9F0' : '#FFFFFF';
    ctx.font = '700 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(node.code, node.x, node.y - 28);

    // Subtitle / Queue status badge
    ctx.fillStyle = 'rgba(148, 163, 184, 0.85)';
    ctx.font = '500 9px JetBrains Mono';
    ctx.fillText(`Q:${node.queue}`, node.x, node.y + 32);

    ctx.restore();
  }
}

// Global hook
window.NetworkCanvas = NetworkCanvas;
