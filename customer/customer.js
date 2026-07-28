/* ============ customer.js ============ */

/* ============================================================
   Sample data (replace with API later)
   ============================================================ */
let customers = [
  {
    id: 'CUST-1001',
    name: 'Ramesh Kumar',
    company: 'Shree Brick Industries',
    mobile: '9876543210',
    altMobile: '9123456780',
    email: 'ramesh@shreebrick.com',
    billingAddress: 'Plot 12, MIDC Area',
    siteAddress: 'Survey No. 45, Outer Ring Road',
    city: 'Nagpur',
    state: 'Maharashtra',
    pincode: '440001',
    gst: '27AABCU9603R1ZM',
    type: 'Brick Kiln Owner',
    leadSource: 'Exhibition',
    status: 'Active',
    requirement: '10 Cavity Fully Automatic Brick Machine',
    siteDetails: 'Shed 80×40 ft, 3-phase electricity available',
    notes: 'Visited site on 12 Jun. Interested in AMC also.',
    totalOrders: 2,
    totalBusiness: 1850000,
    lastActivity: '2026-07-20',
    created: '2026-03-15',
  },
  {
    id: 'CUST-1002',
    name: 'Suresh Patel',
    company: 'Patel Traders',
    mobile: '9988776655',
    altMobile: '',
    email: 'suresh@pateltraders.in',
    billingAddress: 'Shop 4, Main Market',
    siteAddress: '',
    city: 'Indore',
    state: 'Madhya Pradesh',
    pincode: '452001',
    gst: '23AADCP1234F1Z5',
    type: 'Trader-Dealer',
    leadSource: 'Existing Customer Reference',
    status: 'Active',
    requirement: 'Semi-Automatic Brick Making Machine',
    siteDetails: 'Warehouse available',
    notes: 'Repeat buyer — ordered 2nd machine.',
    totalOrders: 3,
    totalBusiness: 920000,
    lastActivity: '2026-07-18',
    created: '2025-11-02',
  },
  {
    id: 'CUST-1003',
    name: 'Anita Deshmukh',
    company: '',
    mobile: '9765432109',
    altMobile: '',
    email: '',
    billingAddress: 'Village Khedi, Taluka Hingna',
    siteAddress: 'Same as billing',
    city: 'Nagpur',
    state: 'Maharashtra',
    pincode: '441110',
    gst: '',
    type: 'Individual Buyer',
    leadSource: 'Direct Enquiry',
    status: 'Prospect',
    requirement: 'Manual Brick Press (small unit)',
    siteDetails: 'Open land 30×20, genset available',
    notes: 'First enquiry. Follow up after 1 week.',
    totalOrders: 0,
    totalBusiness: 0,
    lastActivity: '2026-07-22',
    created: '2026-07-22',
  },
  {
    id: 'CUST-1004',
    name: 'Vikram Singh',
    company: 'Singh Construction Co.',
    mobile: '9812345678',
    altMobile: '9823456789',
    email: 'vikram@singhconst.com',
    billingAddress: '12, Civil Lines',
    siteAddress: 'Project site — Bypass Road',
    city: 'Raipur',
    state: 'Chhattisgarh',
    pincode: '492001',
    gst: '22AABCS9876G1Z2',
    type: 'Contractor',
    leadSource: 'Website',
    status: 'Active',
    requirement: 'Fully Automatic Fly Ash Brick Plant',
    siteDetails: 'Large shed, dedicated transformer',
    notes: 'High value lead. Quotation sent.',
    totalOrders: 1,
    totalBusiness: 2450000,
    lastActivity: '2026-07-10',
    created: '2026-01-28',
  },
  {
    id: 'CUST-1005',
    name: 'Meena Kiln Works',
    company: 'Meena Kiln Works Pvt Ltd',
    mobile: '9654321098',
    altMobile: '',
    email: 'info@meenakiln.com',
    billingAddress: 'Industrial Area Phase-2',
    siteAddress: 'Same',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    pincode: '462001',
    gst: '23AADCM4567H1Z8',
    type: 'Industrial Unit',
    leadSource: 'Advertisement',
    status: 'Inactive',
    requirement: 'Hydraulic Brick Press + Mixer',
    siteDetails: 'Existing plant expansion',
    notes: 'Deal postponed due to budget.',
    totalOrders: 0,
    totalBusiness: 0,
    lastActivity: '2026-05-14',
    created: '2026-04-03',
  },
];

