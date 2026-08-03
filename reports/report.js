// ============================================================
// VKM Reports & Analytics page.
// Every "loadX()/renderX()" function below currently renders from
// a MOCK_* constant keyed by date range. When the backend is wired
// up, swap the mock lookup for a fetch('/api/reports?range=...')
// call inside loadReportsData() — the render functions underneath
// already expect the same shape as the mock payload.
// ============================================================

// ============================================================
// Sidebar collapse / expand (shared boilerplate, same as dashboard.js)
// ============================================================
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const toggleIcon = document.getElementById("toggleIcon");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");

let expanded = false;

function setSidebarExpanded(next) {
  expanded = next;
  sidebar.classList.toggle("expanded", expanded);
  sidebar.classList.toggle("collapsed", !expanded);
  toggleIcon.style.transform = expanded ? "rotate(180deg)" : "rotate(0deg)";

  const isDrawerViewport = window.matchMedia("(max-width: 1023px)").matches;
  sidebarBackdrop.classList.toggle("visible", expanded && isDrawerViewport);
}

sidebarToggle.addEventListener("click", () => setSidebarExpanded(!expanded));
sidebarBackdrop.addEventListener("click", () => setSidebarExpanded(false));

window.addEventListener("resize", () => {
  if (!window.matchMedia("(max-width: 1023px)").matches) {
    sidebarBackdrop.classList.remove("visible");
  }
});

document.querySelectorAll(".nav-list .nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 1023px)").matches) setSidebarExpanded(false);
  });
});

/* ---------------- Topbar: profile dropdown ---------------- */
const profileBtn = document.getElementById("profileBtn");
const profileDropdown = document.getElementById("profileDropdown");
const profileLogoutBtn = document.getElementById("profileLogoutBtn");

function closeAllTopbarDropdowns(except) {
  [profileDropdown].forEach((dd) => {
    if (dd && dd !== except) dd.classList.add("hidden");
  });
}

profileBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  const willOpen = profileDropdown.classList.contains("hidden");
  closeAllTopbarDropdowns();
  profileDropdown.classList.toggle("hidden", !willOpen);
});

document.addEventListener("click", () => closeAllTopbarDropdowns());

function handleLogout() {
  showToast("Logged out");
  window.location.href = "../index.html";
}
profileLogoutBtn?.addEventListener("click", handleLogout);

