// ============================================================

// VKM Dashboard — Complete Backend Integration (No Static Data)

// ============================================================



// ============================================================

// API Configuration

// ============================================================

const API_BASE_URL = 'http://localhost:8092/api';



// ============================================================

// Global Chart Variables

// ============================================================

let monthlyTrendChart = null;

let categoryRevenueChart = null;

let dashboardData = null;

let quotationsData = [];

let quotationRange = 'all';



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

  if (n === null || n === undefined || isNaN(n)) return '₹0';

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

  if (!iso) return '—';

  const d = new Date(iso);

  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

}



function setText(id, value) {

  const el = document.getElementById(id);

  if (el) el.textContent = value;

}



function showToast(message, type) {

  const container = document.getElementById('toast-container');

  if (!container) return;

  const toast = document.createElement('div');

  const bgColor = type === 'error' ? 'bg-red-600' : 'bg-gray-800';

  toast.className = `toast-animate ${bgColor} text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg`;

  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);

}



// ============================================================

// Loading State

// ============================================================

function showLoading() {

  const elements = document.querySelectorAll('[id$="Tbody"], [id$="List"]');

  elements.forEach(el => {

    if (el) el.innerHTML = `<tr><td colspan="10" class="text-center text-gray-400 py-6">Loading...</td></tr>`;

  });

}



// ============================================================

// Fetch Dashboard Data from Backend

// ============================================================

async function fetchDashboardData() {

  try {

    showLoading();

   

    console.log('🔄 Fetching dashboard data...');

    const response = await fetch(`${API_BASE_URL}/dashboard/data`);

    const result = await response.json();

   

    console.log('📊 Dashboard API Response:', result);

   

    if (!result.success) {

      throw new Error(result.message || 'Failed to fetch dashboard data');

    }

   

    dashboardData = result.data;

    console.log('✅ Dashboard Data:', dashboardData);

   

    renderDashboard(dashboardData);

   

  } catch (error) {

    console.error('❌ Error fetching dashboard data:', error);

    showToast('Failed to load dashboard data: ' + error.message, 'error');

    showEmptyState();

  }

}



// ============================================================

// Show Empty State

// ============================================================

function showEmptyState() {

  const tbody = document.getElementById('topMachinesTbody');

  if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center text-gray-400 py-6">No sales data available</td></tr>`;

 

  const qTbody = document.getElementById('quotationsTbody');

  if (qTbody) qTbody.innerHTML = `<tr><td colspan="7" class="text-center text-gray-400 py-6">No quotations found</td></tr>`;

 

  const list = document.getElementById('recentPaymentsList');

  if (list) list.innerHTML = `<p class="text-[11px] text-gray-400 px-1">No recent payments</p>`;

 

  const miniList = document.getElementById('recentQuotationsList');

  if (miniList) miniList.innerHTML = `<p class="text-[11px] text-gray-400 px-1">No quotations yet</p>`;

 

  const breakdown = document.getElementById('rightProductionBreakdown');

  if (breakdown) breakdown.innerHTML = `<div class="text-gray-400 text-[11px]">No production data</div>`;

 

  // Show empty state for charts

  showChartEmptyState('chartMonthlyTrend', 'No trend data available');

  showChartEmptyState('chartCategoryRevenue', 'No category data available');

 

  setText('statTotalCustomers', '0');

  setText('kpiTotalQuotations', '0');

  setText('kpiTotalValue', '₹0');

  setText('kpiPendingDecision', '0');

  setText('kpiConversionRate', '0%');

  setText('kpiConversionSub', '0 of 0 quotations');

  setText('rightInProduction', '0');

}



function showChartEmptyState(canvasId, message) {

  const canvas = document.getElementById(canvasId);

  if (!canvas) return;

  const parent = canvas.parentElement;

  if (parent) {

    parent.innerHTML = `

      <div class="flex flex-col items-center justify-center h-full min-h-[180px]">

        <p class="text-center text-gray-400 text-sm">${message}</p>

        <p class="text-center text-gray-300 text-xs mt-1">Add accepted quotations to see data</p>

      </div>

    `;

  }

}



// ============================================================

