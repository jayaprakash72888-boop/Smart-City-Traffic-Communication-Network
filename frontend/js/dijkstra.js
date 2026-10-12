/**
 * Dijkstra's Shortest Path Module
 * Communicates with Java Backend REST API or executes local fallback.
 * Renders step-by-step trace and highlights path on network graph.
 */

class DijkstraModule {
  constructor() {
    this.srcSelect = document.getElementById('dijkstraSource');
    this.destSelect = document.getElementById('dijkstraDest');
    this.calcBtn = document.getElementById('btnCalculateDijkstra');
    this.resultContainer = document.getElementById('dijkstraResultContainer');
    this.traceTableBody = document.getElementById('dijkstraTraceTableBody');

    this.nodes = [
      { id: 0, code: 'J_A', name: 'Junction A - Central Hub' },
      { id: 1, code: 'J_B', name: 'Junction B - North Cross' },
      { id: 2, code: 'J_C', name: 'Junction C - East Gateway' },
      { id: 3, code: 'J_D', name: 'Junction D - South Terminal' },
      { id: 4, code: 'J_E', name: 'Junction E - West Bridge' },
      { id: 5, code: 'J_F', name: 'Junction F - Tech Corridor' },
      { id: 6, code: 'J_G', name: 'Junction G - Metro Station' },
      { id: 7, code: 'J_H', name: 'Junction H - Airport Express' }
    ];

    this.initSelectors();
    this.bindEvents();
  }

  initSelectors() {
    if (!this.srcSelect || !this.destSelect) return;
    this.srcSelect.innerHTML = '';
    this.destSelect.innerHTML = '';

    this.nodes.forEach(node => {
      const opt1 = document.createElement('option');
      opt1.value = node.id;
      opt1.textContent = `${node.code}: ${node.name}`;
      this.srcSelect.appendChild(opt1);

      const opt2 = document.createElement('option');
      opt2.value = node.id;
      opt2.textContent = `${node.code}: ${node.name}`;
      this.destSelect.appendChild(opt2);
    });

    this.srcSelect.value = '0'; // Junction A
    this.destSelect.value = '7'; // Junction H
  }

  bindEvents() {
    if (this.calcBtn) {
      this.calcBtn.addEventListener('click', () => this.runCalculation());
    }
  }

  async runCalculation() {
    const src = parseInt(this.srcSelect.value, 10);
    const dest = parseInt(this.destSelect.value, 10);

    if (src === dest) {
      alert('Source and Destination junctions cannot be identical. Please select different nodes.');
      return;
    }

    let result = null;
    try {
      // Attempt to fetch from Java Backend REST API
      result = await window.ApiClient.post('/api/dijkstra', { source: src, destination: dest });
    } catch (e) {
      console.log('Backend not reached, running client-side Dijkstra calculation.');
    }

    if (!result) {
      result = this.calculateLocalDijkstra(src, dest);
    }

    this.renderResult(result);

    // Highlight on Canvas
    if (window.networkCanvas) {
      window.networkCanvas.setHighlightPath(result.path);
    }
  }

  renderResult(res) {
    if (!this.resultContainer) return;

    const pathString = res.pathNames && res.pathNames.length > 0
      ? res.pathNames.join(' ➔ ')
      : 'No route available';

    document.getElementById('resShortestPath').textContent = pathString;
    document.getElementById('resTotalDistance').textContent = `${res.totalDistance} km`;
    document.getElementById('resEstimatedLatency').textContent = `${res.totalDistance * 1.5} ms`;
    document.getElementById('resComplexity').textContent = res.complexity || 'O(V^2)';

    this.resultContainer.style.display = 'block';

    // Populate Trace Table
    if (this.traceTableBody && res.trace) {
      this.traceTableBody.innerHTML = '';
      res.trace.forEach(step => {
        const tr = document.createElement('tr');

        // Render distances array with highlights
        const distBadges = step.distances.map((d, idx) => {
          const val = d === -1 ? '∞' : d;
          const isVisited = step.visited[idx];
          const badgeClass = isVisited ? 'badge-green' : (d !== -1 ? 'badge-blue' : 'badge-amber');
          return `<span class="badge ${badgeClass}" style="margin:2px;" title="${this.nodes[idx].code}">${this.nodes[idx].code}:${val}</span>`;
        }).join('');

        tr.innerHTML = `
          <td><strong>#${step.stepNumber}</strong></td>
          <td><span class="badge badge-blue">${step.currentNodeName}</span></td>
          <td style="line-height: 1.8;">${distBadges}</td>
          <td>${step.description}</td>
        `;
        this.traceTableBody.appendChild(tr);
      });
    }
  }