// ============================================================
// Formatting helpers
// ============================================================
function formatINR(n) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function formatCompactINR(n) {
  if (n === null || n === undefined || isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e7) return "₹" + (n / 1e7).toFixed(1) + "Cr";
  if (abs >= 1e5) return "₹" + (n / 1e5).toFixed(1) + "L";
  if (abs >= 1e3) return "₹" + (n / 1e3).toFixed(1) + "K";
  return "₹" + n.toLocaleString("en-IN");
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast-animate bg-gray-800 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg";
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

function setTrendPill(id, value, opts) {
  const el = document.getElementById(id);
  if (!el) return;
  const suffix = opts && opts.percent ? "%" : "";
  el.classList.remove("down", "flat");
  if (value > 0) {
    el.textContent = `+${value}${suffix}`;
  } else if (value < 0) {
    el.textContent = `${value}${suffix}`;
    el.classList.add("down");
  } else {
    el.textContent = `0${suffix}`;
    el.classList.add("flat");
  }
}

// ============================================================
// Mock data — keyed by date range. Mirrors what a future
// GET /api/reports/summary?range=today|week|month|quarter would
// return once a backend exists.
// ============================================================
const MOCK_REPORTS_BY_RANGE = {
  today: {
    label: "3 Aug 2026",
    totalClients: 174, clientsTrend: 1,
    totalQuotations: 4, quotationsTrend: 1,
    totalValue: 620000, valueTrend: 8,
    activeProducts: 6, productsTrend: 0,
  },
  week: {
    label: "28 Jul – 3 Aug 2026",
    totalClients: 174, clientsTrend: 3,
    totalQuotations: 19, quotationsTrend: 12,
    totalValue: 4120000, valueTrend: 14,
    activeProducts: 8, productsTrend: 1,
  },
  month: {
    label: "Jul 2026",
    totalClients: 174, clientsTrend: 9,
    totalQuotations: 34, quotationsTrend: 6,
    totalValue: 8200000, valueTrend: 17,
    activeProducts: 9, productsTrend: 2,
  },
  quarter: {
    label: "Q2 FY26 (May–Jul 2026)",
    totalClients: 174, clientsTrend: 21,
    totalQuotations: 96, quotationsTrend: -4,
    totalValue: 20450000, valueTrend: 9,
    activeProducts: 11, productsTrend: 1,
  },
  custom: {
    label: "Custom range",
    totalClients: 174, clientsTrend: 0,
    totalQuotations: 0, quotationsTrend: 0,
    totalValue: 0, valueTrend: 0,
    activeProducts: 0, productsTrend: 0,
  },
};

const MOCK_MOST_QUOTED_PRODUCTS = [
  { model: "VK002 · 6 Brick Metal to Metal", count: 42 },
  { model: "Budget Machine", count: 35 },
  { model: "VK004 · 10 Brick Fully Automatic", count: 27 },
  { model: "Rotary Type Machine", count: 21 },
  { model: "Nano Machine", count: 14 },
];

const MOCK_VALUE_DISTRIBUTION = {
  "VK004 · 10 Brick Fully Automatic": 18000000,
  "VK002 · 6 Brick Metal to Metal": 15400000,
  "Rotary Type Machine": 8750000,
  "Budget Machine": 6300000,
  "Others": 4050000,
};

const MOCK_CLIENT_ACTIVITY = [
  { client: "Priya Enterprises", count: 11 },
  { client: "Global Foods Pvt Ltd", count: 9 },
  { client: "Sunrise Apartments", count: 8 },
  { client: "Star Cold Storage", count: 7 },
  { client: "Meena Textiles", count: 6 },
];

const MOCK_TOP_CLIENTS_BY_VALUE = [
  { client: "Global Foods Pvt Ltd", value: 9600000, count: 9 },
  { client: "Priya Enterprises", value: 7850000, count: 11 },
  { client: "Sunrise Apartments", value: 6200000, count: 8 },
  { client: "Meena Textiles", value: 5100000, count: 6 },
  { client: "Star Cold Storage", value: 4300000, count: 7 },
];

const MOCK_RECENT_ACTIVITY = [
  { ref: "P/2026/100", client: "Sachin Kumar Mittal", amount: 1400000, date: "2026-07-27", type: "created" },
  { ref: "P/2026/099", client: "Priya Enterprises", amount: 1400000, date: "2026-07-27", type: "created" },
  { ref: "P/2026/098", client: "Ravi Constructions", amount: 715000, date: "2026-07-26", type: "duplicated" },
  { ref: "P/2026/097", client: "Meena Textiles", amount: 1800000, date: "2026-07-25", type: "created" },
  { ref: "P/2026/096", client: "Suresh Patel", amount: 515000, date: "2026-07-24", type: "sent" },
  { ref: "P/2026/095", client: "Global Foods Pvt Ltd", amount: 2000000, date: "2026-07-23", type: "created" },
  { ref: "P/2026/094", client: "Anita Deshmukh", amount: 1325000, date: "2026-07-22", type: "edited" },
  { ref: "P/2026/093", client: "Rajesh Traders", amount: 1250000, date: "2026-07-21", type: "created" },
  { ref: "P/2026/092", client: "Sunrise Apartments", amount: 1600000, date: "2026-07-20", type: "created" },
  { ref: "P/2026/091", client: "Vikram Industries", amount: 1200000, date: "2026-07-19", type: "sent" },
];

const MOCK_TREND_BY_GRANULARITY = {
  daily: [
    { label: "28 Jul", v: 5 }, { label: "29 Jul", v: 3 }, { label: "30 Jul", v: 7 },
    { label: "31 Jul", v: 4 }, { label: "1 Aug", v: 6 }, { label: "2 Aug", v: 2 }, { label: "3 Aug", v: 4 },
  ],
  weekly: [
    { label: "Wk 27", v: 18 }, { label: "Wk 28", v: 22 }, { label: "Wk 29", v: 15 },
    { label: "Wk 30", v: 26 }, { label: "Wk 31", v: 19 }, { label: "Wk 32", v: 21 },
  ],
  monthly: [
    { label: "Feb", v: 41 }, { label: "Mar", v: 49 }, { label: "Apr", v: 38 },
    { label: "May", v: 55 }, { label: "Jun", v: 47 }, { label: "Jul", v: 62 },
  ],
};

// ============================================================
// Date range toggle
// ============================================================
let currentRange = "today";

const dateRangeToggle = document.getElementById("dateRangeToggle");
const customRangeFields = document.getElementById("customRangeFields");
const customRangeApply = document.getElementById("customRangeApply");

dateRangeToggle?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-range]");
  if (!btn) return;
  const range = btn.getAttribute("data-range");
  setRange(range);
});