// Render Complete Dashboard

// ============================================================

function renderDashboard(data) {

  if (!data) {

    showEmptyState();

    return;

  }

 

  renderSummaryMetrics(data.summary);

  renderTopMachines(data.topMachines);

  renderRecentPayments(data.recentPayments);

  renderRecentQuotations(data.recentQuotations);

  renderMonthlyTrend(data.monthlyTrend);

  renderCategoryRevenue(data.categoryRevenue);

  renderQuickStats(data.quickStats);

  renderRecentQuotationsMini(data.recentQuotations);

}



// ============================================================

// Render Summary Metrics

// ============================================================

function renderSummaryMetrics(summary) {

  if (!summary) return;

 

  const isMonth = quotationRange === 'month';

 

  setText('statTotalCustomers', summary.totalCustomers || 0);

  setText('kpiTotalQuotations', isMonth ? summary.totalQuotationsMonth || 0 : summary.totalQuotationsAllTime || 0);

  setText('kpiTotalValue', formatCompactINR(isMonth ? summary.totalQuotationValueMonth : summary.totalQuotationValueAllTime));

  setText('kpiPendingDecision', summary.pendingDecision || 0);

  setText('kpiConversionRate', summary.conversionRate !== undefined ? Math.round(summary.conversionRate) + '%' : '0%');

  setText('kpiConversionSub', (summary.acceptedAllTime || 0) + ' of ' + (summary.totalQuotationsAllTime || 0) + ' quotations');

}



// ============================================================

// Quotation Range Toggle

// ============================================================

function setQuotationRange(range) {

  quotationRange = range;

  document.getElementById('toggleAllTime').classList.toggle('active', range === 'all');

  document.getElementById('toggleThisMonth').classList.toggle('active', range === 'month');

 

  if (dashboardData && dashboardData.summary) {

    renderSummaryMetrics(dashboardData.summary);

  }

}



// ============================================================

// Render Top Machines

// ============================================================

function renderTopMachines(machines) {

  const tbody = document.getElementById('topMachinesTbody');

  if (!tbody) return;

 

  if (!machines || machines.length === 0) {

    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-gray-400 py-6">No sales data available</td></tr>`;

    return;

  }

 

  tbody.innerHTML = machines.map((m, idx) => `

    <tr>

      <td data-label="Rank">#${idx + 1}</td>

      <td data-label="Machine Model" class="font-medium">${m.model || '—'}</td>

      <td data-label="Units Sold (Month)">${m.unitsMonth || 0}</td>

      <td data-label="Units Sold (YTD)">${m.unitsYtd || 0}</td>

      <td data-label="Revenue Generated">${formatCompactINR(m.revenue)}</td>

    </tr>

  `).join('');

}



// ============================================================

// Render Recent Payments

// ============================================================

function renderRecentPayments(payments) {

  const list = document.getElementById('recentPaymentsList');

  if (!list) return;

 

  if (!payments || payments.length === 0) {

    list.innerHTML = `<p class="text-[11px] text-gray-400 px-1">No recent payments</p>`;

    return;

  }

 

  list.innerHTML = payments.map(p => {

    const isPaid = p.status === 'PAID' || p.status === 'paid';

    return `

      <div class="quote-row">

        <div class="w-9 h-9 rounded-full ${isPaid ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'} flex items-center justify-center text-xs font-bold">

          ${isPaid ? '✓' : '!'}

        </div>

        <div class="quote-info">

          <p>${p.customer || '—'}</p>

          <p>${formatINR(p.amount)} · ${formatDate(p.paymentDate)}</p>

        </div>

        <span class="quote-pill ${isPaid ? 'paid' : 'overdue'}">${p.status || '—'}</span>

      </div>

    `;

  }).join('');

}



// ============================================================

// Render Recent Quotations Mini (Right Panel)

// ============================================================

