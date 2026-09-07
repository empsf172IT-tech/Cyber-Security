/**
 * VANTA//SEC - Premium SOC Canvas Visualizations & Interactive Telemetry
 * Real-time Threat Maps, Radar Sweeps, & Connected Topology Engine.
 */

// ============================================================================
// 1. HERO PERIMETER RADAR VISUALIZER
// ============================================================================
function initHeroRadar(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = 0, height = 0, centerX = 0, centerY = 0, radius = 0;
  let angle = 0;
  let blips = [];

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    const rect = parent ? parent.getBoundingClientRect() : canvas.getBoundingClientRect();
    width = rect.width || 380;
    height = rect.height || 320;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.resetTransform ? ctx.resetTransform() : ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    centerX = width / 2;
    centerY = height / 2;
    radius = Math.max(20, Math.min(centerX, centerY) - 24);
    if (blips.length === 0) generateBlips();
  }

  function generateBlips() {
    blips = [];
    const count = 14;
    const severities = ['critical', 'critical', 'warning', 'warning', 'active', 'active', 'active', 'active'];
    const threatTypes = ['ANOMALY//SSH_BURST', 'CVE-2026_PROBE', 'UNAUTH_PORT_SCAN', 'DNS_TUNNEL_EXFIL', 'API_SPRAY_ATTEMPT'];

    for (let i = 0; i < count; i++) {
      const dist = Math.random() * (radius - 35) + 25;
      const blipAngle = Math.random() * Math.PI * 2;
      const sev = severities[Math.floor(Math.random() * severities.length)];
      blips.push({
        x: centerX + Math.cos(blipAngle) * dist,
        y: centerY + Math.sin(blipAngle) * dist,
        angle: blipAngle,
        dist: dist,
        severity: sev,
        tag: threatTypes[Math.floor(Math.random() * threatTypes.length)],
        life: 0,
        ip: `185.220.${Math.floor(Math.random()*150)}.${Math.floor(Math.random()*250)}`
      });
    }
  }

  // Use ResizeObserver for guaranteed container tracking
  if (window.ResizeObserver && canvas.parentElement) {
    new ResizeObserver(() => resize()).observe(canvas.parentElement);
  }
  window.addEventListener('resize', resize);
  resize();

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const bgFill = isLight ? '#070f1e' : '#03060a';
    const cyanBase = isLight ? 'rgba(0, 215, 255, ' : 'rgba(0, 240, 255, ';
    const gridStroke = isLight ? 'rgba(0, 215, 255, 0.25)' : 'rgba(0, 240, 255, 0.15)';
    const textFill = isLight ? '#94a3b8' : '#64748b';

    // 1. Dark tactical screen background
    ctx.fillStyle = bgFill;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(0, 0, width, height, 4) : ctx.rect(0, 0, width, height);
    ctx.fill();

    // Subtle background grid
    ctx.strokeStyle = isLight ? 'rgba(0, 215, 255, 0.05)' : 'rgba(0, 240, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // 2. Concentric Radar Range Rings
    const ringRanges = [0.25, 0.5, 0.75, 1.0];
    ringRanges.forEach((ratio, idx) => {
      const r = radius * ratio;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.strokeStyle = gridStroke;
      ctx.lineWidth = idx === 3 ? 1.5 : 1;
      ctx.stroke();

      // Range text
      ctx.fillStyle = textFill;
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText(`${(ratio * 100).toFixed(0)}% RANGE`, centerX + 4, centerY - r + 11);
    });

    // 3. Tactical Scope Reticles & Degrees
    ctx.beginPath();
    ctx.moveTo(centerX - radius, centerY); ctx.lineTo(centerX + radius, centerY);
    ctx.moveTo(centerX, centerY - radius); ctx.lineTo(centerX, centerY + radius);
    ctx.strokeStyle = gridStroke;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Degree Ticks around perimeter
    for (let deg = 0; deg < 360; deg += 15) {
      const rad = (deg * Math.PI) / 180;
      const isMajor = deg % 90 === 0;
      const len = isMajor ? 10 : 5;
      const x1 = centerX + Math.cos(rad) * (radius - len);
      const y1 = centerY + Math.sin(rad) * (radius - len);
      const x2 = centerX + Math.cos(rad) * radius;
      const y2 = centerY + Math.sin(rad) * radius;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = isMajor ? cyanBase + '0.7)' : cyanBase + '0.3)';
      ctx.lineWidth = isMajor ? 1.5 : 1;
      ctx.stroke();
    }

    // Cardinal Labels (N, E, S, W)
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillStyle = cyanBase + '0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N (000°)', centerX, centerY - radius + 14);
    ctx.fillText('S (180°)', centerX, centerY + radius - 14);
    ctx.fillText('E (090°)', centerX + radius - 22, centerY);
    ctx.fillText('W (270°)', centerX - radius + 22, centerY);

    // 4. Rotating Radar Sweep Sector
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, angle - 0.45, angle);
    ctx.closePath();

    const sweepGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    sweepGradient.addColorStop(0, cyanBase + '0.35)');
    sweepGradient.addColorStop(0.7, cyanBase + '0.15)');
    sweepGradient.addColorStop(1, cyanBase + '0.01)');
    ctx.fillStyle = sweepGradient;
    ctx.fill();

    // Leading Beam Line
    const beamX = centerX + Math.cos(angle) * radius;
    const beamY = centerY + Math.sin(angle) * radius;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(beamX, beamY);
    ctx.strokeStyle = cyanBase + '1.0)';
    ctx.lineWidth = 2;
    ctx.shadowColor = cyanBase + '1.0)';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();

    // 5. Target Blips & HUD Locks
    blips.forEach(blip => {
      let diff = angle - blip.angle;
      while (diff < 0) diff += Math.PI * 2;
      while (diff >= Math.PI * 2) diff -= Math.PI * 2;

      if (diff < 0.2) {
        blip.life = 1.0;
      }

      if (blip.life > 0) {
        blip.life -= 0.006;
        let color = cyanBase + `${Math.max(blip.life, 0.3)})`;
        if (blip.severity === 'critical') color = `rgba(255, 42, 95, ${Math.max(blip.life, 0.4)})`;
        if (blip.severity === 'warning') color = `rgba(245, 158, 11, ${Math.max(blip.life, 0.4)})`;

        // Blip Core
        ctx.beginPath();
        ctx.arc(blip.x, blip.y, blip.severity === 'critical' ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Expanding Ping Ring
        const ringSize = 4 + (1 - blip.life) * 14;
        ctx.beginPath();
        ctx.arc(blip.x, blip.y, ringSize, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Target Lock Reticle HUD Box for Critical Threat
        if (blip.severity === 'critical' && blip.life > 0.4) {
          const s = 10;
          ctx.strokeStyle = 'rgba(255, 42, 95, 0.9)';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(blip.x - s, blip.y - s, s * 2, s * 2);

          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.fillStyle = '#ff2a5f';
          ctx.textAlign = 'left';
          ctx.fillText(`THREAT//${blip.ip}`, blip.x + s + 4, blip.y - 2);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '8px "JetBrains Mono", monospace';
          ctx.fillText(`${blip.tag}`, blip.x + s + 4, blip.y + 7);
        }
      }
    });

    // Outer Shield Perimeter Ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.92, 0, Math.PI * 2);
    ctx.strokeStyle = cyanBase + '0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    angle += 0.015;
    if (angle >= Math.PI * 2) angle = 0;

    requestAnimationFrame(draw);
  }

  draw();
}

