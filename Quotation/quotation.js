/* ============================================================
   Quotation Management — Complete Module
   VKM Brick & Block Machinery (Vaishnokripa Mercantile)
   Solar/referral module fully removed. Calculations verified
   against the real invoice (Flyash Bricks Machine order, 22-06-2026):
     Items Subtotal ₹51,60,000  → GST18% ₹9,28,800 → Grand Total ₹60,88,800

   UPDATED: Product catalog now also includes the full machine range
   from the two rate-card references supplied by VKM:
     - "Machine Specification" sheet (Nano / Double Station Nano /
       Budget / Metal-to-Metal machines)
     - "Flyash Brick Machine Specification" sheet (Budget, Rotary,
       VK001–VK005 fully-automatic range)
   Each machine entry now also carries production capacity, pressure,
   power, shed size and labor requirement so the wizard can show a
   live "Site Requirements" check in Step 2 against what the customer
   told us about their site in Step 1.
   ============================================================ */

(function () {
  'use strict';

  // ============================================================
  // COMPANY INFO — matches the actual VKM letterhead
  // ============================================================
  const COMPANY = {
    name: 'Vaishnokripa Mercantile',
    address: 'Gata No. 60, Agra-Mathura Byepass Road, Near Roshanlal College, Arsena, Agra - 282007',
    phone: '+91 9837143745, 7055008833',
    email: 'vaishnoworks8@gmail.com',
    website: 'www.vaishnoworks.com',
    gstin: '09AMXPS4725R1ZO',
    state: 'Uttar Pradesh',
    logo: '../img/image.png',
    bank: {
      accountName: 'Vaishnokripa Mercantile',
      bankName: 'HDFC BANK',
      accountNumber: '50200118886367',
      ifscCode: 'HDFC0003696',
      branch: 'SHASTRIPURAM AGRA'
    }
  };

  const DEFAULT_TERMS = `GST : Extra.\nDelivery After Full and Final Payment.\nAll Cheques & Drafts in favour of Vaishnokripa Mercantile.\nJurisdiction Agra only.\nFreight Extra.`;

  // ============================================================
  // PRODUCT CATALOG — synced from Product Management (localStorage)
  // Fallback list uses the exact rates from the real VKM invoice,
  // PLUS the full machine range from the two rate-card PDFs
  // ("Machine Specification" + "Flyash Brick Machine Specification").
  //
  // Extra fields on machine entries (all optional / display-only):
  //   production : output per 8-hour shift
  //   pressure   : hydraulic pressure rating
  //   power      : connected load (HP)
  //   oilTank    : hydraulic oil tank capacity
  //   shedSize   : shed / open-yard space the machine needs
  //   labor      : number of laborers required to run it
  //   vibration  : whether the model has a vibration table (Yes/No)
  // ============================================================
  const PRODUCT_CATALOG_STORAGE_KEY = 'vkmProductCatalog';

  const FALLBACK_PRODUCTS = [
    // ---- Items from the real reference invoice (SQ-1001) ----
    { id: 'fb1',  name: 'FLYASH BRICKS MACHINE 10 CAVITY', category: 'Machine',   brand: 'VKM', spec: '180T Pressure, Auto Feed, PLC', unit: 'Nos',  price: 1900000, status: 'Active' },
    { id: 'fb2',  name: 'PAN MIXER 500 KG',                category: 'Component', brand: 'VKM', spec: '1-Stage Gear Box, Replaceable Rollers', unit: 'Nos', price: 500000, status: 'Active' },
    { id: 'fb3',  name: 'CONVEYOR BELT 22 Feet',            category: 'Component', brand: 'VKM', spec: 'JK Make, 450mm width, 2HP Motor', unit: 'Nos', price: 350000, status: 'Active' },
    { id: 'fb4',  name: 'POWER PACK SYSTEM',                category: 'Component', brand: 'VKM', spec: '450 Ltr, 10 HP, Yuken/Polyhydron pump', unit: 'Nos', price: 450000, status: 'Active' },
    { id: 'fb5',  name: 'PLC PANEL FULLY AI BASED',         category: 'Component', brand: 'VKM', spec: 'Hydraulic speed & vibrator control', unit: 'Nos', price: 400000, status: 'Active' },
    { id: 'fb6',  name: 'BRICK TROLLY',                     category: 'Accessory', brand: 'VKM', spec: '', unit: 'Nos', price: 7500, status: 'Active' },
    { id: 'fb7',  name: 'MATERIAL TROLLY',                  category: 'Accessory', brand: 'VKM', spec: '', unit: 'Nos', price: 9000, status: 'Active' },
    { id: 'fb8',  name: 'VIBRATOR TABLE',                   category: 'Accessory', brand: 'VKM', spec: '', unit: 'Nos', price: 90000, status: 'Active' },
    { id: 'fb9',  name: 'MIXER MACHINE WITH MOTOR',         category: 'Machine',   brand: 'VKM', spec: '', unit: 'Nos', price: 150000, status: 'Active' },
    { id: 'fb10', name: 'COLOUR MIXER',                     category: 'Machine',   brand: 'VKM', spec: '', unit: 'Nos', price: 90000, status: 'Active' },
    { id: 'fb11', name: 'MOULD ZIG ZAG WITH DUMBLE',        category: 'Accessory', brand: 'VKM', spec: '', unit: 'Piece', price: 55, status: 'Active' },
    { id: 'fb12', name: 'CHEMICAL DRUM',                    category: 'Accessory', brand: 'VKM', spec: '', unit: 'Drum', price: 12000, status: 'Active' },
    { id: 'fb13', name: 'COLOUR BAG RED & YELLOW',          category: 'Accessory', brand: 'VKM', spec: '', unit: 'Bag', price: 7500, status: 'Active' },
    { id: 'fb14', name: 'PLY BOARD 8X4',                    category: 'Accessory', brand: 'VKM', spec: '', unit: 'Sheet', price: 2500, status: 'Active' },

    // ---- "Machine Specification" rate card (Nano range) ----
    {
      id: 'ms1', name: 'NANO MACHINE', category: 'Machine', brand: 'VKM',
      spec: '1200-1400 blocks/8hr, 25T pressure, 100L oil tank, 10HP (5+5), incl. 300kg Pan Mixer',
      unit: 'Nos', price: 515000, status: 'Active',
      production: '1200-1400 blocks / 8 hr', pressure: '25 Ton', power: '10 HP (5+5)',
      oilTank: '100 Ltr', shedSize: '15x20 ft', labor: 4
    },
    {
      id: 'ms2', name: 'DOUBLE STATION NANO MACHINE', category: 'Machine', brand: 'VKM',
      spec: '2400-2800 blocks/8hr, 25T pressure, 170L oil tank, 17.5HP (10+7.5), incl. 500kg Pan Mixer',
      unit: 'Nos', price: 715000, status: 'Active',
      production: '2400-2800 blocks / 8 hr', pressure: '25 Ton', power: '17.5 HP (10+7.5)',
      oilTank: '170 Ltr', shedSize: '15x20 ft', labor: 6
    },
    {
      id: 'ms3', name: 'BUDGET MACHINE (NANO RANGE)', category: 'Machine', brand: 'VKM',
      spec: '2500-2800 blocks/8hr, 40T pressure, 170L oil tank, 10HP (5+5), incl. 500kg Pan Mixer',
      unit: 'Nos', price: 800000, status: 'Active',
      production: '2500-2800 blocks / 8 hr', pressure: '40 Ton', power: '10 HP (5+5)',
      oilTank: '170 Ltr', shedSize: '12x15 ft', labor: 5
    },
    {
      id: 'ms4', name: 'METAL TO METAL MACHINE', category: 'Machine', brand: 'VKM',
      spec: '3500-3800 blocks/8hr, 60T pressure, 300L oil tank, 17HP (7.5+7.5+2), incl. 500kg Pan Mixer + 20ft Conveyor',
      unit: 'Nos', price: 1325000, status: 'Active',
      production: '3500-3800 blocks / 8 hr', pressure: '60 Ton', power: '17 HP (7.5+7.5+2)',
      oilTank: '300 Ltr', shedSize: '30x20 ft', labor: 6
    },

    // ---- "Flyash Brick Machine Specification" rate card ----
    {
      id: 'fbm1', name: 'FLYASH BRICK BUDGET MACHINE', category: 'Machine', brand: 'VKM',
      spec: '4500-5000 bricks/8hr, 40T pressure, 22 sec/stock cycle, 160L oil tank, 10HP, Full Set Up incl.',
      unit: 'Nos', price: 625000, status: 'Active',
      production: '4500-5000 bricks / 8 hr', pressure: '40 Ton', power: '10 HP',
      oilTank: '160 Ltr', shedSize: '20x15 ft', labor: 5, vibration: 'No'
    },
    {
      id: 'fbm2', name: 'ROTARY TYPE MACHINE', category: 'Machine', brand: 'VKM',
      spec: '14000-15000 bricks/8hr, 40T pressure, 200L oil tank, 20.5HP, 30 KVA genset, incl. 500kg Pan Mixer',
      unit: 'Nos', price: 1250000, status: 'Active',
      production: '14000-15000 bricks / 8 hr', pressure: '40 Ton', power: '20.5 HP',
      oilTank: '200 Ltr', shedSize: '15x35 ft', labor: 7, vibration: 'No'
    },
    {
      id: 'fbm3', name: 'VK001 — 4 BRICK METAL TO METAL', category: 'Machine', brand: 'VKM',
      spec: '8000+ bricks/8hr, 120T pressure, 300L oil tank, 17HP, 25 KVA genset, incl. 500kg Pan Mixer + 20ft Conveyor, Pallet 14x24',
      unit: 'Nos', price: 1200000, status: 'Active',
      production: '8000+ bricks / 8 hr', pressure: '120 Ton', power: '17 HP',
      oilTank: '300 Ltr', shedSize: '40x60 ft (Height 15 ft)', labor: 7, vibration: 'No'
    },
    {
      id: 'fbm4', name: 'VK002 — 6 BRICK METAL TO METAL', category: 'Machine', brand: 'VKM',
      spec: '12000+ bricks/8hr, 140T pressure, 400L oil tank, 21HP, 30 KVA genset, incl. 700kg Pan Mixer + 20ft Conveyor, Pallet 14x32',
      unit: 'Nos', price: 1400000, status: 'Active',
      production: '12000+ bricks / 8 hr', pressure: '140 Ton', power: '21 HP',
      oilTank: '400 Ltr', shedSize: '40x60 ft (Height 15 ft)', labor: 7, vibration: 'No'
    },
    {
      id: 'fbm5', name: 'VK003 — 8 BRICK FULLY AUTOMATIC', category: 'Machine', brand: 'VKM',
      spec: '12000+ bricks/8hr, 150T pressure, 400L oil tank, 26.5HP, 45 KVA genset, incl. 500kg (2 Pcs) Pan Mixer + 20ft Conveyor, Pallet 24x24, Vibration Yes',
      unit: 'Nos', price: 1600000, status: 'Active',
      production: '12000+ bricks / 8 hr', pressure: '150 Ton', power: '26.5 HP',
      oilTank: '400 Ltr', shedSize: '40x60 ft (Height 15 ft)', labor: 7, vibration: 'Yes'
    },
    {
      id: 'fbm6', name: 'VK004 — 10 BRICK FULLY AUTOMATIC', category: 'Machine', brand: 'VKM',
      spec: '14000+ bricks/8hr, 170T pressure, 400L oil tank, 27.5HP, 45 KVA genset, incl. 700kg (2 Pcs) Pan Mixer + 28ft Conveyor, Pallet 24x28, Vibration Yes',
      unit: 'Nos', price: 1800000, status: 'Active',
      production: '14000+ bricks / 8 hr', pressure: '170 Ton', power: '27.5 HP',
      oilTank: '400 Ltr', shedSize: '40x60 ft (Height 15 ft)', labor: 7, vibration: 'Yes'
    },
    {
      id: 'fbm7', name: 'VK005 — 12 BRICK FULLY AUTOMATIC', category: 'Machine', brand: 'VKM',
      spec: '16000+ bricks/8hr, 200T pressure, 450L oil tank, 30HP, 62 KVA genset, incl. 700kg (2 Pcs) Pan Mixer + 28ft Conveyor, Pallet 32x24, Vibration Yes',
      unit: 'Nos', price: 2000000, status: 'Active',
      production: '16000+ bricks / 8 hr', pressure: '200 Ton', power: '30 HP',
      oilTank: '450 Ltr', shedSize: '40x60 ft (Height 15 ft)', labor: 7, vibration: 'Yes'
    }
  ];

  function getProductCatalog() {
    try {
      const raw = localStorage.getItem(PRODUCT_CATALOG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          const active = parsed.filter(p => p.status !== 'Inactive');
          if (active.length) return active;
        }
      }
    } catch (_) { /* fall through to fallback list */ }
    return FALLBACK_PRODUCTS;
  }

  // ============================================================
  // UTILITIES
  // ============================================================
  function escapeAttr(str) { return String(str ?? '').replace(/"/g, '&quot;'); }

  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  function formatINR(n) {
    return '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
  }

  function numberToWordsIndian(num) {
    num = Math.round(Math.max(0, Number(num) || 0));
    if (num === 0) return 'Zero Rupees Only';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
      'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    function twoDigits(n) { return n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : ''); }
    function threeDigits(n) { return n < 100 ? twoDigits(n) : ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoDigits(n % 100) : ''); }
    let result = '';
    const crore = Math.floor(num / 10000000); num %= 10000000;
    const lakh = Math.floor(num / 100000); num %= 100000;
    const thousand = Math.floor(num / 1000); num %= 1000;
    const rest = num;
    if (crore) result += threeDigits(crore) + ' Crore ';
    if (lakh) result += threeDigits(lakh) + ' Lakh ';
    if (thousand) result += threeDigits(thousand) + ' Thousand ';
    if (rest) result += threeDigits(rest);
    return result.trim() + ' Rupees Only';
  }

  function showToast(message, type) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const colors = { success: '#059669', error: '#EF4444', info: '#3B82F6' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.style.borderLeft = `4px solid ${colors[type] || colors.info}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info'}" style="color:${colors[type] || colors.info};"></i> ${escapeHtml(message)}`;
    container.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 4000);
  }

  /**
   * Core money math — kept in one place so every screen (wizard preview,
   * saved list, edit modal, invoice) uses the identical formula.
   *   subtotal  = items + installation + transport + other charges
   *   discount  = % of subtotal OR a flat ₹ amount
   *   taxable   = subtotal - discount        (never negative)
   *   SGST/CGST = taxable * (gst% / 2) / 100  each
   *   total     = taxable + SGST + CGST
   */
  function computeTotals(itemsTotal, costs, gstPercent, discountType, discountValue) {
    const itemsTotalN = Number(itemsTotal) || 0;
    const installation = Number(costs.installation) || 0;
    const transport = Number(costs.transport) || 0;
    const other = Number(costs.other) || 0;
    const gst = Number(gstPercent) || 0;
    const discVal = Number(discountValue) || 0;

    const subtotal = itemsTotalN + installation + transport + other;
    const discountAmount = discountType === 'percent'
      ? subtotal * (Math.min(Math.max(discVal, 0), 100) / 100)
      : Math.min(Math.max(discVal, 0), subtotal);
    const taxable = Math.max(0, subtotal - discountAmount);
    const sgst = taxable * (gst / 2 / 100);
    const cgst = taxable * (gst / 2 / 100);
    const total = taxable + sgst + cgst;

    return { subtotal, discountAmount, taxable, sgst, cgst, total };
  }

  // ============================================================
  // QUOTATION DATA MODEL
  // ============================================================
  let quoteCounter = 1000;
  function nextQuoteNo() { quoteCounter += 1; return `SQ-${quoteCounter}`; }

  let quotations = [];
  let wizardItems = [];
  let itemIdCounter = 1;
  function newItemId() { return 'it' + (itemIdCounter++); }

  function itemsSubtotal(items) {
    return items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
  }

  function makeQuotation(overrides) {
    const base = {
      quoteNo: nextQuoteNo(),
      date: new Date().toISOString().slice(0, 10),
      status: 'Pending',
      customer: { name: '', company: '', mobile: '', email: '', address: '', city: '', state: '', pincode: '', gst: '' },
       customerType: '',
      siteType: '',
      deliveryTimeline: '45 days from advance payment',
      items: [],
      costs: { installation: 0, transport: 0, otherLabel: 'Other Charges', other: 0 },
      gstPercent: 18,
      discountType: 'percent',
      discountValue: 0,
      bank: { ...COMPANY.bank },
      terms: DEFAULT_TERMS,
      paymentTerms: { advance: 50, material: 25, installation: 15, balance: 10 },
      paymentType: 'full',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    };
    const merged = { ...base, ...(overrides || {}) };
    if (overrides?.customer) merged.customer = { ...base.customer, ...overrides.customer };
    if (overrides?.costs) merged.costs = { ...base.costs, ...overrides.costs };
    if (overrides?.items) merged.items = overrides.items;
    if (overrides?.bank) merged.bank = { ...base.bank, ...overrides.bank };
    if (overrides?.paymentTerms) merged.paymentTerms = { ...base.paymentTerms, ...overrides.paymentTerms };

    const itTotal = itemsSubtotal(merged.items);
    const totals = computeTotals(itTotal, merged.costs, merged.gstPercent, merged.discountType, merged.discountValue);
    Object.assign(merged, totals);
    merged.itemsTotal = itTotal;
    merged.amount = Math.round(totals.total);

    return merged;
  }

  // ============================================================
  // SAMPLE QUOTATIONS (matches the real reference invoice for SQ-1001)
  // ============================================================
 // In generateSampleQuotations function, REPLACE the entire function with this:

function generateSampleQuotations() {
  const q1 = makeQuotation({
    customer: { 
      name: 'YASHPAL SINGH', 
      mobile: '6395840394', 
      email: 'yashpal@example.com', 
      address: 'Shamshabad', 
      city: 'Agra', 
      state: 'Uttar Pradesh', 
      pincode: '282001',
      customerType: 'Individual'
    },
    items: [
      { id: newItemId(), name: 'FLYASH BRICKS MACHINE 10 CAVITY', qty: 1, rate: 1900000 },
      { id: newItemId(), name: 'PAN MIXER 500 KG', qty: 2, rate: 500000 },
      { id: newItemId(), name: 'CONVEYOR BELT 22 Feet', qty: 1, rate: 350000 },
      { id: newItemId(), name: 'POWER PACK SYSTEM', qty: 1, rate: 450000 },
      { id: newItemId(), name: 'PLC PANEL FULLY AI BASED', qty: 1, rate: 400000 },
      { id: newItemId(), name: 'BRICK TROLLY', qty: 6, rate: 7500 },
      { id: newItemId(), name: 'MATERIAL TROLLY', qty: 10, rate: 9000 },
      { id: newItemId(), name: 'VIBRATOR TABLE', qty: 1, rate: 90000 },
      { id: newItemId(), name: 'MIXER MACHINE WITH MOTOR', qty: 1, rate: 150000 },
      { id: newItemId(), name: 'COLOUR MIXER', qty: 1, rate: 90000 },
      { id: newItemId(), name: 'MOULD ZIG ZAG WITH DUMBLE', qty: 5000, rate: 55 },
      { id: newItemId(), name: 'CHEMICAL DRUM', qty: 10, rate: 12000 },
      { id: newItemId(), name: 'COLOUR BAG RED & YELLOW', qty: 10, rate: 7500 },
      { id: newItemId(), name: 'PLY BOARD 8X4', qty: 50, rate: 2500 }
    ],
    status: 'Pending',
    date: '2026-06-22',
    siteType: 'Factory',
    deliveryTimeline: '45 days from advance payment'
  });
  q1.quoteNo = 'SQ-1001';

  const q2 = makeQuotation({
    customer: { 
      name: 'Ramesh Traders', 
      company: 'Ramesh Traders', 
      mobile: '9876500001', 
      email: 'ramesh@example.com', 
      address: 'MG Road', 
      city: 'Ahmedabad', 
      state: 'Gujarat', 
      pincode: '380001', 
      gst: '24ABCDE5678F1Z2',
      customerType: 'Company'
    },
    items: [
      { id: newItemId(), name: 'FLYASH BRICKS MACHINE 10 CAVITY', qty: 1, rate: 1900000 },
      { id: newItemId(), name: 'PAN MIXER 500 KG', qty: 1, rate: 500000 }
    ],
    status: 'Accepted',
    date: '2026-07-14',
    siteType: 'Own Land'
  });
  q2.quoteNo = 'SQ-1002';

  const q3 = makeQuotation({
    customer: { 
      name: 'Priya Nair', 
      mobile: '9876500002', 
      email: 'priya@example.com', 
      address: 'Marine Drive', 
      city: 'Kochi', 
      state: 'Kerala', 
      pincode: '682001',
      customerType: 'Individual'
    },
    items: [
      { id: newItemId(), name: 'CONVEYOR BELT 22 Feet', qty: 2, rate: 350000 },
      { id: newItemId(), name: 'VIBRATOR TABLE', qty: 1, rate: 90000 }
    ],
    status: 'Rejected',
    date: '2026-07-13',
    siteType: 'Open Yard'
  });
  q3.quoteNo = 'SQ-1003';

  const q4 = makeQuotation({
    customer: { 
      name: 'Suresh Patel', 
      mobile: '9876500003', 
      email: 'suresh@example.com', 
      address: 'Ring Road', 
      city: 'Rajkot', 
      state: 'Gujarat', 
      pincode: '360001',
      customerType: 'Individual'
    },
    items: [
      { id: newItemId(), name: 'FLYASH BRICKS MACHINE 10 CAVITY', qty: 1, rate: 1900000 },
      { id: newItemId(), name: 'PAN MIXER 500 KG', qty: 1, rate: 500000 },
      { id: newItemId(), name: 'CONVEYOR BELT 22 Feet', qty: 1, rate: 350000 },
      { id: newItemId(), name: 'PLC PANEL FULLY AI BASED', qty: 1, rate: 400000 }
    ],
    status: 'Pending',
    date: '2026-07-12',
    siteType: 'Rented Shed'
  });
  q4.quoteNo = 'SQ-1004';

  return [q1, q2, q3, q4];
}

  // ============================================================
  // DOM SHORTCUTS
  // ============================================================
  const $ = (s) => document.querySelector(s);

  // ============================================================
  // SIDEBAR / TOPBAR CHROME
  // ============================================================
  const sidebar = $('#sidebar');
  const sidebarToggle = $('#sidebarToggle');
  const toggleIcon = $('#toggleIcon');
  const sidebarBackdrop = $('#sidebarBackdrop');

  function isDrawerBreakpoint() { return window.innerWidth < 1024; }

  function setSidebarExpanded(expand) {
    sidebar?.classList.toggle('expanded', expand);
    sidebar?.classList.toggle('collapsed', !expand);
    toggleIcon?.classList.toggle('rotate-180', expand);
    if (isDrawerBreakpoint()) {
      sidebarBackdrop?.classList.toggle('visible', expand);
    } else {
      sidebarBackdrop?.classList.remove('visible');
    }
  }

  setSidebarExpanded(false);
  sidebarToggle?.addEventListener('click', () => setSidebarExpanded(!sidebar.classList.contains('expanded')));
  sidebarBackdrop?.addEventListener('click', () => setSidebarExpanded(false));

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (isDrawerBreakpoint() && sidebar?.classList.contains('expanded')) setSidebarExpanded(false);
    });
  });

  window.addEventListener('resize', () => {
    if (!isDrawerBreakpoint()) sidebarBackdrop?.classList.remove('visible');
  });

  function setupDropdown(btnId, menuId) {
    const btn = document.getElementById(btnId);
    const menu = document.getElementById(menuId);
    btn?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.topbar-dropdown').forEach(m => { if (m !== menu) m.classList.add('hidden'); });
      menu?.classList.toggle('hidden');
    });
  }
  setupDropdown('notifBtn', 'notifDropdown');
  setupDropdown('profileBtn', 'profileDropdown');
  document.addEventListener('click', () => {
    document.querySelectorAll('.topbar-dropdown').forEach(m => m.classList.add('hidden'));
  });

  // ============================================================
  // MODAL HELPERS
  // ============================================================
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
  }
  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.add('hidden'); document.body.style.overflow = ''; }
    if (id === 'modal-wizard') draftQuoteNo = null;
  }
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });
  document.querySelectorAll('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', (e) => { if (e.target === ov) closeModal(ov.id); });
  });

  // ============================================================
  // TABLE: search / filter / sort / pagination / stats
  // ============================================================
  let sortKey = null, sortDir = 1, currentPage = 1, rowsPerPage = 10;

  function badgeClass(status) {
    if (status === 'Accepted') return 'badge-accepted';
    if (status === 'Rejected') return 'badge-rejected';
    return 'badge-pending';
  }

  function refreshSiteTypeFilterOptions() {
    const sel = $('#filter-sitetype');
    if (!sel) return;
    const current = sel.value;
    const types = [...new Set(quotations.map(q => q.siteType).filter(Boolean))];
    sel.innerHTML = `<option value="">All Site Types</option>` + types.map(t => `<option value="${escapeAttr(t)}">${escapeHtml(t)}</option>`).join('');
    sel.value = types.includes(current) ? current : '';
  }

  function getFiltered() {
    const q = $('#search-input')?.value.trim().toLowerCase() || '';
    const status = $('#filter-status')?.value || '';
    const siteType = $('#filter-sitetype')?.value || '';
    let list = quotations.filter(row => {
      const matchesSearch = !q || row.customer.name.toLowerCase().includes(q) || row.quoteNo.toLowerCase().includes(q);
      const matchesStatus = !status || row.status === status;
      const matchesSiteType = !siteType || row.siteType === siteType;
      return matchesSearch && matchesStatus && matchesSiteType;
    });
    if (sortKey) {
      list = [...list].sort((a, b) => {
        const map = { quoteNo: a.quoteNo, customer: a.customer.name, amount: a.amount, status: a.status, date: a.date };
        const mapB = { quoteNo: b.quoteNo, customer: b.customer.name, amount: b.amount, status: b.status, date: b.date };
        let va = map[sortKey], vb = mapB[sortKey];
        if (sortKey === 'amount') { va = Number(va); vb = Number(vb); }
        if (va < vb) return -1 * sortDir;
        if (va > vb) return 1 * sortDir;
        return 0;
      });
    }
    return list;
  }

  function updateStats() {
    $('#stat-total').textContent = quotations.length;
    const todayStr = new Date().toISOString().slice(0, 10);
    $('#stat-today').textContent = quotations.filter(q => q.date === todayStr).length;
    $('#stat-value').textContent = formatINR(quotations.reduce((s, q) => s + q.amount, 0));
    $('#stat-accepted').textContent = quotations.filter(q => q.status === 'Accepted').length;
    $('#stat-rejected').textContent = quotations.filter(q => q.status === 'Rejected').length;
    $('#stat-pending').textContent = quotations.filter(q => q.status === 'Pending').length;
  }

  function buildPaginationButtons(totalPages) {
    const pages = [];
    if (totalPages <= 7) {
      for (let p = 1; p <= totalPages; p++) pages.push(p);
    } else {
      pages.push(1);
      if (currentPage > 4) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let p = start; p <= end; p++) pages.push(p);
      if (currentPage < totalPages - 3) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }

  function renderTable() {
    updateStats();
    refreshSiteTypeFilterOptions();
    const filtered = getFiltered();
    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * rowsPerPage;
    const pageRows = filtered.slice(start, start + rowsPerPage);

    const tbody = $('#quotation-tbody');
    if (!tbody) return;

    tbody.innerHTML = pageRows.map(row => `
      <tr>
        <td data-label="Quotation No."><b>${escapeHtml(row.quoteNo)}</b></td>
        <td data-label="Customer">${escapeHtml(row.customer.name || '—')}</td>
        <td data-label="Type">${escapeHtml(row.customer.customerType || '—')}</td>
        <td data-label="Amount">${formatINR(row.amount)}</td>
        <td data-label="Status"><span class="badge ${badgeClass(row.status)}">${row.status}</span></td>
<td data-label="Date">${row.date ? new Date(row.date).toLocaleDateString('en-GB') : '—'}</td>        <td data-label="Actions" class="text-right">
          <div class="action-icons">
            <button class="icon-action-btn" title="View" data-action="view" data-quote="${escapeAttr(row.quoteNo)}"><i class="fas fa-eye"></i></button>
            <button class="icon-action-btn" title="Edit" data-action="edit" data-quote="${escapeAttr(row.quoteNo)}"><i class="fas fa-pen"></i></button>
            <button class="icon-action-btn danger" title="Delete" data-action="delete" data-quote="${escapeAttr(row.quoteNo)}"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('') || `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px;">No quotations match your filters.</td></tr>`;

    const rangeEl = $('#table-range');
    if (rangeEl) {
      rangeEl.textContent = filtered.length
        ? `· Showing ${start + 1}-${Math.min(start + rowsPerPage, filtered.length)} of ${filtered.length}`
        : '· No results';
    }

    const pagination = $('#pagination');
    if (pagination) {
      const pageList = buildPaginationButtons(totalPages);
      let html = `<button ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}"><i class="fas fa-chevron-left"></i></button>`;
      pageList.forEach(p => {
        if (p === '...') { html += `<span class="ellipsis">…</span>`; }
        else { html += `<button class="${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`; }
      });
      html += `<button ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}"><i class="fas fa-chevron-right"></i></button>`;
      pagination.innerHTML = html;
      pagination.querySelectorAll('button[data-page]').forEach(btn => {
        btn.addEventListener('click', () => { currentPage = Number(btn.dataset.page); renderTable(); });
      });
    }

    tbody.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const quote = quotations.find(q => q.quoteNo === btn.dataset.quote);
        if (!quote) return;
        if (btn.dataset.action === 'view') openViewModal(quote);
        if (btn.dataset.action === 'edit') openEditModal(quote);
        if (btn.dataset.action === 'delete') openDeleteModal(quote);
      });
    });
  }

  // ============================================================
  // INVOICE MARKUP (shared by wizard preview + view modal)
  // ============================================================
  function buildInvoiceMarkup(q) {
    const items = (q.items || []).map(it => ({
      name: it.name || '—',
      qty: it.qty,
      rate: it.rate,
      amount: (Number(it.qty) || 0) * (Number(it.rate) || 0)
    }));
    if (q.costs.installation) items.push({ name: 'Installation Charges', qty: 1, rate: q.costs.installation, amount: q.costs.installation });
    if (q.costs.transport) items.push({ name: 'Transportation Charges', qty: 1, rate: q.costs.transport, amount: q.costs.transport });
    if (q.costs.other) items.push({ name: q.costs.otherLabel || 'Other Charges', qty: 1, rate: q.costs.other, amount: q.costs.other });

    const rowsHtml = items.map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${escapeHtml(item.name)}</td>
        <td class="num">${item.qty}</td>
        <td class="num">${formatINR(item.rate)}</td>
        <td class="num">0</td>
        <td class="num">${q.gstPercent}%</td>
        <td class="num">${formatINR(item.amount)}</td>
      </tr>
    `).join('');

    const badgeCls = badgeClass(q.status);
    const bank = q.bank || COMPANY.bank;
    const paymentTerms = q.paymentTerms || { advance: 50, material: 25, installation: 15, balance: 10 };
    const paymentType = q.paymentType || 'full';

    let paymentScheduleHtml = paymentType === 'full'
      ? `<tr><td>Full Advance</td><td>100%</td></tr>`
      : `
        <tr><td>Advance</td><td>${paymentTerms.advance || 0}%</td></tr>
        <tr><td>Before Dispatch</td><td>${paymentTerms.material || 0}%</td></tr>
        <tr><td>On Delivery</td><td>${paymentTerms.installation || 0}%</td></tr>
        <tr><td>Balance</td><td>${paymentTerms.balance || 0}%</td></tr>
      `;

    return `
      <div class="inv-header">
        <div class="inv-company">
          <div class="inv-company-name">${escapeHtml(COMPANY.name)}</div>
          <div>Regd. Office: ${escapeHtml(COMPANY.address)}</div>
          <div>Mob.: ${escapeHtml(COMPANY.phone)}</div>
          <div>Email: ${escapeHtml(COMPANY.email)}</div>
          <div>GSTIN: ${escapeHtml(COMPANY.gstin)}</div>
          <div>State: ${escapeHtml(COMPANY.state)}</div>
        </div>
        <img src="${COMPANY.logo}" alt="Company Logo" class="inv-logo" crossorigin="anonymous">
      </div>
      <div class="inv-title">Quotation</div>
      <div class="inv-parties">
        <div class="inv-bill-to">
          <div class="inv-label">Bill To:</div>
          <div>Name: ${escapeHtml(q.customer.name || '—')}</div>
          <div>Address: ${escapeHtml(q.customer.address || '—')}${q.customer.city ? ', ' + escapeHtml(q.customer.city) : ''}</div>
          <div>Contact No.: ${escapeHtml(q.customer.mobile || '—')}</div>
          <div>GSTIN No.: ${escapeHtml(q.customer.gst || '—')}</div>
          <div>State: ${escapeHtml(q.customer.state || '—')}</div>
          ${q.siteType ? `<div>Site Type: ${escapeHtml(q.siteType)}</div>` : ''}
          ${q.deliveryTimeline ? `<div>Delivery Timeline: ${escapeHtml(q.deliveryTimeline)}</div>` : ''}
          <span class="badge ${badgeCls} inv-status">${q.status}</span>
        </div>
        <div class="inv-meta">
          <div><span>Quotation No.:</span> <b>${escapeHtml(q.quoteNo)}</b></div>
          <div><span>Quotation Date:</span> <b>${new Date(q.date).toLocaleDateString('en-GB')}</b></div>
          <div><span>Valid Until:</span> <b>${q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-GB') : '—'}</b></div>
        </div>
      </div>
      <table class="inv-items-table">
        <thead><tr><th>#</th><th>Equipment Name</th><th>Qty</th><th>Rate</th><th>Dis</th><th>GST</th><th>Amount</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div class="inv-totals">
        <div class="inv-words">
          <div class="inv-label">Amount in Words:</div>
          <div>${numberToWordsIndian(q.total)}</div>

          <div class="inv-bank-details">
            <div class="inv-label">Bank Details:</div>
            <table>
              <tr><td>Account Name</td><td>${escapeHtml(bank.accountName || '—')}</td></tr>
              <tr><td>Bank Name</td><td>${escapeHtml(bank.bankName || '—')}</td></tr>
              <tr><td>Account Number</td><td>${escapeHtml(bank.accountNumber || '—')}</td></tr>
              <tr><td>IFSC Code</td><td>${escapeHtml(bank.ifscCode || '—')}</td></tr>
              <tr><td>Branch</td><td>${escapeHtml(bank.branch || '—')}</td></tr>
            </table>
          </div>

          <div class="inv-payment-terms">
            <div class="inv-label">Payment Schedule:</div>
            <table>${paymentScheduleHtml}</table>
          </div>

          <div class="inv-terms">
            <div class="inv-label">Terms & Conditions</div>
            <div class="terms-text">${escapeHtml(q.terms || '').replace(/\n/g, '<br>')}</div>
          </div>
        </div>
        <table class="inv-totals-table">
          <tr><td>Sub Total</td><td>${formatINR(q.subtotal)}</td></tr>
          <tr><td>Discount</td><td>${formatINR(q.discountAmount)}</td></tr>
          <tr><td>SGST</td><td>${formatINR(q.sgst)}</td></tr>
          <tr><td>CGST</td><td>${formatINR(q.cgst)}</td></tr>
          <tr class="total-row"><td>Grand Total</td><td>${formatINR(q.total)}</td></tr>
        </table>
      </div>
      <div class="inv-seal">Company Seal & Signature</div>
    `;
  }

  function downloadInvoicePDF(elementId, filename) {
    const element = document.getElementById(elementId);
    if (!element || typeof html2pdf === 'undefined') {
      showToast('PDF library failed to load. Check your internet connection.', 'error');
      return Promise.resolve();
    }
    const opt = {
      margin: 8,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    return html2pdf().set(opt).from(element).save();
  }

  // ============================================================
  // VIEW MODAL
  // ============================================================
  let viewingQuoteNo = null;

  function openViewModal(q) {
    viewingQuoteNo = q.quoteNo;
    const preview = $('#view-invoice-preview');
    if (preview) preview.innerHTML = buildInvoiceMarkup(q);
    openModal('modal-view');
  }

  $('#btn-view-download-pdf')?.addEventListener('click', () => {
    if (!viewingQuoteNo) return;
    downloadInvoicePDF('view-invoice-preview', `${viewingQuoteNo}.pdf`);
  });

  // ============================================================
  // EDIT MODAL
  // ============================================================
  let editingQuoteNo = null;

  function openEditModal(q) {
    editingQuoteNo = q.quoteNo;
    $('#edit-quoteno').textContent = q.quoteNo;
    $('#edit-customerName').value = q.customer.name || '';
    $('#edit-mobile').value = q.customer.mobile || '';
    $('#edit-email').value = q.customer.email || '';
    $('#edit-installation').value = q.costs?.installation || 0;
    $('#edit-transport').value = q.costs?.transport || 0;
    $('#edit-discountValue').value = q.discountValue || 0;
    $('#edit-status').value = q.status || 'Pending';
    ['err-edit-customerName', 'err-edit-mobile', 'err-edit-email'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });
    updateEditSummary();
    openModal('modal-edit');
  }

  function updateEditSummary() {
    const q = quotations.find(x => x.quoteNo === editingQuoteNo);
    if (!q) return;
    const installation = parseFloat($('#edit-installation')?.value) || 0;
    const transport = parseFloat($('#edit-transport')?.value) || 0;
    const discountValue = parseFloat($('#edit-discountValue')?.value) || 0;
    const costs = { ...q.costs, installation, transport };
    const totals = computeTotals(q.itemsTotal, costs, q.gstPercent, q.discountType, discountValue);
    const el = $('#edit-summary');
    if (el) {
      el.innerHTML = `
        <div class="row"><span>Sub Total</span><b>${formatINR(totals.subtotal)}</b></div>
        <div class="row"><span>Discount</span><b>- ${formatINR(totals.discountAmount)}</b></div>
        <div class="row"><span>SGST + CGST</span><b>${formatINR(totals.sgst + totals.cgst)}</b></div>
        <div class="row total"><span>New Total</span><b>${formatINR(totals.total)}</b></div>
      `;
    }
  }
  ['edit-installation', 'edit-transport', 'edit-discountValue'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', updateEditSummary);
  });

  $('#btn-save-edit')?.addEventListener('click', () => {
    const q = quotations.find(x => x.quoteNo === editingQuoteNo);
    if (!q) return;

    const name = $('#edit-customerName')?.value.trim() || '';
    const mobile = $('#edit-mobile')?.value.trim() || '';
    const email = $('#edit-email')?.value.trim() || '';
    let valid = true;

    if (!name) { $('#err-edit-customerName').textContent = 'Required'; valid = false; }
    else { $('#err-edit-customerName').textContent = ''; }

    if (!/^[6-9]\d{9}$/.test(mobile)) { $('#err-edit-mobile').textContent = 'Enter valid 10-digit mobile'; valid = false; }
    else { $('#err-edit-mobile').textContent = ''; }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { $('#err-edit-email').textContent = 'Enter valid email'; valid = false; }
    else { $('#err-edit-email').textContent = ''; }

    if (!valid) { showToast('Please fix the highlighted fields.', 'error'); return; }

    q.customer.name = name;
    q.customer.mobile = mobile;
    q.customer.email = email;
    q.costs.installation = parseFloat($('#edit-installation')?.value) || 0;
    q.costs.transport = parseFloat($('#edit-transport')?.value) || 0;
    q.discountValue = parseFloat($('#edit-discountValue')?.value) || 0;
    q.status = $('#edit-status')?.value || 'Pending';

    const totals = computeTotals(q.itemsTotal, q.costs, q.gstPercent, q.discountType, q.discountValue);
    Object.assign(q, totals);
    q.amount = Math.round(totals.total);

    closeModal('modal-edit');
    renderTable();
    showToast(`${q.quoteNo} updated successfully`, 'success');
  });

  // ============================================================
  // DELETE MODAL
  // ============================================================
  let deletingQuoteNo = null;

  function openDeleteModal(q) {
    deletingQuoteNo = q.quoteNo;
    $('#delete-quoteno').textContent = q.quoteNo;
    openModal('modal-delete');
  }

  $('#btn-confirm-delete')?.addEventListener('click', () => {
    quotations = quotations.filter(q => q.quoteNo !== deletingQuoteNo);
    closeModal('modal-delete');
    showToast(`${deletingQuoteNo} deleted`, 'success');
    renderTable();
  });

  // ============================================================
  // NEW QUOTATION WIZARD
  // ============================================================
  let currentStep = 1;
  const totalWizardSteps = 5;
  let draftQuoteNo = null;

// REPLACE the populateProductPicker function with this version:
function populateProductPicker() {
  const select = $('#product-catalog-select');
  if (!select) return;
  const catalog = getProductCatalog();
  window.__quotationProductCatalog = catalog;

  if (!catalog.length) {
    select.innerHTML = `<option value="">No products found — add some in Product Management</option>`;
    return;
  }

  const byCategory = {};
  catalog.forEach(p => {
    const cat = p.category || 'Other';
    (byCategory[cat] = byCategory[cat] || []).push(p);
  });

  select.innerHTML = `<option value="">Select a product to add…</option>` +
    Object.keys(byCategory).sort().map(cat => `
      <optgroup label="${escapeAttr(cat)}">
        ${byCategory[cat].map(p => `<option value="${escapeAttr(p.id)}">${escapeAttr(p.name)}${p.brand ? ' — ' + escapeAttr(p.brand) : ''}</option>`).join('')}
      </optgroup>
    `).join('');
}

  $('#btn-add-catalog-product')?.addEventListener('click', () => {
    const select = $('#product-catalog-select');
    const qtyInput = $('#product-picker-qty');
    const rateInput = $('#product-picker-rate');
    if (!select || !select.value) { showToast('Select a product first.', 'error'); return; }

    const catalog = window.__quotationProductCatalog || [];
    const p = catalog.find(c => String(c.id) === select.value);
    if (!p) return;

    const qty = parseFloat(qtyInput?.value) || 1;
    const rate = parseFloat(rateInput?.value) || Number(p.price) || 0;
    wizardItems.push({
      id: newItemId(), name: p.name, qty: qty, rate: rate,
      // carry the machine's site-requirement metadata along so Step 2
      // can show a live comparison against what was entered in Step 1
      category: p.category || '', shedSize: p.shedSize || '', labor: p.labor || 0,
      production: p.production || '', power: p.power || ''
    });
    renderItemsTable();

    if (select) select.value = '';
    if (qtyInput) qtyInput.value = 1;
    if (rateInput) rateInput.value = 0;

    if (p.category === 'Machine' && (p.shedSize || p.labor)) {
      showToast(`${p.name} added — needs ${p.shedSize || 'N/A'} shed & ~${p.labor || 'N/A'} laborers`, 'info');
    } else {
      showToast(`${p.name} added to quotation`, 'success');
    }
  });

  $('#chip-custom')?.addEventListener('click', () => {
    wizardItems.push({ id: newItemId(), name: '', qty: 1, rate: 0 });
    renderItemsTable();
  });

  function renderItemsTable() {
    const tbody = $('#items-tbody');
    if (!tbody) return;

    if (!wizardItems.length) {
      tbody.innerHTML = `<tr class="items-empty-row"><td colspan="6">No products added yet — pick one from the dropdown above to start building this quotation.</td></tr>`;
    } else {
      tbody.innerHTML = wizardItems.map((it, i) => `
        <tr data-id="${it.id}">
          <td>${i + 1}</td>
          <td class="item-name-cell"><input type="text" class="item-name" value="${escapeAttr(it.name)}" placeholder="Equipment name"></td>
          <td><input type="number" class="item-qty" value="${it.qty}" min="0" step="any"></td>
          <td><input type="number" class="item-rate" value="${it.rate}" min="0" step="any"></td>
          <td class="item-amount-cell" id="amt-${it.id}">${formatINR((Number(it.qty) || 0) * (Number(it.rate) || 0))}</td>
          <td class="item-remove-cell"><button type="button" class="btn-icon-sm item-remove" title="Remove"><i class="fas fa-trash"></i></button></td>
        </tr>
      `).join('');
    }

    tbody.querySelectorAll('tr[data-id]').forEach(row => {
      const id = row.dataset.id;
      const item = wizardItems.find(i => i.id === id);
      if (!item) return;
      row.querySelector('.item-name')?.addEventListener('input', e => { item.name = e.target.value; });
      row.querySelector('.item-qty')?.addEventListener('input', e => { item.qty = parseFloat(e.target.value) || 0; updateItemAmount(item); });
      row.querySelector('.item-rate')?.addEventListener('input', e => { item.rate = parseFloat(e.target.value) || 0; updateItemAmount(item); });
      row.querySelector('.item-remove')?.addEventListener('click', () => {
        wizardItems = wizardItems.filter(i => i.id !== id);
        renderItemsTable();
      });
    });

    updateItemsSubtotalDisplay();
    updateSiteRequirementsBox();
  }

  // ------------------------------------------------------------
  // Site Requirements check (Step 2) — cross-references the
  // shed/labor needs of the machines picked here against what the
  // customer told us in Step 1 (Site Readiness section).
  // ------------------------------------------------------------
  function updateSiteRequirementsBox() {
    const box = $('#site-requirements-box');
    if (!box) return;

    const machineItems = wizardItems.filter(it => it.category === 'Machine' && (it.shedSize || it.labor || it.production));
    if (!machineItems.length) { box.classList.add('hidden'); box.innerHTML = ''; return; }

    const totalLabor = machineItems.reduce((s, it) => s + (Number(it.labor) || 0), 0);
    const shedList = [...new Set(machineItems.map(it => it.shedSize).filter(Boolean))];
    const enteredShed = $('#f-shedDimensions')?.value.trim();

    box.classList.remove('hidden');
    box.innerHTML = `
      <i class="fas fa-warehouse"></i>
      <div>
        <b>Site Requirements for selected machine(s):</b><br>
        Shed / space needed: ${shedList.length ? escapeHtml(shedList.join(', ')) : 'N/A'}<br>
        Estimated labor required: ${totalLabor || 'N/A'} worker(s)
        ${enteredShed ? `<br>Customer's available space (Step 1): ${escapeHtml(enteredShed)} — please confirm it fits.` : `<br><span style="opacity:.8;">Tip: go back to Step 1 to record the customer's available space for comparison.</span>`}
      </div>
    `;
  }

  function updateItemAmount(item) {
    const amt = (Number(item.qty) || 0) * (Number(item.rate) || 0);
    const cell = document.getElementById('amt-' + item.id);
    if (cell) cell.textContent = formatINR(amt);
    updateItemsSubtotalDisplay();
    if (currentStep === 3) computeCosts();
    if (currentStep === 4) computeGstSummary();
  }

  function updateItemsSubtotalDisplay() {
    const total = itemsSubtotal(wizardItems);
    const el = $('#items-subtotal');
    if (el) el.textContent = formatINR(total);
    const costItems = $('#cost-items');
    if (costItems) costItems.textContent = formatINR(total);
  }

  function resetWizardForm() {
    ['f-customerName', 'f-companyName', 'f-mobile', 'f-email', 'f-address', 'f-city', 'f-state', 'f-pincode', 'f-gst'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    const siteTypeEl = $('#f-siteType');
    if (siteTypeEl) siteTypeEl.value = '';
    $('#f-deliveryTimeline').value = '45 days from advance payment';

    $('#f-accountName').value = COMPANY.bank.accountName;
    $('#f-bankName').value = COMPANY.bank.bankName;
    $('#f-accountNumber').value = COMPANY.bank.accountNumber;
    $('#f-ifscCode').value = COMPANY.bank.ifscCode;
    $('#f-branch').value = COMPANY.bank.branch;

    $('#f-paymentType').value = 'full';
    togglePaymentFields();

    const date = new Date();
    date.setDate(date.getDate() + 30);
    const validUntilEl = $('#f-validUntil');
    if (validUntilEl) validUntilEl.value = date.toISOString().slice(0, 10);

    $('#edit-terms').value = DEFAULT_TERMS;

    wizardItems = [];
    renderItemsTable();
    populateProductPicker();

    $('#product-picker-qty').value = 1;
    $('#product-picker-rate').value = 0;

    ['cost-erection', 'cost-commissioning', 'cost-trialrun', 'cost-training-days', 'cost-training-amount', 'cost-travelstay', 'cost-transport', 'cost-loading', 'cost-other'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = 0;
    });
    const costOtherLabelEl = $('#cost-other-label');
    if (costOtherLabelEl) costOtherLabelEl.value = 'Other Charges';
    const trainingTag = $('#training-days-tag');
    if (trainingTag) trainingTag.textContent = '0 days';
    $('#f-gstPercent').value = 18;
    $('#f-discountType').value = 'percent';
    $('#f-discountValue').value = 0;

    document.querySelectorAll('.field-error').forEach(e => e.textContent = '');
    document.querySelectorAll('.invalid').forEach(e => e.classList.remove('invalid'));
    $('#share-grid')?.classList.add('hidden');
    $('#btn-generate')?.classList.remove('hidden');
    if ($('#btn-generate')) $('#btn-generate').disabled = false;
  }

  function openWizard() {
    draftQuoteNo = null;
    resetWizardForm();
    currentStep = 1;
    goToStep(1);
    openModal('modal-wizard');
  }
  $('#btn-new-quotation')?.addEventListener('click', openWizard);

  function goToStep(step) {
    currentStep = step;
    document.querySelectorAll('.step-panel').forEach(p => p.classList.toggle('active', Number(p.dataset.panel) === step));
    document.querySelectorAll('.step').forEach(s => {
      const n = Number(s.dataset.step);
      s.classList.toggle('active', n === step);
      s.classList.toggle('done', n < step);
    });
    $('#btn-prev').disabled = step === 1;
    $('#btn-next').classList.toggle('hidden', step === totalWizardSteps);
    $('#btn-generate').classList.toggle('hidden', step !== totalWizardSteps);

    if (step === 2) { populateProductPicker(); updateSiteRequirementsBox(); }
    if (step === 3) computeCosts();
    if (step === 4) computeGstSummary();
    if (step === 5) renderWizardPreview();
  }

  $('#btn-next')?.addEventListener('click', () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 5 && !validatePaymentTerms()) {
      showToast('Payment terms must total 100%.', 'error');
      return;
    }
    goToStep(Math.min(currentStep + 1, totalWizardSteps));
  });
  $('#btn-prev')?.addEventListener('click', () => goToStep(Math.max(currentStep - 1, 1)));
  document.querySelectorAll('#stepper .step').forEach(s => {
    s.addEventListener('click', () => {
      const n = Number(s.dataset.step);
      if (n < currentStep) goToStep(n);
    });
  });

  function markError(fieldId, errId, message) {
    const field = document.getElementById(fieldId);
    const err = document.getElementById(errId);
    if (message) { field?.classList.add('invalid'); if (err) err.textContent = message; return false; }
    field?.classList.remove('invalid'); if (err) err.textContent = ''; return true;
  }

  function validateStep1() {
    let ok = true;
    const name = $('#f-customerName')?.value.trim() || '';
    ok = markError('f-customerName', 'err-customerName', name ? '' : 'Customer name is required') && ok;

    const mobile = $('#f-mobile')?.value.trim() || '';
    ok = markError('f-mobile', 'err-mobile', /^[6-9]\d{9}$/.test(mobile) ? '' : 'Enter a valid 10-digit mobile number') && ok;

    const email = $('#f-email')?.value.trim() || '';
    ok = markError('f-email', 'err-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Enter a valid email address') && ok;

    const address = $('#f-address')?.value.trim() || '';
    ok = markError('f-address', 'err-address', address ? '' : 'Installation address is required') && ok;

    const state = $('#f-state')?.value.trim() || '';
    ok = markError('f-state', 'err-state', state ? '' : 'State is required') && ok;

    const pincode = $('#f-pincode')?.value.trim() || '';
    ok = markError('f-pincode', 'err-pincode', /^\d{6}$/.test(pincode) ? '' : 'Enter a valid 6-digit pincode') && ok;

    const gst = $('#f-gst')?.value.trim() || '';
    if (gst && !/^[0-9A-Z]{15}$/i.test(gst)) {
      ok = markError('f-gst', 'err-gst', 'Enter a valid 15-character GSTIN') && ok;
    } else {
      document.getElementById('err-gst').textContent = '';
    }

    const shedAvailable = $('#f-shedAvailable')?.value || '';
    ok = markError('f-shedAvailable', 'err-shedAvailable', shedAvailable ? '' : 'Please tell us if a shed/space is available') && ok;

    const powerAvailability = $('#f-powerAvailability')?.value || '';
    ok = markError('f-powerAvailability', 'err-powerAvailability', powerAvailability ? '' : 'Please select power availability at site') && ok;

    if (!ok) showToast('Please fix the highlighted fields.', 'error');
    return ok;
  }

  function validateStep2() {
    let ok = true;
    const errEl = $('#err-items');
    if (!wizardItems.length) {
      if (errEl) errEl.textContent = 'Add at least one product to this quotation.';
      ok = false;
    } else {
      const invalidRow = wizardItems.some(it => !it.name || !it.name.trim() || !(Number(it.qty) > 0) || !(Number(it.rate) >= 0));
      if (invalidRow) {
        if (errEl) errEl.textContent = 'Every product needs a name, quantity > 0, and rate >= 0.';
        ok = false;
      } else if (errEl) {
        errEl.textContent = '';
      }
    }

    const deliveryTimeline = $('#f-deliveryTimeline')?.value.trim() || '';
    if (!deliveryTimeline) {
      $('#err-deliveryTimeline').textContent = 'Delivery timeline is required.';
      ok = false;
    } else {
      $('#err-deliveryTimeline').textContent = '';
    }

    if (!ok) showToast('Please fix the highlighted fields.', 'error');
    return ok;
  }

  function getCostTotalsFromForm() {
    const erection = parseFloat($('#cost-erection')?.value) || 0;
    const commissioning = parseFloat($('#cost-commissioning')?.value) || 0;
    const trialrun = parseFloat($('#cost-trialrun')?.value) || 0;
    const trainingDays = parseFloat($('#cost-training-days')?.value) || 0;
    const trainingAmount = parseFloat($('#cost-training-amount')?.value) || 0;
    const travelstay = parseFloat($('#cost-travelstay')?.value) || 0;
    const transport = parseFloat($('#cost-transport')?.value) || 0;
    const loading = parseFloat($('#cost-loading')?.value) || 0;
    const otherLabel = $('#cost-other-label')?.value || 'Other Charges';
    const otherRaw = parseFloat($('#cost-other')?.value) || 0;

    const installation = erection + commissioning + trialrun + trainingAmount + travelstay;
    const other = loading + otherRaw;

    return {
      installation, transport, other, otherLabel,
      // raw breakdown kept for reference / future editing
      erection, commissioning, trialrun, trainingDays, trainingAmount, travelstay, loading, otherRaw
    };
  }

  function computeCosts() {
    const el = $('#cost-items');
    if (el) el.textContent = formatINR(itemsSubtotal(wizardItems));

    const costs = getCostTotalsFromForm();
    const installTotalEl = $('#cost-installation-total');
    if (installTotalEl) installTotalEl.textContent = formatINR(costs.installation);

    const trainingTag = $('#training-days-tag');
    if (trainingTag) trainingTag.textContent = `${costs.trainingDays || 0} day${costs.trainingDays === 1 ? '' : 's'}`;
  }
  ['cost-erection', 'cost-commissioning', 'cost-trialrun', 'cost-training-days', 'cost-training-amount', 'cost-travelstay', 'cost-transport', 'cost-loading', 'cost-other'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => {
      if (currentStep === 3) computeCosts();
      if (currentStep === 4) computeGstSummary();
    });
  });

  function computeGstSummary() {
    const costs = getCostTotalsFromForm();
    const itTotal = itemsSubtotal(wizardItems);
    const gstPercent = parseFloat($('#f-gstPercent')?.value) || 0;
    const discountType = $('#f-discountType')?.value || 'percent';
    const discountValue = parseFloat($('#f-discountValue')?.value) || 0;
    const totals = computeTotals(itTotal, costs, gstPercent, discountType, discountValue);

    const el = $('#summary-gst');
    if (el) {
      el.innerHTML = `
        <div class="row"><span>Items Subtotal</span><b>${formatINR(itTotal)}</b></div>
        <div class="row"><span>Additional Charges</span><b>${formatINR(costs.installation + costs.transport + costs.other)}</b></div>
        <div class="row"><span>Discount</span><b>- ${formatINR(totals.discountAmount)}</b></div>
        <div class="row"><span>SGST (${(gstPercent / 2).toFixed(1)}%)</span><b>${formatINR(totals.sgst)}</b></div>
        <div class="row"><span>CGST (${(gstPercent / 2).toFixed(1)}%)</span><b>${formatINR(totals.cgst)}</b></div>
        <div class="row total"><span>Grand Total</span><b>${formatINR(totals.total)}</b></div>
      `;
    }
  }
  ['f-gstPercent', 'f-discountType', 'f-discountValue'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', computeGstSummary);
  });

  function togglePaymentFields() {
    const paymentType = $('#f-paymentType')?.value || 'full';
    const fields = ['payment-advance-field', 'payment-material-field', 'payment-installation-field', 'payment-balance-field'];
    if (paymentType === 'full') {
      fields.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
      $('#f-payment-advance').value = 100;
      $('#f-payment-material').value = 0;
      $('#f-payment-installation').value = 0;
      $('#f-payment-balance').value = 0;
    } else {
      fields.forEach(id => { const el = document.getElementById(id); if (el) el.style.display = ''; });
    }
    validatePaymentTerms();
  }

  function validatePaymentTerms() {
    const paymentType = $('#f-paymentType')?.value || 'full';
    if (paymentType === 'full') {
      $('#payment-total').textContent = '100';
      $('#err-payment').textContent = '';
      return true;
    }
    const advance = parseFloat($('#f-payment-advance')?.value) || 0;
    const material = parseFloat($('#f-payment-material')?.value) || 0;
    const installation = parseFloat($('#f-payment-installation')?.value) || 0;
    const balance = parseFloat($('#f-payment-balance')?.value) || 0;
    const total = advance + material + installation + balance;
    $('#payment-total').textContent = total;
    const errEl = $('#err-payment');
    if (Math.abs(total - 100) > 0.01) {
      if (errEl) errEl.textContent = `Total must equal 100% (current: ${total}%)`;
      return false;
    } else {
      if (errEl) errEl.textContent = '';
      return true;
    }
  }
  $('#f-paymentType')?.addEventListener('change', togglePaymentFields);
  ['f-payment-advance', 'f-payment-material', 'f-payment-installation', 'f-payment-balance'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', validatePaymentTerms);
  });

  function collectWizardRecord(quoteNo) {
    const costs = getCostTotalsFromForm();
    const itTotal = itemsSubtotal(wizardItems);
    const gstPercent = parseFloat($('#f-gstPercent')?.value) || 0;
    const discountType = $('#f-discountType')?.value || 'percent';
    const discountValue = parseFloat($('#f-discountValue')?.value) || 0;
    const totals = computeTotals(itTotal, costs, gstPercent, discountType, discountValue);

    const bank = {
      accountName: $('#f-accountName')?.value.trim() || COMPANY.bank.accountName,
      bankName: $('#f-bankName')?.value.trim() || COMPANY.bank.bankName,
      accountNumber: $('#f-accountNumber')?.value.trim() || COMPANY.bank.accountNumber,
      ifscCode: $('#f-ifscCode')?.value.trim() || COMPANY.bank.ifscCode,
      branch: $('#f-branch')?.value.trim() || COMPANY.bank.branch
    };

    const paymentType = $('#f-paymentType')?.value || 'full';
    let paymentTerms = { advance: 0, material: 0, installation: 0, balance: 0 };
    if (paymentType === 'full') {
      paymentTerms.advance = 100;
    } else {
      paymentTerms.advance = parseFloat($('#f-payment-advance')?.value) || 0;
      paymentTerms.material = parseFloat($('#f-payment-material')?.value) || 0;
      paymentTerms.installation = parseFloat($('#f-payment-installation')?.value) || 0;
      paymentTerms.balance = parseFloat($('#f-payment-balance')?.value) || 0;
    }

    return {
      quoteNo: quoteNo,
      date: new Date().toISOString().slice(0, 10),
      status: 'Pending',
      customer: {
        name: $('#f-customerName')?.value.trim() || '',
        company: $('#f-companyName')?.value.trim() || '',
        mobile: $('#f-mobile')?.value.trim() || '',
        email: $('#f-email')?.value.trim() || '',
        address: $('#f-address')?.value.trim() || '',
        city: $('#f-city')?.value.trim() || '',
        state: $('#f-state')?.value.trim() || '',
        pincode: $('#f-pincode')?.value.trim() || '',
        gst: $('#f-gst')?.value.trim() || ''
      },
      siteType: $('#f-siteType')?.value || '',
      shedAvailable: $('#f-shedAvailable')?.value || '',
      shedDimensions: $('#f-shedDimensions')?.value.trim() || '',
      powerAvailability: $('#f-powerAvailability')?.value || '',
      deliveryTimeline: $('#f-deliveryTimeline')?.value.trim() || '',
      items: wizardItems.map(it => ({ ...it })),
      itemsTotal: itTotal,
      costs: costs,
      gstPercent: gstPercent,
      discountType: discountType,
      discountValue: discountValue,
      ...totals,
      amount: Math.round(totals.total),
      bank: bank,
      paymentTerms: paymentTerms,
      paymentType: paymentType,
      terms: $('#edit-terms')?.value.trim() || DEFAULT_TERMS,
      validUntil: (() => {
        const days = parseInt($('#f-validityDays')?.value, 10) || 30;
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString().slice(0, 10);
      })()
    };
  }

  function renderWizardPreview() {
    draftQuoteNo = draftQuoteNo || nextQuoteNo();
    const record = collectWizardRecord(draftQuoteNo);
    const preview = $('#invoice-preview');
    if (preview) preview.innerHTML = buildInvoiceMarkup(record);
  }

  $('#btn-generate')?.addEventListener('click', () => {
    const btn = $('#btn-generate');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...'; }

    const record = collectWizardRecord(draftQuoteNo || nextQuoteNo());
    quotations.unshift(record);
    draftQuoteNo = null;

    const preview = $('#invoice-preview');
    if (preview) preview.innerHTML = buildInvoiceMarkup(record);
    $('#share-grid')?.classList.remove('hidden');
    if (btn) btn.classList.add('hidden');

    renderTable();

    downloadInvoicePDF('invoice-preview', `${record.quoteNo}.pdf`).then(() => {
      showToast(`Quotation ${record.quoteNo} generated & PDF downloaded`, 'success');
    }).catch(() => {
      showToast(`Quotation ${record.quoteNo} generated successfully`, 'success');
    });

    $('#btn-download-pdf').onclick = () => downloadInvoicePDF('invoice-preview', `${record.quoteNo}.pdf`);
    $('#btn-share-email').onclick = () => {
      const subject = encodeURIComponent(`Quotation ${record.quoteNo}`);
      const body = encodeURIComponent(`Hi ${record.customer.name || ''},\n\nPlease find your quotation ${record.quoteNo} (Total: ${formatINR(record.total)}). We have downloaded the PDF — please attach it to this email before sending.\n\nThanks,\n${COMPANY.name}`);
      window.location.href = `mailto:${record.customer.email || ''}?subject=${subject}&body=${body}`;
    };
    $('#btn-share-whatsapp').onclick = () => {
      const text = encodeURIComponent(`Hi ${record.customer.name || ''}, here is your quotation ${record.quoteNo} — Total: ${formatINR(record.total)}. (PDF downloaded separately)`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    setTimeout(() => closeModal('modal-wizard'), 1200);
  });

  // ============================================================
  // EXPORTS
  // ============================================================
  function exportToCSV() {
    const filtered = getFiltered();
const headers = ['Quotation No.', 'Customer', 'Type', 'Company', 'Mobile', 'Email', 'Amount', 'Status', 'Date'];
const rows = filtered.map(q => [
  q.quoteNo, 
  q.customer.name || '', 
  q.customer.customerType || '',  
  q.customer.company || '', 
  q.customer.mobile || '', 
  q.customer.email || '', 
  q.amount || 0, 
  q.status || '', 
  q.date || ''
]);    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `quotations_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('CSV exported successfully', 'success');
  }

//   function exportToExcel() {
//     const filtered = getFiltered();
//     const headers = ['Quotation No.', 'Customer', 'Company', 'Mobile', 'Email', 'Amount', 'Status', 'Date'];
//     const rows = filtered.map(q => [q.quoteNo, q.customer.name || '', q.customer.company || '', q.customer.mobile || '', q.customer.email || '', q.amount || 0, q.status || '', q.date || '']);
//     const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const link = document.createElement('a');
//     link.href = URL.createObjectURL(blob);
//     link.download = `quotations_${new Date().toISOString().slice(0, 10)}.xls`;
//     link.click();
//     showToast('Excel exported successfully', 'success');
//   }

//   function exportToPDF() {
//     const table = document.querySelector('.data-table');
//     if (!table || typeof html2pdf === 'undefined') {
//       showToast('PDF library failed to load.', 'error');
//       return;
//     }
//     const printArea = document.createElement('div');
//     printArea.style.padding = '20px';
//     printArea.style.background = '#fff';
//     printArea.innerHTML = `
//       <h2 style="font-family: Poppins, sans-serif; margin-bottom: 20px;">Quotation List</h2>
//       <p style="font-family: Poppins, sans-serif; color: #666; margin-bottom: 15px;">Generated: ${new Date().toLocaleString()}</p>
//       ${table.outerHTML}
//     `;
//     document.body.appendChild(printArea);
//     html2pdf().set({
//       margin: 10,
//       filename: `quotations_${new Date().toISOString().slice(0, 10)}.pdf`,
//       image: { type: 'jpeg', quality: 0.98 },
//       html2canvas: { scale: 2, backgroundColor: '#ffffff' },
//       jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
//     }).from(printArea).save().then(() => {
//       document.body.removeChild(printArea);
//       showToast('PDF exported successfully', 'success');
//     }).catch(() => {
//       document.body.removeChild(printArea);
//       showToast('PDF export failed', 'error');
//     });
//   }

//   function printQuotations() { window.print(); }

//   $('#btn-export-excel')?.addEventListener('click', exportToExcel);
//   $('#btn-export-csv')?.addEventListener('click', exportToCSV);
//   $('#btn-export-pdf')?.addEventListener('click', exportToPDF);
//   $('#btn-print')?.addEventListener('click', printQuotations);

//   // ============================================================
//   // FILTER EVENTS
//   // ============================================================
//   ['search-input', 'filter-status', 'filter-sitetype'].forEach(id => {
//     document.getElementById(id)?.addEventListener('input', () => { currentPage = 1; renderTable(); });
//   });
//   $('#rows-per-page')?.addEventListener('change', (e) => {
//     rowsPerPage = Number(e.target.value);
//     currentPage = 1;
//     renderTable();
//   });
//   document.querySelectorAll('.data-table th[data-sort]').forEach(th => {
//     th.addEventListener('click', () => {
//       const key = th.dataset.sort;
//       sortDir = (sortKey === key) ? -sortDir : 1;
//       sortKey = key;
//       renderTable();
//     });
//   });
//   $('#btn-reset-filters')?.addEventListener('click', () => {
//     if ($('#search-input')) $('#search-input').value = '';
//     if ($('#filter-status')) $('#filter-status').value = '';
//     if ($('#filter-sitetype')) $('#filter-sitetype').value = '';
//     currentPage = 1;
//     renderTable();
//   });

  // ============================================================
  // INIT
  // ============================================================
  function init() {
    if (quotations.length === 0) {
      quotations = generateSampleQuotations();
    }
    populateProductPicker();
    togglePaymentFields();
    renderTable();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();