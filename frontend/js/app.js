/**
 * Main Application Orchestrator for Smart City Traffic Communication Network
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Header Navigation Tabs
  initNavigation();

  // Initialize User Profile & Sign Out
  initAuthProfile();

  // Initialize Network Canvas Topology Visualizer
  window.networkCanvas = new NetworkCanvas('networkCanvas');

  // Initialize Modules
  window.dijkstraModule = new DijkstraModule();
  window.dvrModule = new DistanceVectorModule();
  window.leakyBucketModule = new LeakyBucketModule();
  window.congestionModule = new CongestionModule();
  window.trafficAgentModule = new TrafficAgentModule();
  window.ns2Module = new Ns2Module();

  // Check Backend Health
  checkBackendHealth();
  setInterval(checkBackendHealth, 8000);

  // Canvas Node Click Handler
  window.onNodeSelected = (node) => {
    const infoBox = document.getElementById('selectedNodeInfo');
    if (infoBox) {
      infoBox.style.display = 'block';
      document.getElementById('nodeInfoCode').textContent = node.code;
      document.getElementById('nodeInfoName').textContent = node.name;
      document.getElementById('nodeInfoType').textContent = node.type;
      document.getElementById('nodeInfoVehicles').textContent = `${node.vehicles} vehicles`;
      document.getElementById('nodeInfoSignal').textContent = node.signal;
      document.getElementById('nodeInfoSignal').className = 'badge ' + 
        (node.signal === 'GREEN' ? 'badge-green' : (node.signal === 'RED' ? 'badge-red' : 'badge-amber'));
      document.getElementById('nodeInfoQueue').textContent = `${node.queue} packets in buffer`;
    }
  };
});

function initNavigation() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add('active');
      }

      // Redraw charts or canvas if relevant tab opened
      if (targetId === 'tab-overview' && window.networkCanvas) {
        setTimeout(() => window.networkCanvas.resizeCanvas(), 50);
      } else if (targetId === 'tab-congestion' && window.congestionModule) {
        setTimeout(() => window.congestionModule.renderCharts(), 50);
      } else if (targetId === 'tab-leaky' && window.leakyBucketModule) {
        setTimeout(() => window.leakyBucketModule.drawChart(), 50);
      } else if (targetId === 'tab-agent' && window.trafficAgentModule) {
        window.trafficAgentModule.fetchAgentStatus();
      }
    });
  });
}

async function checkBackendHealth() {
  const badge = document.getElementById('backendStatusBadge');
  const text = document.getElementById('backendStatusText');
  if (!badge || !text) return;

  try {
    const base = await window.ApiClient.getBaseUrl();
    const res = await fetch(`${base}/api/health`, { method: 'GET', signal: AbortSignal.timeout(1000) });
    if (res.ok) {
      const data = await res.json();
      badge.className = 'badge-status';
      text.textContent = `Java Backend Connected (${base.replace('http://localhost', '') || ':8085'})`;
    } else {
      setOfflineBadge(badge, text);
    }
  } catch (err) {
    setOfflineBadge(badge, text);
  }
}

function setOfflineBadge(badge, text) {
  badge.className = 'badge-status offline';
  text.textContent = 'Client Engine Active (Start Java Backend)';
}

function initAuthProfile() {
  const rawUser = localStorage.getItem('smartcity_user') || sessionStorage.getItem('smartcity_user');
  if (rawUser) {
    try {
      const user = JSON.parse(rawUser);
      const nameEl = document.getElementById('currentUserName');
      if (nameEl && user.username) {
        nameEl.textContent = user.username;
      }
    } catch (e) {}
  }

  const btnSignOut = document.getElementById('btnSignOut');
  if (btnSignOut) {
    btnSignOut.addEventListener('click', () => {
      localStorage.removeItem('smartcity_user');
      sessionStorage.removeItem('smartcity_user');
      window.location.href = 'login.html';
    });
  }
}