// ============================================================================
// 2. GLOBAL THREAT INTELLIGENCE MAP (With Continent Landmass Dot Matrix)
// ============================================================================
function initGlobalThreatMap(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = 0, height = 0;
  let attacks = [];

  // Continental SOC Nodes
  const nodes = [
    { id: 'US-EAST', name: 'N. Virginia [AWS-US-1]', xRatio: 0.25, yRatio: 0.36, status: 'secure', latency: '12ms' },
    { id: 'US-WEST', name: 'Oregon Core [DC-02]', xRatio: 0.17, yRatio: 0.33, status: 'secure', latency: '24ms' },
    { id: 'EU-CENT', name: 'Frankfurt Hub [SOC-1]', xRatio: 0.51, yRatio: 0.30, status: 'mitigating', latency: '38ms' },
    { id: 'EU-WEST', name: 'London Edge [LON-4]', xRatio: 0.46, yRatio: 0.27, status: 'secure', latency: '31ms' },
    { id: 'AP-SE', name: 'Singapore Gateway', xRatio: 0.77, yRatio: 0.58, status: 'critical', latency: '89ms' },
    { id: 'AP-NE', name: 'Tokyo Command [TYO-1]', xRatio: 0.85, yRatio: 0.35, status: 'secure', latency: '65ms' },
    { id: 'SA-EAST', name: 'São Paulo Perimeter', xRatio: 0.34, yRatio: 0.71, status: 'secure', latency: '110ms' },
    { id: 'AU-EAST', name: 'Sydney Telemetry Node', xRatio: 0.88, yRatio: 0.78, status: 'secure', latency: '135ms' },
    { id: 'ME-CENT', name: 'Dubai Relay Center', xRatio: 0.62, yRatio: 0.44, status: 'warning', latency: '72ms' }
  ];

  // Continent Landmass Points (normalized coordinates)
  const continentPoints = [
    // North America
    {x:0.12,y:0.22},{x:0.16,y:0.18},{x:0.22,y:0.16},{x:0.28,y:0.19},{x:0.30,y:0.26},{x:0.27,y:0.38},{x:0.21,y:0.42},{x:0.15,y:0.35},{x:0.18,y:0.28},
    {x:0.24,y:0.32},{x:0.26,y:0.28},{x:0.20,y:0.22},{x:0.14,y:0.26},{x:0.29,y:0.35},{x:0.22,y:0.38},
    // South America
    {x:0.31,y:0.52},{x:0.36,y:0.55},{x:0.38,y:0.64},{x:0.35,y:0.75},{x:0.32,y:0.82},{x:0.29,y:0.72},{x:0.28,y:0.60},
    // Europe
    {x:0.46,y:0.22},{x:0.50,y:0.19},{x:0.54,y:0.22},{x:0.55,y:0.30},{x:0.49,y:0.32},{x:0.45,y:0.28},{x:0.48,y:0.25},
    // Africa
    {x:0.48,y:0.40},{x:0.56,y:0.42},{x:0.60,y:0.52},{x:0.56,y:0.66},{x:0.51,y:0.72},{x:0.46,y:0.58},{x:0.45,y:0.46},
    // Asia
    {x:0.60,y:0.20},{x:0.68,y:0.18},{x:0.78,y:0.20},{x:0.85,y:0.26},{x:0.88,y:0.35},{x:0.80,y:0.42},{x:0.74,y:0.48},{x:0.68,y:0.38},{x:0.62,y:0.32},
    {x:0.72,y:0.28},{x:0.76,y:0.34},{x:0.82,y:0.30},{x:0.65,y:0.25},{x:0.70,y:0.36},
    // Australia & Oceania
    {x:0.82,y:0.68},{x:0.88,y:0.66},{x:0.91,y:0.74},{x:0.86,y:0.82},{x:0.80,y:0.78}
  ];

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    const rect = parent ? parent.getBoundingClientRect() : canvas.getBoundingClientRect();
    width = rect.width || 800;
    height = rect.height || 420;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.resetTransform ? ctx.resetTransform() : ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  function triggerAttack() {
    const fromIdx = Math.floor(Math.random() * nodes.length);
    let toIdx = Math.floor(Math.random() * nodes.length);
    while (toIdx === fromIdx) {
      toIdx = Math.floor(Math.random() * nodes.length);
    }

    const types = ['DDoS Syn-Flood', 'Brute-Force SSH', 'CVE-2026 RCE', 'BGP Hijack Probe', 'API Auth Bypass', 'SQL Injection'];
    const isCrit = Math.random() > 0.65;
    attacks.push({
      from: nodes[fromIdx],
      to: nodes[toIdx],
      progress: 0,
      speed: 0.007 + Math.random() * 0.009,
      type: types[Math.floor(Math.random() * types.length)],
      critical: isCrit
    });

    if (attacks.length > 10) attacks.shift();
  }

  setInterval(triggerAttack, 1400);

  if (window.ResizeObserver && canvas.parentElement) {
    new ResizeObserver(() => resize()).observe(canvas.parentElement);
  }
  window.addEventListener('resize', resize);
  resize();

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const bgFill = isLight ? '#060c18' : '#03060a';
    const gridColor = isLight ? 'rgba(0, 215, 255, 0.12)' : 'rgba(0, 240, 255, 0.06)';
    const cyanBase = isLight ? 'rgba(0, 215, 255, ' : 'rgba(0, 240, 255, ';

    // 1. Dark Monitor Canvas Background
    ctx.fillStyle = bgFill;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(0, 0, width, height, 4) : ctx.rect(0, 0, width, height);
    ctx.fill();

    // 2. Cyber Coordinates Grid Lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Grid Coordinates Text Overlay
    ctx.font = '8px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.textAlign = 'left';
    ctx.fillText('LAT 60° N', 10, 25);
    ctx.fillText('EQUATOR 0°', 10, height / 2);
    ctx.fillText('LAT 60° S', 10, height - 15);

    // 3. Continent Landmass Dot Matrix Visuals
    ctx.fillStyle = isLight ? 'rgba(0, 215, 255, 0.28)' : 'rgba(0, 240, 255, 0.18)';
    continentPoints.forEach(pt => {
      const px = pt.x * width;
      const py = pt.y * height;
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Micro connect dots for wireframe effect
      continentPoints.forEach(other => {
        const ox = other.x * width;
        const oy = other.y * height;
        const dist = Math.hypot(ox - px, oy - py);
        if (dist > 0 && dist < width * 0.05) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(ox, oy);
          ctx.strokeStyle = isLight ? 'rgba(0, 215, 255, 0.08)' : 'rgba(0, 240, 255, 0.05)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      });
    });

    // 4. Mesh Lines Between Neighboring Nodes
    ctx.strokeStyle = cyanBase + '0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const x1 = nodes[i].xRatio * width;
        const y1 = nodes[i].yRatio * height;
        const x2 = nodes[j].xRatio * width;
        const y2 = nodes[j].yRatio * height;
        if (Math.hypot(x2 - x1, y2 - y1) < width * 0.4) {
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        }
      }
    }

    // 5. Active Ballistic Attack Trajectories
    attacks.forEach((atk) => {
      atk.progress += atk.speed;
      const x1 = atk.from.xRatio * width;
      const y1 = atk.from.yRatio * height;
      const x2 = atk.to.xRatio * width;
      const y2 = atk.to.yRatio * height;
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2 - 45;

      // Arc Line
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(midX, midY, x2, y2);
      ctx.strokeStyle = atk.critical ? 'rgba(255, 42, 95, 0.75)' : cyanBase + '0.45)';
      ctx.lineWidth = atk.critical ? 1.8 : 1.2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Traveling Particle Packet
      const t = atk.progress;
      if (t <= 1) {
        const curX = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * midX + t * t * x2;
        const curY = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * midY + t * t * y2;

        ctx.beginPath();
        ctx.arc(curX, curY, atk.critical ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = atk.critical ? '#ff2a5f' : '#00f0ff';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label above particle
        if (atk.critical) {
          ctx.font = 'bold 8px "JetBrains Mono", monospace';
          ctx.fillStyle = '#ff2a5f';
          ctx.textAlign = 'center';
          ctx.fillText(atk.type, curX, curY - 7);
        }
      } else {
        // Impact Ripple on Target Node
        ctx.beginPath();
        ctx.arc(x2, y2, 12, 0, Math.PI * 2);
        ctx.strokeStyle = atk.critical ? 'rgba(255, 42, 95, 0.8)' : cyanBase + '0.8)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });
    attacks = attacks.filter(a => a.progress <= 1.1);

    // 6. Continental SOC Nodes Visuals
    const now = Date.now() * 0.003;
    nodes.forEach(node => {
      const nx = node.xRatio * width;
      const ny = node.yRatio * height;

      let color = cyanBase + '1.0)';
      let glowColor = cyanBase + '0.4)';
      if (node.status === 'critical') { color = '#ff2a5f'; glowColor = 'rgba(255, 42, 95, 0.5)'; }
      if (node.status === 'warning') { color = '#f59e0b'; glowColor = 'rgba(245, 158, 11, 0.5)'; }

      // Pulse Ring Halo
      const pulseSize = 4 + (Math.sin(now + node.xRatio * 10) + 1) * 3;
      ctx.beginPath();
      ctx.arc(nx, ny, pulseSize, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Node Core
      ctx.beginPath();
      ctx.arc(nx, ny, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Node Label Card
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'left';
      ctx.fillText(node.id, nx + 8, ny - 2);

      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = node.status === 'critical' ? '#ff2a5f' : '#94a3b8';
      ctx.fillText(`${node.latency}`, nx + 8, ny + 8);
    });

    requestAnimationFrame(draw);
  }

  draw();
}

// ============================================================================
// 3. ATTACK SURFACE TOPOLOGY GRAPH
// ============================================================================
function initAttackSurfaceTopology(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = 0, height = 0;

  const nodes = [
    { label: 'Cloud Gateway', sub: 'AWS Ingress', role: 'edge', x: 0.15, y: 0.3, score: 98 },
    { label: 'WAF / DDoS Shield', sub: 'Cloudflare SOC', role: 'def', x: 0.35, y: 0.25, score: 99 },
    { label: 'API Gateway', sub: 'Kong Enterprise', role: 'edge', x: 0.35, y: 0.65, score: 95 },
    { label: 'Auth (OAuth 2.0)', sub: 'Identity Vault', role: 'core', x: 0.60, y: 0.25, score: 92 },
    { label: 'K8s Ingress', sub: 'EKS Cluster 01', role: 'core', x: 0.60, y: 0.65, score: 94 },
    { label: 'Core DB Vault', sub: 'PostgreSQL HA', role: 'vault', x: 0.85, y: 0.25, score: 99 },
    { label: 'Legacy ERP API', sub: 'UNPATCHED VULN', role: 'risk', x: 0.60, y: 0.85, score: 68 },
    { label: 'S3 Data Bucket', sub: 'EXPOSED PARQUET', role: 'risk', x: 0.85, y: 0.85, score: 74 }
  ];

  const connections = [
    [0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 6], [3, 5], [4, 5], [6, 7]
  ];

  const vulnerabilityPath = [[2, 6], [6, 7]]; // Highlighted Attack Vector Path

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const parent = canvas.parentElement;
    const rect = parent ? parent.getBoundingClientRect() : canvas.getBoundingClientRect();
    width = rect.width || 700;
    height = rect.height || 320;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.resetTransform ? ctx.resetTransform() : ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  if (window.ResizeObserver && canvas.parentElement) {
    new ResizeObserver(() => resize()).observe(canvas.parentElement);
  }
  window.addEventListener('resize', resize);
  resize();

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const bgFill = isLight ? '#060c18' : '#03060a';
    const cyanBase = isLight ? 'rgba(0, 215, 255, ' : 'rgba(0, 240, 255, ';

    // 1. Canvas Dark Screen Background
    ctx.fillStyle = bgFill;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(0, 0, width, height, 4) : ctx.rect(0, 0, width, height);
    ctx.fill();

    // Background Grid lines
    ctx.strokeStyle = isLight ? 'rgba(0, 215, 255, 0.08)' : 'rgba(0, 240, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // 2. Standard Topology Connection Links
    connections.forEach(([i, j]) => {
      const n1 = nodes[i];
      const n2 = nodes[j];
      const x1 = n1.x * width;
      const y1 = n1.y * height;
      const x2 = n2.x * width;
      const y2 = n2.y * height;

      const isRiskLink = vulnerabilityPath.some(([a, b]) => (a === i && b === j) || (a === j && b === i));

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = isRiskLink ? 'rgba(255, 42, 95, 0.8)' : cyanBase + '0.25)';
      ctx.lineWidth = isRiskLink ? 2 : 1.2;
      if (isRiskLink) ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Flowing Packet Particle
      const t = ((Date.now() * 0.0012 + i) % 2) / 2;
      const px = x1 + (x2 - x1) * t;
      const py = y1 + (y2 - y1) * t;

      ctx.beginPath();
      ctx.arc(px, py, isRiskLink ? 3.5 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = isRiskLink ? '#ff2a5f' : '#00f0ff';
      ctx.fill();
    });

    // 3. Topology Node Cards
    nodes.forEach(node => {
      const nx = node.x * width;
      const ny = node.y * height;
      const isRisk = node.role === 'risk';
      const nodeColor = isRisk ? '#ff2a5f' : (node.score < 90 ? '#f59e0b' : '#00f0ff');

      const cardW = 110;
      const cardH = 38;
      const rx = nx - cardW / 2;
      const ry = ny - cardH / 2;

      // Node Card Body
      ctx.fillStyle = isRisk ? '#1a050b' : '#0b1320';
      ctx.strokeStyle = nodeColor;
      ctx.lineWidth = isRisk ? 1.5 : 1;

      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(rx, ry, cardW, cardH, 5) : ctx.rect(rx, ry, cardW, cardH);
      ctx.fill();
      ctx.stroke();

      // Status indicator dot inside card
      ctx.beginPath();
      ctx.arc(rx + 10, ry + 12, 3, 0, Math.PI * 2);
      ctx.fillStyle = nodeColor;
      ctx.fill();

      // Node Title Text
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'left';
      ctx.fillText(node.label, rx + 18, ry + 14);

      // Subtitle & Score
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(node.sub, rx + 10, ry + 28);

      // Posture Badge right side
      ctx.fillStyle = nodeColor;
      ctx.textAlign = 'right';
      ctx.fillText(`${node.score}%`, rx + cardW - 6, ry + 14);
    });

    requestAnimationFrame(draw);
  }

  draw();
}

// Global Export
window.VANTA_SOC = {
  initHeroRadar,
  initGlobalThreatMap,
  initAttackSurfaceTopology
};