function setRange(range) {
  currentRange = range;
  dateRangeToggle.querySelectorAll(".kpi-toggle-btn").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-range") === range);
  });
  customRangeFields.classList.toggle("hidden", range !== "custom");
  customRangeFields.classList.toggle("flex", range === "custom");
  loadReportsData();
}

customRangeApply?.addEventListener("click", () => {
  const from = document.getElementById("customFrom").value;
  const to = document.getElementById("customTo").value;
  if (!from || !to) {
    showToast("Pick both a start and end date");
    return;
  }
  showToast(`Showing ${from} to ${to}`);
  loadReportsData();
});

// ============================================================
// Load + render KPI summary
// ============================================================
function loadReportsData() {
  // Swap this lookup for a fetch('/api/reports/summary?range=' + currentRange)
  // call once the backend endpoint exists — renderKpiSummary() already
  // expects the same shape as MOCK_REPORTS_BY_RANGE[range].
  const data = MOCK_REPORTS_BY_RANGE[currentRange] || MOCK_REPORTS_BY_RANGE.today;
  renderKpiSummary(data);
}

function renderKpiSummary(data) {
  setText("rangeLabel", data.label);
  setText("kpiTotalClients", data.totalClients);
  setText("kpiTotalQuotationsCount", data.totalQuotations);
  setText("kpiTotalValue", formatCompactINR(data.totalValue));
  setText("kpiActiveProducts", data.activeProducts);

  setTrendPill("kpiClientsTrend", data.clientsTrend);
  setTrendPill("kpiQuotationsTrend", data.quotationsTrend);
  setTrendPill("kpiValueTrend", data.valueTrend, { percent: true });
  setTrendPill("kpiProductsTrend", data.productsTrend);
}

// ============================================================
// Charts
// ============================================================
Chart.defaults.font.family = "'Poppins', sans-serif";
Chart.defaults.font.size = 11;

const paletteBerry = "#800021";  /* peach-500 */
const paletteMaroon = "#540016"; /* peach-700 */
const paletteTan = "#E8B9CE";    /* peach-300 */
const paletteRose = "#B8285F";   /* peach-400 */
const paletteLight = "#F6DCE8";  /* peach-100 */
const donutColors = [paletteBerry, paletteMaroon, paletteRose, paletteTan, paletteLight];

const tooltipOpts = {
  backgroundColor: "#fff",
  titleColor: "#1F2937",
  bodyColor: "#6B7280",
  borderColor: "#F1F1F1",
  borderWidth: 1,
  padding: 10,
  cornerRadius: 10,
  displayColors: true,
  boxWidth: 8,
  boxHeight: 8,
  boxPadding: 4,
};

// ---- Quotations Over Time (bar, granularity toggle) ----
let quotationsOverTimeChart = null;
let trendGranularity = "weekly";

function renderQuotationsOverTimeChart() {
  const series = MOCK_TREND_BY_GRANULARITY[trendGranularity];
  const ctx = document.getElementById("chartQuotationsOverTime");
  if (quotationsOverTimeChart) {
    quotationsOverTimeChart.data.labels = series.map((d) => d.label);
    quotationsOverTimeChart.data.datasets[0].data = series.map((d) => d.v);
    quotationsOverTimeChart.update();
    return;
  }
  quotationsOverTimeChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: series.map((d) => d.label),
      datasets: [{
        label: "Quotations",
        data: series.map((d) => d.v),
        backgroundColor: paletteBerry,
        borderRadius: 6,
        maxBarThickness: 30,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { ...tooltipOpts, callbacks: { label: (ctx) => `${ctx.parsed.y} quotations` } },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#6B7280" } },
        y: { beginAtZero: true, ticks: { color: "#6B7280", precision: 0 }, grid: { color: "#F5E6EA" } },
      },
    },
  });
}