let followups = [
  { customerId: 'CUST-1001', date: '2026-07-15', remark: 'Discussed AMC package', next: '2026-07-30', status: 'Completed' },
  { customerId: 'CUST-1003', date: '2026-07-22', remark: 'First call — interested in manual press', next: '2026-07-29', status: 'Pending' },
  { customerId: 'CUST-1004', date: '2026-07-08', remark: 'Site visit scheduled', next: '2026-07-25', status: 'Pending' },
];

let historyData = {
  'CUST-1001': [
    { label: 'Order placed — 10 Cavity Auto Machine', when: '15 Mar 2026' },
    { label: 'Quotation QT-2041 approved', when: '10 Mar 2026' },
    { label: 'Site visit completed', when: '28 Feb 2026' },
  ],
  'CUST-1002': [
    { label: 'Order placed — Semi-Auto Machine #3', when: '05 Jun 2026' },
    { label: 'Repeat order discussion', when: '20 May 2026' },
  ],
  'CUST-1004': [
    { label: 'Quotation QT-2105 sent', when: '28 Jan 2026' },
    { label: 'Lead created from website', when: '28 Jan 2026' },
  ],
};

/* ============================================================
   State
   ============================================================ */
let searchTerm = '';
let typeFilter = 'All';
let statusFilter = 'All';
let currentPage = 1;
const rowsPerPage = 8;

const typePillClass = {
  'Individual Buyer': 'pill-type',
  'Contractor': 'pill-type',
  'Brick Kiln Owner': 'pill-type',
  'Trader-Dealer': 'pill-type',
  'Industrial Unit': 'pill-type',
};
const statusPillClass = {
  Active: 'pill-active',
  Inactive: 'pill-inactive',
  Prospect: 'pill-prospect',
};
const followupPillClass = {
  Pending: 'pill-pending',
  Completed: 'pill-completed',
  Cancelled: 'pill-cancelled',
};

/* ============================================================
   Helpers
   ============================================================ */
function formatDateDisplay(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
}

function formatCurrency(n) {
  if (!n && n !== 0) return '—';
  return '₹' + Number(n).toLocaleString('en-IN');
}

function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.add('hidden'), 2600);
}

/* ============================================================
   Summary
   ============================================================ */
function renderSummary() {
  const total = customers.length;
  const active = customers.filter(c => c.status === 'Active').length;
  const prospect = customers.filter(c => c.status === 'Prospect').length;
  const business = customers.reduce((s, c) => s + (c.totalBusiness || 0), 0);

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statActive').textContent = active;
  document.getElementById('statProspect').textContent = prospect;
  document.getElementById('statBusiness').textContent = formatCurrency(business);

  document.getElementById('statTotalTrend').textContent = `${active} active`;
  document.getElementById('statActiveTrend').textContent = total ? `${Math.round((active / total) * 100)}% of customers` : 'Buying customers';
  document.getElementById('statProspectTrend').textContent = total ? `${Math.round((prospect / total) * 100)}% of customers` : 'Enquiry only';
  document.getElementById('statBusinessTrend').textContent = 'Lifetime value';
}

/* ============================================================
   Filtering + table render
   ============================================================ */
function filteredCustomers() {
  return customers.filter(c => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term ||
      c.name.toLowerCase().includes(term) ||
      (c.company || '').toLowerCase().includes(term) ||
      c.mobile.toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term);
    const matchesType = typeFilter === 'All' || c.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });
}

const ICONS = {
  view: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
  edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"></path></svg>',
  delete: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>',
  quote: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="9" y1="15" x2="15" y2="15"></line><line x1="9" y1="11" x2="12" y2="11"></line></svg>',
};

function actionIconsHtml(id) {
  return `
    <div class="row-actions">
      <button class="action-icon-btn icon-view" data-action="view" data-id="${id}" title="View">${ICONS.view}</button>
      <button class="action-icon-btn icon-edit" data-action="edit" data-id="${id}" title="Edit">${ICONS.edit}</button>
      <button class="action-icon-btn icon-quote" data-action="quote" data-id="${id}" title="Create Quotation">${ICONS.quote}</button>
      <button class="action-icon-btn icon-delete" data-action="delete" data-id="${id}" title="Delete">${ICONS.delete}</button>
    </div>`;
}