function renderRecentQuotationsMini(quotations) {

  const list = document.getElementById('recentQuotationsList');

  if (!list) return;

 

  if (!quotations || quotations.length === 0) {

    list.innerHTML = `<p class="text-[11px] text-gray-400 px-1">No quotations yet</p>`;

    return;

  }

 

  const recent = quotations.slice(0, 4);

 

  list.innerHTML = recent.map(q => `

    <div class="quote-row" data-no="${q.quotationNo}">

      <div class="quote-avatar">${(q.customer || '?').charAt(0).toUpperCase()}</div>

      <div class="quote-info">

        <p>${q.customer || '—'}</p>

        <p>${formatINR(q.amount)} · ${formatDate(q.date)}</p>

      </div>

      <span class="badge ${getStatusBadgeClass(q.status)}">${q.status || '—'}</span>

    </div>

  `).join('');

 

  list.querySelectorAll('.quote-row[data-no]').forEach(row => {

    row.addEventListener('click', () => openModal(row.getAttribute('data-no'), 'view'));

  });

}



function getStatusBadgeClass(status) {

  if (!status) return 'badge-neutral';

  const s = status.toLowerCase();

  if (s === 'pending') return 'badge-pending';

  if (s === 'accepted' || s === 'approved') return 'badge-accepted';

  if (s === 'rejected') return 'badge-rejected';

  return 'badge-neutral';

}



// ============================================================

// Render Monthly Trend Chart - FIXED

// ============================================================

function renderMonthlyTrend(trendData) {

  const canvas = document.getElementById('chartMonthlyTrend');

  if (!canvas) {

    console.log('❌ chartMonthlyTrend canvas not found');

    return;

  }

 

  // Destroy existing chart

  if (monthlyTrendChart) {

    monthlyTrendChart.destroy();

    monthlyTrendChart = null;

  }

 

  console.log('📈 Monthly Trend Data:', trendData);

 

  // Check if data exists

  if (!trendData || trendData.length === 0) {

    console.log('⚠️ No monthly trend data');

    const parent = canvas.parentElement;

    if (parent) {

      parent.innerHTML = `

        <div class="flex flex-col items-center justify-center h-full min-h-[180px]">

          <p class="text-center text-gray-400 text-sm">No trend data available</p>

          <p class="text-center text-gray-300 text-xs mt-1">Add accepted quotations to see trends</p>

        </div>

      `;

    }

    return;

  }

 

  // Check if all values are zero

  const hasData = trendData.some(d => (d.totalValue || 0) > 0);

  if (!hasData) {

    console.log('⚠️ All trend values are zero');

    const parent = canvas.parentElement;

    if (parent) {

      parent.innerHTML = `

        <div class="flex flex-col items-center justify-center h-full min-h-[180px]">

          <p class="text-center text-gray-400 text-sm">No quotation data available</p>

          <p class="text-center text-gray-300 text-xs mt-1">Create quotations to see trends</p>

        </div>

      `;

    }

    return;

  }

 

  // Extract data

  const labels = trendData.map(d => d.month || '—');

  const values = trendData.map(d => d.totalValue || 0);

 

  console.log('📊 Chart Labels:', labels);

  console.log('📊 Chart Values:', values);

 

  try {

    // Make sure canvas is visible

    const ctx = canvas.getContext('2d');

    if (!ctx) {

      console.log('❌ Cannot get canvas context');

      return;

    }

   

    // Create chart

    monthlyTrendChart = new Chart(canvas, {

      type: 'bar',

      data: {

        labels: labels,

        datasets: [{

          label: 'Quotation Value',

          data: values,

          backgroundColor: '#800021',

          borderRadius: 6,

          maxBarThickness: 34,

        }]

      },

      options: {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

          legend: { display: false },

          tooltip: {

            backgroundColor: "#fff",

            titleColor: "#1F2937",

            bodyColor: "#6B7280",

            borderColor: "#F1F1F1",

            borderWidth: 1,

            padding: 10,

            cornerRadius: 10,

            callbacks: {

              label: function(ctx) {

                return '₹' + ctx.parsed.y.toLocaleString('en-IN');

              }

            }

          }

        },

        scales: {

          x: {

            grid: { display: false },

            ticks: { color: '#6B7280' }

          },

          y: {

            beginAtZero: true,

            ticks: {

              color: '#6B7280',

              callback: function(value) {

                if (value >= 10000000) return '₹' + (value / 10000000).toFixed(1) + 'Cr';

                if (value >= 100000) return '₹' + (value / 100000).toFixed(1) + 'L';

                if (value >= 1000) return '₹' + (value / 1000).toFixed(0) + 'K';

                return '₹' + value;

              }

            },

            grid: { color: '#F5E6EA' }

          }

        }

      }

    });

   

    console.log('✅ Monthly trend chart created successfully');

  } catch (error) {

    console.error('❌ Error creating monthly trend chart:', error);

    const parent = canvas.parentElement;

    if (parent) {

      parent.innerHTML = `

        <div class="flex flex-col items-center justify-center h-full min-h-[180px]">

          <p class="text-center text-red-500 text-sm">Error loading chart</p>

          <p class="text-center text-gray-400 text-xs mt-1">${error.message}</p>

        </div>

      `;

    }

  }

}