  calculateLocalDijkstra(src, dest) {
    // 8-node local graph matrix
    const INF = 999999;
    const n = 8;
    const graph = [
      [0, 4, INF, INF, 5, 3, INF, INF],
      [4, 0, 6, INF, INF, 2, INF, INF],
      [INF, 6, 0, INF, INF, INF, 4, 5],
      [INF, INF, INF, 0, 6, 4, 3, INF],
      [5, INF, INF, 6, 0, INF, INF, INF],
      [3, 2, INF, 4, INF, 0, 3, INF],
      [INF, INF, 4, 3, INF, 3, 0, 4],
      [INF, INF, 5, INF, INF, INF, 4, 0]
    ];

    const dist = new Array(n).fill(INF);
    const visited = new Array(n).fill(false);
    const parent = new Array(n).fill(-1);
    const trace = [];

    dist[src] = 0;
    trace.push({
      stepNumber: 1,
      currentNode: src,
      currentNodeName: this.nodes[src].code,
      distances: dist.map(d => d >= INF ? -1 : d),
      visited: [...visited],
      description: `Initialized distance of ${this.nodes[src].code} to 0 and all other nodes to ∞.`
    });

    let stepCounter = 2;
    for (let count = 0; count < n; count++) {
      let u = -1;
      let min = INF;
      for (let i = 0; i < n; i++) {
        if (!visited[i] && dist[i] < min) {
          min = dist[i];
          u = i;
        }
      }

      if (u === -1 || dist[u] >= INF) break;

      visited[u] = true;
      let relaxDesc = `Inspecting adjacent nodes from ${this.nodes[u].code} (Dist: ${dist[u]}). `;
      let updated = false;

      for (let v = 0; v < n; v++) {
        if (!visited[v] && graph[u][v] !== INF && graph[u][v] > 0) {
          if (dist[u] + graph[u][v] < dist[v]) {
            dist[v] = dist[u] + graph[u][v];
            parent[v] = u;
            relaxDesc += `Relaxed link to ${this.nodes[v].code} (New Dist: ${dist[v]}). `;
            updated = true;
          }
        }
      }

      if (!updated) relaxDesc += 'No shorter routes discovered.';

      trace.push({
        stepNumber: stepCounter++,
        currentNode: u,
        currentNodeName: this.nodes[u].code,
        distances: dist.map(d => d >= INF ? -1 : d),
        visited: [...visited],
        description: relaxDesc
      });

      if (u === dest) break;
    }

    // Reconstruct path
    const path = [];
    let curr = dest;
    while (curr !== -1) {
      path.unshift(curr);
      curr = parent[curr];
    }

    return {
      source: src,
      destination: dest,
      sourceName: this.nodes[src].name,
      destinationName: this.nodes[dest].name,
      totalDistance: dist[dest] >= INF ? -1 : dist[dest],
      path: path,
      pathNames: path.map(id => this.nodes[id].code),
      complexity: 'O(V^2) via Matrix / O((V+E)log V) with Min-Heap',
      trace: trace
    };
  }
}

window.DijkstraModule = DijkstraModule;