function renderTable() {
  const data = filteredCustomers();
  const totalRows = data.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * rowsPerPage;
  const pageRows = data.slice(start, start + rowsPerPage);

  const tbody = document.getElementById('customerTbody');
  const emptyState = document.getElementById('emptyState');
  const tableFooter = document.getElementById('tableFooter');
  const tableWrap = document.querySelector('.table-scroll');

  document.getElementById('tableCountLabel').textContent = `${totalRows} record${totalRows === 1 ? '' : 's'}`;

  if (totalRows === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    tableWrap.classList.add('hidden');
    tableFooter.classList.add('hidden');
    return;
  }
  emptyState.classList.add('hidden');
  tableWrap.classList.remove('hidden');
  tableFooter.classList.remove('hidden');

  tbody.innerHTML = pageRows.map(c => `
    <tr data-id="${c.id}">
      <td data-label="Customer ID" class="font-medium">${c.id}</td>
      <td data-label="Name">${c.name}</td>
      <td data-label="Company">${c.company || '—'}</td>
      <td data-label="Mobile">${c.mobile}</td>
      <td data-label="City/State">${[c.city, c.state].filter(Boolean).join(', ') || '—'}</td>
      <td data-label="Type"><span class="pill ${typePillClass[c.type] || 'pill-type'}">${c.type}</span></td>
      <td data-label="Total Orders">${c.totalOrders || 0}</td>
      <td data-label="Total Business Value">${formatCurrency(c.totalBusiness)}</td>
      <td data-label="Status"><span class="pill ${statusPillClass[c.status]}">${c.status}</span></td>
      <td data-label="Last Activity">${formatDateDisplay(c.lastActivity)}</td>
      <td data-label="Actions">${actionIconsHtml(c.id)}</td>
    </tr>
  `).join('');

  document.getElementById('rowsRangeLabel').textContent = `${start + 1}–${Math.min(start + rowsPerPage, totalRows)} of ${totalRows}`;
  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const el = document.getElementById('paginationControls');
  let html = `<span class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" data-page="prev">‹</span>`;
  for (let p = 1; p <= totalPages; p++) {
    html += `<span class="pagination-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</span>`;
  }
  html += `<span class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" data-page="next">›</span>`;
  el.innerHTML = html;

  el.querySelectorAll('.pagination-btn:not(.disabled)').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.getAttribute('data-page');
      if (p === 'prev') currentPage = Math.max(1, currentPage - 1);
      else if (p === 'next') currentPage = Math.min(totalPages, currentPage + 1);
      else currentPage = parseInt(p, 10);
      renderTable();
    });
  });
}

/* ---------- Search & filters ---------- */
document.getElementById('searchName')?.addEventListener('input', (e) => {
  searchTerm = e.target.value;
  currentPage = 1;
  renderTable();
});

/* ---------- Custom dropdown ---------- */
function setupCustomSelect(rootId, onSelect) {
  const root = document.getElementById(rootId);
  if (!root) return null;
  const trigger = root.querySelector('.custom-select-trigger');
  const label = root.querySelector('.cs-label');
  const panel = root.querySelector('.custom-select-panel');
  const options = root.querySelectorAll('.custom-select-option');

  function closePanel() {
    panel.classList.add('hidden');
    trigger.setAttribute('aria-expanded', 'false');
  }
  function openPanel() {
    document.querySelectorAll('.custom-select-panel').forEach(p => { if (p !== panel) p.classList.add('hidden'); });
    panel.classList.remove('hidden');
    trigger.setAttribute('aria-expanded', 'true');
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.contains('hidden') ? openPanel() : closePanel();
  });

  options.forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      options.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      label.textContent = opt.textContent;
      closePanel();
      onSelect(opt.getAttribute('data-value'));
    });
  });

  return {
    close: closePanel,
    setValue(val) {
      options.forEach(o => o.classList.toggle('selected', o.getAttribute('data-value') === val));
      const match = [...options].find(o => o.getAttribute('data-value') === val);
      if (match) label.textContent = match.textContent;
    },
  };
}