// ============================================================

// Render Category Revenue Chart - FIXED

// ============================================================

function renderCategoryRevenue(categoryData) {

  const canvas = document.getElementById('chartCategoryRevenue');

  if (!canvas) {

    console.log('❌ chartCategoryRevenue canvas not found');

    return;

  }

 

  // Destroy existing chart

  if (categoryRevenueChart) {

    categoryRevenueChart.destroy();

    categoryRevenueChart = null;

  }

 

  console.log('📊 Category Revenue Data:', categoryData);

 

  // Check if data exists

  if (!categoryData || categoryData.length === 0) {

    console.log('⚠️ No category revenue data');

    const parent = canvas.parentElement;

    if (parent) {

      parent.innerHTML = `

        <div class="flex flex-col items-center justify-center h-full min-h-[180px]">

          <p class="text-center text-gray-400 text-sm">No category data available</p>

          <p class="text-center text-gray-300 text-xs mt-1">Add accepted quotations to see categories</p>

        </div>

      `;

    }

    return;

  }

 

  // Check if all values are zero

  const hasData = categoryData.some(d => (d.totalRevenue || 0) > 0);

  if (!hasData) {

    console.log('⚠️ All category revenues are zero');

    const parent = canvas.parentElement;

    if (parent) {

      parent.innerHTML = `

        <div class="flex flex-col items-center justify-center h-full min-h-[180px]">

          <p class="text-center text-gray-400 text-sm">No revenue data available</p>

          <p class="text-center text-gray-300 text-xs mt-1">Create quotations to see revenue breakdown</p>

        </div>

      `;

    }

    return;

  }

 

  // Extract data

  const labels = categoryData.map(d => d.category || '—');

  const values = categoryData.map(d => d.totalRevenue || 0);

  const colors = ['#800021', '#FFC9D9', '#5C0018', '#E8B9CE', '#B8285F'];

 

  console.log('📊 Category Labels:', labels);

  console.log('📊 Category Values:', values);

 

  try {

    // Make sure canvas is visible

    const ctx = canvas.getContext('2d');

    if (!ctx) {

      console.log('❌ Cannot get canvas context');

      return;

    }

   

    // Create chart

    categoryRevenueChart = new Chart(canvas, {

      type: 'doughnut',

      data: {

        labels: labels,

        datasets: [{

          data: values,

          backgroundColor: colors.slice(0, labels.length),

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

          legend: {

            position: 'bottom',

            labels: {

              color: '#6B7280',

              boxWidth: 8,

              boxHeight: 8,

              padding: 8,

              font: { size: 10 },

              usePointStyle: true,

              pointStyle: 'circle'

            }

          },

          tooltip: {

            backgroundColor: "#fff",

            titleColor: "#1F2937",

            bodyColor: "#6B7280",

            borderColor: "#F1F1F1",

            borderWidth: 1,

            padding: 10,

            cornerRadius: 10,

            callbacks: {

              label: function(ctx) {

                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);

                const percentage = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;

                return ctx.label + ': ₹' + ctx.parsed.toLocaleString('en-IN') + ' (' + percentage + '%)';

              }

            }

          }

        }

      }

    });

   

    console.log('✅ Category revenue chart created successfully');

  } catch (error) {

    console.error('❌ Error creating category revenue chart:', error);

    const parent = canvas.parentElement;

    if (parent) {

      parent.innerHTML = `

        <div class="flex flex-col items-center justify-center h-full min-h-[180px]">

          <p class="text-center text-red-500 text-sm">Error loading chart</p>

          <p class="text-center text-gray-400 text-xs mt-1">${error.message}</p>

        </div>

      `;

    }

  }

}



