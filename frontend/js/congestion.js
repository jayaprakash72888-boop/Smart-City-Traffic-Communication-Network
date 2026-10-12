/**
 * Network Congestion & Performance Evaluation Module
 * Implements Low, Medium, High, Extreme traffic simulation and exact CNIP formulas:
 *  - Packet Loss Rate = (Lost / Sent) * 100
 *  - Throughput = (Bits / Seconds)
 *  - Packet Delivery Ratio = (Received / Sent) * 100
 *  - Average Delay (ms)
 */

class CongestionModule {
  constructor() {
    this.trafficLevel = 'MEDIUM';
    this.simRunning = false;
    this.simInterval = null;
    this.tick = 0;
    this.maxTicks = 20;

    // Data Series
    this.history = [];

    // UI Buttons
    this.btnLow = document.getElementById('btnTrafficLow');
    this.btnMed = document.getElementById('btnTrafficMed');
    this.btnHigh = document.getElementById('btnTrafficHigh');
    this.btnExtreme = document.getElementById('btnTrafficExtreme');

    this.btnStart = document.getElementById('btnCongestionStart');
    this.btnPause = document.getElementById('btnCongestionPause');
    this.btnReset = document.getElementById('btnCongestionReset');
    this.btnExport = document.getElementById('btnExportCsv');

    // KPI Elements
    this.dispSent = document.getElementById('cgDispSent');
    this.dispReceived = document.getElementById('cgDispReceived');
    this.dispLost = document.getElementById('cgDispLost');
    this.dispLossRate = document.getElementById('cgDispLossRate');
    this.dispThroughput = document.getElementById('cgDispThroughput');
    this.dispPdr = document.getElementById('cgDispPdr');
    this.dispDelay = document.getElementById('cgDispDelay');
    this.dispQueue = document.getElementById('cgDispQueue');
    this.dispBottleneck = document.getElementById('cgDispBottleneck');
    this.dispStatus = document.getElementById('cgDispStatus');

    this.tableBody = document.getElementById('congestionResultsTableBody');

    this.bindEvents();
    this.setTrafficLevel('MEDIUM');
  }

  bindEvents() {
    if (this.btnLow) this.btnLow.addEventListener('click', () => this.setTrafficLevel('LOW'));
    if (this.btnMed) this.btnMed.addEventListener('click', () => this.setTrafficLevel('MEDIUM'));
    if (this.btnHigh) this.btnHigh.addEventListener('click', () => this.setTrafficLevel('HIGH'));
    if (this.btnExtreme) this.btnExtreme.addEventListener('click', () => this.setTrafficLevel('EXTREME'));

    if (this.btnStart) this.btnStart.addEventListener('click', () => this.startSimulation());
    if (this.btnPause) this.btnPause.addEventListener('click', () => this.pauseSimulation());
    if (this.btnReset) this.btnReset.addEventListener('click', () => this.resetSimulation());
    if (this.btnExport) this.btnExport.addEventListener('click', () => this.exportCsv());
  }

