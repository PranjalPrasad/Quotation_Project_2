// ============================================================
// PURCHASE MANAGEMENT — Complete JS
// (Sidebar toggle now lives inline in purchase.html, same pattern as productm.html)
// ============================================================

const API_BASE = 'http://localhost:8092/api';

// ============================================================
// Offline banner — shown once if the backend can't be reached,
// so mock/demo data on screen doesn't look like a silent bug.
// ============================================================
let backendOffline = false;
function markBackendOffline() {
  if (backendOffline) return;
  backendOffline = true;
  const banner = document.getElementById('offlineBanner');
  if (banner) banner.classList.remove('hidden');
}
function markBackendOnline() {
  if (!backendOffline) return;
  backendOffline = false;
  const banner = document.getElementById('offlineBanner');
  if (banner) banner.classList.add('hidden');
}

// ============================================================
// State
// ============================================================
let purchases = [];
let suppliers = [];
let poItems = [];
let currentPage = 1;
let rowsPerPage = 10;
let sortKey = 'poNo';
let sortDir = 'asc';

// ============================================================
// Helpers
// ============================================================
function formatINR(n) {
  if (!n && n !== 0) return '₹0';
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(msg, type) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast-animate ${type === 'error' ? 'bg-red-600' : 'bg-gray-800'} text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

// ============================================================
// Tabs
// ============================================================
function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.remove('hidden');
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
}

// ============================================================
// Fetch Data
// ============================================================
async function fetchSuppliers() {
  try {
    const res = await fetch(`${API_BASE}/suppliers`);
    const data = await res.json();
    suppliers = data.success ? data.data : [];
    markBackendOnline();
    populateSupplierDropdown();
  } catch (err) {
    markBackendOffline();
    suppliers = getMockSuppliers();
    populateSupplierDropdown();
  }
}

async function fetchPurchases() {
  try {
    const res = await fetch(`${API_BASE}/purchases`);
    const data = await res.json();
    purchases = data.success ? data.data : [];
    markBackendOnline();
  } catch (err) {
    markBackendOffline();
    purchases = getMockPurchases();
  }
  renderSummary();
  renderTable();
}

function populateSupplierDropdown() {
  const sel = document.getElementById('poSupplier');
  if (!sel) return;
  sel.innerHTML = '<option value="">Select Supplier</option>' +
    suppliers.map(s => `<option value="${s.id}">${escapeHtml(s.name)}${s.gstin ? ' (GST: ' + escapeHtml(s.gstin) + ')' : ''}</option>`).join('');
}

// ============================================================
// Mock Data
// ============================================================
function getMockSuppliers() {
  return [
    { id: 1, name: 'ABC Machinery Pvt Ltd', gstin: '09ABCDE1234F1Z5', mobile: '9876543210', address: 'Mumbai', city: 'Mumbai', state: 'Maharashtra' },
    { id: 2, name: 'Steel Industries', gstin: '09FGHIJ5678K1Z2', mobile: '9876543211', address: 'Pune', city: 'Pune', state: 'Maharashtra' },
    { id: 3, name: 'Hydraulic Solutions', gstin: '', mobile: '9876543212', address: 'Delhi', city: 'Delhi', state: 'Delhi' },
  ];
}

function getMockPurchases() {
  return [
    { id: 1, poNo: 'PO-1001', supplier: 'ABC Machinery Pvt Ltd', date: '2026-08-01', amount: 250000, status: 'Received' },
    { id: 2, poNo: 'PO-1002', supplier: 'Steel Industries', date: '2026-08-05', amount: 180000, status: 'Pending' },
    { id: 3, poNo: 'PO-1003', supplier: 'Hydraulic Solutions', date: '2026-08-10', amount: 95000, status: 'Pending' },
  ];
}

// ============================================================
// Render Summary
// ============================================================
function renderSummary() {
  document.getElementById('statTotalPurchases').textContent = purchases.length;
  document.getElementById('statReceived').textContent = purchases.filter(p => p.status === 'Received').length;
  document.getElementById('statPending').textContent = purchases.filter(p => p.status === 'Pending').length;
  const total = purchases.reduce((s, p) => s + (p.amount || 0), 0);
  document.getElementById('statTotalValue').textContent = formatINR(total);
}

