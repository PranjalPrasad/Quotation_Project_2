// ============================================================
// VKM Dashboard — single admin login, no channel-partner tiers.
// Every "loadX()" function below currently renders from a MOCK_*
// constant. When the backend is wired up, swap the mock source
// for a fetch() call inside that same function — the render
// logic underneath doesn't need to change.
// ============================================================

// ============================================================
// Sidebar collapse / expand
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

// ============================================================
// Formatting helpers
// ============================================================
function formatINR(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function formatCompactINR(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e7) return '₹' + (n / 1e7).toFixed(1) + 'Cr';
  if (abs >= 1e5) return '₹' + (n / 1e5).toFixed(1) + 'L';
  if (abs >= 1e3) return '₹' + (n / 1e3).toFixed(1) + 'K';
  return '₹' + n.toLocaleString('en-IN');
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast-animate bg-gray-800 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// ============================================================
// Mock summary data — mirrors what a future
// GET /api/dashboard/summary would return.
// ============================================================
const MOCK_DASHBOARD_SUMMARY = {
  totalCustomers: 174,
  totalQuotationsAllTime: 312,
  totalQuotationsMonth: 34,
  totalQuotationValueAllTime: 74300000,
  totalQuotationValueMonth: 8200000,
  pendingDecision: 47,
  machinesDispatchedMonth: 11,
  totalProducts: 58,
  acceptedAllTime: 156,
};

function loadDashboardData() {
  // Swap this line for a fetch('/api/dashboard/summary') call once the
  // backend endpoint exists — renderDashboardSummary() already expects
  // the same shape as MOCK_DASHBOARD_SUMMARY.
  renderDashboardSummary(MOCK_DASHBOARD_SUMMARY);
}

let quotationRange = 'all'; // 'all' | 'month'

function setQuotationRange(range) {
  quotationRange = range;
  document.getElementById('toggleAllTime').classList.toggle('active', range === 'all');
  document.getElementById('toggleThisMonth').classList.toggle('active', range === 'month');
  renderDashboardSummary(MOCK_DASHBOARD_SUMMARY);
}

function renderDashboardSummary(data) {
  const isMonth = quotationRange === 'month';
  
  // Card 1: Total Customers
  setText('statTotalCustomers', data.totalCustomers);
  
  // Card 2: Quotations count + total value
  setText('kpiTotalQuotations', isMonth ? data.totalQuotationsMonth : data.totalQuotationsAllTime);
  setText('kpiTotalValue', formatCompactINR(isMonth ? data.totalQuotationValueMonth : data.totalQuotationValueAllTime));
  
  // Card 3: Pending Decision
  setText('kpiPendingDecision', data.pendingDecision);
  
  // Card 4: Pending Quotation (show count of pending quotations)
  const pendingCount = quotations.filter(q => q.status === 'Pending').length;
  setText('kpiConversionRate', pendingCount);
  setText('kpiConversionSub', `${pendingCount} quotations pending`);
  
  // Additional stats that may be used elsewhere
  setText('statDispatched', data.machinesDispatchedMonth);
  setText('statTotalProducts', data.totalProducts);
  const avgQuotation = data.totalQuotationValueAllTime / data.totalQuotationsAllTime;
  setText('statAvgQuotation', formatCompactINR(avgQuotation));
}

// ============================================================
// Charts
// ============================================================
Chart.defaults.font.family = "'Poppins', sans-serif";
Chart.defaults.font.size = 11;

const paletteBerry = "#800021";  /* brand-600 */
const paletteMaroon = "#5C0018"; /* brand-700 */
const paletteTan = "#FFC9D9";    /* brand-200 */

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

// ---- Monthly Quotation Value Trend (bar) ----
const monthlyTrend = [
  { m: 'Feb', v: 5200000 },
  { m: 'Mar', v: 6100000 },
  { m: 'Apr', v: 5800000 },
  { m: 'May', v: 7000000 },
  { m: 'Jun', v: 6600000 },
  { m: 'Jul', v: 8200000 },
];

new Chart(document.getElementById('chartMonthlyTrend'), {
  type: 'bar',
  data: {
    labels: monthlyTrend.map(d => d.m),
    datasets: [{
      label: 'Quotation Value',
      data: monthlyTrend.map(d => d.v),
      backgroundColor: paletteBerry,
      borderRadius: 6,
      maxBarThickness: 34,
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { ...tooltipOpts, callbacks: { label: (ctx) => formatCompactINR(ctx.parsed.y) } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#6B7280' } },
      y: { beginAtZero: true, ticks: { color: '#6B7280', callback: (v) => formatCompactINR(v) }, grid: { color: '#F5E6EA' } },
    },
  }
});

// ---- Revenue by Machine Category (doughnut) ----
const categoryRevenue = { 'Brick Machines': 5250000, 'Accessories': 1420000, 'Consumables': 640000 };

new Chart(document.getElementById('chartCategoryRevenue'), {
  type: 'doughnut',
  data: {
    labels: Object.keys(categoryRevenue),
    datasets: [{
      data: Object.values(categoryRevenue),
      backgroundColor: [paletteBerry, paletteTan, paletteMaroon],
      borderColor: '#FFE4EC',
      borderWidth: 3,
      hoverOffset: 6,
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: { position: 'bottom', labels: { color: '#6B7280', boxWidth: 8, boxHeight: 8, padding: 8, font: { size: 10 }, usePointStyle: true, pointStyle: 'circle' } },
      tooltip: { ...tooltipOpts, callbacks: { label: (ctx) => `${ctx.label}: ${formatCompactINR(ctx.parsed)}` } },
    }
  }
});

// ============================================================
// Top Selling Machines
// ============================================================
const MOCK_TOP_MACHINES = [
  { model: 'VK002 · 6 Brick Metal to Metal', unitsMonth: 6, unitsYtd: 29, revenue: 8400000 },
  { model: 'VK004 · 10 Brick Fully Automatic', unitsMonth: 4, unitsYtd: 17, revenue: 7200000 },
  { model: 'Rotary Type Machine', unitsMonth: 3, unitsYtd: 14, revenue: 4375000 },
  { model: 'Budget Machine', unitsMonth: 5, unitsYtd: 33, revenue: 2062500 },
  { model: 'VK001 · 4 Brick Metal to Metal', unitsMonth: 2, unitsYtd: 11, revenue: 1320000 },
];

function renderTopMachines() {
  const tbody = document.getElementById('topMachinesTbody');
  if (!tbody) return;
  if (!MOCK_TOP_MACHINES.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-gray-400 py-3">No sales data yet</td></tr>`;
    return;
  }
  tbody.innerHTML = MOCK_TOP_MACHINES.map((m, idx) => `
    <tr>
      <td data-label="Rank">#${idx + 1}</td>
      <td data-label="Machine Model" class="font-medium">${m.model}</td>
      <td data-label="Units Sold (Month)">${m.unitsMonth}</td>
      <td data-label="Units Sold (YTD)">${m.unitsYtd}</td>
      <td data-label="Revenue Generated">${formatCompactINR(m.revenue)}</td>
    </tr>
  `).join('');
}

// ============================================================
// Right panel — Recent Quotations (mini) + Machines in Production
// ============================================================
const MINI_BADGE_CLASS = { Pending: 'badge-pending', Accepted: 'badge-accepted', Rejected: 'badge-rejected' };

function renderRecentQuotationsMini() {
  const list = document.getElementById('recentQuotationsList');
  if (!list) return;
  const recent = [...quotations]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 4);

  if (!recent.length) {
    list.innerHTML = `<p class="text-[11px] text-gray-400 px-1">No quotations yet</p>`;
    return;
  }

  list.innerHTML = recent.map(q => `
    <div class="quote-row" data-no="${q.no}">
      <div class="quote-avatar">${q.customer.charAt(0).toUpperCase()}</div>
      <div class="quote-info">
        <p>${q.customer}</p>
        <p>${formatINR(q.amount)} · ${formatDate(q.date)}</p>
      </div>
      <span class="badge ${MINI_BADGE_CLASS[q.status] || 'badge-neutral'}">${q.status}</span>
    </div>
  `).join('');

  list.querySelectorAll('.quote-row[data-no]').forEach(row => {
    row.addEventListener('click', () => openModal(row.getAttribute('data-no'), 'view'));
  });
}

function renderProductionBreakdown() {
  const total = document.getElementById('rightInProduction');
  const breakdown = document.getElementById('rightProductionBreakdown');
  if (!total || !breakdown) return;
  const items = [
    { label: 'VK002 · 6 Brick', count: 9 },
    { label: 'VK004 · 10 Brick', count: 6 },
    { label: 'Rotary Type Machine', count: 5 },
    { label: 'Budget Machine', count: 3 },
  ];
  total.textContent = items.reduce((s, i) => s + i.count, 0);
  breakdown.innerHTML = items.map(i => `
    <div class="flex items-center justify-between">
      <span>${i.label}</span>
      <span class="font-semibold text-gray-800">${i.count}</span>
    </div>
  `).join('');
}

// ============================================================
// Recent Quotations — full table (sort, paginate, view/edit,
// print, PDF export, duplicate)
// ============================================================
let quotations = [
  { no: 'SQ-1024', customer: 'Amit Sharma', machine: 'Budget Machine', amount: 800000, status: 'Pending', date: '2026-07-28' },
  { no: 'SQ-1023', customer: 'Priya Enterprises', machine: 'VK002 · 6 Brick Metal to Metal', amount: 1400000, status: 'Accepted', date: '2026-07-27' },
  { no: 'SQ-1022', customer: 'Ravi Constructions', machine: 'Double Station Nano Machine', amount: 715000, status: 'Rejected', date: '2026-07-26' },
  { no: 'SQ-1021', customer: 'Meena Textiles', machine: 'VK004 · 10 Brick Fully Automatic', amount: 1800000, status: 'Accepted', date: '2026-07-25' },
  { no: 'SQ-1020', customer: 'Suresh Patel', machine: 'Nano Machine', amount: 515000, status: 'Accepted', date: '2026-07-24' },
  { no: 'SQ-1019', customer: 'Global Foods Pvt Ltd', machine: 'VK005 · 12 Brick Fully Automatic', amount: 2000000, status: 'Accepted', date: '2026-07-23' },
  { no: 'SQ-1018', customer: 'Anita Deshmukh', machine: 'Metal to Metal Machine', amount: 1325000, status: 'Rejected', date: '2026-07-22' },
  { no: 'SQ-1017', customer: 'Rajesh Traders', machine: 'Rotary Type Machine', amount: 1250000, status: 'Pending', date: '2026-07-21' },
  { no: 'SQ-1016', customer: 'Sunrise Apartments', machine: 'VK003 · 8 Brick Fully Automatic', amount: 1600000, status: 'Accepted', date: '2026-07-20' },
  { no: 'SQ-1015', customer: 'Vikram Industries', machine: 'VK001 · 4 Brick Metal to Metal', amount: 1200000, status: 'Pending', date: '2026-07-19' },
  { no: 'SQ-1014', customer: 'Kavita Rao', machine: 'Budget Machine', amount: 800000, status: 'Accepted', date: '2026-07-18' },
  { no: 'SQ-1013', customer: 'Deepak Motors', machine: 'VK002 · 6 Brick Metal to Metal', amount: 1400000, status: 'Pending', date: '2026-07-17' },
  { no: 'SQ-1012', customer: 'Farha Textiles', machine: 'Double Station Nano Machine', amount: 715000, status: 'Rejected', date: '2026-07-16' },
  { no: 'SQ-1011', customer: 'Nikhil Joshi', machine: 'Nano Machine', amount: 515000, status: 'Accepted', date: '2026-07-15' },
  { no: 'SQ-1010', customer: 'Star Cold Storage', machine: 'VK004 · 10 Brick Fully Automatic', amount: 1800000, status: 'Pending', date: '2026-07-14' },
];

const tableStatusPillClass = { Pending: 'pill-pending', Accepted: 'pill-accepted', Rejected: 'pill-rejected' };

let sortKey = 'date';
let sortDir = 'desc';
let currentPage = 1;
let rowsPerPage = 10;

const qTbody = document.getElementById('quotationsTbody');
const paginationControls = document.getElementById('paginationControls');
const rowsRangeLabel = document.getElementById('rowsRangeLabel');
const rowsPerPageSelect = document.getElementById('rowsPerPage');

function sortedQuotations() {
  let list = [...quotations];
  list.sort((a, b) => {
    let av = a[sortKey], bv = b[sortKey];
    if (sortKey === 'amount') { /* numeric already */ }
    else if (sortKey === 'date') { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
    else { av = String(av).toLowerCase(); bv = String(bv).toLowerCase(); }
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
  return list;
}

const ICONS = {
  view: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"></path></svg>',
  print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>',
  pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><polyline points="9 15 12 12 15 15"></polyline></svg>',
  duplicate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
};

// Note: tooltips use data-tooltip (rendered via the floating tooltip
// system below) instead of the native title attribute, so they never
// get clipped by the table's overflow/scroll container and always
// appear above every other element.
function actionIconsHtml(no) {
  return `
    <div class="row-actions">
      <button class="action-icon-btn icon-view" data-action="view" data-no="${no}" data-tooltip="View">${ICONS.view}</button>
      <button class="action-icon-btn icon-edit" data-action="edit" data-no="${no}" data-tooltip="Edit">${ICONS.edit}</button>
      <button class="action-icon-btn icon-duplicate" data-action="duplicate" data-no="${no}" data-tooltip="Duplicate">${ICONS.duplicate}</button>
    </div>`;
}

function renderTable() {
  const data = sortedQuotations();
  const totalRows = data.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * rowsPerPage;
  const pageRows = data.slice(start, start + rowsPerPage);

  qTbody.innerHTML = pageRows.map((q) => `
    <tr data-no="${q.no}">
      <td data-label="Quotation No." class="font-medium">${q.no}</td>
      <td data-label="Customer">${q.customer}</td>
      <td data-label="Machine">${q.machine}</td>
      <td data-label="Amount">${formatINR(q.amount)}</td>
      <td data-label="Status"><span class="pill ${tableStatusPillClass[q.status]}">${q.status}</span></td>
      <td data-label="Date">${formatDate(q.date)}</td>
      <td data-label="Actions" class="actions-cell">${actionIconsHtml(q.no)}</td>
    </tr>
  `).join('');

  rowsRangeLabel.textContent = totalRows === 0
    ? 'No records'
    : `${start + 1}–${Math.min(start + rowsPerPage, totalRows)} of ${totalRows}`;

  renderPagination(totalPages);
  updateSortIcons();
  setText('statPendingQuotations', quotations.filter(q => q.status === 'Pending').length);
}

function renderPagination(totalPages) {
  let html = '';
  html += `<span class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" data-page="prev">‹</span>`;
  for (let p = 1; p <= totalPages; p++) {
    if (totalPages > 7 && p !== 1 && p !== totalPages && Math.abs(p - currentPage) > 1) {
      if (p === 2 || p === totalPages - 1) html += `<span class="pagination-btn disabled">…</span>`;
      continue;
    }
    html += `<span class="pagination-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</span>`;
  }
  html += `<span class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" data-page="next">›</span>`;
  paginationControls.innerHTML = html;

  paginationControls.querySelectorAll('.pagination-btn:not(.disabled)').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.getAttribute('data-page');
      if (p === 'prev') currentPage = Math.max(1, currentPage - 1);
      else if (p === 'next') currentPage = Math.min(totalPages, currentPage + 1);
      else currentPage = parseInt(p, 10);
      renderTable();
    });
  });
}

function updateSortIcons() {
  document.querySelectorAll('#quotationsTable thead th[data-key]').forEach(th => {
    const icon = th.querySelector('.sort-icon');
    const key = th.getAttribute('data-key');
    th.classList.toggle('sorted', key === sortKey);
    icon.textContent = key === sortKey ? (sortDir === 'asc' ? '↑' : '↓') : '⇅';
  });
}

document.querySelectorAll('#quotationsTable thead th[data-key]').forEach(th => {
  th.addEventListener('click', () => {
    const key = th.getAttribute('data-key');
    if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    else { sortKey = key; sortDir = 'asc'; }
    currentPage = 1;
    renderTable();
  });
});

rowsPerPageSelect?.addEventListener('change', () => {
  rowsPerPage = parseInt(rowsPerPageSelect.value, 10);
  currentPage = 1;
  renderTable();
});

/* ---- View / Edit modal ---- */
const quoteModal = document.getElementById('quoteModal');
const modalTitle = document.getElementById('modalTitle');
const modalSubtitle = document.getElementById('modalSubtitle');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalSaveBtn = document.getElementById('modalSaveBtn');
const quoteForm = document.getElementById('quoteForm');

const fldNo = document.getElementById('fldNo');
const fldCustomer = document.getElementById('fldCustomer');
const fldMachine = document.getElementById('fldMachine');
const fldAmount = document.getElementById('fldAmount');
const fldStatus = document.getElementById('fldStatus');
const fldDate = document.getElementById('fldDate');

const EDITABLE_FIELD_IDS = ['fldCustomer', 'fldMachine', 'fldAmount', 'fldStatus'];

let modalMode = 'view';
let modalQuoteNo = null;

function findQuote(no) {
  return quotations.find(q => q.no === no);
}

function fillForm(q) {
  fldNo.value = q.no;
  fldCustomer.value = q.customer;
  fldMachine.value = q.machine;
  fldAmount.value = q.amount;
  fldStatus.value = q.status;
  fldDate.value = q.date;
}

function openModal(no, mode) {
  const q = findQuote(no);
  if (!q) return;
  modalMode = mode;
  modalQuoteNo = no;
  fillForm(q);

  if (mode === 'view') {
    modalTitle.textContent = 'Quotation Details';
    modalSubtitle.textContent = `${q.no} · Read-only`;
    quoteForm.querySelectorAll('.field-input').forEach(el => el.disabled = true);
    modalSaveBtn.classList.add('hidden');
    modalCancelBtn.textContent = 'Close';
  } else {
    modalTitle.textContent = 'Edit Quotation';
    modalSubtitle.textContent = `${q.no} · Customer, machine, amount & status only`;
    quoteForm.querySelectorAll('.field-input').forEach(el => {
      el.disabled = !EDITABLE_FIELD_IDS.includes(el.id);
    });
    modalSaveBtn.classList.remove('hidden');
    modalCancelBtn.textContent = 'Cancel';
  }

  quoteModal.classList.remove('hidden');
}

function closeModal() {
  quoteModal.classList.add('hidden');
  modalQuoteNo = null;
}

modalCloseBtn?.addEventListener('click', closeModal);
modalCancelBtn?.addEventListener('click', closeModal);
quoteModal?.addEventListener('click', (e) => { if (e.target === quoteModal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !quoteModal.classList.contains('hidden')) closeModal(); });

modalSaveBtn?.addEventListener('click', () => {
  const q = findQuote(modalQuoteNo);
  if (!q) return;
  q.customer = fldCustomer.value.trim() || q.customer;
  q.machine = fldMachine.value.trim() || q.machine;
  q.amount = parseFloat(fldAmount.value) || q.amount;
  q.status = fldStatus.value;
  renderTable();
  renderRecentQuotationsMini();
  closeModal();
  showToast(`Saved changes to ${q.no}`);
});

/* ---- Print ---- */
function printQuotation(no) {
  const q = findQuote(no);
  if (!q) return;
  document.getElementById('pNo').textContent = q.no;
  document.getElementById('pCustomer').textContent = q.customer;
  document.getElementById('pMachine').textContent = q.machine;
  document.getElementById('pAmount').textContent = formatINR(q.amount);
  document.getElementById('pStatus').textContent = q.status;
  document.getElementById('pDate').textContent = formatDate(q.date);
  document.getElementById('pGenDate').textContent = new Date().toLocaleString('en-IN');
  window.print();
}

/* ---- Download PDF ---- */
function downloadQuotationPdf(no) {
  const q = findQuote(no);
  if (!q) return;
  if (!window.jspdf) {
    showToast('PDF library failed to load — check your connection');
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  doc.setFontSize(16);
  doc.setTextColor(136, 17, 68);
  doc.text('Vaishnokripa Mercantile Pvt. Ltd.', 40, 50);
  doc.setFontSize(11);
  doc.setTextColor(107, 114, 128);
  doc.text('Quotation Slip', 40, 68);
  doc.setDrawColor(136, 17, 68);
  doc.line(40, 78, 555, 78);

  const rows = [
    ['Quotation No.', q.no],
    ['Customer', q.customer],
    ['Machine', q.machine],
    ['Amount', formatINR(q.amount)],
    ['Status', q.status],
    ['Date', formatDate(q.date)],
  ];

  let y = 110;
  doc.setFontSize(11);
  rows.forEach(([label, value]) => {
    doc.setTextColor(107, 114, 128);
    doc.text(label, 40, y);
    doc.setTextColor(31, 41, 55);
    doc.text(String(value), 220, y);
    y += 26;
  });

  doc.setFontSize(9);
  doc.setTextColor(156, 163, 175);
  doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, 40, y + 20);

  doc.save(`${q.no}.pdf`);
  showToast(`Downloaded ${q.no}.pdf`);
}

/* ---- Duplicate ---- */
function duplicateQuotation(no) {
  const q = findQuote(no);
  if (!q) return;

  const maxNum = quotations.reduce((max, item) => {
    const n = parseInt(item.no.replace(/\D/g, ''), 10);
    return isNaN(n) ? max : Math.max(max, n);
  }, 0);
  const newNo = `SQ-${String(maxNum + 1).padStart(4, '0')}`;

  const copy = { ...q, no: newNo, status: 'Pending', date: new Date().toISOString().slice(0, 10) };
  quotations.unshift(copy);
  sortKey = 'date'; sortDir = 'desc'; currentPage = 1;
  renderTable();
  renderRecentQuotationsMini();
  showToast(`Duplicated as ${newNo}`);
}

qTbody?.addEventListener('click', (e) => {
  const actionBtn = e.target.closest('[data-action]');
  if (actionBtn) {
    e.stopPropagation();
    hideActionTooltip();
    const no = actionBtn.getAttribute('data-no');
    const action = actionBtn.getAttribute('data-action');
    if (action === 'view') openModal(no, 'view');
    else if (action === 'edit') openModal(no, 'edit');
    else if (action === 'print') printQuotation(no);
    else if (action === 'pdf') downloadQuotationPdf(no);
    else if (action === 'duplicate') duplicateQuotation(no);
    return;
  }
  const row = e.target.closest('tr[data-no]');
  if (row) openModal(row.getAttribute('data-no'), 'view');
});

// ============================================================
// Floating tooltip overlay for Recent Quotations action icons.
// Rendered on <body> and positioned via getBoundingClientRect so
// it always sits above the table/card and is never clipped by
// overflow-x-auto / overflow-hidden ancestors. Works for mouse
// hover on desktop and tap-and-hold on touch devices.
// ============================================================
let actionTooltipEl = null;

function getActionTooltipEl() {
  if (!actionTooltipEl) {
    actionTooltipEl = document.createElement('div');
    actionTooltipEl.className = 'action-tooltip';
    document.body.appendChild(actionTooltipEl);
  }
  return actionTooltipEl;
}

function showActionTooltip(btn) {
  const label = btn.getAttribute('data-tooltip');
  if (!label) return;
  const tip = getActionTooltipEl();
  tip.textContent = label;
  const rect = btn.getBoundingClientRect();
  tip.style.left = `${rect.left + rect.width / 2}px`;
  tip.style.top = `${rect.top}px`;
  requestAnimationFrame(() => tip.classList.add('visible'));
}

function hideActionTooltip() {
  if (actionTooltipEl) actionTooltipEl.classList.remove('visible');
}

qTbody?.addEventListener('mouseover', (e) => {
  const btn = e.target.closest('.action-icon-btn');
  if (btn) showActionTooltip(btn);
});
qTbody?.addEventListener('mouseout', (e) => {
  const btn = e.target.closest('.action-icon-btn');
  if (btn) hideActionTooltip();
});
qTbody?.addEventListener('focusin', (e) => {
  const btn = e.target.closest('.action-icon-btn');
  if (btn) showActionTooltip(btn);
});
qTbody?.addEventListener('focusout', (e) => {
  const btn = e.target.closest('.action-icon-btn');
  if (btn) hideActionTooltip();
});
window.addEventListener('scroll', hideActionTooltip, true);
window.addEventListener('resize', hideActionTooltip);

/* ---------------- New Quotation button ---------------- */
document.getElementById('newQuotationBtn')?.addEventListener('click', () => {
  window.location.href = '../Quotation/quotation.html';
});

/* ---------------- Topbar: profile dropdown ---------------- */
const profileBtn = document.getElementById('profileBtn');
const profileDropdown = document.getElementById('profileDropdown');
const profileLogoutBtn = document.getElementById('profileLogoutBtn');

function closeAllTopbarDropdowns(except) {
  [profileDropdown].forEach((dd) => {
    if (dd && dd !== except) dd.classList.add('hidden');
  });
}

profileBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  const willOpen = profileDropdown.classList.contains('hidden');
  closeAllTopbarDropdowns();
  profileDropdown.classList.toggle('hidden', !willOpen);
});

document.addEventListener('click', () => closeAllTopbarDropdowns());

function handleLogout() {
  showToast('Logged out');
  Auth.logout();
}
profileLogoutBtn?.addEventListener('click', handleLogout);

// ============================================================
// Init
// ============================================================
renderTopMachines();
renderRecentQuotationsMini();
renderProductionBreakdown();
renderTable();
loadDashboardData();