  setTrafficLevel(level) {
    this.trafficLevel = level;
    [this.btnLow, this.btnMed, this.btnHigh, this.btnExtreme].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });

    if (level === 'LOW' && this.btnLow) this.btnLow.classList.add('active');
    else if (level === 'MEDIUM' && this.btnMed) this.btnMed.classList.add('active');
    else if (level === 'HIGH' && this.btnHigh) this.btnHigh.classList.add('active');
    else if (level === 'EXTREME' && this.btnExtreme) this.btnExtreme.classList.add('active');

    if (!this.simRunning) {
      this.fetchOrGeneratePreset(level);
    }
  }

  async fetchOrGeneratePreset(level) {
    let report = null;
    try {
      report = await window.ApiClient.post('/api/congestion', { level, duration: 15 });
    } catch (e) {
      // Backend not reached, fall back to local computation
    }

    if (!report) {
      report = this.evaluateLocalCongestion(level, 15);
    }

    this.applyReport(report);
  }

  startSimulation() {
    if (this.simRunning) return;
    this.simRunning = true;
    if (this.btnStart) this.btnStart.disabled = true;
    if (this.btnPause) this.btnPause.disabled = false;

    // Run active tick simulation
    this.simInterval = setInterval(() => {
      this.tick++;
      this.simulateNextStep();
      if (this.tick >= this.maxTicks) {
        this.pauseSimulation();
      }
    }, 1000);
  }

  pauseSimulation() {
    this.simRunning = false;
    clearInterval(this.simInterval);
    if (this.btnStart) this.btnStart.disabled = false;
    if (this.btnPause) this.btnPause.disabled = true;
  }

  resetSimulation() {
    this.pauseSimulation();
    this.tick = 0;
    this.history = [];
    if (this.tableBody) this.tableBody.innerHTML = '';
    this.fetchOrGeneratePreset(this.trafficLevel);
  }

  simulateNextStep() {
    // Determine traffic rates based on level
    const baseRates = { LOW: 24, MEDIUM: 70, HIGH: 145, EXTREME: 270 };
    const baseRate = baseRates[this.trafficLevel] || 70;
    const jitter = Math.floor((Math.random() - 0.5) * (baseRate * 0.2));
    const generated = Math.max(5, baseRate + jitter);

    const channelCap = 110; // bottleneck capacity
    const bufferMax = 50;

    const prevQueue = this.history.length > 0 ? this.history[this.history.length - 1].queue : 0;
    const space = Math.max(0, bufferMax - prevQueue);
    const accepted = Math.min(generated, space);
    const lost = generated - accepted;

    const currentBuffer = prevQueue + accepted;
    const transmitted = Math.min(currentBuffer, channelCap);
    const endQueue = currentBuffer - transmitted;

    const packetSizeBytes = 512;
    const secThroughputKbps = (transmitted * packetSizeBytes * 8) / 1000.0;
    const queuingDelay = (endQueue / channelCap) * 1000.0;
    const baseDelay = 12 + (this.trafficLevel === 'LOW' ? 2 : this.trafficLevel === 'MEDIUM' ? 8 : 28);
    const secDelay = baseDelay + queuingDelay;

    const point = {
      time: this.tick,
      sent: generated,
      received: transmitted,
      lost: lost,
      throughput: secThroughputKbps,
      delay: secDelay,
      queue: endQueue
    };

    this.history.push(point);
    this.updateLiveDisplays();
  }

  updateLiveDisplays() {
    const totalSent = this.history.reduce((a, b) => a + b.sent, 0);
    const totalRecv = this.history.reduce((a, b) => a + b.received, 0);
    const totalLost = this.history.reduce((a, b) => a + b.lost, 0);

    const lossRate = totalSent > 0 ? (totalLost / totalSent) * 100 : 0;
    const pdr = totalSent > 0 ? (totalRecv / totalSent) * 100 : 100;
    const avgThroughput = this.history.length > 0
      ? this.history.reduce((a, b) => a + b.throughput, 0) / this.history.length
      : 0;
    const avgDelay = this.history.length > 0
      ? this.history.reduce((a, b) => a + b.delay, 0) / this.history.length
      : 0;
    const currentQueue = this.history.length > 0 ? this.history[this.history.length - 1].queue : 0;
    const queuePct = Math.min(100, Math.round((currentQueue / 50) * 100));

    if (this.dispSent) this.dispSent.textContent = totalSent;
    if (this.dispReceived) this.dispReceived.textContent = totalRecv;
    if (this.dispLost) this.dispLost.textContent = totalLost;
    if (this.dispLossRate) this.dispLossRate.textContent = `${lossRate.toFixed(2)}%`;
    if (this.dispThroughput) this.dispThroughput.textContent = `${avgThroughput.toFixed(1)} kbps`;
    if (this.dispPdr) this.dispPdr.textContent = `${pdr.toFixed(1)}%`;
    if (this.dispDelay) this.dispDelay.textContent = `${avgDelay.toFixed(1)} ms`;
    if (this.dispQueue) this.dispQueue.textContent = `${queuePct}% (${currentQueue} pkts)`;

    // Bottlenecks
    let bottleneck = 'None';
    let status = 'OPTIMAL';
    if (this.trafficLevel === 'MEDIUM') {
      bottleneck = 'Junction B (North Cross)';
      status = 'MODERATE';
    } else if (this.trafficLevel === 'HIGH') {
      bottleneck = 'Junction F (Tech Corridor)';
      status = 'CONGESTED';
    } else if (this.trafficLevel === 'EXTREME') {
      bottleneck = 'Junction F & Junction A (Buffer Exhausted)';
      status = 'CRITICAL COLLAPSE';
    }

    if (this.dispBottleneck) this.dispBottleneck.textContent = bottleneck;
    if (this.dispStatus) {
      this.dispStatus.textContent = status;
      this.dispStatus.className = 'badge ' + (status === 'OPTIMAL' ? 'badge-green' : (status === 'MODERATE' ? 'badge-blue' : (status === 'CONGESTED' ? 'badge-amber' : 'badge-red')));
    }

    // Add table row
    const latest = this.history[this.history.length - 1];
    if (latest && this.tableBody) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>T+${latest.time}s</strong></td>
        <td>${this.trafficLevel}</td>
        <td>${latest.sent}</td>
        <td>${latest.received}</td>
        <td><span class="${latest.lost > 0 ? 'badge badge-red' : 'badge badge-green'}">${latest.lost}</span></td>
        <td>${latest.throughput.toFixed(1)} kbps</td>
        <td>${latest.delay.toFixed(1)} ms</td>
        <td>${latest.queue} pkts</td>
      `;
      this.tableBody.insertBefore(tr, this.tableBody.firstChild);
      while (this.tableBody.children.length > 15) {
        this.tableBody.removeChild(this.tableBody.lastChild);
      }
    }

    this.renderCharts();
  }

  applyReport(report) {
    if (this.dispSent) this.dispSent.textContent = report.packetsSent;
    if (this.dispReceived) this.dispReceived.textContent = report.packetsReceived;
    if (this.dispLost) this.dispLost.textContent = report.packetsLost;
    if (this.dispLossRate) this.dispLossRate.textContent = `${report.packetLossRatePercent.toFixed(2)}%`;
    if (this.dispThroughput) this.dispThroughput.textContent = `${report.throughputKbps.toFixed(1)} kbps`;
    if (this.dispPdr) this.dispPdr.textContent = `${report.packetDeliveryRatioPercent.toFixed(1)}%`;
    if (this.dispDelay) this.dispDelay.textContent = `${report.averageDelayMs.toFixed(1)} ms`;
    if (this.dispQueue) this.dispQueue.textContent = `${report.queueOccupancyPercent}%`;
    if (this.dispBottleneck) this.dispBottleneck.textContent = report.bottleneckNode;
    if (this.dispStatus) {
      this.dispStatus.textContent = report.congestionState;
      this.dispStatus.className = 'badge ' + (report.congestionState === 'OPTIMAL' ? 'badge-green' : (report.congestionState === 'MODERATE' ? 'badge-blue' : (report.congestionState === 'CONGESTED' ? 'badge-amber' : 'badge-red')));
    }

    this.history = report.history.map(h => ({
      time: h.timeSec || h.time,
      sent: h.sent,
      received: h.received,
      lost: h.lost,
      throughput: h.throughputKbps || h.throughput,
      delay: h.delayMs || h.delay,
      queue: h.queueLength || h.queue
    }));

    if (this.tableBody) {
      this.tableBody.innerHTML = '';
      this.history.forEach(h => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>T+${h.time}s</strong></td>
          <td>${report.trafficLevel}</td>
          <td>${h.sent}</td>
          <td>${h.received}</td>
          <td><span class="${h.lost > 0 ? 'badge badge-red' : 'badge badge-green'}">${h.lost}</span></td>
          <td>${h.throughput.toFixed(1)} kbps</td>
          <td>${h.delay.toFixed(1)} ms</td>
          <td>${h.queue} pkts</td>
        `;
        this.tableBody.appendChild(tr);
      });
    }

    this.renderCharts();
  }

  renderCharts() {
    if (!window.TrafficCharts || this.history.length === 0) return;

    const labels = this.history.map(h => `${h.time}s`);

    // Chart 1: Throughput vs Time
    TrafficCharts.renderLineChart('chartThroughputCanvas', {
      height: 240,
      labels: labels,
      unit: 'kbps',
      series: [
        {
          name: 'Received Throughput (kbps)',
          data: this.history.map(h => h.throughput),
          color: '#4CC9F0',
          fill: true,
          fillColor: 'rgba(76, 201, 240, 0.2)'
        }
      ]
    });

    // Chart 2: Packet Loss & Queue Occupancy
    TrafficCharts.renderLineChart('chartLossQueueCanvas', {
      height: 240,
      labels: labels,
      unit: 'pkts',
      series: [
        {
          name: 'Queue Buffer Length',
          data: this.history.map(h => h.queue),
          color: '#F59E0B',
          fill: false
        },
        {
          name: 'Packets Dropped',
          data: this.history.map(h => h.lost),
          color: '#EF4444',
          fill: true,
          fillColor: 'rgba(239, 68, 68, 0.2)'
        }
      ]
    });

    // Chart 3: Average Latency
    TrafficCharts.renderLineChart('chartDelayCanvas', {
      height: 240,
      labels: labels,
      unit: 'ms',
      series: [
        {
          name: 'End-to-End Delay (ms)',
          data: this.history.map(h => h.delay),
          color: '#10B981',
          fill: true,
          fillColor: 'rgba(16, 185, 129, 0.15)'
        }
      ]
    });
  }

  evaluateLocalCongestion(level, duration) {
    const rates = { LOW: 25, MEDIUM: 75, HIGH: 140, EXTREME: 260 };
    const rate = rates[level] || 75;
    const packetSizeBytes = 512;
    const channelCap = 120;
    const bufferMax = 50;

    let totalSent = 0;
    let totalRecv = 0;
    let totalLost = 0;
    let queue = 0;
    let totalDelay = 0;
    const history = [];

    for (let t = 1; t <= duration; t++) {
      const sent = rate + Math.floor((Math.random() - 0.5) * (rate * 0.15));
      totalSent += sent;

      const space = bufferMax - queue;
      const accepted = Math.min(sent, Math.max(0, space));
      const lost = sent - accepted;
      totalLost += lost;

      queue += accepted;
      const transmitted = Math.min(queue, channelCap);
      queue -= transmitted;
      totalRecv += transmitted;

      const queuingDelay = (queue / channelCap) * 1000.0;
      const baseDelay = 12 + (level === 'LOW' ? 2 : level === 'MEDIUM' ? 8 : 25);
      const delay = baseDelay + queuingDelay;
      totalDelay += delay;

      const throughput = (transmitted * packetSizeBytes * 8) / 1000.0;
      history.push({ time: t, sent, received: transmitted, lost, throughput, delay, queue });
    }

    const lossRate = totalSent > 0 ? (totalLost / totalSent) * 100 : 0;
    const pdr = totalSent > 0 ? (totalRecv / totalSent) * 100 : 100;
    const throughputKbps = (totalRecv * packetSizeBytes * 8) / (duration * 1000.0);

    return {
      trafficLevel: level,
      packetsSent: totalSent,
      packetsReceived: totalRecv,
      packetsLost: totalLost,
      packetLossRatePercent: lossRate,
      packetDeliveryRatioPercent: pdr,
      throughputKbps: throughputKbps,
      averageDelayMs: totalDelay / duration,
      queueOccupancyPercent: Math.round((queue / bufferMax) * 100),
      bottleneckNode: level === 'LOW' ? 'None (Uncongested)' : (level === 'MEDIUM' ? 'Junction B' : 'Junction F (Tech Corridor)'),
      congestionState: level === 'LOW' ? 'OPTIMAL' : (level === 'MEDIUM' ? 'MODERATE' : (level === 'HIGH' ? 'CONGESTED' : 'CRITICAL_COLLAPSE')),
      history: history
    };
  }

  exportCsv() {
    if (this.history.length === 0) {
      alert('No simulation data available to export.');
      return;
    }

    let csv = 'Timestamp (s),Traffic Level,Packets Sent,Packets Received,Packets Lost,Throughput (kbps),Delay (ms),Queue Length\n';
    this.history.forEach(h => {
      csv += `T+${h.time}s,${this.trafficLevel},${h.sent},${h.received},${h.lost},${h.throughput.toFixed(2)},${h.delay.toFixed(2)},${h.queue}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `traffic_congestion_${this.trafficLevel.toLowerCase()}_results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

window.CongestionModule = CongestionModule;