document.getElementById("trendGranularityToggle")?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-gran]");
  if (!btn) return;
  trendGranularity = btn.getAttribute("data-gran");
  document.querySelectorAll("#trendGranularityToggle .kpi-toggle-btn").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-gran") === trendGranularity);
  });
  renderQuotationsOverTimeChart();
});

// ---- Most Quoted Products (horizontal bar) ----
new Chart(document.getElementById("chartMostQuoted"), {
  type: "bar",
  data: {
    labels: MOCK_MOST_QUOTED_PRODUCTS.map((d) => d.model),
    datasets: [{
      label: "Times quoted",
      data: MOCK_MOST_QUOTED_PRODUCTS.map((d) => d.count),
      backgroundColor: paletteBerry,
      borderRadius: 6,
      maxBarThickness: 18,
    }],
  },
  options: {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { ...tooltipOpts, callbacks: { label: (ctx) => `${ctx.parsed.x} quotations` } },
    },
    scales: {
      x: { beginAtZero: true, ticks: { color: "#6B7280", precision: 0 }, grid: { color: "#F5E6EA" } },
      y: { grid: { display: false }, ticks: { color: "#6B7280", font: { size: 10 } } },
    },
  },
});

// ---- Quotation Value Distribution (doughnut) ----
new Chart(document.getElementById("chartValueDistribution"), {
  type: "doughnut",
  data: {
    labels: Object.keys(MOCK_VALUE_DISTRIBUTION),
    datasets: [{
      data: Object.values(MOCK_VALUE_DISTRIBUTION),
      backgroundColor: donutColors,
      borderColor: "#F6DCE8",
      borderWidth: 3,
      hoverOffset: 6,
    }],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: { position: "bottom", labels: { color: "#6B7280", boxWidth: 8, boxHeight: 8, padding: 8, font: { size: 9.5 }, usePointStyle: true, pointStyle: "circle" } },
      tooltip: { ...tooltipOpts, callbacks: { label: (ctx) => `${ctx.label}: ${formatCompactINR(ctx.parsed)}` } },
    },
  },
});

