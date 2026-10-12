/**
 * Leaky Bucket Algorithm Simulator
 * Visualizes packet buffering, traffic shaping, overflow drop,
 * and Constant Bit Rate (CBR) output stream.
 */

class LeakyBucketModule {
  constructor() {
    this.capacityInput = document.getElementById('lbCapacity');
    this.leakRateInput = document.getElementById('lbLeakRate');
    this.arrivalPatternSelect = document.getElementById('lbArrivalPattern');
    this.burstBtn = document.getElementById('btnLbSendBurst');
    this.startBtn = document.getElementById('btnLbStart');
    this.resetBtn = document.getElementById('btnLbReset');

    // Visual Elements
    this.waterElement = document.getElementById('lbWaterFill');
    this.overflowAlert = document.getElementById('lbOverflowAlert');
    this.timelineTableBody = document.getElementById('lbTimelineTableBody');
    this.chartCanvas = document.getElementById('lbChartCanvas');

    // Metric Displays
    this.dispArrived = document.getElementById('lbDispArrived');
    this.dispAccepted = document.getElementById('lbDispAccepted');
    this.dispDropped = document.getElementById('lbDispDropped');
    this.dispCurrentLevel = document.getElementById('lbDispCurrentLevel');
    this.dispOccupancy = document.getElementById('lbDispOccupancy');

    // State
    this.capacity = 20;
    this.leakRate = 4;
    this.currentLevel = 0;
    this.totalArrived = 0;
    this.totalAccepted = 0;
    this.totalDropped = 0;
    this.totalTransmitted = 0;
    this.timeline = [];
    this.simRunning = false;
    this.simInterval = null;
    this.simTick = 0;

    this.bindEvents();
    this.updateVisuals();
  }

