/**
 * Centralized API Client & Port Discovery
 * Dynamically discovers the Java Backend port (8085, 8080, 8090)
 * or falls back cleanly to client-side computation.
 */

window.ApiClient = {
  activeBaseUrl: null,
  candidatePorts: [8085, 8080, 8090],

  async getBaseUrl() {
    if (this.activeBaseUrl) return this.activeBaseUrl;

    // If served via HTTP/HTTPS, use origin
    if (window.location.origin && window.location.origin.startsWith('http')) {
      this.activeBaseUrl = window.location.origin;
      return this.activeBaseUrl;
    }

    // Try candidate ports for file:/// execution
    for (const port of this.candidatePorts) {
      try {
        const res = await fetch(`http://localhost:${port}/api/health`, { method: 'GET', signal: AbortSignal.timeout(600) });
        if (res.ok) {
          this.activeBaseUrl = `http://localhost:${port}`;
          return this.activeBaseUrl;
        }
      } catch (e) {
        // try next
      }
    }

    // Default fallback
    this.activeBaseUrl = 'http://localhost:8085';
    return this.activeBaseUrl;
  },

  async post(endpoint, body) {
    const base = await this.getBaseUrl();
    const res = await fetch(`${base}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  async get(endpoint) {
    const base = await this.getBaseUrl();
    const res = await fetch(`${base}${endpoint}`, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }
};
