/**
 * Distance Vector Routing (DVR) Module
 * Implements Bellman-Ford distributed routing table generation,
 * interactive link cost updates, link failure simulation, and convergence logging.
 */

class DistanceVectorModule {
  constructor() {
    this.tablesContainer = document.getElementById('dvrTablesContainer');
    this.logContainer = document.getElementById('dvrLogContainer');
    this.linkSelect = document.getElementById('dvrLinkSelect');
    this.costInput = document.getElementById('dvrNewCost');
    this.linkActiveCheckbox = document.getElementById('dvrLinkActive');
    this.updateBtn = document.getElementById('btnUpdateDvrLink');
    this.resetBtn = document.getElementById('btnResetDvr');

    this.nodes = [
      { id: 0, code: 'J_A' }, { id: 1, code: 'J_B' }, { id: 2, code: 'J_C' }, { id: 3, code: 'J_D' },
      { id: 4, code: 'J_E' }, { id: 5, code: 'J_F' }, { id: 6, code: 'J_G' }, { id: 7, code: 'J_H' }
    ];

    this.links = [
      { from: 0, to: 1, cost: 4, active: true },
      { from: 0, to: 4, cost: 5, active: true },
      { from: 0, to: 5, cost: 3, active: true },
      { from: 1, to: 2, cost: 6, active: true },
      { from: 1, to: 5, cost: 2, active: true },
      { from: 2, to: 6, cost: 4, active: true },
      { from: 2, to: 7, cost: 5, active: true },
      { from: 3, to: 4, cost: 6, active: true },
      { from: 3, to: 5, cost: 4, active: true },
      { from: 3, to: 6, cost: 3, active: true },
      { from: 5, to: 6, cost: 3, active: true },
      { from: 6, to: 7, cost: 4, active: true }
    ];

    this.initLinkSelector();
    this.bindEvents();
    this.computeAndRender();
  }

  initLinkSelector() {
    if (!this.linkSelect) return;
    this.linkSelect.innerHTML = '';
    this.links.forEach((l, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `Link ${this.nodes[l.from].code} ↔ ${this.nodes[l.to].code} (Current Cost: ${l.cost})`;
      this.linkSelect.appendChild(opt);
    });

    this.linkSelect.addEventListener('change', () => {
      const selected = this.links[this.linkSelect.value];
      if (selected && this.costInput) {
        this.costInput.value = selected.cost;
        if (this.linkActiveCheckbox) this.linkActiveCheckbox.checked = selected.active;
      }
    });

    if (this.costInput) this.costInput.value = this.links[0].cost;
  }