  bindEvents() {
    if (this.capacityInput) {
      this.capacityInput.addEventListener('input', () => {
        this.capacity = parseInt(this.capacityInput.value, 10) || 10;
        this.updateVisuals();
      });
    }

    if (this.leakRateInput) {
      this.leakRateInput.addEventListener('input', () => {
        this.leakRate = parseInt(this.leakRateInput.value, 10) || 2;
      });
    }

    if (this.burstBtn) {
      this.burstBtn.addEventListener('click', () => {
        const burstSize = Math.floor(Math.random() * 12) + 8; // 8-20 packets
        this.processIncoming(burstSize);
      });
    }

    if (this.startBtn) {
      this.startBtn.addEventListener('click', () => {
        if (this.simRunning) {
          this.stopSimulation();
        } else {
          this.startSimulation();
        }
      });
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => this.resetSimulation());
    }
  }

  startSimulation() {
    this.simRunning = true;
    this.startBtn.innerHTML = '<span>⏸ Pause Simulation</span>';
    this.startBtn.classList.add('btn-secondary');

    const pattern = this.arrivalPatternSelect ? this.arrivalPatternSelect.value : 'BURSTY';
    const sequences = {
      BURSTY: [6, 12, 18, 2, 20, 4, 15, 2, 0, 14, 3, 1],
      STEADY: [4, 5, 4, 4, 5, 4, 4, 5, 4, 5, 4, 4],
      HEAVY: [10, 15, 14, 18, 16, 20, 14, 12, 15, 18, 16, 14]
    };
    const seq = sequences[pattern] || sequences.BURSTY;

    this.simInterval = setInterval(() => {
      const incoming = seq[this.simTick % seq.length];
      this.simTick++;
      this.processIncoming(incoming);
    }, 1200);
  }

  stopSimulation() {
    this.simRunning = false;
    clearInterval(this.simInterval);
    this.startBtn.innerHTML = '<span>▶ Start Simulation</span>';
    this.startBtn.classList.remove('btn-secondary');
  }

  resetSimulation() {
    this.stopSimulation();
    this.currentLevel = 0;
    this.totalArrived = 0;
    this.totalAccepted = 0;
    this.totalDropped = 0;
    this.totalTransmitted = 0;
    this.timeline = [];
    this.simTick = 0;
    this.updateVisuals();
    if (this.timelineTableBody) this.timelineTableBody.innerHTML = '';
    this.drawChart();
  }

  processIncoming(incoming) {
    this.totalArrived += incoming;

    const freeSpace = Math.max(0, this.capacity - this.currentLevel);
    let accepted = 0;
    let dropped = 0;

    if (incoming <= freeSpace) {
      accepted = incoming;
      dropped = 0;
      if (this.overflowAlert) this.overflowAlert.style.display = 'none';
    } else {
      accepted = freeSpace;
      dropped = incoming - freeSpace;
      if (this.overflowAlert) {
        this.overflowAlert.style.display = 'block';
        this.overflowAlert.textContent = `⚠ Overflow! Dropped ${dropped} pkts`;
        setTimeout(() => {
          if (this.overflowAlert) this.overflowAlert.style.display = 'none';
        }, 1100);
      }
    }

    this.totalAccepted += accepted;
    this.totalDropped += dropped;

    const beforeLeak = this.currentLevel + accepted;
    const leaked = Math.min(beforeLeak, this.leakRate);
    this.totalTransmitted += leaked;

    this.currentLevel = beforeLeak - leaked;

    const occupancyPercent = ((this.currentLevel / this.capacity) * 100).toFixed(1);

    const step = {
      time: this.timeline.length + 1,
      incoming,
      accepted,
      dropped,
      leaked,
      level: this.currentLevel,
      occupancy: occupancyPercent
    };
    this.timeline.push(step);

    this.updateVisuals();
    this.addTimelineRow(step);
    this.drawChart();
  }

  updateVisuals() {
    if (this.dispArrived) this.dispArrived.textContent = this.totalArrived;
    if (this.dispAccepted) this.dispAccepted.textContent = this.totalAccepted;
    if (this.dispDropped) this.dispDropped.textContent = this.totalDropped;
    if (this.dispCurrentLevel) this.dispCurrentLevel.textContent = `${this.currentLevel} / ${this.capacity} pkts`;

    const occ = Math.min(100, (this.currentLevel / this.capacity) * 100);
    if (this.dispOccupancy) this.dispOccupancy.textContent = `${occ.toFixed(0)}%`;

    if (this.waterElement) {
      this.waterElement.style.height = `${occ}%`;
      if (occ > 85) {
        this.waterElement.style.background = 'linear-gradient(to top, #DC2626, #EF4444)';
      } else if (occ > 60) {
        this.waterElement.style.background = 'linear-gradient(to top, #D97706, #F59E0B)';
      } else {
        this.waterElement.style.background = 'linear-gradient(to top, rgba(67, 97, 238, 0.85), rgba(76, 201, 240, 0.75))';
      }
    }
  }

  addTimelineRow(step) {
    if (!this.timelineTableBody) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${step.time}s</strong></td>
      <td><span class="badge badge-blue">+${step.incoming} pkts</span></td>
      <td><span class="badge badge-green">${step.accepted} pkts</span></td>
      <td><span class="badge ${step.dropped > 0 ? 'badge-red' : 'badge-blue'}">${step.dropped} pkts</span></td>
      <td><span class="badge badge-green">${step.leaked} pkts/s</span></td>
      <td>${step.level} (${step.occupancy}%)</td>
    `;
    this.timelineTableBody.insertBefore(tr, this.timelineTableBody.firstChild);

    // Keep table to last 15 rows for neatness
    while (this.timelineTableBody.children.length > 15) {
      this.timelineTableBody.removeChild(this.timelineTableBody.lastChild);
    }
  }

  drawChart() {
    if (!this.chartCanvas) return;
    const ctx = this.chartCanvas.getContext('2d');
    const width = this.chartCanvas.parentElement.clientWidth || 400;
    const height = 220;

    this.chartCanvas.width = width;
    this.chartCanvas.height = height;

    ctx.clearRect(0, 0, width, height);

    if (this.timeline.length < 2) {
      ctx.fillStyle = '#64748B';
      ctx.font = '12px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText('Awaiting simulation timeline data...', width / 2, height / 2);
      return;
    }

    const data = this.timeline.slice(-14); // show last 14 seconds
    const maxVal = Math.max(25, ...data.map(d => Math.max(d.incoming, d.leaked, d.level)));

    const padL = 35;
    const padB = 30;
    const padR = 15;
    const padT = 20;

    const chartW = width - padL - padR;
    const chartH = height - padB - padT;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(width - padR, y);
      ctx.stroke();

      const labelVal = Math.round(maxVal - (maxVal / 4) * i);
      ctx.fillStyle = '#64748B';
      ctx.font = '9px JetBrains Mono';
      ctx.textAlign = 'right';
      ctx.fillText(labelVal, padL - 6, y + 3);
    }

    const getX = (idx) => padL + (chartW / (data.length - 1)) * idx;
    const getY = (val) => padT + chartH - (val / maxVal) * chartH;

    // Draw Inflow (Bursty Blue line)
    ctx.beginPath();
    ctx.strokeStyle = '#4CC9F0';
    ctx.lineWidth = 2;
    data.forEach((d, idx) => {
      const x = getX(idx);
      const y = getY(d.incoming);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw Outflow (Smooth Green line)
    ctx.beginPath();
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2.5;
    data.forEach((d, idx) => {
      const x = getX(idx);
      const y = getY(d.leaked);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Legend
    ctx.font = '10px Outfit';
    ctx.fillStyle = '#4CC9F0';
    ctx.fillText('● Bursty Inflow', padL + 10, 14);
    ctx.fillStyle = '#10B981';
    ctx.fillText('● Constant Leak (CBR)', padL + 120, 14);
  }
}

window.LeakyBucketModule = LeakyBucketModule;