// ============================================================

// Render Quick Stats (Right Panel)

// ============================================================

function renderQuickStats(quickStats) {

  if (!quickStats) return;

 

  const total = document.getElementById('rightInProduction');

  const breakdown = document.getElementById('rightProductionBreakdown');

 

  if (total) {

    total.textContent = quickStats.machinesInProduction || 0;

  }

 

  if (breakdown) {

    if (!quickStats.productionBreakdown || quickStats.productionBreakdown.length === 0) {

      breakdown.innerHTML = `<div class="text-gray-400 text-[11px]">No production data</div>`;

    } else {

      breakdown.innerHTML = quickStats.productionBreakdown.map(item => `

        <div class="flex items-center justify-between">

          <span>${item.label || '—'}</span>

          <span class="font-semibold text-gray-800">${item.count || 0}</span>

        </div>

      `).join('');

    }

  }

}



// ============================================================

// Render Full Recent Quotations Table

// ============================================================

const tableStatusPillClass = {

  'Pending': 'pill-pending',

  'Accepted': 'pill-accepted',

  'Rejected': 'pill-rejected',

  'pending': 'pill-pending',

  'accepted': 'pill-accepted',

  'rejected': 'pill-rejected'

};



let sortKey = 'date';

let sortDir = 'desc';

let currentPage = 1;

let rowsPerPage = 10;



const qTbody = document.getElementById('quotationsTbody');

const paginationControls = document.getElementById('paginationControls');

const rowsRangeLabel = document.getElementById('rowsRangeLabel');

const rowsPerPageSelect = document.getElementById('rowsPerPage');



function renderRecentQuotations(quotations) {

  quotationsData = quotations || [];

  renderTable();

  renderRecentQuotationsMini(quotationsData);

}



function sortedQuotations() {

  let list = [...quotationsData];

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

  duplicate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',

  print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>',

  pdf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><polyline points="9 15 12 12 15 15"></polyline></svg>',

};



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



  if (pageRows.length === 0) {

    qTbody.innerHTML = `

      <tr>

        <td colspan="7" class="text-center text-gray-400 py-6">

          No quotations found

        </td>

      </tr>

    `;

  } else {

    qTbody.innerHTML = pageRows.map((q) => `

      <tr data-no="${q.quotationNo}">

        <td data-label="Quotation No." class="font-medium">${q.quotationNo || '—'}</td>

        <td data-label="Customer">${q.customer || '—'}</td>

        <td data-label="Machine">${q.machine || '—'}</td>

        <td data-label="Amount">${formatINR(q.amount)}</td>

        <td data-label="Status"><span class="pill ${tableStatusPillClass[q.status] || 'pill-pending'}">${q.status || 'Pending'}</span></td>

        <td data-label="Date">${formatDate(q.date)}</td>

        <td data-label="Actions" class="actions-cell">${actionIconsHtml(q.quotationNo)}</td>

      </tr>

    `).join('');

  }



  rowsRangeLabel.textContent = totalRows === 0

    ? 'No records'

    : `${start + 1}–${Math.min(start + rowsPerPage, totalRows)} of ${totalRows}`;



  renderPagination(totalPages);

  updateSortIcons();

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



// ============================================================

// View / Edit Modal

// ============================================================

const quoteModal = document.getElementById('quoteModal');

const modalTitle = document.getElementById('modalTitle');

const modalSubtitle = document.getElementById('modalSubtitle');

const modalCloseBtn = document.getElementById('modalCloseBtn');

const modalCancelBtn = document.getElementById('modalCancelBtn');

const modalSaveBtn = document.getElementById('modalSaveBtn');



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

  return quotationsData.find(q => q.quotationNo === no);

}