  bindEvents() {
    if (this.updateBtn) {
      this.updateBtn.addEventListener('click', () => this.handleLinkUpdate());
    }
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => this.handleReset());
    }
  }

  async handleLinkUpdate() {
    const idx = parseInt(this.linkSelect.value, 10);
    const newCost = parseInt(this.costInput.value, 10) || 1;
    const isActive = this.linkActiveCheckbox ? this.linkActiveCheckbox.checked : true;

    this.links[idx].cost = newCost;
    this.links[idx].active = isActive;

    let result = null;
    try {
      const l = this.links[idx];
      result = await window.ApiClient.post('/api/distance-vector/update-link', {
        from: l.from, to: l.to, cost: newCost, active: isActive
      });
    } catch (e) {
      console.log('Backend not reached, computing DVR locally.');
    }

    if (!result) {
      result = this.computeLocalDVR();
    }

    this.renderResult(result);
  }

  handleReset() {
    this.links = [
      { from: 0, to: 1, cost: 4, active: true },
      { from: 0, to: 4, cost: 5, active: true },
      { from: 0, to: 5, cost: 3, active: true },
      { from: 1, to: 2, cost: 6, active: true },
      { from: 1, to: 5, cost: 2, active: true },
      { from: 2, to: 6, cost: 4, active: true },
      { from: 2, to: 7, cost: 5, active: true },
      { from: 3, to: 4, cost: 6, active: true },
      { from: 3, to: 5, cost: 4, active: true },
      { from: 3, to: 6, cost: 3, active: true },
      { from: 5, to: 6, cost: 3, active: true },
      { from: 6, to: 7, cost: 4, active: true }
    ];
    this.initLinkSelector();
    this.computeAndRender();
  }

  async computeAndRender() {
    let result = null;
    try {
      result = await window.ApiClient.post('/api/distance-vector', {});
    } catch (e) {
      console.log('Backend offline, using local DVR engine.');
    }

    if (!result) {
      result = this.computeLocalDVR();
    }

    this.renderResult(result);
  }

  renderResult(res) {
    if (!this.tablesContainer) return;
    this.tablesContainer.innerHTML = '';

    // Render individual routing tables for each node in cards
    res.routingTables.forEach(table => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.padding = '1rem';

      let rows = '';
      table.routes.forEach(r => {
        const costStr = (r.cost === -1 || r.cost >= 99999) ? '∞' : r.cost;
        const hopStr = (r.nextHopCode === 'NONE' || r.cost === -1) ? '—' : r.nextHopCode;
        rows += `
          <tr>
            <td><strong>${r.destinationCode}</strong></td>
            <td><span class="badge badge-blue">${hopStr}</span></td>
            <td><span class="badge ${costStr === '∞' ? 'badge-red' : 'badge-green'}">${costStr}</span></td>
          </tr>
        `;
      });

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.6rem;">
          <h4 style="font-size:0.95rem; font-weight:700; color:#4CC9F0;">${table.nodeCode} Routing Table</h4>
          <span class="tag-pill">Node ${table.nodeId}</span>
        </div>
        <table class="custom-table" style="font-size: 0.78rem;">
          <thead>
            <tr>
              <th>Dest</th>
              <th>Next Hop</th>
              <th>Min Cost</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;

      this.tablesContainer.appendChild(card);
    });

    // Render Convergence Log
    if (this.logContainer && res.convergenceLog) {
      this.logContainer.innerHTML = res.convergenceLog.map((line, idx) => `
        <div style="padding: 0.4rem 0.6rem; border-left: 2px solid #4CC9F0; margin-bottom: 0.4rem; font-size: 0.8rem; background: rgba(76,201,240,0.05);">
          ${line}
        </div>
      `).join('');
    }
  }

  computeLocalDVR() {
    const INF = 999999;
    const n = 8;
    const graph = Array.from({ length: n }, () => new Array(n).fill(INF));
    for (let i = 0; i < n; i++) graph[i][i] = 0;

    this.links.forEach(l => {
      if (l.active) {
        graph[l.from][l.to] = l.cost;
        graph[l.to][l.from] = l.cost;
      }
    });

    let dist = Array.from({ length: n }, (_, i) => [...graph[i]]);
    let nextHop = Array.from({ length: n }, () => new Array(n).fill(-1));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) nextHop[i][j] = i;
        else if (graph[i][j] < INF && graph[i][j] > 0) nextHop[i][j] = j;
      }
    }

    const log = ['Round 0: Local routing tables populated from directly attached physical links.'];
    let updated = true;
    let round = 0;

    while (updated && round < 10) {
      round++;
      updated = false;
      let changes = 0;

      const nextDist = dist.map(row => [...row]);
      const nextHopCopy = nextHop.map(row => [...row]);

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (i === j) continue;
          for (let k = 0; k < n; k++) {
            if (k !== i && graph[i][k] < INF) {
              const costViaK = graph[i][k] + dist[k][j];
              if (dist[k][j] < INF && costViaK < nextDist[i][j]) {
                nextDist[i][j] = costViaK;
                nextHopCopy[i][j] = k;
                updated = true;
                changes++;
              }
            }
          }
        }
      }

      dist = nextDist;
      nextHop = nextHopCopy;

      if (updated) {
        log.push(`Round ${round}: Exchanged distance vectors. Updated ${changes} route costs.`);
      } else {
        log.push(`Round ${round}: Convergence achieved. All routing tables in optimal steady state.`);
      }
    }

    const routingTables = [];
    for (let i = 0; i < n; i++) {
      const routes = [];
      for (let j = 0; j < n; j++) {
        const hop = nextHop[i][j];
        const hopCode = (hop >= 0 && hop < n) ? this.nodes[hop].code : 'NONE';
        routes.push({
          destination: j,
          destinationCode: this.nodes[j].code,
          nextHop: hop,
          nextHopCode: hopCode,
          cost: dist[i][j] >= INF ? -1 : dist[i][j]
        });
      }
      routingTables.push({
        nodeId: i,
        nodeCode: this.nodes[i].code,
        routes: routes
      });
    }

    return {
      roundsToConverge: round,
      converged: !updated,
      routingTables: routingTables,
      convergenceLog: log
    };
  }
}

window.DistanceVectorModule = DistanceVectorModule;