const typeSelectCtrl = setupCustomSelect('filterTypeSelect', (val) => {
  typeFilter = val;
  currentPage = 1;
  renderTable();
});
const statusSelectCtrl = setupCustomSelect('filterStatusSelect', (val) => {
  statusFilter = val;
  currentPage = 1;
  renderTable();
});
const fldTypeCtrl = setupCustomSelect('fldTypeSelect', (val) => {
  document.getElementById('fldType').value = val;
});
const fldLeadSourceCtrl = setupCustomSelect('fldLeadSourceSelect', (val) => {
  document.getElementById('fldLeadSource').value = val;
});
const fldStatusCtrl = setupCustomSelect('fldStatusSelect', (val) => {
  document.getElementById('fldStatus').value = val;
});
const fuStatusCtrl = setupCustomSelect('fuStatusSelect', (val) => {
  document.getElementById('fuStatus').value = val;
});

/* fuCustomer dynamic dropdown */
function buildFuCustomerDropdown(selectedId) {
  const root = document.getElementById('fuCustomerSelect');
  const trigger = root.querySelector('.custom-select-trigger');
  const label = root.querySelector('.cs-label');
  const panel = root.querySelector('.custom-select-panel');

  panel.innerHTML = customers.map(c =>
    `<div class="custom-select-option${c.id === selectedId ? ' selected' : ''}" data-value="${c.id}" role="option">${c.name} · ${c.id}</div>`
  ).join('');

  const chosen = customers.find(c => c.id === selectedId) || customers[0];
  document.getElementById('fuCustomer').value = chosen ? chosen.id : '';
  label.textContent = chosen ? `${chosen.name} · ${chosen.id}` : 'Select customer';

  panel.querySelectorAll('.custom-select-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      label.textContent = opt.textContent;
      document.getElementById('fuCustomer').value = opt.getAttribute('data-value');
      panel.classList.add('hidden');
      trigger.setAttribute('aria-expanded', 'false');
    });
  });

  trigger.onclick = (e) => {
    e.stopPropagation();
    const willOpen = panel.classList.contains('hidden');
    document.querySelectorAll('.custom-select-panel').forEach(p => { if (p !== panel) p.classList.add('hidden'); });
    panel.classList.toggle('hidden', !willOpen);
    trigger.setAttribute('aria-expanded', String(willOpen));
  };
}

document.addEventListener('click', (e) => {
  document.querySelectorAll('.custom-select').forEach(root => {
    if (!root.contains(e.target)) root.querySelector('.custom-select-panel')?.classList.add('hidden');
  });
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') document.querySelectorAll('.custom-select-panel').forEach(p => p.classList.add('hidden'));
});

document.getElementById('resetFiltersBtn')?.addEventListener('click', () => {
  searchTerm = '';
  typeFilter = 'All';
  statusFilter = 'All';
  currentPage = 1;
  document.getElementById('searchName').value = '';
  typeSelectCtrl?.setValue('All');
  statusSelectCtrl?.setValue('All');
  renderTable();
  showToast('Filters reset');
});

/* ============================================================
   Add / Edit Customer modal
   ============================================================ */
const customerFormModal = document.getElementById('customerFormModal');
let formMode = 'add';