function fillForm(q) {

  fldNo.value = q.quotationNo || '';

  fldCustomer.value = q.customer || '';

  fldMachine.value = q.machine || '';

  fldAmount.value = q.amount || 0;

  fldStatus.value = q.status || 'Pending';

  fldDate.value = q.date || '';

}



function openModal(no, mode) {

  const q = findQuote(no);

  if (!q) {

    showToast('Quotation not found!', 'error');

    return;

  }

  modalMode = mode;

  modalQuoteNo = no;

  fillForm(q);



  if (mode === 'view') {

    modalTitle.textContent = 'Quotation Details';

    modalSubtitle.textContent = `${q.quotationNo} · Read-only`;

    quoteForm.querySelectorAll('.field-input').forEach(el => el.disabled = true);

    modalSaveBtn.classList.add('hidden');

    modalCancelBtn.textContent = 'Close';

  } else {

    modalTitle.textContent = 'Edit Quotation';

    modalSubtitle.textContent = `${q.quotationNo} · Edit fields below`;

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

 

  const amount = parseFloat(fldAmount.value);

  if (isNaN(amount) || amount < 0) {

    showToast('Please enter a valid amount', 'error');

    return;

  }

 

  q.customer = fldCustomer.value.trim() || q.customer;

  q.machine = fldMachine.value.trim() || q.machine;

  q.amount = amount;

  q.status = fldStatus.value;

 

  renderTable();

  renderRecentQuotationsMini(quotationsData);

  closeModal();

  showToast('Saved changes to ' + q.quotationNo);

});



// ============================================================

// Duplicate Quotation

// ============================================================

function duplicateQuotation(no) {

  const q = findQuote(no);

  if (!q) {

    showToast('Quotation not found!', 'error');

    return;

  }



  const maxNum = quotationsData.reduce((max, item) => {

    const n = parseInt(item.quotationNo.replace(/\D/g, ''), 10);

    return isNaN(n) ? max : Math.max(max, n);

  }, 0);

  const newNo = 'SQ-' + String(maxNum + 1).padStart(4, '0');



  const copy = {

    ...q,

    quotationNo: newNo,

    status: 'Pending',

    date: new Date().toISOString().slice(0, 10)

  };

  quotationsData.unshift(copy);

  sortKey = 'date';

  sortDir = 'desc';

  currentPage = 1;

  renderTable();

  renderRecentQuotationsMini(quotationsData);

  showToast('Duplicated as ' + newNo);

}



// ============================================================

// Floating tooltip overlay

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

  tip.style.top = `${rect.top - 8}px`;

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



// ============================================================

// Table Action Click Handler

// ============================================================

qTbody?.addEventListener('click', (e) => {

  const actionBtn = e.target.closest('[data-action]');

  if (actionBtn) {

    e.stopPropagation();

    hideActionTooltip();

    const no = actionBtn.getAttribute('data-no');

    const action = actionBtn.getAttribute('data-action');

    if (action === 'view') openModal(no, 'view');

    else if (action === 'edit') openModal(no, 'edit');

    else if (action === 'duplicate') duplicateQuotation(no);

    return;

  }

  const row = e.target.closest('tr[data-no]');

  if (row) openModal(row.getAttribute('data-no'), 'view');

});



// ============================================================

// Topbar: Profile Dropdown

// ============================================================

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

  if (typeof Auth !== 'undefined' && Auth.logout) {

    Auth.logout();

  } else {

    window.location.href = '../index.html';

  }

}

profileLogoutBtn?.addEventListener('click', handleLogout);



// ============================================================

// Navigation Buttons

// ============================================================

document.getElementById('viewAllBtn')?.addEventListener('click', (e) => {

  e.preventDefault();

  window.location.href = '../Quotation/quotation.html';

});



// ============================================================

// Initialize Dashboard - Fetch from API only

// ============================================================

document.addEventListener('DOMContentLoaded', function() {

  console.log('🚀 Dashboard initializing...');

  fetchDashboardData();

});



// ============================================================

// Auto Refresh every 60 seconds

// ============================================================

setInterval(() => {

  if (document.visibilityState === 'visible') {

    console.log('🔄 Auto-refreshing dashboard...');

    fetchDashboardData();

  }

}, 60000);