// ---- Client Activity (bar) ----
new Chart(document.getElementById("chartClientActivity"), {
  type: "bar",
  data: {
    labels: MOCK_CLIENT_ACTIVITY.map((d) => d.client),
    datasets: [{
      label: "Quotations received",
      data: MOCK_CLIENT_ACTIVITY.map((d) => d.count),
      backgroundColor: paletteMaroon,
      borderRadius: 6,
      maxBarThickness: 26,
    }],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { ...tooltipOpts, callbacks: { label: (ctx) => `${ctx.parsed.y} quotations` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#6B7280", font: { size: 9.5 }, maxRotation: 20, minRotation: 0 } },
      y: { beginAtZero: true, ticks: { color: "#6B7280", precision: 0 }, grid: { color: "#F5E6EA" } },
    },
  },
});

// ============================================================
// Section C — Recent Activity feed
// ============================================================
const ACTIVITY_ICONS = {
  created: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>',
  edited: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"></path></svg>',
  duplicated: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
  sent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>',
};

const ACTIVITY_VERB = {
  created: "created for",
  edited: "edited for",
  duplicated: "duplicated for",
  sent: "sent to",
};

function renderActivityFeed() {
  const list = document.getElementById("activityFeedList");
  if (!list) return;
  if (!MOCK_RECENT_ACTIVITY.length) {
    list.innerHTML = `<p class="text-xs text-gray-400 text-center py-4">No activity yet</p>`;
    return;
  }
  list.innerHTML = MOCK_RECENT_ACTIVITY.slice(0, 10).map((a) => `
    <div class="activity-row" data-ref="${a.ref}">
      <div class="activity-icon">${ACTIVITY_ICONS[a.type] || ACTIVITY_ICONS.created}</div>
      <div class="activity-body">
        <p class="activity-title">Quotation #${a.ref} ${ACTIVITY_VERB[a.type] || "created for"} ${a.client}</p>
        <p class="activity-meta">${formatDate(a.date)}, 2026</p>
      </div>
      <span class="activity-amount">${formatCompactINR(a.amount)}</span>
    </div>
  `).join("");

  list.querySelectorAll(".activity-row").forEach((row) => {
    row.addEventListener("click", () => {
      // In production this opens the Quotation History detail view
      // for row.dataset.ref — wired here as a placeholder navigation.
      window.location.href = "../Quotation/quotation.html";
    });
  });
}

// ============================================================
// Section D — Top Clients quick table
// ============================================================
function renderTopClients() {
  const list = document.getElementById("topClientsList");
  if (!list) return;
  list.innerHTML = MOCK_TOP_CLIENTS_BY_VALUE.map((c, idx) => `
    <div class="top-client-row">
      <span class="top-client-rank">${idx + 1}</span>
      <div class="top-client-body">
        <p class="top-client-name">${c.client}</p>
        <p class="top-client-meta">${c.count} quotations</p>
      </div>
      <span class="top-client-value">${formatCompactINR(c.value)}</span>
    </div>
  `).join("");
}

// ============================================================
// Export — CSV / Excel / PDF
// Builds one snapshot object from the currently selected date
// range and renders it three ways. Swap MOCK_* reads here for the
// same live data the KPIs/charts use once the backend is wired up.
// ============================================================
function getReportSnapshot() {
  const summary = MOCK_REPORTS_BY_RANGE[currentRange] || MOCK_REPORTS_BY_RANGE.today;
  return {
    range: summary.label,
    generatedAt: new Date().toLocaleString("en-IN"),
    kpis: [
      { label: "Total Clients", value: summary.totalClients },
      { label: "Quotations Generated", value: summary.totalQuotations },
      { label: "Total Quotation Value", value: formatINR(summary.totalValue) },
      { label: "Active Products / Models", value: summary.activeProducts },
    ],
    mostQuoted: MOCK_MOST_QUOTED_PRODUCTS.map((p, i) => ({ rank: i + 1, product: p.model, timesQuoted: p.count })),
    valueDistribution: Object.entries(MOCK_VALUE_DISTRIBUTION).map(([product, value]) => ({ product, value: formatINR(value) })),
    clientActivity: MOCK_CLIENT_ACTIVITY.map((c, i) => ({ rank: i + 1, client: c.client, quotationsReceived: c.count })),
    topClients: MOCK_TOP_CLIENTS_BY_VALUE.map((c, i) => ({ rank: i + 1, client: c.client, totalValue: formatINR(c.value), quotations: c.count })),
    recentActivity: MOCK_RECENT_ACTIVITY.map((a) => ({
      ref: a.ref, client: a.client, event: a.type, amount: formatINR(a.amount), date: formatDate(a.date) + ", 2026",
    })),
  };
}

function csvEscape(val) {
  const s = String(val ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function rowsToCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  rows.forEach((r) => lines.push(headers.map((h) => csvEscape(r[h])).join(",")));
  return lines.join("\n");
}

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportReportCSV() {
  const snap = getReportSnapshot();
  const sections = [
    [`VKM Reports — ${snap.range}`],
    [`Generated on ${snap.generatedAt}`],
    [],
    ["KPI SUMMARY"],
    rowsToCsv(snap.kpis.map((k) => ({ Metric: k.label, Value: k.value }))),
    [],
    ["MOST QUOTED PRODUCTS"],
    rowsToCsv(snap.mostQuoted),
    [],
    ["QUOTATION VALUE DISTRIBUTION"],
    rowsToCsv(snap.valueDistribution),
    [],
    ["CLIENT ACTIVITY"],
    rowsToCsv(snap.clientActivity),
    [],
    ["TOP CLIENTS BY VALUE"],
    rowsToCsv(snap.topClients),
    [],
    ["RECENT ACTIVITY"],
    rowsToCsv(snap.recentActivity),
  ];
  const csvContent = sections
    .map((s) => (Array.isArray(s) ? s.join(",") : s))
    .join("\n");
  downloadBlob(csvContent, `VKM-Report-${currentRange}-${Date.now()}.csv`, "text/csv;charset=utf-8;");
  showToast("CSV downloaded");
}

function exportReportExcel() {
  if (!window.XLSX) {
    showToast("Excel library failed to load — check your connection");
    return;
  }
  const snap = getReportSnapshot();
  const wb = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.json_to_sheet(snap.kpis.map((k) => ({ Metric: k.label, Value: k.value })));
  XLSX.utils.book_append_sheet(wb, summarySheet, "KPI Summary");

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(snap.mostQuoted), "Most Quoted Products");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(snap.valueDistribution), "Value Distribution");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(snap.clientActivity), "Client Activity");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(snap.topClients), "Top Clients");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(snap.recentActivity), "Recent Activity");

  XLSX.writeFile(wb, `VKM-Report-${currentRange}-${Date.now()}.xlsx`);
  showToast("Excel file downloaded");
}