function openCustomerForm(mode, customer) {
  formMode = mode;
  clearFormErrors();
  document.getElementById('customerFormTitle').textContent = mode === 'add' ? 'Add Customer' : 'Edit Customer';
  document.getElementById('customerFormSubtitle').textContent = mode === 'add' ? "Fill in the customer's details" : `Editing ${customer.id}`;
  document.getElementById('customerFormSaveBtn').textContent = mode === 'add' ? 'Save Customer' : 'Update Customer';

  document.getElementById('fldCustomerId').value = customer ? customer.id : '';
  document.getElementById('fldName').value = customer ? customer.name : '';
  document.getElementById('fldCompany').value = customer ? (customer.company || '') : '';
  document.getElementById('fldMobile').value = customer ? customer.mobile : '';
  document.getElementById('fldAltMobile').value = customer ? (customer.altMobile || '') : '';
  document.getElementById('fldEmail').value = customer ? (customer.email || '') : '';
  document.getElementById('fldBillingAddress').value = customer ? (customer.billingAddress || '') : '';
  document.getElementById('fldSiteAddress').value = customer ? (customer.siteAddress || '') : '';
  document.getElementById('fldCity').value = customer ? (customer.city || '') : '';
  document.getElementById('fldState').value = customer ? (customer.state || '') : '';
  document.getElementById('fldPincode').value = customer ? (customer.pincode || '') : '';
  document.getElementById('fldGst').value = customer ? (customer.gst || '') : '';
  document.getElementById('fldType').value = customer ? customer.type : 'Individual Buyer';
  fldTypeCtrl?.setValue(customer ? customer.type : 'Individual Buyer');
  document.getElementById('fldLeadSource').value = customer ? (customer.leadSource || 'Direct Enquiry') : 'Direct Enquiry';
  fldLeadSourceCtrl?.setValue(customer ? (customer.leadSource || 'Direct Enquiry') : 'Direct Enquiry');
  document.getElementById('fldStatus').value = customer ? customer.status : 'Prospect';
  fldStatusCtrl?.setValue(customer ? customer.status : 'Prospect');
  document.getElementById('fldRequirement').value = customer ? (customer.requirement || '') : '';
  document.getElementById('fldSiteDetails').value = customer ? (customer.siteDetails || '') : '';
  document.getElementById('fldNotes').value = customer ? (customer.notes || '') : '';

  customerFormModal.classList.remove('hidden');
}

function closeCustomerForm() {
  customerFormModal.classList.add('hidden');
}

