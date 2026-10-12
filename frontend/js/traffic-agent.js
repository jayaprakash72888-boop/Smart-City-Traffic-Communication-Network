/**
 * Autonomous Traffic Control & Routing Agent (Sentinel-Agent)
 * Simulates intelligent multi-intersection supervision, dynamic signal overrides,
 * adaptive Dijkstra shortest-path reroutes, and automated traffic shaping.
 */

class TrafficAgentModule {
  constructor() {
    this.statusContainer = document.getElementById('agentStatusBadge');
    this.agentStateText = document.getElementById('agentStateText');
    this.interventionsCount = document.getElementById('agentInterventionsCount');
    this.reroutesCount = document.getElementById('agentReroutesCount');
    this.signalOverridesCount = document.getElementById('agentSignalOverridesCount');
    this.congestionReductionText = document.getElementById('agentReductionText');
    this.decisionFeed = document.getElementById('agentDecisionFeed');

    this.toggleAgentBtn = document.getElementById('btnToggleAgent');
    this.triggerAgentBtn = document.getElementById('btnTriggerAgentIntervention');

    this.autonomousEnabled = true;
    this.pollInterval = null;

    this.bindEvents();
    this.fetchAgentStatus();
    this.startAgentMonitoring();
  }

  bindEvents() {
    if (this.toggleAgentBtn) {
      this.toggleAgentBtn.addEventListener('click', () => this.toggleAutonomousMode());
    }

    if (this.triggerAgentBtn) {
      this.triggerAgentBtn.addEventListener('click', () => this.triggerIntervention('HIGH'));
    }
  }

  startAgentMonitoring() {
    // Autonomous periodic monitoring cycle every 6 seconds
    this.pollInterval = setInterval(() => {
      if (this.autonomousEnabled) {
        this.fetchAgentStatus();
      }
    }, 6000);
  }

  async fetchAgentStatus() {
    let data = null;
    try {
      data = await window.ApiClient.get('/api/agent/status');
    } catch (e) {
      // Local fallback
    }

    if (!data) {
      data = this.getLocalAgentStatus();
    }

    this.renderAgentStatus(data);
  }

  async toggleAutonomousMode() {
    this.autonomousEnabled = !this.autonomousEnabled;
    let data = null;

    try {
      data = await window.ApiClient.post('/api/agent/toggle', { enabled: this.autonomousEnabled });
    } catch (e) {
      // Local fallback
    }

    if (!data) {
      data = this.getLocalAgentStatus();
      data.autonomousMode = this.autonomousEnabled;
    }

    this.renderAgentStatus(data);
  }

  async triggerIntervention(level = 'HIGH') {
    let data = null;
    try {
      data = await window.ApiClient.post('/api/agent/evaluate', { level });
    } catch (e) {
      // Local fallback
    }

    if (!data) {
      data = this.generateLocalIntervention(level);
    }

    this.renderAgentStatus(data);

    // If reroute happened, highlight route on canvas
    if (window.networkCanvas) {
      window.networkCanvas.setHighlightPath([0, 1, 2, 7]); // Alternate high-capacity bypass
      setTimeout(() => {
        if (window.networkCanvas) window.networkCanvas.setHighlightPath([]);
      }, 4000);
    }
  }

