/**
 * Canvas Charting Library (Zero External Dependencies)
 * Renders smooth high-DPI multi-metric charts for network performance analysis.
 */

class TrafficCharts {
  static renderLineChart(canvasId, options) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.parentElement.getBoundingClientRect();
    const w = rect.width;
    const h = options.height || 260;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const padL = options.padLeft || 50;
    const padR = 20;
    const padT = 30;
    const padB = 40;

    const chartW = w - padL - padR;
    const chartH = h - padT - padB;

    const series = options.series || [];
    const labels = options.labels || [];

    if (series.length === 0 || labels.length === 0) {
      ctx.fillStyle = '#64748B';
      ctx.font = '12px Outfit';
      ctx.textAlign = 'center';
      ctx.fillText('No telemetry data available', w / 2, h / 2);
      return;
    }

    // Find max value across all series
    let maxVal = 0;
    series.forEach(s => {
      const m = Math.max(...s.data);
      if (m > maxVal) maxVal = m;
    });
    if (maxVal === 0) maxVal = 10;
    maxVal = Math.ceil(maxVal * 1.15); // headroom

    // Draw Grid Lines & Y-Axis Labels
    const gridRows = 5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.font = '10px JetBrains Mono';
    ctx.fillStyle = '#64748B';
    ctx.textAlign = 'right';

    for (let i = 0; i <= gridRows; i++) {
      const y = padT + (chartH / gridRows) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();

      const labelNum = (maxVal - (maxVal / gridRows) * i).toFixed(options.decimals || 0);
      ctx.fillText(`${labelNum} ${options.unit || ''}`, padL - 8, y + 3);
    }

    // Draw X-Axis Labels
    ctx.textAlign = 'center';
    const stepX = chartW / Math.max(1, labels.length - 1);
    const skipLabel = Math.ceil(labels.length / 8);

    labels.forEach((lbl, idx) => {
      if (idx % skipLabel === 0 || idx === labels.length - 1) {
        const x = padL + stepX * idx;
        ctx.fillText(lbl, x, h - padB + 18);
      }
    });

    const getX = (idx) => padL + stepX * idx;
    const getY = (val) => padT + chartH - (val / maxVal) * chartH;

    // Draw Series Lines & Gradient Fill
    series.forEach(s => {
      if (s.data.length < 2) return;

      // Area gradient
      if (s.fill) {
        ctx.save();
        const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
        grad.addColorStop(0, s.fillColor || 'rgba(76, 201, 240, 0.25)');
        grad.addColorStop(1, 'rgba(76, 201, 240, 0)');

        ctx.beginPath();
        s.data.forEach((val, idx) => {
          const x = getX(idx);
          const y = getY(val);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.lineTo(getX(s.data.length - 1), padT + chartH);
        ctx.lineTo(getX(0), padT + chartH);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }

      // Line
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = s.color || '#4CC9F0';
      ctx.lineWidth = s.lineWidth || 2.5;
      if (s.dashed) ctx.setLineDash([5, 5]);

      s.data.forEach((val, idx) => {
        const x = getX(idx);
        const y = getY(val);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Point dots
      if (s.dots !== false) {
        ctx.fillStyle = s.color || '#4CC9F0';
        s.data.forEach((val, idx) => {
          const x = getX(idx);
          const y = getY(val);
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      ctx.restore();
    });

    // Draw Legend at top
    let legendX = padL;
    ctx.font = '600 11px Outfit';
    series.forEach(s => {
      ctx.fillStyle = s.color || '#4CC9F0';
      ctx.beginPath();
      ctx.arc(legendX + 5, 14, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#CBD5E1';
      ctx.textAlign = 'left';
      ctx.fillText(s.name, legendX + 14, 18);
      legendX += ctx.measureText(s.name).width + 36;
    });
  }
}

window.TrafficCharts = TrafficCharts;