function clearFormErrors() {
  ['errName', 'errMobile', 'errEmail'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
  ['fldName', 'fldMobile', 'fldEmail'].forEach(id => {
    document.getElementById(id)?.classList.remove('invalid');
  });
}

document.getElementById('addCustomerBtn')?.addEventListener('click', () => openCustomerForm('add', null));
document.getElementById('addFirstCustomerBtn')?.addEventListener('click', () => openCustomerForm('add', null));
document.getElementById('customerFormCloseBtn')?.addEventListener('click', closeCustomerForm);
document.getElementById('customerFormCancelBtn')?.addEventListener('click', closeCustomerForm);
customerFormModal?.addEventListener('click', (e) => { if (e.target === customerFormModal) closeCustomerForm(); });

function validateCustomerForm() {
  clearFormErrors();
  let valid = true;
  const name = document.getElementById('fldName').value.trim();
  const mobile = document.getElementById('fldMobile').value.trim();
  const email = document.getElementById('fldEmail').value.trim();

  if (!name) {
    document.getElementById('errName').textContent = 'Customer name is required.';
    document.getElementById('fldName').classList.add('invalid');
    valid = false;
  }
  if (!mobile) {
    document.getElementById('errMobile').textContent = 'Mobile number is required.';
    document.getElementById('fldMobile').classList.add('invalid');
    valid = false;
  } else if (!/^\d{10}$/.test(mobile.replace(/\D/g, ''))) {
    document.getElementById('errMobile').textContent = 'Enter a valid 10-digit mobile number.';
    document.getElementById('fldMobile').classList.add('invalid');
    valid = false;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    document.getElementById('errEmail').textContent = 'Enter a valid email address.';
    document.getElementById('fldEmail').classList.add('invalid');
    valid = false;
  }
  return valid;
}

document.getElementById('customerFormSaveBtn')?.addEventListener('click', () => {
  if (!validateCustomerForm()) return;

  const payload = {
    name: document.getElementById('fldName').value.trim(),
    company: document.getElementById('fldCompany').value.trim(),
    mobile: document.getElementById('fldMobile').value.trim(),
    altMobile: document.getElementById('fldAltMobile').value.trim(),
    email: document.getElementById('fldEmail').value.trim(),
    billingAddress: document.getElementById('fldBillingAddress').value.trim(),
    siteAddress: document.getElementById('fldSiteAddress').value.trim(),
    city: document.getElementById('fldCity').value.trim(),
    state: document.getElementById('fldState').value.trim(),
    pincode: document.getElementById('fldPincode').value.trim(),
    gst: document.getElementById('fldGst').value.trim(),
    type: document.getElementById('fldType').value,
    leadSource: document.getElementById('fldLeadSource').value,
    status: document.getElementById('fldStatus').value,
    requirement: document.getElementById('fldRequirement').value.trim(),
    siteDetails: document.getElementById('fldSiteDetails').value.trim(),
    notes: document.getElementById('fldNotes').value.trim(),
  };

  if (formMode === 'add') {
    const maxNum = customers.reduce((max, c) => {
      const n = parseInt(c.id.replace(/\D/g, ''), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 1000);
    const newId = `CUST-${maxNum + 1}`;
    const today = new Date().toISOString().slice(0, 10);
    const newCustomer = {
      id: newId,
      created: today,
      lastActivity: today,
      totalOrders: 0,
      totalBusiness: 0,
      ...payload,
    };
    customers.unshift(newCustomer);
    showToast(`Customer ${newId} added`);
  } else {
    const id = document.getElementById('fldCustomerId').value;
    const c = customers.find(x => x.id === id);
    if (c) {
      Object.assign(c, payload);
      c.lastActivity = new Date().toISOString().slice(0, 10);
    }
    showToast(`Customer ${id} updated`);
  }

  closeCustomerForm();
  currentPage = 1;
  renderAll();
});

/* ============================================================
   View Customer modal
   ============================================================ */
const viewCustomerModal = document.getElementById('viewCustomerModal');

function openViewCustomer(customer) {
  document.getElementById('viewCustomerSubtitle').textContent = customer.id;
  document.getElementById('viewCustomerBody').innerHTML = `
    <div class="detail-item"><span class="d-label">Customer Name</span><span class="d-value">${customer.name}</span></div>
    <div class="detail-item"><span class="d-label">Company / Firm</span><span class="d-value">${customer.company || '—'}</span></div>
    <div class="detail-item"><span class="d-label">Mobile</span><span class="d-value">${customer.mobile}</span></div>
    <div class="detail-item"><span class="d-label">Alternate Mobile</span><span class="d-value">${customer.altMobile || '—'}</span></div>
    <div class="detail-item"><span class="d-label">Email</span><span class="d-value">${customer.email || '—'}</span></div>
    <div class="detail-item"><span class="d-label">City / State</span><span class="d-value">${[customer.city, customer.state].filter(Boolean).join(', ') || '—'}</span></div>
    <div class="detail-item"><span class="d-label">Pincode</span><span class="d-value">${customer.pincode || '—'}</span></div>
    <div class="detail-item"><span class="d-label">GSTIN</span><span class="d-value">${customer.gst || '—'}</span></div>
    <div class="detail-item"><span class="d-label">Customer Type</span><span class="d-value">${customer.type}</span></div>
    <div class="detail-item"><span class="d-label">Lead Source</span><span class="d-value">${customer.leadSource || '—'}</span></div>
    <div class="detail-item"><span class="d-label">Status</span><span class="d-value">${customer.status}</span></div>
    <div class="detail-item"><span class="d-label">Total Orders</span><span class="d-value">${customer.totalOrders || 0}</span></div>
    <div class="detail-item"><span class="d-label">Total Business Value</span><span class="d-value">${formatCurrency(customer.totalBusiness)}</span></div>
    <div class="detail-item full"><span class="d-label">Billing Address</span><span class="d-value">${customer.billingAddress || '—'}</span></div>
    <div class="detail-item full"><span class="d-label">Site / Plant Address</span><span class="d-value">${customer.siteAddress || '—'}</span></div>
    <div class="detail-item full"><span class="d-label">Requirement / Interest</span><span class="d-value">${customer.requirement || '—'}</span></div>
    <div class="detail-item full"><span class="d-label">Site Details</span><span class="d-value">${customer.siteDetails || '—'}</span></div>
    <div class="detail-item full"><span class="d-label">Notes / Remarks</span><span class="d-value">${customer.notes || '—'}</span></div>
    <div class="detail-item"><span class="d-label">Date Added</span><span class="d-value">${formatDateDisplay(customer.created)}</span></div>
    <div class="detail-item"><span class="d-label">Last Activity</span><span class="d-value">${formatDateDisplay(customer.lastActivity)}</span></div>
  `;
  viewCustomerModal.classList.remove('hidden');
}

function closeViewCustomer() { viewCustomerModal.classList.add('hidden'); }
document.getElementById('viewCustomerCloseBtn')?.addEventListener('click', closeViewCustomer);
document.getElementById('viewCustomerCloseBtn2')?.addEventListener('click', closeViewCustomer);
viewCustomerModal?.addEventListener('click', (e) => { if (e.target === viewCustomerModal) closeViewCustomer(); });

/* ============================================================
   Delete Customer modal
   ============================================================ */
const deleteModal = document.getElementById('deleteModal');
let pendingDeleteId = null;

function openDeleteModal(customer) {
  pendingDeleteId = customer.id;
  document.getElementById('deleteCustomerName').textContent = `${customer.name} · ${customer.id}`;
  deleteModal.classList.remove('hidden');
}
function closeDeleteModal() { deleteModal.classList.add('hidden'); pendingDeleteId = null; }
document.getElementById('deleteModalCloseBtn')?.addEventListener('click', closeDeleteModal);
document.getElementById('deleteCancelBtn')?.addEventListener('click', closeDeleteModal);
deleteModal?.addEventListener('click', (e) => { if (e.target === deleteModal) closeDeleteModal(); });

document.getElementById('deleteConfirmBtn')?.addEventListener('click', () => {
  if (!pendingDeleteId) return;
  customers = customers.filter(c => c.id !== pendingDeleteId);
  followups = followups.filter(f => f.customerId !== pendingDeleteId);
  delete historyData[pendingDeleteId];
  showToast('Customer deleted');
  closeDeleteModal();
  renderAll();
});

/* ============================================================
   Table row action wiring
   ============================================================ */
document.getElementById('customerTbody')?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  e.stopPropagation();
  const id = btn.getAttribute('data-id');
  const customer = customers.find(c => c.id === id);
  if (!customer) return;
  const action = btn.getAttribute('data-action');
  if (action === 'view') openViewCustomer(customer);
  else if (action === 'edit') openCustomerForm('edit', customer);
  else if (action === 'delete') openDeleteModal(customer);
  else if (action === 'quote') showToast(`Quotation flow started for ${customer.name}`);
});

/* ============================================================
   Customer History
   ============================================================ */
function renderHistory() {
  const list = document.getElementById('historyList');
  const entries = Object.keys(historyData).filter(id => customers.some(c => c.id === id));

  if (entries.length === 0) {
    list.innerHTML = `<p style="font-size:12.5px;color:#9CA3AF;padding:8px 2px;">No history recorded yet.</p>`;
    return;
  }

  list.innerHTML = entries.map(id => {
    const customer = customers.find(c => c.id === id);
    const items = historyData[id];
    return `
      <div class="history-card" data-id="${id}">
        <div class="history-card-head" data-toggle="${id}">
          <div>
            <p class="history-card-name">${customer ? customer.name : id}</p>
            <p class="history-card-sub">${id} · ${items.length} activities</p>
          </div>
          <svg class="history-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
        <div class="history-card-body">
          <ul class="history-timeline">
            ${items.map(it => `<li><span class="history-dot"></span><span>${it.label}<span class="h-when">${it.when}</span></span></li>`).join('')}
          </ul>
        </div>
      </div>`;
  }).join('');

  list.querySelectorAll('[data-toggle]').forEach(head => {
    head.addEventListener('click', () => {
      head.closest('.history-card').classList.toggle('open');
    });
  });
}

/* ============================================================
   Follow-up section
   ============================================================ */
function renderFollowups() {
  const tbody = document.getElementById('followupTbody');
  if (followups.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#9CA3AF;padding:24px 8px;">No follow-up activities yet.</td></tr>`;
    return;
  }
  tbody.innerHTML = followups.map(f => {
    const customer = customers.find(c => c.id === f.customerId);
    return `
      <tr>
        <td data-label="Follow-up Date">${formatDateDisplay(f.date)}</td>
        <td data-label="Customer">${customer ? customer.name : f.customerId}</td>
        <td data-label="Remarks">${f.remark || '—'}</td>
        <td data-label="Next Follow-up Date">${formatDateDisplay(f.next)}</td>
        <td data-label="Status"><span class="pill ${followupPillClass[f.status]}">${f.status}</span></td>
      </tr>`;
  }).join('');
}

const followupModal = document.getElementById('followupModal');

function openFollowupModal() {
  buildFuCustomerDropdown(customers[0] ? customers[0].id : null);
  document.getElementById('fuDate').value = new Date().toISOString().slice(0, 10);
  document.getElementById('fuNextDate').value = '';
  document.getElementById('fuRemark').value = '';
  document.getElementById('fuStatus').value = 'Pending';
  fuStatusCtrl?.setValue('Pending');
  followupModal.classList.remove('hidden');
}
function closeFollowupModal() { followupModal.classList.add('hidden'); }

document.getElementById('addFollowupBtn')?.addEventListener('click', () => {
  if (customers.length === 0) {
    showToast('Add a customer first');
    return;
  }
  openFollowupModal();
});
document.getElementById('followupCloseBtn')?.addEventListener('click', closeFollowupModal);
document.getElementById('followupCancelBtn')?.addEventListener('click', closeFollowupModal);
followupModal?.addEventListener('click', (e) => { if (e.target === followupModal) closeFollowupModal(); });

document.getElementById('followupSaveBtn')?.addEventListener('click', () => {
  const customerId = document.getElementById('fuCustomer').value;
  const date = document.getElementById('fuDate').value;
  if (!customerId || !date) {
    showToast('Customer and date are required');
    return;
  }
  followups.unshift({
    customerId,
    date,
    remark: document.getElementById('fuRemark').value.trim(),
    next: document.getElementById('fuNextDate').value,
    status: document.getElementById('fuStatus').value,
  });
  const c = customers.find(x => x.id === customerId);
  if (c) c.lastActivity = date;
  closeFollowupModal();
  renderFollowups();
  renderTable();
  showToast('Follow-up added');
});

/* ============================================================
   Export / Print
   ============================================================ */
function customersToCsvRows() {
  const header = [
    'Customer ID', 'Name', 'Company', 'Mobile', 'Alternate Mobile', 'Email',
    'City', 'State', 'Pincode', 'GSTIN', 'Type', 'Lead Source', 'Status',
    'Total Orders', 'Total Business Value', 'Requirement', 'Date Added', 'Last Activity'
  ];
  const rows = filteredCustomers().map(c => [
    c.id, c.name, c.company || '', c.mobile, c.altMobile || '', c.email || '',
    c.city || '', c.state || '', c.pincode || '', c.gst || '', c.type, c.leadSource || '',
    c.status, c.totalOrders || 0, c.totalBusiness || 0, c.requirement || '',
    c.created, c.lastActivity
  ]);
  return [header, ...rows];
}

function downloadDelimited(filename, mime) {
  const rows = customersToCsvRows();
  const content = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportCustomersPDF() {
  showToast('PDF export will be available soon');
}

document.getElementById('exportBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('exportMenu').classList.toggle('hidden');
});
document.addEventListener('click', () => {
  document.getElementById('exportMenu')?.classList.add('hidden');
});

document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
  downloadDelimited('customers.csv', 'text/csv');
  showToast('Exported customers.csv');
});
document.getElementById('exportExcelBtn')?.addEventListener('click', () => {
  downloadDelimited('customers.xls', 'application/vnd.ms-excel');
  showToast('Exported customers.xls');
});
document.getElementById('exportPdfBtn')?.addEventListener('click', exportCustomersPDF);
document.getElementById('printBtn')?.addEventListener('click', () => {
  window.print();
});

/* ============================================================
   Topbar dropdowns (notif + profile)
   ============================================================ */
document.getElementById('notifBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('notifDropdown').classList.toggle('hidden');
  document.getElementById('profileDropdown')?.classList.add('hidden');
});
document.getElementById('profileBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('profileDropdown').classList.toggle('hidden');
  document.getElementById('notifDropdown')?.classList.add('hidden');
});
document.addEventListener('click', () => {
  document.getElementById('notifDropdown')?.classList.add('hidden');
  document.getElementById('profileDropdown')?.classList.add('hidden');
});
document.getElementById('profileLogoutBtn')?.addEventListener('click', () => {
  showToast('Logged out');
});

/* ============================================================
   Render all
   ============================================================ */
function renderAll() {
  renderSummary();
  renderTable();
  renderHistory();
  renderFollowups();
}

renderAll();