// ============================================================
// Render Table (data-label attrs added so mobile/tablet card-view CSS works)
// ============================================================
function renderTable() {
  const data = [...purchases];
  const search = document.getElementById('searchPurchase')?.value?.toLowerCase() || '';
  const filterStatus = document.getElementById('filterStatus')?.value || 'All';
  const from = document.getElementById('filterDateFrom')?.value;
  const to = document.getElementById('filterDateTo')?.value;

  let filtered = data.filter(p => {
    const matchSearch = p.poNo.toLowerCase().includes(search) || p.supplier.toLowerCase().includes(search);
    const matchStatus = filterStatus === 'All' || p.status === filterStatus;
    const matchDate = (!from || p.date >= from) && (!to || p.date <= to);
    return matchSearch && matchStatus && matchDate;
  });

  // Sort
  filtered.sort((a, b) => {
    let av = a[sortKey] || '', bv = b[sortKey] || '';
    if (sortKey === 'amount') { av = parseFloat(av) || 0; bv = parseFloat(bv) || 0; }
    else if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  document.getElementById('purchaseCount').textContent = filtered.length + ' records';

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * rowsPerPage;
  const pageRows = filtered.slice(start, start + rowsPerPage);

  const tbody = document.getElementById('purchaseTbody');
  if (pageRows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-gray-400 py-6">No purchase orders found</td></tr>`;
  } else {
    tbody.innerHTML = pageRows.map(p => `
      <tr>
        <td data-label="PO No." class="font-medium">${escapeHtml(p.poNo)}</td>
        <td data-label="Supplier">${escapeHtml(p.supplier)}</td>
        <td data-label="Date">${formatDate(p.date)}</td>
        <td data-label="Amount">${formatINR(p.amount)}</td>
        <td data-label="Status"><span class="pill ${p.status === 'Received' ? 'pill-paid' : p.status === 'Pending' ? 'pill-pending' : 'pill-cancelled'}">${escapeHtml(p.status)}</span></td>
        <td data-label="Actions">
          <button class="text-peach-600 hover:text-peach-700 text-xs font-medium mr-2" style="color:#800021" onclick="viewPurchase(${p.id})">View</button>
          <button class="text-blue-600 hover:text-blue-700 text-xs font-medium mr-2" onclick="editPurchase(${p.id})">Edit</button>
          <button class="text-red-600 hover:text-red-700 text-xs font-medium" onclick="deletePurchase(${p.id})">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  // Update pagination
  document.getElementById('rowsRangeLabel').textContent =
    filtered.length === 0 ? 'Showing 0-0 of 0' :
    `${start + 1}–${Math.min(start + rowsPerPage, filtered.length)} of ${filtered.length}`;

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const el = document.getElementById('paginationControls');
  let html = `<button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" onclick="${currentPage > 1 ? 'goToPage(' + (currentPage - 1) + ')' : ''}">‹</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }
  html += `<button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" onclick="${currentPage < totalPages ? 'goToPage(' + (currentPage + 1) + ')' : ''}">›</button>`;
  el.innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  renderTable();
}

function changeRowsPerPage() {
  rowsPerPage = parseInt(document.getElementById('rowsPerPage').value);
  currentPage = 1;
  renderTable();
}

function applyFilters() {
  currentPage = 1;
  renderTable();
}

function resetFilters() {
  document.getElementById('searchPurchase').value = '';
  document.getElementById('filterStatus').value = 'All';
  document.getElementById('filterDateFrom').value = '';
  document.getElementById('filterDateTo').value = '';
  applyFilters();
}

// ============================================================
// Purchase CRUD
// ============================================================
function openPurchaseModal() {
  poItems = [];
  document.getElementById('poItemsList').innerHTML = '';
  document.getElementById('poSubtotal').value = 0;
  document.getElementById('poGrandTotal').value = 0;
  document.getElementById('poDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('purchaseModal').classList.remove('hidden');
  fetchSuppliers();
}

function addPoItem() {
  const name = document.getElementById('poItemName').value.trim();
  const qty = parseInt(document.getElementById('poItemQty').value);
  const rate = parseFloat(document.getElementById('poItemRate').value);
  if (!name || !qty || !rate) {
    showToast('Please fill item name, qty and rate');
    return;
  }
  poItems.push({ name, qty, rate, amount: qty * rate });
  document.getElementById('poItemName').value = '';
  document.getElementById('poItemQty').value = '';
  document.getElementById('poItemRate').value = '';
  renderPoItems();
  calcPoTotal();
}

function renderPoItems() {
  const list = document.getElementById('poItemsList');
  list.innerHTML = poItems.map((item, i) =>
    `<div class="flex justify-between items-center py-1 border-b border-gray-100 flex-wrap gap-1">
      <span>${escapeHtml(item.name)} × ${item.qty} @ ${formatINR(item.rate)}</span>
      <span class="font-medium">${formatINR(item.amount)} <button class="text-red-500 text-xs ml-2" onclick="removePoItem(${i})">✕</button></span>
    </div>`
  ).join('');
}

function removePoItem(i) {
  poItems.splice(i, 1);
  renderPoItems();
  calcPoTotal();
}

function calcPoTotal() {
  const subtotal = poItems.reduce((s, i) => s + i.amount, 0);
  const gst = parseFloat(document.getElementById('poGst').value) || 0;
  const cgst = subtotal * (gst / 200);
  const sgst = subtotal * (gst / 200);
  document.getElementById('poSubtotal').value = subtotal.toFixed(2);
  document.getElementById('poCgst').value = cgst.toFixed(2);
  document.getElementById('poSgst').value = sgst.toFixed(2);
  document.getElementById('poGrandTotal').value = (subtotal + cgst + sgst).toFixed(2);
}

async function savePurchase(e) {
  e.preventDefault();
  const supplierId = document.getElementById('poSupplier').value;
  const date = document.getElementById('poDate').value;
  const delivery = document.getElementById('poDelivery').value;
  const gst = parseFloat(document.getElementById('poGst').value) || 18;
  const notes = document.getElementById('poNotes').value;
  const grandTotal = parseFloat(document.getElementById('poGrandTotal').value) || 0;

  if (!supplierId) { showToast('Please select a supplier', 'error'); return; }
  if (poItems.length === 0) { showToast('Please add at least one item', 'error'); return; }

  const payload = {
    supplierId: parseInt(supplierId),
    date: date,
    expectedDelivery: delivery,
    items: poItems,
    gstPercent: gst,
    grandTotal: grandTotal,
    notes: notes,
    status: 'Pending'
  };

  try {
    const res = await fetch(`${API_BASE}/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Purchase order created successfully');
      closeModal('purchaseModal');
      fetchPurchases();
    } else {
      showToast('Failed to create purchase: ' + data.message, 'error');
    }
  } catch (err) {
    // Mock: Add to local
    const mockPO = {
      id: purchases.length + 1,
      poNo: 'PO-' + String(purchases.length + 1001),
      supplier: suppliers.find(s => s.id == supplierId)?.name || 'Unknown',
      date: date,
      amount: grandTotal,
      status: 'Pending'
    };
    purchases.unshift(mockPO);
    showToast('Purchase created (mock)');
    closeModal('purchaseModal');
    renderAll();
  }
}

// ============================================================
// Supplier CRUD
// ============================================================
function openSupplierModal() {
  document.getElementById('supplierModal').classList.remove('hidden');
  document.getElementById('supplierForm').reset();
}

async function saveSupplier(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('supplierName').value.trim(),
    gstin: document.getElementById('supplierGst').value.trim(),
    mobile: document.getElementById('supplierMobile').value.trim(),
    address: document.getElementById('supplierAddress').value.trim(),
    city: document.getElementById('supplierCity').value.trim(),
    state: document.getElementById('supplierState').value.trim()
  };

  if (!payload.name) { showToast('Supplier name is required', 'error'); return; }

  try {
    const res = await fetch(`${API_BASE}/suppliers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast('Supplier added successfully');
      closeModal('supplierModal');
      fetchSuppliers();
    } else {
      showToast('Failed to add supplier: ' + data.message, 'error');
    }
  } catch (err) {
    // Mock
    const newSupplier = { id: suppliers.length + 1, ...payload };
    suppliers.push(newSupplier);
    showToast('Supplier added (mock)');
    closeModal('supplierModal');
    populateSupplierDropdown();
  }
}

// ============================================================
// GST Reports
// ============================================================
function generateGstr1b() {
  const month = document.getElementById('gstr1bMonth').value;
  if (!month) { showToast('Please select a month', 'error'); return; }
  showToast('Generating GSTR-1B for ' + month + '...');

  document.getElementById('gstr1bTotalSales').textContent = formatINR(1250000);
  document.getElementById('gstr1bB2B').textContent = formatINR(850000);
  document.getElementById('gstr1bB2C').textContent = formatINR(400000);
  document.getElementById('gstr1bTotalTax').textContent = formatINR(225000);

  const tbody = document.getElementById('gstr1bTbody');
  const rows = [
    ['INV-001', '2026-08-01', 'ABC Corp', '09ABCDE1234F1Z5', 100000, 9000, 9000, 0, 118000],
    ['INV-002', '2026-08-05', 'XYZ Ltd', '09FGHIJ5678K1Z2', 150000, 13500, 13500, 0, 177000],
    ['INV-003', '2026-08-10', 'B2C Customer', '—', 200000, 18000, 18000, 0, 236000],
  ];
  const labels = ['Invoice No.', 'Invoice Date', 'Customer', 'GSTIN', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total'];
  tbody.innerHTML = rows.map(r => `
    <tr>${r.map((v, i) => `<td data-label="${labels[i]}">${v}</td>`).join('')}</tr>
  `).join('');
}

function generateGstr3b() {
  const month = document.getElementById('gstr3bMonth').value;
  if (!month) { showToast('Please select a month', 'error'); return; }
  showToast('Generating GSTR-3B for ' + month + '...');

  document.getElementById('gstr3bOutwardTaxable').textContent = formatINR(1050000);
  document.getElementById('gstr3bOutwardCGST').textContent = formatINR(94500);
  document.getElementById('gstr3bOutwardSGST').textContent = formatINR(94500);
  document.getElementById('gstr3bOutwardIGST').textContent = formatINR(0);

  document.getElementById('gstr3bInwardTaxable').textContent = formatINR(450000);
  document.getElementById('gstr3bInwardCGST').textContent = formatINR(40500);
  document.getElementById('gstr3bInwardSGST').textContent = formatINR(40500);
  document.getElementById('gstr3bInwardIGST').textContent = formatINR(0);

  document.getElementById('gstr3bNetCGST').textContent = formatINR(54000);
  document.getElementById('gstr3bNetSGST').textContent = formatINR(54000);
  document.getElementById('gstr3bNetIGST').textContent = formatINR(0);
  document.getElementById('gstr3bNetTotal').textContent = formatINR(108000);
}

function exportGstr1b() {
  showToast('Downloading GSTR-1B Excel...');
}

function exportGstr3b() {
  showToast('Downloading GSTR-3B PDF...');
}

// ============================================================
// View / Edit / Delete stubs (kept for table action buttons)
// ============================================================
function viewPurchase(id) {
  const p = purchases.find(x => x.id === id);
  if (p) showToast(`${p.poNo} — ${p.supplier} — ${formatINR(p.amount)}`);
}

function editPurchase(id) {
  showToast('Edit purchase order: ' + id);
}

function deletePurchase(id) {
  purchases = purchases.filter(p => p.id !== id);
  showToast('Purchase order deleted', 'error');
  renderAll();
}

// ============================================================
// Profile Dropdown (fixed position, same pattern as productm.js)
// ============================================================
function positionFixedDropdown(trigger, menu) {
  const rect = trigger.getBoundingClientRect();
  menu.style.visibility = 'hidden';
  menu.classList.remove('hidden');
  const menuWidth = menu.offsetWidth || 190;
  let left = rect.right - menuWidth;
  if (left < 8) left = 8;
  if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;
  menu.style.left = left + 'px';
  menu.style.top = (rect.bottom + 8) + 'px';
  menu.style.visibility = '';
}

document.getElementById('profileBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  const dropdown = document.getElementById('profileDropdown');
  if (!dropdown) return;
  const willOpen = dropdown.classList.contains('hidden');
  dropdown.classList.add('hidden');
  if (willOpen) positionFixedDropdown(e.currentTarget, dropdown);
});
document.addEventListener('click', () => {
  document.getElementById('profileDropdown')?.classList.add('hidden');
});
document.getElementById('profileLogoutBtn')?.addEventListener('click', () => {
  showToast('Logged out');
  window.location.href = '../index.html';
});

// ============================================================
// Init
// ============================================================
function renderAll() {
  renderSummary();
  renderTable();
}

document.addEventListener('DOMContentLoaded', function() {
  const now = new Date();
  const monthStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  document.getElementById('gstr1bMonth').value = monthStr;
  document.getElementById('gstr3bMonth').value = monthStr;

  fetchSuppliers();
  fetchPurchases();
});

// Table sort
document.getElementById('purchaseTable')?.addEventListener('click', (e) => {
  const th = e.target.closest('th[data-sort]');
  if (!th) return;
  const key = th.dataset.sort;
  if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
  else { sortKey = key; sortDir = 'asc'; }
  renderTable();
});