/**
 * HOMECARE – Digital Twins Water Management Platform
 * app.js – Main application logic
 */

'use strict';

/* ============================================================
   State
   ============================================================ */
const state = {
  currentPage: 'dashboard',
  currentPeriod: 'week',
  sidebarCollapsed: false,
  sensors: [
    { id: 'K-F1',  room: 'Kitchen',     type: 'Flow',     value: '4.2 L/min',  status: 'ok',      battery: '92%' },
    { id: 'K-P2',  room: 'Kitchen',     type: 'Pressure', value: '4.1 bar',    status: 'warning', battery: '85%' },
    { id: 'B1-F1', room: 'Bathroom 1',  type: 'Flow',     value: '2.1 L/min',  status: 'ok',      battery: '78%' },
    { id: 'B1-D1', room: 'Bathroom 1',  type: 'Drain',    value: '1.9 L/min',  status: 'ok',      battery: '88%' },
    { id: 'B2-P1', room: 'Bathroom 2',  type: 'Pressure', value: '1.4 bar',    status: 'alert',   battery: '61%' },
    { id: 'B2-F2', room: 'Bathroom 2',  type: 'Flow',     value: '0.0 L/min',  status: 'ok',      battery: '74%' },
    { id: 'HW-T1', room: 'Utility',     type: 'Temp',     value: '52 °C',      status: 'warning', battery: '90%' },
    { id: 'HW-F1', room: 'Utility',     type: 'Flow',     value: '1.8 L/min',  status: 'ok',      battery: '95%' },
    { id: 'G-F1',  room: 'Garden',      type: 'Flow',     value: '0.0 L/min',  status: 'ok',      battery: '82%' },
    { id: 'G-R1',  room: 'Garden',      type: 'Rain',     value: 'Dry',        status: 'ok',      battery: '88%' },
    { id: 'M-F1',  room: 'Main Supply', type: 'Flow',     value: '6.4 L/min',  status: 'ok',      battery: '99%' },
    { id: 'M-P1',  room: 'Main Supply', type: 'Pressure', value: '3.2 bar',    status: 'ok',      battery: '99%' },
  ],
  systemStatus: [
    { label: 'Main Supply Valve',  status: 'ok',      text: 'Open' },
    { label: 'Boiler',             status: 'ok',      text: 'Active 52°C' },
    { label: 'Bathroom 2 Leak',    status: 'alert',   text: 'Alert!' },
    { label: 'Kitchen Pressure',   status: 'warning', text: '4.1 bar' },
    { label: 'Garden Valve',       status: 'ok',      text: 'Closed' },
    { label: 'Leak Detection',     status: 'ok',      text: 'Monitoring' },
  ],
  liveFlowData: [],
  charts: {},
  avatarMood: 'normal', // normal | happy | alert
  avatarPersonality: 'eco',
};

/* ============================================================
   Navigation
   ============================================================ */
const pageTitles = {
  dashboard:    ['Dashboard',    'Real-time water management overview'],
  'digital-twin': ['Digital Twin', 'Live model of your home water system'],
  avatar:       ['Home Avatar',  "Your home's intelligent water personality"],
  analytics:    ['Analytics',    'Historical usage and cost analysis'],
  alerts:       ['Alerts',       'System notifications and warnings'],
  settings:     ['Settings',     'Configure sensors, thresholds & preferences'],
};

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const page = item.dataset.page;
    navigateTo(page);
  });
});

function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');

  const [title, subtitle] = pageTitles[page] || [page, ''];
  document.getElementById('pageTitle').textContent = title;
  document.getElementById('pageSubtitle').textContent = subtitle;

  state.currentPage = page;

  // Lazy-init charts when first visiting
  if (page === 'digital-twin' && !state.charts.twinFlow) initTwinCharts();
  if (page === 'analytics'    && !state.charts.trend)    initAnalyticsCharts();
}

/* ============================================================
   Sidebar Toggle
   ============================================================ */
document.getElementById('sidebarToggle').addEventListener('click', () => {
  state.sidebarCollapsed = !state.sidebarCollapsed;
  document.getElementById('sidebar').classList.toggle('collapsed', state.sidebarCollapsed);
});

/* ============================================================
   Clock
   ============================================================ */