function exportReportPDF() {
  if (!window.jspdf) {
    showToast("PDF library failed to load — check your connection");
    return;
  }
  const snap = getReportSnapshot();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 40;
  const marginRight = 555;
  let y = 50;

  function ensureSpace(next) {
    if (y + next > pageHeight - 40) {
      doc.addPage();
      y = 50;
    }
  }

  function drawHeader() {
    doc.setFontSize(16);
    doc.setTextColor(136, 17, 68);
    doc.text("Vaishnokripa Mercantile Pvt. Ltd.", marginLeft, y);
    y += 18;
    doc.setFontSize(11);
    doc.setTextColor(107, 114, 128);
    doc.text(`Reports & Analytics — ${snap.range}`, marginLeft, y);
    y += 10;
    doc.setDrawColor(136, 17, 68);
    doc.line(marginLeft, y, marginRight, y);
    y += 22;
  }

  function drawSectionTitle(title) {
    ensureSpace(26);
    doc.setFontSize(12);
    doc.setTextColor(128, 0, 33);
    doc.text(title, marginLeft, y);
    y += 8;
    doc.setDrawColor(232, 185, 206);
    doc.line(marginLeft, y, marginRight, y);
    y += 16;
  }

  function drawTable(rows, colWidths) {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    doc.setFontSize(9.5);
    ensureSpace(16);
    doc.setTextColor(107, 114, 128);
    let x = marginLeft;
    headers.forEach((h, i) => { doc.text(String(h), x, y); x += colWidths[i]; });
    y += 12;
    doc.setDrawColor(245, 230, 234);
    doc.line(marginLeft, y - 4, marginRight, y - 4);

    doc.setTextColor(31, 41, 55);
    rows.forEach((r) => {
      ensureSpace(16);
      x = marginLeft;
      headers.forEach((h, i) => { doc.text(String(r[h]), x, y); x += colWidths[i]; });
      y += 15;
    });
    y += 10;
  }

  drawHeader();

  drawSectionTitle("KPI Summary");
  drawTable(snap.kpis.map((k) => ({ Metric: k.label, Value: k.value })), [260, 200]);

  drawSectionTitle("Most Quoted Products");
  drawTable(snap.mostQuoted, [40, 320, 100]);

  drawSectionTitle("Quotation Value Distribution");
  drawTable(snap.valueDistribution, [340, 150]);

  drawSectionTitle("Client Activity");
  drawTable(snap.clientActivity, [40, 320, 130]);

  drawSectionTitle("Top Clients by Value");
  drawTable(snap.topClients, [40, 220, 130, 100]);

  drawSectionTitle("Recent Activity");
  drawTable(snap.recentActivity, [80, 150, 90, 90, 90]);

  ensureSpace(20);
  doc.setFontSize(8.5);
  doc.setTextColor(156, 163, 175);
  doc.text(`Generated on ${snap.generatedAt}`, marginLeft, y);

  doc.save(`VKM-Report-${currentRange}-${Date.now()}.pdf`);
  showToast("PDF downloaded");
}

document.getElementById("exportCsvBtn")?.addEventListener("click", exportReportCSV);
document.getElementById("exportExcelBtn")?.addEventListener("click", exportReportExcel);
document.getElementById("exportPdfBtn")?.addEventListener("click", exportReportPDF);

// ============================================================
// Init
// ============================================================
renderQuotationsOverTimeChart();
renderActivityFeed();
renderTopClients();
loadReportsData();