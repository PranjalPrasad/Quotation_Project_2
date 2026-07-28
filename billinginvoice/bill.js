// TODO: replace mock data with API call to /api/invoices

(function () {
  'use strict';

  // ---------------------------------------------------
  // 0. Auth guard (wire to your auth.js) — matches productm.js pattern
  // ---------------------------------------------------
  (async function initAuth() {
    try {
      if (typeof requireAuth === 'function') await requireAuth();
      if (typeof getAdminInfo === 'function') {
        const admin = getAdminInfo();
        const profileBtn = document.getElementById('profileBtn');
        if (profileBtn && admin?.name) profileBtn.textContent = admin.name.charAt(0).toUpperCase();
        const roleLabel = document.getElementById('profileRoleLabel');
        if (roleLabel && admin?.role) roleLabel.textContent = `Logged in as: ${admin.role}`;
      }
    } catch (e) { /* auth.js not wired yet in this preview */ }
  })();

  const COMPANY = {
    name: 'Vaishnokripa Mercantile',
    address: 'Gata No. 60, Agra-Mathura Bypass Road, Near Roshanlal College, Arsena, Agra – 282007',
    phone: '9837143745 / 7055008833',
    email: 'vaishnoworks8@gmail.com',
    website: 'www.vaishnoworks.com',
    gstin: '09AMXP5472SR1ZO',
    state: 'Uttar Pradesh',
    logo: '/img/image.png',
    bank: {
      accountName: 'Vaishnokripa Mercantile',
      bankName: 'HDFC BANK',
      accountNumber: '50200118886367',
      ifscCode: 'HDFC0003696',
      branch: 'SHASTRIPURAM AGRA'
    }
  };

  let invoiceCounter = 0;
  function nextInvoiceNo() {
    invoiceCounter += 1;
    return `INV-2026-${String(invoiceCounter).padStart(3, '0')}`;
  }

  function formatINR(n) {
    return '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
  }

  function isIntrastate(customerState) {
    return (customerState || '').trim().toLowerCase() === COMPANY.state.trim().toLowerCase();
  }

  // FIX: totals now also compute CGST/SGST vs IGST split based on
  // whether the customer's state matches the seller's (UP) state.
  function computeTotals(itemsTotal, gstPercent, intrastate) {
    const taxable = itemsTotal;
    const gst = taxable * (gstPercent / 100);
    const total = taxable + gst;
    if (intrastate) {
      return { taxable, gst, cgst: gst / 2, sgst: gst / 2, igst: 0, total, intrastate: true };
    }
    return { taxable, gst, cgst: 0, sgst: 0, igst: gst, total, intrastate: false };
  }

  function makeInvoice(overrides = {}) {
    const base = {
      invoiceNo: nextInvoiceNo(),
      quoteNo: '',
      date: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      status: 'Draft',
      customer: { name: '', mobile: '', address: '', city: '', state: '', gst: '' },
      items: [],
      gstPercent: 18,
      amountPaid: 0,
      payments: [],
      bank: { ...COMPANY.bank },
      terms: `A – GST : EXTRA\nB – Delivery After Full and Final Payment\nC – All Cheque & Drafts in favour of Vaishnokripa Mercantile\nD – Jurisdiction Agra only.\nE – Freight Extra.`
    };
    const merged = { ...base, ...overrides };
    merged.customer = { ...base.customer, ...(overrides.customer || {}) };
    merged.items = overrides.items || [];
    const itTotal = merged.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
    const totals = computeTotals(itTotal, merged.gstPercent, isIntrastate(merged.customer.state));
    Object.assign(merged, totals);
    merged.amount = Math.round(totals.total);
    merged.balance = Math.max(0, merged.amount - (merged.amountPaid || 0));
    return merged;
  }

  // Seed data matching the real quotation PDF
  let invoices = [
    makeInvoice({
      customer: { name: 'YASHPAL SINGH', mobile: '6395840394', address: 'SHAMSHABAD, AGRA', city: 'Agra', state: 'Uttar Pradesh' },
      items: [
        { name: 'FLYASH BRICKS MACHINE 10 CAVITY\nA- Heavy MS Steel plate 20mm thickness.\nB- Auto material feeding System\nC- 180Tones Pressure, Double Main Cylinder with two side cylinder.\nD- Electronic panel with PLC system\nE- Accident proof locking system\nF- Auto Wooden Pallet Feeder System', qty: 1, rate: 1900000 },
        { name: 'PAN MIXER 500 KG.\nWith Rollers replaceable linear and wear resistance scrapper high efficient 1 Stage gear box helical type with conveyor belt', qty: 2, rate: 500000 },
        { name: 'CONVEYOR BELT\n22 Feet length heavy duty frame 450 mm width conveyer belt system JK make.\nA- 2 HP Motor Crompton make 1440 Rpm 3 phase\nB- Gear box Assembly with 100 x 50 channel', qty: 1, rate: 350000 },
        { name: 'POWER PACK SYSTEM\nA- Hydrullic power pack 450 ltr capacity\nB- High Efficient Yuken High Flow control value with PCM Block System.\nC- Oil Cooler for oil Colling 30 inch 12 Copper Tube.\nD- High Pressure / Low pressure Technology\nE- Dauty/ Yuken / Polyhydron pump\nF- 10 Hp Crompton Motor 1440 RPM 3 Phase', qty: 1, rate: 450000 },
        { name: 'PLC PANEL FULLY AI BASED\nA- Hydraulic speed control and vibrator control\nB- Emergency Control Button, Stroke calculator, Delay Timer Display.\nC- Electronic Parts Siemens, Schneider and Delta.', qty: 1, rate: 400000 },
        { name: 'BRICK TROLLEY', qty: 6, rate: 7500 },
        { name: 'MATERIAL TROLLEY', qty: 10, rate: 9000 },
        { name: 'VIBRATOR TABLE', qty: 1, rate: 90000 },
        { name: 'MIXER MACHINE WITH MOTOR', qty: 1, rate: 150000 },
        { name: 'COLOUR MIXER', qty: 1, rate: 90000 },
        { name: 'MOULD ZIG ZAG WITH DUMBLE', qty: 5000, rate: 55 },
        { name: 'CHEMICAL DRUM', qty: 10, rate: 12000 },
        { name: 'COLOUR BAG RED & YELLOW', qty: 10, rate: 7500 },
        { name: 'PLY BOARD 8X4', qty: 50, rate: 2500 }
      ],
      status: 'Sent',
      date: '2026-06-22',
      gstPercent: 18,
      amountPaid: 0
    })
  ];

  // ---------------------------------------------------
  // 1. Sidebar (collapse / expand + mobile drawer)
  // ---------------------------------------------------
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const toggleIcon = document.getElementById('toggleIcon');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  let sidebarExpanded = false;

  function isMobile() { return window.innerWidth < 1024; }
  function updateChevron() { if (toggleIcon) toggleIcon.style.transform = sidebarExpanded ? 'rotate(180deg)' : 'rotate(0deg)'; }
  function openSidebar() {
    sidebarExpanded = true;
    sidebar?.classList.add('expanded');
    sidebar?.classList.remove('collapsed');
    if (isMobile()) { sidebarBackdrop?.classList.remove('hidden'); sidebarBackdrop?.classList.add('visible'); }
    updateChevron();
  }
  function closeSidebar() {
    sidebarExpanded = false;
    sidebar?.classList.remove('expanded');
    sidebar?.classList.add('collapsed');
    sidebarBackdrop?.classList.remove('visible');
    sidebarBackdrop?.classList.add('hidden');
    updateChevron();
  }
  sidebarToggle?.addEventListener('click', () => sidebarExpanded ? closeSidebar() : openSidebar());
  sidebarBackdrop?.addEventListener('click', closeSidebar);
  document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', () => { if (isMobile()) closeSidebar(); }));
  window.addEventListener('resize', () => { if (!isMobile() && sidebarExpanded) { sidebarBackdrop?.classList.remove('visible'); sidebarBackdrop?.classList.add('hidden'); } });
  closeSidebar();

  // ---------------------------------------------------
  // 2. Topbar dropdowns
  // ---------------------------------------------------
  const notifBtn = document.getElementById('notifBtn');
  const notifDropdown = document.getElementById('notifDropdown');
  const profileBtn = document.getElementById('profileBtn');
  const profileDropdown = document.getElementById('profileDropdown');
  notifBtn?.addEventListener('click', e => { e.stopPropagation(); notifDropdown?.classList.toggle('hidden'); profileDropdown?.classList.add('hidden'); });
  profileBtn?.addEventListener('click', e => { e.stopPropagation(); profileDropdown?.classList.toggle('hidden'); notifDropdown?.classList.add('hidden'); });
  document.addEventListener('click', () => { notifDropdown?.classList.add('hidden'); profileDropdown?.classList.add('hidden'); });
  document.getElementById('profileLogoutBtn')?.addEventListener('click', async () => {
    if (typeof logout === 'function') await logout();
    else window.location.href = '../index.html';
  });

  function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
  function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
  document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => closeModal(btn.dataset.close)));
  document.querySelectorAll('.modal-overlay').forEach(ov => ov.addEventListener('click', e => { if (e.target === ov) closeModal(ov.id); }));

  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast-animate bg-cream border border-peach-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-700 shadow-lg flex items-center gap-2';
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-circle-check text-emerald-600' : 'fa-circle-xmark text-rose-500'}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 250); }, 2600);
  }

  function badgeClass(status) {
    if (status === 'Paid') return 'badge-paid';
    if (status === 'Partially Paid') return 'badge-partial';
    if (status === 'Overdue') return 'badge-overdue';
    if (status === 'Sent') return 'badge-sent';
    return 'badge-draft';
  }

  // FIX: this used to only run inside the payment-save handler, so a
  // Sent invoice past its due date never flipped to "Overdue" on its own.
  function updateStatus(inv) {
    if (inv.balance <= 0 && inv.amount > 0) { inv.status = 'Paid'; return; }
    if (inv.amountPaid > 0) { inv.status = 'Partially Paid'; return; }
    if (inv.status === 'Draft') return; // don't auto-flip drafts
    if (inv.dueDate && new Date(inv.dueDate) < new Date()) { inv.status = 'Overdue'; return; }
    if (inv.status === 'Overdue') inv.status = 'Sent'; // due date pushed back / payment undone
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str ?? '';
    return div.innerHTML;
  }

  let sortKey = null, sortDir = 1, currentPage = 1, rowsPerPage = 10;

  function getFiltered() {
    const q = (document.getElementById('search-input')?.value || '').trim().toLowerCase();
    const status = document.getElementById('filter-status')?.value || '';
    let list = invoices.filter(inv => {
      const matchesSearch = !q || inv.invoiceNo.toLowerCase().includes(q) || (inv.customer.name || '').toLowerCase().includes(q);
      const matchesStatus = !status || inv.status === status;
      return matchesSearch && matchesStatus;
    });
    if (sortKey) {
      list = [...list].sort((a, b) => {
        let va = a[sortKey], vb = b[sortKey];
        if (sortKey === 'customer') { va = a.customer.name; vb = b.customer.name; }
        // FIX: table's data-sort="amountPaid" now matches the actual field name.
        if (sortKey === 'amount' || sortKey === 'amountPaid' || sortKey === 'balance') { va = Number(va) || 0; vb = Number(vb) || 0; }
        if (va < vb) return -1 * sortDir;
        if (va > vb) return 1 * sortDir;
        return 0;
      });
    }
    return list;
  }

  function updateStats() {
    document.getElementById('stat-total').textContent = invoices.length;
    document.getElementById('stat-paid').textContent = invoices.filter(i => i.status === 'Paid').length;
    document.getElementById('stat-partial').textContent = invoices.filter(i => i.status === 'Partially Paid').length;
    document.getElementById('stat-overdue').textContent = invoices.filter(i => i.status === 'Overdue').length;
    document.getElementById('stat-value').textContent = formatINR(invoices.reduce((s, i) => s + i.amount, 0));
    document.getElementById('stat-due').textContent = formatINR(invoices.reduce((s, i) => s + i.balance, 0));
  }

  function renderTable() {
    // FIX: recompute Draft/Sent → Overdue/Paid/Partially Paid on every render,
    // not just after recording a payment.
    invoices.forEach(updateStatus);
    updateStats();

    const filtered = getFiltered();
    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * rowsPerPage;
    const pageRows = filtered.slice(start, start + rowsPerPage);
    const tbody = document.getElementById('invoice-tbody');
    tbody.innerHTML = pageRows.map(inv => `
      <tr>
        <td data-label="Invoice No."><b>${escapeHtml(inv.invoiceNo)}</b></td>
        <td data-label="Customer">${escapeHtml(inv.customer.name) || '—'}</td>
        <td data-label="Amount">${formatINR(inv.amount)}</td>
        <td data-label="Paid">${formatINR(inv.amountPaid || 0)}</td>
        <td data-label="Balance">${formatINR(inv.balance)}</td>
        <td data-label="Status"><span class="badge ${badgeClass(inv.status)}">${inv.status}</span></td>
        <td data-label="Date">${new Date(inv.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
        <td data-label="Actions">
          <div class="row-actions">
            <button class="action-icon-btn icon-view" title="View" data-action="view" data-id="${inv.invoiceNo}"><i class="fas fa-eye"></i></button>
            <button class="action-icon-btn" title="Record Payment" data-action="pay" data-id="${inv.invoiceNo}"><i class="fas fa-money-bill-wave"></i></button>
            <button class="action-icon-btn danger" title="Delete" data-action="delete" data-id="${inv.invoiceNo}"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('') || `<tr><td colspan="8" style="text-align:center;color:#9CA3AF;padding:24px;">No invoices found.</td></tr>`;

    document.getElementById('table-range').textContent = filtered.length ? `· Showing ${start + 1}-${Math.min(start + rowsPerPage, filtered.length)} of ${filtered.length}` : '';

    const pagination = document.getElementById('pagination');
    let html = `<button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}"><i class="fas fa-chevron-left"></i></button>`;
    for (let p = 1; p <= totalPages; p++) html += `<button class="pagination-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
    html += `<button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}"><i class="fas fa-chevron-right"></i></button>`;
    pagination.innerHTML = html;
    pagination.querySelectorAll('button[data-page]').forEach(btn => btn.addEventListener('click', () => { currentPage = Number(btn.dataset.page); renderTable(); }));

    tbody.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const inv = invoices.find(i => i.invoiceNo === btn.dataset.id);
        if (!inv) return;
        if (btn.dataset.action === 'view') openViewModal(inv);
        if (btn.dataset.action === 'pay') openPaymentModal(inv);
        if (btn.dataset.action === 'delete') openDeleteModal(inv);
      });
    });
  }

  // FIX: debounce search like productm.js does (was firing on every keystroke).
  let searchTimer;
  document.getElementById('search-input')?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { currentPage = 1; renderTable(); }, 200);
  });
  document.getElementById('filter-status')?.addEventListener('input', () => { currentPage = 1; renderTable(); });

  document.getElementById('rows-per-page')?.addEventListener('change', e => { rowsPerPage = Number(e.target.value); currentPage = 1; renderTable(); });
  document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-status').value = '';
    currentPage = 1;
    renderTable();
  });
  document.querySelectorAll('.data-table th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      sortDir = (sortKey === key) ? -sortDir : 1;
      sortKey = key;
      document.querySelectorAll('.data-table th').forEach(h => h.classList.remove('sorted'));
      th.classList.add('sorted');
      renderTable();
    });
  });

  // ---------------------------------------------------
  // Invoice PDF markup
  // FIX: logo now top-left / GSTIN top-right (spec requirement),
  // due date shown, customer city/state/GST shown, quote ref shown,
  // CGST+SGST vs IGST split shown instead of one flat "G.S.T." line.
  // ---------------------------------------------------
  function buildInvoiceMarkup(inv) {
    const rows = inv.items.map((it, i) => `
      <tr>
        <td>${i + 1}</td>
        <td style="white-space:pre-line">${escapeHtml(it.name)}</td>
        <td class="num">${it.qty}</td>
        <td class="num">${Number(it.rate).toLocaleString('en-IN')}.00</td>
        <td class="num">${(Number(it.qty) * Number(it.rate)).toLocaleString('en-IN')}.00</td>
      </tr>
    `).join('');

    const taxRowsHtml = inv.intrastate
      ? `<tr><td>CGST ${(inv.gstPercent / 2).toFixed(1)}%</td><td>${formatINR(inv.cgst)}</td></tr>
         <tr><td>SGST ${(inv.gstPercent / 2).toFixed(1)}%</td><td>${formatINR(inv.sgst)}</td></tr>`
      : `<tr><td>IGST ${inv.gstPercent}%</td><td>${formatINR(inv.igst)}</td></tr>`;

    return `
      <div class="inv-header">
        <div class="inv-header-left">
          <img src="${COMPANY.logo}" alt="Logo" style="height:48px;object-fit:contain;">
          <div>
            <div class="inv-company-name">${escapeHtml(COMPANY.name)}</div>
            <div>${escapeHtml(COMPANY.address)}</div>
            <div>Mob: ${escapeHtml(COMPANY.phone)}</div>
            <div>Email: ${escapeHtml(COMPANY.email)}</div>
          </div>
        </div>
        <div class="inv-header-right">
          <div class="inv-gstin">GSTIN: ${escapeHtml(COMPANY.gstin)}</div>
          <div>State: ${escapeHtml(COMPANY.state)}</div>
        </div>
      </div>
      <div class="inv-title">TAX INVOICE / BILL OF SUPPLY</div>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:12px;">
        <div>
          <b>Bill To:</b><br>
          ${escapeHtml(inv.customer.name) || '—'}<br>
          ${escapeHtml(inv.customer.address) || ''}${inv.customer.city ? ', ' + escapeHtml(inv.customer.city) : ''}${inv.customer.state ? ', ' + escapeHtml(inv.customer.state) : ''}<br>
          Mob: ${escapeHtml(inv.customer.mobile) || '—'}
          ${inv.customer.gst ? `<br>GSTIN: ${escapeHtml(inv.customer.gst)}` : ''}
        </div>
        <div style="text-align:right;">
          <div>Invoice No.: <b>${escapeHtml(inv.invoiceNo)}</b></div>
          ${inv.quoteNo ? `<div>Against Quotation: <b>${escapeHtml(inv.quoteNo)}</b></div>` : ''}
          <div>Date: <b>${new Date(inv.date).toLocaleDateString('en-GB')}</b></div>
          <div>Due Date: <b>${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB') : '—'}</b></div>
          <div>Status: <span class="badge ${badgeClass(inv.status)}">${inv.status}</span></div>
        </div>
      </div>
      <table class="inv-items-table">
        <thead><tr><th>Sr.</th><th>NAME OF EQUIPMENTS</th><th>QTY</th><th>RATE PER UNIT</th><th>AMOUNT</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="display:flex;justify-content:flex-end;">
        <table class="inv-totals-table">
          <tr><td>TOTAL</td><td>${formatINR(inv.taxable)}</td></tr>
          ${taxRowsHtml}
          <tr class="total-row"><td>Grand Total</td><td>${formatINR(inv.total)}</td></tr>
          <tr><td>Amount Paid</td><td>${formatINR(inv.amountPaid || 0)}</td></tr>
          <tr><td>Balance Due</td><td>${formatINR(inv.balance)}</td></tr>
        </table>
      </div>
      <div class="inv-bank">
        <b>Bank Details :-</b><br>
        A – Bank Name – ${escapeHtml(inv.bank.bankName)}<br>
        B – A/C NO – ${escapeHtml(inv.bank.accountNumber)}<br>
        C – IFSC – ${escapeHtml(inv.bank.ifscCode)}<br>
        D – BRANCH – ${escapeHtml(inv.bank.branch)}
      </div>
      <div class="inv-terms">
        <b>Terms & Condition :-</b><br>
        ${(inv.terms || '').replace(/\n/g, '<br>')}
      </div>
      <div class="inv-seal">FOR ${escapeHtml(COMPANY.name.toUpperCase())}<br>AUTH. SIGNATORY</div>
    `;
  }

  function openViewModal(inv) {
    document.getElementById('view-invoice-preview').innerHTML = buildInvoiceMarkup(inv);
    openModal('modal-view');
    document.getElementById('btn-view-download-pdf').onclick = () => {
      if (typeof html2pdf === 'undefined') { showToast('PDF library failed to load', 'error'); return; }
      html2pdf().set({ margin: 8, filename: `${inv.invoiceNo}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } })
        .from(document.getElementById('view-invoice-preview')).save();
    };
  }

  let payingInvoice = null;
  function openPaymentModal(inv) {
    payingInvoice = inv;
    document.getElementById('pay-invoiceno').textContent = inv.invoiceNo;
    document.getElementById('pay-amount').value = inv.balance;
    document.getElementById('pay-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('pay-mode').value = 'NEFT';
    document.getElementById('pay-ref').value = '';
    document.getElementById('pay-summary').innerHTML = `
      <div class="row"><span>Invoice Amount</span><b>${formatINR(inv.amount)}</b></div>
      <div class="row"><span>Already Paid</span><b>${formatINR(inv.amountPaid || 0)}</b></div>
      <div class="row total"><span>Balance Due</span><b>${formatINR(inv.balance)}</b></div>
    `;
    openModal('modal-payment');
  }

  document.getElementById('btn-save-payment')?.addEventListener('click', () => {
    if (!payingInvoice) return;
    const amt = parseFloat(document.getElementById('pay-amount').value) || 0;
    if (amt <= 0) { showToast('Enter a valid amount', 'error'); return; }
    if (amt > payingInvoice.balance) { showToast('Amount cannot exceed balance', 'error'); return; }
    payingInvoice.amountPaid = (payingInvoice.amountPaid || 0) + amt;
    payingInvoice.balance = Math.max(0, payingInvoice.amount - payingInvoice.amountPaid);
    payingInvoice.payments = payingInvoice.payments || [];
    payingInvoice.payments.push({
      amount: amt,
      date: document.getElementById('pay-date').value,
      mode: document.getElementById('pay-mode').value,
      ref: document.getElementById('pay-ref').value
    });
    updateStatus(payingInvoice);
    closeModal('modal-payment');
    renderTable();
    showToast('Payment recorded', 'success');
  });

  let deletingInvoice = null;
  function openDeleteModal(inv) {
    deletingInvoice = inv;
    document.getElementById('delete-invoiceno').textContent = inv.invoiceNo;
    openModal('modal-delete');
  }
  document.getElementById('btn-confirm-delete')?.addEventListener('click', () => {
    if (deletingInvoice) {
      invoices = invoices.filter(i => i.invoiceNo !== deletingInvoice.invoiceNo);
      showToast(`${deletingInvoice.invoiceNo} deleted`, 'success');
    }
    closeModal('modal-delete');
    renderTable();
  });

  // ---------------------------------------------------
  // FIX: toolbar Export/Print buttons now actually do something.
  // These act on the currently filtered invoice list (respecting
  // search + status filter), not just the current page.
  // ---------------------------------------------------
  function downloadBlob(content, filename, mime) {
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

  const EXPORT_COLUMNS = ['Invoice No.', 'Customer', 'Amount', 'Paid', 'Balance', 'Status', 'Date'];
  function exportRows() {
    return getFiltered().map(inv => [
      inv.invoiceNo,
      inv.customer.name || '—',
      inv.amount,
      inv.amountPaid || 0,
      inv.balance,
      inv.status,
      new Date(inv.date).toLocaleDateString('en-GB')
    ]);
  }

  function buildExportTableHtml() {
    const rows = exportRows();
    return `<table border="1"><thead><tr>${EXPORT_COLUMNS.map(c => `<th>${c}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${escapeHtml(String(c))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }

  document.getElementById('btn-export-csv')?.addEventListener('click', () => {
    const rows = exportRows();
    if (!rows.length) { showToast('No invoices to export', 'error'); return; }
    const csv = [EXPORT_COLUMNS.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\r\n');
    downloadBlob(csv, `invoices-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
    showToast('CSV exported', 'success');
  });

  document.getElementById('btn-export-excel')?.addEventListener('click', () => {
    const rows = exportRows();
    if (!rows.length) { showToast('No invoices to export', 'error'); return; }
    const html = `<html><head><meta charset="UTF-8"></head><body>${buildExportTableHtml()}</body></html>`;
    downloadBlob(html, `invoices-${new Date().toISOString().slice(0, 10)}.xls`, 'application/vnd.ms-excel');
    showToast('Excel file exported', 'success');
  });

  document.getElementById('btn-export-pdf')?.addEventListener('click', () => {
    if (typeof html2pdf === 'undefined') { showToast('PDF library failed to load', 'error'); return; }
    const rows = exportRows();
    if (!rows.length) { showToast('No invoices to export', 'error'); return; }
    const wrapper = document.createElement('div');
    wrapper.style.padding = '12px';
    wrapper.style.fontFamily = 'Poppins, sans-serif';
    wrapper.innerHTML = `<h3 style="color:#800021;">Invoice List — ${COMPANY.name}</h3>${buildExportTableHtml()}`;
    html2pdf().set({ margin: 8, filename: `invoices-${new Date().toISOString().slice(0, 10)}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' } })
      .from(wrapper).save();
    showToast('PDF exported', 'success');
  });

  document.getElementById('btn-print')?.addEventListener('click', () => {
    const rows = exportRows();
    if (!rows.length) { showToast('No invoices to print', 'error'); return; }
    document.getElementById('print-only-table').innerHTML = `
      <thead><tr>${EXPORT_COLUMNS.map(c => `<th>${c}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${escapeHtml(String(c))}</td>`).join('')}</tr>`).join('')}</tbody>
    `;
    window.print();
  });

  // ---------------------------------------------------
  // Convert from Quotation (called from quotation.js)
  // ---------------------------------------------------
  window.convertQuotationToInvoice = function (quote) {
    const inv = makeInvoice({
      quoteNo: quote.quoteNo,
      customer: { ...quote.customer },
      items: (quote.items || []).map(it => ({ name: it.name, qty: it.qty, rate: it.rate })),
      gstPercent: quote.gstPercent || 18,
      status: 'Draft',
      bank: quote.bank || { ...COMPANY.bank },
      terms: quote.terms || COMPANY.terms
    });
    invoices.unshift(inv);
    renderTable();
    showToast(`Invoice ${inv.invoiceNo} created from ${quote.quoteNo}`, 'success');
    return inv;
  };

  document.getElementById('btn-new-invoice')?.addEventListener('click', () => {
    showToast('Use "Convert to Invoice" from Quotation or open a quotation and convert.', 'error');
  });

  renderTable();
})();