function updateClock() {
  const el = document.getElementById('timeDisplay');
  if (el) el.textContent = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

/* ============================================================
   Sensor Grid (Dashboard)
   ============================================================ */
function renderSensorGrid() {
  const grid = document.getElementById('sensorGrid');
  if (!grid) return;
  grid.innerHTML = state.sensors.slice(0, 8).map(s => `
    <div class="sensor-item">
      <div>
        <div class="sensor-name">${s.room}</div>
        <div class="sensor-value">${s.type} · ${s.value}</div>
      </div>
      <span class="dot-${s.status}">
        ${s.status === 'ok' ? '✅' : s.status === 'warning' ? '⚠️' : '🔴'}
      </span>
    </div>
  `).join('');
}

/* ============================================================
   Sensors List (Settings)
   ============================================================ */
function renderSensorsList() {
  const list = document.getElementById('sensorsList');
  if (!list) return;
  list.innerHTML = state.sensors.map(s => `
    <div class="sensor-list-item">
      <span class="sensor-id">${s.id}</span>
      <span class="sensor-room">${s.room} – ${s.type}</span>
      <span class="sensor-battery">🔋 ${s.battery}</span>
      <span class="dot-${s.status}">
        ${s.status === 'ok' ? '✅' : s.status === 'warning' ? '⚠️' : '🔴'}
      </span>
    </div>
  `).join('');
}

/* ============================================================
   System Status List (Digital Twin)
   ============================================================ */
function renderSystemStatus() {
  const list = document.getElementById('systemStatusList');
  if (!list) return;
  list.innerHTML = state.systemStatus.map(s => `
    <div class="sys-row">
      <span class="sys-label">${s.label}</span>
      <span class="sys-${s.status}">${s.text}</span>
    </div>
  `).join('');
}

/* ============================================================
   Dashboard Charts
   ============================================================ */
function initDashboardCharts() {
  // Seed live flow data
  state.liveFlowData = Array.from({ length: 20 }, (_, i) => ({
    x: i,
    y: parseFloat((Math.random() * 3 + 2).toFixed(2)),
  }));

  // Flow chart
  const flowCtx = document.getElementById('flowChart')?.getContext('2d');
  if (!flowCtx) return;
  state.charts.flow = new Chart(flowCtx, {
    type: 'line',
    data: {
      labels: state.liveFlowData.map((_, i) => `${i * 3}s`),
      datasets: [{
        label: 'Flow (L/min)',
        data: state.liveFlowData.map(d => d.y),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: { duration: 0 },
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 0 } },
        y: { min: 0, max: 10, grid: { color: '#f1f5f9' } },
      },
    },
  });

  // Room chart (doughnut)
  const roomCtx = document.getElementById('roomChart')?.getContext('2d');
  if (!roomCtx) return;
  state.charts.room = new Chart(roomCtx, {
    type: 'doughnut',
    data: {
      labels: ['Kitchen', 'Bathroom 1', 'Bathroom 2', 'Garden', 'Utility', 'Other'],
      datasets: [{
        data: [35, 28, 12, 10, 8, 7],
        backgroundColor: ['#3b82f6', '#6366f1', '#8b5cf6', '#22c55e', '#f59e0b', '#94a3b8'],
        borderWidth: 2,
        borderColor: '#fff',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } },
      },
      cutout: '62%',
    },
  });
}

/* Update live flow chart */
function tickLiveFlow() {
  if (state.currentPage !== 'dashboard' && state.currentPage !== 'digital-twin') return;
  const chart = state.charts.flow;
  if (!chart) return;
  chart.data.datasets[0].data.shift();
  chart.data.datasets[0].data.push(parseFloat((Math.random() * 3 + 2).toFixed(2)));
  chart.data.labels.shift();
  const last = parseInt(chart.data.labels[chart.data.labels.length - 1]) || 0;
  chart.data.labels.push(`${last + 3}s`);
  chart.update('none');

  // Update KPI with random slight variation
  const usage = (127 + Math.random() * 4 - 2).toFixed(0);
  const el = document.getElementById('kpiTodayUsage');
  if (el) el.textContent = `${usage} L`;
}

/* ============================================================
   Digital Twin Charts
   ============================================================ */
function initTwinCharts() {
  const ctx = document.getElementById('twinFlowChart')?.getContext('2d');
  if (!ctx) return;
  const labels = Array.from({ length: 12 }, (_, i) => `${(new Date().getHours() - 11 + i + 24) % 24}:00`);
  state.charts.twinFlow = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'L/hr',
        data: labels.map(() => +(Math.random() * 40 + 5).toFixed(1)),
        backgroundColor: 'rgba(99,102,241,.7)',
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
        x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      },
    },
  });
}