  renderAgentStatus(data) {
    if (!data) return;

    if (this.toggleAgentBtn) {
      if (data.autonomousMode) {
        this.toggleAgentBtn.innerHTML = '<span>⏸ Pause Agent (Manual Mode)</span>';
        this.toggleAgentBtn.className = 'btn btn-secondary btn-sm';
      } else {
        this.toggleAgentBtn.innerHTML = '<span>▶ Resume Autonomous Agent</span>';
        this.toggleAgentBtn.className = 'btn btn-sm';
      }
    }

    if (this.statusContainer) {
      this.statusContainer.className = 'badge ' + (data.autonomousMode ? 'badge-green' : 'badge-amber');
      this.statusContainer.textContent = data.autonomousMode ? 'AGENT ACTIVE (AUTONOMOUS)' : 'MANUAL OVERRIDE (STANDBY)';
    }

    if (this.agentStateText) this.agentStateText.textContent = data.agentState.replace('_', ' ');
    if (this.interventionsCount) this.interventionsCount.textContent = data.totalInterventions;
    if (this.reroutesCount) this.reroutesCount.textContent = data.reroutesTriggered;
    if (this.signalOverridesCount) this.signalOverridesCount.textContent = data.signalOverrides;
    if (this.congestionReductionText) this.congestionReductionText.textContent = `${data.congestionReductionPercent}%`;

    // Render Live Action Decision Feed
    if (this.decisionFeed && data.actionLog) {
      this.decisionFeed.innerHTML = data.actionLog.map(action => {
        let badgeClass = 'badge-blue';
        if (action.type === 'SIGNAL_OVERRIDE') badgeClass = 'badge-green';
        else if (action.type === 'REROUTE') badgeClass = 'badge-blue';
        else if (action.type === 'SHAPING_ENGAGED') badgeClass = 'badge-amber';
        else if (action.type === 'CONGESTION_CLEARED') badgeClass = 'badge-green';

        const timeStr = new Date(action.timestamp).toLocaleTimeString();

        return `
          <div style="padding: 0.65rem 0.85rem; border-left: 3px solid #4CC9F0; background: rgba(14,23,54,0.6); border-radius: 4px; margin-bottom: 0.5rem; font-size: 0.82rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.25rem;">
              <span class="badge ${badgeClass}">${action.type}</span>
              <span style="font-size:0.75rem; color:#64748B;">${timeStr} • Target: ${action.targetNode}</span>
            </div>
            <div style="color: #E2E8F0; margin-bottom: 0.2rem;">${action.description}</div>
            <div style="font-size: 0.75rem; color: #10B981;">Impact: ${action.improvement}</div>
          </div>
        `;
      }).join('');
    }
  }

  getLocalAgentStatus() {
    return {
      autonomousMode: this.autonomousEnabled,
      agentState: 'MONITORING_OPTIMAL',
      totalInterventions: 6,
      reroutesTriggered: 2,
      signalOverrides: 3,
      congestionReductionPercent: 41.2,
      actionLog: [
        {
          timestamp: Date.now() - 2000,
          type: 'SIGNAL_OVERRIDE',
          targetNode: 'Junction F',
          description: 'Extended GREEN light duration by +15s to flush 18 queued telemetry packets.',
          improvement: 'Reduced local queuing delay by 42%'
        },
        {
          timestamp: Date.now() - 15000,
          type: 'REROUTE',
          targetNode: 'Junction A ➔ Junction H',
          description: 'Discovered link saturation on A-F direct link. Rerouted flow via B-C corridor.',
          improvement: 'Bypassed bottleneck, restored PDR to 99.2%'
        },
        {
          timestamp: Date.now() - 35000,
          type: 'SHAPING_ENGAGED',
          targetNode: 'Junction A',
          description: 'Activated Leaky Bucket rate limiter at 4 pkts/s on bursty entrance link.',
          improvement: 'Zero DropTail buffer drops downstream'
        }
      ]
    };
  }

  generateLocalIntervention(level) {
    const status = this.getLocalAgentStatus();
    status.totalInterventions += 1;
    status.reroutesTriggered += 1;
    status.signalOverrides += 1;
    status.agentState = 'MITIGATING_CONGESTION';

    status.actionLog.unshift({
      timestamp: Date.now(),
      type: 'SIGNAL_OVERRIDE',
      targetNode: 'Junction F (Tech Corridor)',
      description: 'Autonomous Signal Override: Green Corridor engaged for 20s to relieve queue pressure.',
      improvement: 'Queue decreased from 24 pkts to 4 pkts'
    });

    status.actionLog.unshift({
      timestamp: Date.now(),
      type: 'REROUTE',
      targetNode: 'Junction A ➔ Junction H',
      description: 'Autonomous Dijkstra Reroute: Switched flow from saturated A-F to secondary arterial A-B-C-H.',
      improvement: 'Saved 9.4ms latency'
    });

    return status;
  }
}

window.TrafficAgentModule = TrafficAgentModule;