/* ============================================================
   Analytics Charts
   ============================================================ */
function initAnalyticsCharts() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const trendCtx = document.getElementById('trendChart')?.getContext('2d');
  if (trendCtx && !state.charts.trend) {
    state.charts.trend = new Chart(trendCtx, {
      type: 'line',
      data: {
        labels: days,
        datasets: [
          {
            label: 'This Week (L)',
            data: [520, 480, 610, 540, 495, 680, 517],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59,130,246,.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Last Week (L)',
            data: [540, 510, 590, 570, 520, 700, 580],
            borderColor: '#94a3b8',
            backgroundColor: 'transparent',
            borderDash: [6, 3],
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false } },
        },
      },
    });
  }

  const monthCtx = document.getElementById('monthlyChart')?.getContext('2d');
  if (monthCtx && !state.charts.monthly) {
    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    state.charts.monthly = new Chart(monthCtx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Monthly Usage (kL)',
          data: [4.8, 4.2, 3.9, 4.6, 3.7, 3.5],
          backgroundColor: months.map((_, i) => i === months.length - 1 ? '#3b82f6' : '#bfdbfe'),
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false } },
        },
      },
    });
  }

  const costCtx = document.getElementById('costChart')?.getContext('2d');
  if (costCtx && !state.charts.cost) {
    state.charts.cost = new Chart(costCtx, {
      type: 'doughnut',
      data: {
        labels: ['Domestic Use', 'Hot Water', 'Garden', 'Leakage Est.'],
        datasets: [{
          data: [55, 28, 12, 5],
          backgroundColor: ['#3b82f6', '#f59e0b', '#22c55e', '#ef4444'],
          borderWidth: 3,
          borderColor: '#fff',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 10 } },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.parsed}% of £${(ctx.parsed * 0.155).toFixed(2)}`,
            },
          },
        },
        cutout: '55%',
      },
    });
  }
}

/* ============================================================
   Quick Controls
   ============================================================ */
const controlLabels = {
  main:   ['Open',       'Closed'],
  garden: ['Open',       'Closed'],
  boiler: ['Active',     'Off'],
  leak:   ['Monitoring', 'Disabled'],
};

window.toggleValve = function(id, checkbox) {
  const [onLabel, offLabel] = controlLabels[id];
  const statusEl = document.getElementById(`${id}ValveStatus`) || document.getElementById(`${id}SwitchStatus`) || document.getElementById(`${id}DetectStatus`);
  const labelMap = { main: 'mainValveStatus', garden: 'gardenValveStatus', boiler: 'boilerSwitchStatus', leak: 'leakDetectStatus' };
  const el = document.getElementById(labelMap[id]);
  if (el) el.textContent = checkbox.checked ? onLabel : offLabel;
  showToast(checkbox.checked ? `${id.charAt(0).toUpperCase() + id.slice(1)} turned ON` : `${id.charAt(0).toUpperCase() + id.slice(1)} turned OFF`, checkbox.checked ? 'success' : 'warning');
};

/* ============================================================
   Chart Period
   ============================================================ */
window.setChartPeriod = function(btn, period) {
  document.querySelectorAll('#page-dashboard .btn-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  showToast(`Switched to ${period === 'live' ? 'Live' : period === 'hour' ? '1-hour' : '24-hour'} view`);
};

window.setAnalyticsPeriod = function(btn, period) {
  state.currentPeriod = period;
  btn.parentElement.querySelectorAll('.btn-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  showToast(`Showing ${period}ly analytics`);
};

window.toggleCompare = function(checkbox) {
  showToast(checkbox.checked ? 'Comparison enabled' : 'Comparison disabled');
};

/* ============================================================
   Digital Twin
   ============================================================ */
window.setTwinView = function(btn, view) {
  btn.parentElement.querySelectorAll('.btn-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  showToast(view === '3d' ? '3D view coming soon – showing floor plan' : 'Showing floor plan view');
};

window.syncTwin = function() {
  document.getElementById('lastSyncTime').textContent = 'Syncing…';
  setTimeout(() => {
    document.getElementById('lastSyncTime').textContent = 'Just now';
    showToast('Digital twin synced successfully!', 'success');
  }, 1500);
};

// SVG room interactions
document.querySelectorAll('.room').forEach(room => {
  const roomData = {
    kitchen:     'Kitchen – Flow: 4.2 L/min | Pressure: 4.1 bar ⚠️',
    living:      'Living Room – No water fixtures active',
    'master-bed':'Master Bedroom – No active sensors',
    bath1:       'Bathroom 1 – Flow: 2.1 L/min | Drain: 1.9 L/min ✅',
    bath2:       'Bathroom 2 – ⚠️ Pressure drop detected! 1.4 bar',
    utility:     'Utility – Boiler 52°C | Flow: 1.8 L/min ✅',
    bed2:        'Bedroom 2 – No active sensors',
    garage:      'Garden Zone – Irrigation OFF | Rain sensor: Dry',
  };
  room.addEventListener('mouseenter', e => {
    const tooltip = document.getElementById('roomTooltip');
    if (!tooltip) return;
    const info = roomData[room.dataset.room] || room.dataset.room;
    tooltip.textContent = info;
    tooltip.style.display = 'block';
  });
  room.addEventListener('mousemove', e => {
    const tooltip = document.getElementById('roomTooltip');
    if (!tooltip) return;
    const wrapper = document.querySelector('.house-svg-wrapper');
    const rect = wrapper?.getBoundingClientRect() || { left: 0, top: 0 };
    tooltip.style.left = `${e.clientX - rect.left + 10}px`;
    tooltip.style.top  = `${e.clientY - rect.top  - 30}px`;
  });
  room.addEventListener('mouseleave', () => {
    const tooltip = document.getElementById('roomTooltip');
    if (tooltip) tooltip.style.display = 'none';
  });
});

/* ============================================================
   Avatar
   ============================================================ */
const avatarMessages = [
  'All water systems running normally. Garden irrigation schedule active for 18:00.',
  'Water usage is 8% below your weekly average – great eco-friendly behaviour! 🌿',
  'Bathroom 2 pressure is low. I\'m monitoring the situation closely.',
  'Hot water ready! Boiler running at 52°C – optimal for legionella prevention.',
  'Tip: Running the dishwasher at night saves up to 20% on water heating costs.',
  'Rain forecast tomorrow – garden irrigation auto-cancelled to save water.',
];

let avatarMsgIndex = 0;

function rotateAvatarMessage() {
  avatarMsgIndex = (avatarMsgIndex + 1) % avatarMessages.length;
  const el = document.getElementById('avatarMessage');
  if (el) {
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = avatarMessages[avatarMsgIndex];
      el.style.opacity = '1';
    }, 300);
  }
}
setInterval(rotateAvatarMessage, 6000);

window.setAvatarMode = function(btn, mode) {
  const label = document.getElementById('avatarModeBtn');
  if (label) label.textContent = mode === 'status' ? 'Status Mode' : 'Edit Mode';
  btn.parentElement.querySelectorAll('.btn-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  showToast(`Avatar switched to ${mode} mode`);
};

window.setPersonality = function(item, personality) {
  state.avatarPersonality = personality;
  document.querySelectorAll('.personality-item').forEach(p => p.classList.remove('active'));
  item.classList.add('active');

  const msgs = {
    eco:     'Eco mode activated 🌿 – Optimising for minimum water usage.',
    comfort:'Comfort mode activated 🛁 – Hot water pre-heating at peak times.',
    smart:   'Smart AI mode activated 🤖 – Learning your patterns to auto-schedule.',
    alert:   'Guardian mode activated 🛡️ – Maximum leak and pressure monitoring.',
  };
  const msgEl = document.getElementById('avatarMessage');
  if (msgEl) msgEl.textContent = msgs[personality];
  showToast(`Personality: ${personality.charAt(0).toUpperCase() + personality.slice(1)}`, 'success');
};

/* ============================================================
   Alerts
   ============================================================ */
window.filterAlerts = function(btn, type) {
  btn.parentElement.querySelectorAll('.btn-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  document.querySelectorAll('.alert-card').forEach(card => {
    card.style.display = (type === 'all' || card.dataset.type === type) ? 'flex' : 'none';
  });
};

window.resolveAlert = function(btn) {
  const card = btn.closest('.alert-card');
  if (!card) return;
  card.classList.add('resolved');
  card.style.opacity = '0.4';
  showToast('Alert resolved', 'success');

  // Update badge count
  const unresolvedCritical = document.querySelectorAll('.alert-card.critical:not(.resolved)').length;
  const unresolvedWarning  = document.querySelectorAll('.alert-card.warning:not(.resolved)').length;
  const total = unresolvedCritical + unresolvedWarning;
  const badge = document.getElementById('alertBadge');
  if (badge) badge.textContent = total;
};

window.clearAllAlerts = function() {
  document.querySelectorAll('.alert-card.resolved').forEach(c => {
    c.style.transition = 'all 0.3s ease';
    c.style.height = c.offsetHeight + 'px';
    c.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      c.style.height = '0';
      c.style.padding = '0';
      c.style.marginBottom = '0';
      c.style.opacity = '0';
    });
    setTimeout(() => c.remove(), 350);
  });
  showToast('Resolved alerts cleared', 'success');
};

window.showDetail = function(type) {
  const details = {
    leak: {
      title: '🚨 Leak Detected – Bathroom 2',
      body: `<p><strong>Sensor:</strong> B2-P1 (under-sink pressure sensor)</p>
             <p><strong>Detected:</strong> ${new Date().toLocaleTimeString()} today</p>
             <p><strong>Reading:</strong> Pressure dropped to 1.4 bar (expected: 3.0–3.5 bar)</p>
             <hr style="margin:12px 0;border:none;border-top:1px solid #e2e8f0"/>
             <p><strong>Recommended Action:</strong></p>
             <ol style="margin-left:16px;margin-top:8px">
               <li>Turn off Bathroom 2 supply valve immediately</li>
               <li>Check under-sink pipework for visible leaks</li>
               <li>Contact a plumber if leak is confirmed</li>
             </ol>
             <p style="margin-top:12px;font-size:.8rem;color:#64748b">Auto-isolation is available in Settings › Smart Shutoff.</p>`,
    },
    pressure: {
      title: '⚠️ High Pressure – Kitchen Supply',
      body: `<p><strong>Sensor:</strong> K-P2 (kitchen inlet pressure)</p>
             <p><strong>Reading:</strong> 4.1 bar (normal range: 2.5–4.0 bar)</p>
             <p><strong>Risk:</strong> Sustained high pressure can damage appliance connections and accelerate pipe wear.</p>
             <hr style="margin:12px 0;border:none;border-top:1px solid #e2e8f0"/>
             <p><strong>Recommended Action:</strong></p>
             <ol style="margin-left:16px;margin-top:8px">
               <li>Check mains pressure reducer setting</li>
               <li>If reducer is absent, consider fitting one</li>
               <li>Monitor over next 24h</li>
             </ol>`,
    },
  };
  const d = details[type];
  if (!d) return;
  document.getElementById('modalTitle').textContent = d.title;
  document.getElementById('modalBody').innerHTML = d.body;
  document.getElementById('modalOverlay').classList.add('open');
};

window.closeModal = function() {
  document.getElementById('modalOverlay').classList.remove('open');
};

/* ============================================================
   Settings
   ============================================================ */
window.saveSettings = function() {
  showToast('Settings saved successfully!', 'success');
};

/* ============================================================
   Toast Notifications
   ============================================================ */
function showToast(message, type = '') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

/* ============================================================
   Simulated Live Updates
   ============================================================ */
function simulateLiveUpdates() {
  // Pressure KPI random wobble
  const pressureEl = document.getElementById('kpiPressure');
  if (pressureEl) {
    const p = (3.2 + (Math.random() - 0.5) * 0.3).toFixed(1);
    pressureEl.textContent = `${p} bar`;
  }

  // Temperature KPI
  const tempEl = document.getElementById('kpiTemp');
  if (tempEl) {
    const t = Math.round(52 + (Math.random() - 0.5) * 2);
    tempEl.textContent = `${t}°C`;
  }

  // Sync time
  const syncEl = document.getElementById('lastSyncTime');
  if (syncEl && syncEl.textContent !== 'Syncing…') {
    const seconds = Math.floor(Date.now() / 1000) % 60;
    syncEl.textContent = seconds < 5 ? 'Just now' : `${seconds}s ago`;
  }
}

/* ============================================================
   Initialisation
   ============================================================ */
function init() {
  renderSensorGrid();
  renderSensorsList();
  renderSystemStatus();
  initDashboardCharts();

  // Start live tickers
  setInterval(tickLiveFlow, 1500);
  setInterval(simulateLiveUpdates, 3000);

  // Avatar message transition
  const msgEl = document.getElementById('avatarMessage');
  if (msgEl) msgEl.style.transition = 'opacity .3s';
}

document.addEventListener('DOMContentLoaded', init);
