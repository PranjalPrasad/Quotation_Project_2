/* ============================================================
   Quotation Management — Complete Module
   VKM Brick & Block Machinery (Vaishnokripa Mercantile)

   CHANGELOG (this revision):
   - Fixed Hindi (Devanagari) terms rendering for PDF export:
     more robust font-loading/measurement, correct CSS targeting
     of the rasterized <canvas> (not just <img>), safe fallbacks
     if the webfont fails to load.
   - Added Plant Overview fields (Model, Production Capacity,
     Bricks Size, Pallet Size, Required Shed Area, Total Land,
     Connected Power, Labour Requirement) to the wizard + PDF,
     matching the ENDEAVOUR-i reference layout.
   - Added per-quotation History (audit trail: created, edited,
     approved, rejected) + a global History Log, both persisted.
   - Added an Approval section (Approve / Reject with notes) in
     the View modal, wired to status + history.
   - All changes persist to localStorage immediately (previously
     edits were lost on refresh).
   - NEW: "Generate Report" action button — shows ONLY on
     quotations whose status is "Accepted". Opens a GST-style
     report (format inspired by the GSTR2 report reference: bordered
     tables, company header block, metadata rows, highlighted totals
     row) and lets the admin download it as a PDF.
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

  // ============================================================
  // API CONFIG
  // ============================================================
  const API_BASE = 'http://localhost:8092/api';

  // ============================================================
  // PRODUCT CATALOG — synced live from Product Management
  // ============================================================
  const PRODUCT_CATALOG_STORAGE_KEY = 'vkmProductCatalog';

  const FALLBACK_PRODUCTS = [
    { id: 'fb1',  name: 'FLYASH BRICKS MACHINE 10 CAVITY', category: 'Brick Machine', brand: 'VKM', spec: '180T Pressure, Auto Feed, PLC', unit: 'Nos',  price: 1900000, status: 'Active', hsnCode: '84743100', gstRate: 18, sectionCode: 'A', imageUrl: '' },
    { id: 'fb2',  name: 'PAN MIXER 500 KG',                category: 'Component', brand: 'VKM', spec: '1-Stage Gear Box, Replaceable Rollers', unit: 'Nos', price: 500000, status: 'Active', hsnCode: '84743100', gstRate: 18, sectionCode: 'B', imageUrl: '' },
    { id: 'fb3',  name: 'CONVEYOR BELT 22 Feet',            category: 'Component', brand: 'VKM', spec: 'JK Make, 450mm width, 2HP Motor', unit: 'Nos', price: 350000, status: 'Active', hsnCode: '84283900', gstRate: 18, sectionCode: 'B', imageUrl: '' },
    { id: 'fb4',  name: 'POWER PACK SYSTEM',                category: 'Component', brand: 'VKM', spec: '450 Ltr, 10 HP, Yuken/Polyhydron pump', unit: 'Nos', price: 450000, status: 'Active', hsnCode: '84129000', gstRate: 18, sectionCode: 'A', powerHP: 10, imageUrl: '' },
    { id: 'fb5',  name: 'PLC PANEL FULLY AI BASED',         category: 'Component', brand: 'VKM', spec: 'Hydraulic speed & vibrator control', unit: 'Nos', price: 400000, status: 'Active', hsnCode: '85371000', gstRate: 18, sectionCode: 'A', imageUrl: '' },
    { id: 'fb6',  name: 'BRICK TROLLY',                     category: 'Accessory', brand: 'VKM', spec: '', unit: 'Nos', price: 7500, status: 'Active', hsnCode: '', gstRate: 18, sectionCode: 'D', imageUrl: '' },
    { id: 'fb7',  name: 'MATERIAL TROLLY',                  category: 'Accessory', brand: 'VKM', spec: '', unit: 'Nos', price: 9000, status: 'Active', hsnCode: '', gstRate: 18, sectionCode: 'D', imageUrl: '' },
    { id: 'fb8',  name: 'VIBRATOR TABLE',                   category: 'Accessory', brand: 'VKM', spec: '', unit: 'Nos', price: 90000, status: 'Active', hsnCode: '', gstRate: 18, sectionCode: 'D', imageUrl: '' },
    { id: 'fb9',  name: 'MIXER MACHINE WITH MOTOR',         category: 'Brick Machine', brand: 'VKM', spec: '', unit: 'Nos', price: 150000, status: 'Active', hsnCode: '', gstRate: 18, sectionCode: 'B', imageUrl: '' },
    { id: 'fb10', name: 'COLOUR MIXER',                     category: 'Brick Machine', brand: 'VKM', spec: '', unit: 'Nos', price: 90000, status: 'Active', hsnCode: '', gstRate: 18, sectionCode: 'B', imageUrl: '' },
    { id: 'fb11', name: 'MOULD ZIG ZAG WITH DUMBLE',        category: 'Mould', brand: 'VKM', spec: '', unit: 'Piece', price: 55, status: 'Active', hsnCode: '', gstRate: 18, sectionCode: 'E', imageUrl: '' },
    { id: 'fb12', name: 'CHEMICAL DRUM',                    category: 'Accessory', brand: 'VKM', spec: '', unit: 'Drum', price: 12000, status: 'Active', hsnCode: '', gstRate: 18, sectionCode: 'D', imageUrl: '' },
    { id: 'fb13', name: 'COLOUR BAG RED & YELLOW',          category: 'Accessory', brand: 'VKM', spec: '', unit: 'Bag', price: 7500, status: 'Active', hsnCode: '', gstRate: 18, sectionCode: 'D', imageUrl: '' },
    { id: 'fb14', name: 'PLY BOARD 8X4',                    category: 'Accessory', brand: 'VKM', spec: '', unit: 'Sheet', price: 2500, status: 'Active', hsnCode: '', gstRate: 18, sectionCode: 'D', imageUrl: '' },

    { id: 'ms1', name: 'NANO MACHINE', category: 'Brick Machine', brand: 'VKM', spec: '1200-1400 blocks/8hr, 25T pressure, 100L oil tank, 10HP (5+5), incl. 300kg Pan Mixer', unit: 'Nos', price: 515000, status: 'Active', production: '1200-1400 blocks / 8 hr', pressure: '25 Ton', power: '10 HP (5+5)', powerHP: 10, oilTank: '100 Ltr', shedSize: '15x20 ft', labor: 4, hsnCode: '84743100', gstRate: 18, sectionCode: 'A', imageUrl: '' },
    { id: 'ms2', name: 'DOUBLE STATION NANO MACHINE', category: 'Brick Machine', brand: 'VKM', spec: '2400-2800 blocks/8hr, 25T pressure, 170L oil tank, 17.5HP (10+7.5), incl. 500kg Pan Mixer', unit: 'Nos', price: 715000, status: 'Active', production: '2400-2800 blocks / 8 hr', pressure: '25 Ton', power: '17.5 HP (10+7.5)', powerHP: 17.5, oilTank: '170 Ltr', shedSize: '15x20 ft', labor: 6, hsnCode: '84743100', gstRate: 18, sectionCode: 'A', imageUrl: '' },
    { id: 'ms3', name: 'BUDGET MACHINE (NANO RANGE)', category: 'Brick Machine', brand: 'VKM', spec: '2500-2800 blocks/8hr, 40T pressure, 170L oil tank, 10HP (5+5), incl. 500kg Pan Mixer', unit: 'Nos', price: 800000, status: 'Active', production: '2500-2800 blocks / 8 hr', pressure: '40 Ton', power: '10 HP (5+5)', powerHP: 10, oilTank: '170 Ltr', shedSize: '12x15 ft', labor: 5, hsnCode: '84743100', gstRate: 18, sectionCode: 'A', imageUrl: '' },
    { id: 'ms4', name: 'METAL TO METAL MACHINE', category: 'Brick Machine', brand: 'VKM', spec: '3500-3800 blocks/8hr, 60T pressure, 300L oil tank, 17HP (7.5+7.5+2), incl. 500kg Pan Mixer + 20ft Conveyor', unit: 'Nos', price: 1325000, status: 'Active', production: '3500-3800 blocks / 8 hr', pressure: '60 Ton', power: '17 HP (7.5+7.5+2)', powerHP: 17, oilTank: '300 Ltr', shedSize: '30x20 ft', labor: 6, hsnCode: '84743100', gstRate: 18, sectionCode: 'A', imageUrl: '' },

    { id: 'fbm1', name: 'FLYASH BRICK BUDGET MACHINE', category: 'Brick Machine', brand: 'VKM', spec: '4500-5000 bricks/8hr, 40T pressure, 22 sec/stock cycle, 160L oil tank, 10HP, Full Set Up incl.', unit: 'Nos', price: 625000, status: 'Active', production: '4500-5000 bricks / 8 hr', pressure: '40 Ton', power: '10 HP', powerHP: 10, oilTank: '160 Ltr', shedSize: '20x15 ft', labor: 5, vibration: 'No', hsnCode: '84743100', gstRate: 18, sectionCode: 'A', imageUrl: '' },
    { id: 'fbm2', name: 'ROTARY TYPE MACHINE', category: 'Brick Machine', brand: 'VKM', spec: '14000-15000 bricks/8hr, 40T pressure, 200L oil tank, 20.5HP, 30 KVA genset, incl. 500kg Pan Mixer', unit: 'Nos', price: 1250000, status: 'Active', production: '14000-15000 bricks / 8 hr', pressure: '40 Ton', power: '20.5 HP', powerHP: 20.5, oilTank: '200 Ltr', shedSize: '15x35 ft', labor: 7, vibration: 'No', hsnCode: '84743100', gstRate: 18, sectionCode: 'A', imageUrl: '' },
    { id: 'fbm3', name: 'VK001 — 4 BRICK METAL TO METAL', category: 'Brick Machine', brand: 'VKM', spec: '8000+ bricks/8hr, 120T pressure, 300L oil tank, 17HP, 25 KVA genset, incl. 500kg Pan Mixer + 20ft Conveyor, Pallet 14x24', unit: 'Nos', price: 1200000, status: 'Active', production: '8000+ bricks / 8 hr', pressure: '120 Ton', power: '17 HP', powerHP: 17, oilTank: '300 Ltr', shedSize: '40x60 ft (Height 15 ft)', labor: 7, vibration: 'No', hsnCode: '84743100', gstRate: 18, sectionCode: 'A', imageUrl: '' },
    { id: 'fbm4', name: 'VK002 — 6 BRICK METAL TO METAL', category: 'Brick Machine', brand: 'VKM', spec: '12000+ bricks/8hr, 140T pressure, 400L oil tank, 21HP, 30 KVA genset, incl. 700kg Pan Mixer + 20ft Conveyor, Pallet 14x32', unit: 'Nos', price: 1400000, status: 'Active', production: '12000+ bricks / 8 hr', pressure: '140 Ton', power: '21 HP', powerHP: 21, oilTank: '400 Ltr', shedSize: '40x60 ft (Height 15 ft)', labor: 7, vibration: 'No', hsnCode: '84743100', gstRate: 18, sectionCode: 'A', imageUrl: '' },
    { id: 'fbm5', name: 'VK003 — 8 BRICK FULLY AUTOMATIC', category: 'Brick Machine', brand: 'VKM', spec: '12000+ bricks/8hr, 150T pressure, 400L oil tank, 26.5HP, 45 KVA genset, incl. 500kg (2 Pcs) Pan Mixer + 20ft Conveyor, Pallet 24x24, Vibration Yes', unit: 'Nos', price: 1600000, status: 'Active', production: '12000+ bricks / 8 hr', pressure: '150 Ton', power: '26.5 HP', powerHP: 26.5, oilTank: '400 Ltr', shedSize: '40x60 ft (Height 15 ft)', labor: 7, vibration: 'Yes', hsnCode: '84743100', gstRate: 18, sectionCode: 'A', imageUrl: '' },
    { id: 'fbm6', name: 'VK004 — 10 BRICK FULLY AUTOMATIC', category: 'Brick Machine', brand: 'VKM', spec: '14000+ bricks/8hr, 170T pressure, 400L oil tank, 27.5HP, 45 KVA genset, incl. 700kg (2 Pcs) Pan Mixer + 28ft Conveyor, Pallet 24x28, Vibration Yes', unit: 'Nos', price: 1800000, status: 'Active', production: '14000+ bricks / 8 hr', pressure: '170 Ton', power: '27.5 HP', powerHP: 27.5, oilTank: '400 Ltr', shedSize: '40x60 ft (Height 15 ft)', labor: 7, vibration: 'Yes', hsnCode: '84743100', gstRate: 18, sectionCode: 'A', imageUrl: '' },
    { id: 'fbm7', name: 'VK005 — 12 BRICK FULLY AUTOMATIC', category: 'Brick Machine', brand: 'VKM', spec: '16000+ bricks/8hr, 200T pressure, 450L oil tank, 30HP, 62 KVA genset, incl. 700kg (2 Pcs) Pan Mixer + 28ft Conveyor, Pallet 32x24, Vibration Yes', unit: 'Nos', price: 2000000, status: 'Active', production: '16000+ bricks / 8 hr', pressure: '200 Ton', power: '30 HP', powerHP: 30, oilTank: '450 Ltr', shedSize: '40x60 ft (Height 15 ft)', labor: 7, vibration: 'Yes', hsnCode: '84743100', gstRate: 18, sectionCode: 'A', imageUrl: '' }
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

  // Fetch products from backend and update localStorage
  async function fetchProductsFromBackend() {
    try {
      const response = await fetch(`${API_BASE}/products/get-all-products`);
      const json = await response.json();
      if (response.ok && json && json.success) {
        const products = json.data.map(dto => ({
          id: dto.id,
          name: dto.name,
          category: dto.category,
          brand: dto.brand,
          spec: dto.description || '',
          unit: 'Nos',
          price: dto.finalPrice || 0,
          status: dto.status || 'Active',
          hsnCode: dto.hsn || '',
          gstRate: dto.gst || 18,
          sectionCode: '',
          imageUrl: dto.thumbnail || '',
          powerHP: dto.powerConsumptionKw || 0,
          production: '',
          shedSize: '',
          labor: 0,
          inCustomerScope: false
        }));

        // Store in localStorage
        try {
          localStorage.setItem(PRODUCT_CATALOG_STORAGE_KEY, JSON.stringify(products));
        } catch (_) {}

        // Update the catalog dropdown if it exists
        if (window.__quotationProductCatalog) {
          window.__quotationProductCatalog = products;
          populateProductPicker();
        }

        return products;
      }
    } catch (err) {
      console.error('Failed to fetch products from backend:', err);
    }
    return null;
  }

  function findCatalogProduct(catalog, productId) {
    return catalog.find(c => String(c.id) === String(productId));
  }


  // ============================================================
  // SYNC CUSTOM ITEM -> PRODUCT MANAGEMENT
  // Jab quotation mein ek naya "Custom Item" add hota hai (jo
  // catalog mein pehle se maujood nahi tha), usko automatically
  // Product Management (backend /api/create-product) mein bhi
  // ek product ke roop mein create kar dete hain.
  // ============================================================
  async function syncCustomItemToProductCatalog(item) {
    if (!item || item._syncing || item._synced) return;
    const name = (item.name || '').trim();
    if (!name) return; // naam khaali hai toh product mat banao

    item._syncing = true;

    const sku = 'CUSTOM-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(Math.random() * 1000);

    const productPayload = {
      name: name,
      sku: sku,
      brand: 'VKM',
      type: 'Custom',
      category: item.category || 'Custom',
      subCategory: '',
      hsn: item.hsnCode || '',
      gst: item.gstRate || 18,
      mrp: Number(item.rate) || 0,
      discountType: 'flat',
      discountValue: 0,
      calculatedPrice: Number(item.rate) || 0,
      finalPrice: Number(item.rate) || 0,
      stock: 0,
      threshold: 0,
      reorderQuantity: 0,
      leadTimeDays: 0,
      status: 'Active',
      powerConsumptionKw: Number(item.powerHP) || 0,
      weightKg: 0,
      description: 'Auto-added from Quotation Management (Custom Item)'
    };

    try {
      const formData = new FormData();
      formData.append('product', JSON.stringify(productPayload));

      const response = await fetch(`${API_BASE}/create-product`, {
        method: 'POST',
        body: formData
      });
      const json = await response.json();

      if (response.ok && json && json.success && json.data) {
        item.productId = String(json.data.id);
        item._synced = true;
        showToast(`"${name}" Product Management mein bhi add ho gaya`, 'success');
        // local catalog cache refresh kar do taaki dropdown mein bhi dikhe
        fetchProductsFromBackend();
      } else {
        console.error('Failed to sync custom item to product catalog:', json);
        showToast(`"${name}" ko Product Management mein save nahi kar paya`, 'error');
      }
    } catch (err) {
      console.error('Error syncing custom item to product catalog:', err);
      showToast('Product Management se connect nahi ho paya', 'error');
    } finally {
      item._syncing = false;
    }
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

  function formatNumberPlain(n) {
    return Math.round(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDateTime(iso) {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    } catch (_) { return '—'; }
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

  // Normalizes a state name for comparison (case/whitespace insensitive)
  function normState(s) { return String(s || '').trim().toLowerCase(); }

  function computeTotals(itemsTotal, costs, gstPercent, discountType, discountValue, customerState) {
    const itemsTotalN = Number(itemsTotal) || 0;
    const transport = Number(costs.transport) || 0;
    const loading = Number(costs.loading) || 0;
    const other = Number(costs.other) || 0;
    const gst = Number(gstPercent) || 0;
    const discVal = Number(discountValue) || 0;

    const subtotal = itemsTotalN + transport + loading + other;
    const discountAmount = discountType === 'percent'
      ? subtotal * (Math.min(Math.max(discVal, 0), 100) / 100)
      : Math.min(Math.max(discVal, 0), subtotal);
    const taxable = Math.max(0, subtotal - discountAmount);

    const isInterState = normState(customerState) !== normState(COMPANY.state) && !!normState(customerState);

    let cgstPercent = 0, sgstPercent = 0, igstPercent = 0;
    let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;

    if (isInterState) {
      igstPercent = gst;
      igstAmount = taxable * (gst / 100);
    } else {
      cgstPercent = gst / 2;
      sgstPercent = gst / 2;
      cgstAmount = taxable * (cgstPercent / 100);
      sgstAmount = taxable * (sgstPercent / 100);
    }

    const totalTax = cgstAmount + sgstAmount + igstAmount;
    const total = taxable + totalTax;

    return {
      subtotal, discountAmount, taxable,
      isInterState,
      sgst: sgstAmount, cgst: cgstAmount,
      gstBreakup: { cgstPercent, cgstAmount, sgstPercent, sgstAmount, igstPercent, igstAmount },
      total
    };
  }

  // ============================================================
  // TERMS & CONDITIONS
  // ============================================================
  function buildTermsText(items) {
    const cfg = window.TERMS_CONFIG || { version: 'DEFAULT_TC_V1', base: { english: [], hindi: [] }, categoryExtras: {} };
    const catalog = getProductCatalog();

    const categories = [...new Set((items || []).map(it => {
      if (it.category) return it.category;
      const p = findCatalogProduct(catalog, it.productId);
      return p ? p.category : null;
    }).filter(Boolean))];

    let english = [...(cfg.base?.english || [])];
    let hindi = [...(cfg.base?.hindi || [])];

    categories.forEach(cat => {
      const extra = cfg.categoryExtras?.[cat];
      if (extra) {
        if (extra.english) english = english.concat(extra.english);
        if (extra.hindi) hindi = hindi.concat(extra.hindi);
      }
    });

    return { version: cfg.version || 'DEFAULT_TC_V1', english, hindi, categoriesApplied: categories };
  }

  // ============================================================
  // QUOTATION DATA MODEL
  // ============================================================
  const QUOTE_COUNTER_STORAGE_KEY = 'quoteCounter';
  const QUOTATIONS_STORAGE_KEY = 'quotations';
  const GLOBAL_HISTORY_LOG_KEY = 'quotationHistoryLog';

  function nextQuoteNo() {
    let counter = parseInt(localStorage.getItem(QUOTE_COUNTER_STORAGE_KEY), 10);
    if (!Number.isFinite(counter)) counter = 1000;
    counter += 1;
    try { localStorage.setItem(QUOTE_COUNTER_STORAGE_KEY, String(counter)); } catch (_) { /* ignore quota errors */ }
    return `SQ-${counter}`;
  }

  let quotations = [];
  let wizardItems = [];
  let itemIdCounter = 1;
  function newItemId() { return 'it' + (itemIdCounter++); }

  function itemsSubtotal(items) {
    return items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
  }

  // ------------------------------------------------------------
  // Persistence — every mutation to `quotations` should end with
  // a call to persistQuotations() so nothing is lost on refresh.
  // ------------------------------------------------------------
  function persistQuotations() {
    try { localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(quotations)); } catch (_) { /* storage full/unavailable */ }
  }

  // ------------------------------------------------------------
  // History — per-quotation audit trail + a flat global log so
  // "Quotation History" can be viewed both per-record and overall.
  // ------------------------------------------------------------
  function addHistoryEntry(q, action, details) {
    if (!q) return;
    if (!Array.isArray(q.history)) q.history = [];
    const entry = {
      ts: new Date().toISOString(),
      action: action,
      by: 'Admin',
      details: details || ''
    };
    q.history.unshift(entry);

    try {
      const raw = localStorage.getItem(GLOBAL_HISTORY_LOG_KEY);
      const log = raw ? JSON.parse(raw) : [];
      log.unshift({ quoteNo: q.quoteNo, customer: q.customer?.name || '', ...entry });
      // keep the flat log from growing forever
      const trimmed = log.slice(0, 300);
      localStorage.setItem(GLOBAL_HISTORY_LOG_KEY, JSON.stringify(trimmed));
    } catch (_) { /* ignore storage errors for the log */ }
  }

  function getGlobalHistoryLog() {
    try {
      const raw = localStorage.getItem(GLOBAL_HISTORY_LOG_KEY);
      const log = raw ? JSON.parse(raw) : [];
      return Array.isArray(log) ? log : [];
    } catch (_) { return []; }
  }

  function makeQuotation(overrides) {
    const base = {
      quoteNo: nextQuoteNo(),
      date: new Date().toISOString().slice(0, 10),
      status: 'Pending',
      customer: { name: '', mobilePrimary: '', mobileSecondary: '', email: '', address: '', city: '', state: '', pincode: '', gst: '' },
      deliveryTimeline: '45 days from advance payment',
      items: [],
      costs: { transport: 0, loading: 0, otherLabel: 'Other Charges', other: 0 },
      gstPercent: 18,
      discountType: 'percent',
      discountValue: 0,
      bank: { ...COMPANY.bank },
      paymentTerms: { advance: 50, material: 25, installation: 15, balance: 10 },
      paymentType: 'full',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      // Plant Overview — optional summary block shown at the top of the PDF,
      // mirrors the reference ENDEAVOUR-i layout (Model / Production
      // Capacity / Bricks Size / Pallet Size / Shed Area / Land / Power / Labour)
      plantOverview: {
        model: '', productionCapacity: '', bricksSize: '', palletSize: '',
        requiredShedArea: '', totalLand: '', connectedPower: '', labourRequirement: ''
      },
      // Approval workflow
      approval: { approvedBy: '', approvalDate: '', notes: '' },
      // Audit trail
      history: []
    };
    const merged = { ...base, ...(overrides || {}) };
    if (overrides?.customer) merged.customer = { ...base.customer, ...overrides.customer };
    if (overrides?.costs) merged.costs = { ...base.costs, ...overrides.costs };
    if (overrides?.items) merged.items = overrides.items;
    if (overrides?.bank) merged.bank = { ...base.bank, ...overrides.bank };
    if (overrides?.paymentTerms) merged.paymentTerms = { ...base.paymentTerms, ...overrides.paymentTerms };
    if (overrides?.plantOverview) merged.plantOverview = { ...base.plantOverview, ...overrides.plantOverview };
    if (overrides?.approval) merged.approval = { ...base.approval, ...overrides.approval };
    merged.history = Array.isArray(overrides?.history) ? overrides.history : [];

    const itTotal = itemsSubtotal(merged.items);
    const totals = computeTotals(itTotal, merged.costs, merged.gstPercent, merged.discountType, merged.discountValue, merged.customer.state);
    Object.assign(merged, totals);
    merged.itemsTotal = itTotal;
    merged.amount = Math.round(totals.total);
    merged.termsAndConditions = merged.termsAndConditions || buildTermsText(merged.items);

    return merged;
  }

  // ============================================================
  // BACKEND API INTEGRATION
  // ============================================================
  async function saveQuotationToBackend(quotationData) {
    try {
      const requestDto = {
        quoteNo: quotationData.quoteNo,
        date: quotationData.date,
        status: quotationData.status,
        customer: {
          name: quotationData.customer.name || '',
          mobilePrimary: quotationData.customer.mobilePrimary || '',
          mobileSecondary: quotationData.customer.mobileSecondary || '',
          email: quotationData.customer.email || '',
          address: quotationData.customer.address || '',
          city: quotationData.customer.city || '',
          state: quotationData.customer.state || '',
          pincode: quotationData.customer.pincode || '',
          gst: quotationData.customer.gst || ''
        },
        items: quotationData.items.map(item => ({
          productId: item.productId || null,
          name: item.name || '',
          category: item.category || '',
          qty: Number(item.qty) || 0,
          rate: Number(item.rate) || 0,
          amount: (Number(item.qty) || 0) * (Number(item.rate) || 0),
          hsnCode: item.hsnCode || '',
          gstRate: Number(item.gstRate) || 18,
          powerHP: Number(item.powerHP) || 0,
          powerKW: Number(item.powerKW) || 0,
          inCustomerScope: item.inCustomerScope || false,
          shedSize: item.shedSize || '',
          labor: Number(item.labor) || 0,
          production: item.production || '',
          imageUrl: item.imageUrl || ''
        })),
        costs: {
          transport: Number(quotationData.costs.transport) || 0,
          loading: Number(quotationData.costs.loading) || 0,
          otherLabel: quotationData.costs.otherLabel || 'Other Charges',
          other: Number(quotationData.costs.other) || 0
        },
        gstPercent: Number(quotationData.gstPercent) || 18,
        discountType: quotationData.discountType || 'percent',
        discountValue: Number(quotationData.discountValue) || 0,
        subtotal: Number(quotationData.subtotal) || 0,
        discountAmount: Number(quotationData.discountAmount) || 0,
        taxable: Number(quotationData.taxable) || 0,
        total: Number(quotationData.total) || 0,
        amount: Number(quotationData.amount) || 0,
        deliveryTimeline: quotationData.deliveryTimeline || '',
        validUntil: quotationData.validUntil || '',
        paymentTerms: {
          advance: Number(quotationData.paymentTerms.advance) || 0,
          material: Number(quotationData.paymentTerms.material) || 0,
          installation: Number(quotationData.paymentTerms.installation) || 0,
          balance: Number(quotationData.paymentTerms.balance) || 0
        },
        paymentType: quotationData.paymentType || 'full',
        bank: {
          accountName: quotationData.bank.accountName || '',
          bankName: quotationData.bank.bankName || '',
          accountNumber: quotationData.bank.accountNumber || '',
          ifscCode: quotationData.bank.ifscCode || '',
          branch: quotationData.bank.branch || ''
        },
        termsAndConditions: quotationData.termsAndConditions || {},
        additionalNotes: quotationData.additionalNotes || '',
        productImages: quotationData.productImages || [],
        plantOverview: quotationData.plantOverview || {},
        approval: quotationData.approval || {},
        history: quotationData.history || []
      };

      const response = await fetch(`${API_BASE}/quotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestDto)
      });

      const json = await response.json();
      if (response.ok && json && json.success) {
        return json.data;
      } else {
        console.error('Backend error:', json);
        showToast(json?.message || 'Failed to save quotation', 'error');
        return null;
      }
    } catch (err) {
      console.error('Error saving quotation:', err);
      showToast('Could not connect to server on port 8092.', 'error');
      return null;
    }
  }

  async function fetchQuotationsFromBackend() {
    try {
      const response = await fetch(`${API_BASE}/quotations`);
      const json = await response.json();
      if (response.ok && json && json.success) {
        const backendQuotations = json.data.content || json.data || [];
        return backendQuotations.map(q => convertBackendToFrontend(q));
      }
      return [];
    } catch (err) {
      console.error('Error fetching quotations:', err);
      return [];
    }
  }

  function convertBackendToFrontend(backendData) {
    return {
      quoteNo: backendData.quoteNo || '',
      date: backendData.date || new Date().toISOString().slice(0, 10),
      status: backendData.status || 'Pending',
      customer: {
        name: backendData.customer?.name || '',
        mobilePrimary: backendData.customer?.mobilePrimary || '',
        mobileSecondary: backendData.customer?.mobileSecondary || '',
        email: backendData.customer?.email || '',
        address: backendData.customer?.address || '',
        city: backendData.customer?.city || '',
        state: backendData.customer?.state || '',
        pincode: backendData.customer?.pincode || '',
        gst: backendData.customer?.gst || ''
      },
      items: (backendData.items || []).map(item => ({
        id: item.id || 'it' + Math.random(),
        productId: item.productId || null,
        name: item.name || '',
        category: item.category || '',
        qty: Number(item.qty) || 0,
        rate: Number(item.rate) || 0,
        hsnCode: item.hsnCode || '',
        gstRate: Number(item.gstRate) || 18,
        powerHP: Number(item.powerHP) || 0,
        powerKW: Number(item.powerKW) || 0,
        inCustomerScope: item.inCustomerScope || false,
        shedSize: item.shedSize || '',
        labor: Number(item.labor) || 0,
        production: item.production || '',
        imageUrl: item.imageUrl || ''
      })),
      costs: {
        transport: Number(backendData.costs?.transport) || 0,
        loading: Number(backendData.costs?.loading) || 0,
        otherLabel: backendData.costs?.otherLabel || 'Other Charges',
        other: Number(backendData.costs?.other) || 0
      },
      gstPercent: Number(backendData.gstPercent) || 18,
      discountType: backendData.discountType || 'percent',
      discountValue: Number(backendData.discountValue) || 0,
      subtotal: Number(backendData.subtotal) || 0,
      discountAmount: Number(backendData.discountAmount) || 0,
      taxable: Number(backendData.taxable) || 0,
      total: Number(backendData.total) || 0,
      amount: Number(backendData.amount) || 0,
      itemsTotal: Number(backendData.itemsTotal) || 0,
      deliveryTimeline: backendData.deliveryTimeline || '45 days from advance payment',
      validUntil: backendData.validUntil || '',
      paymentTerms: {
        advance: Number(backendData.paymentTerms?.advance) || 0,
        material: Number(backendData.paymentTerms?.material) || 0,
        installation: Number(backendData.paymentTerms?.installation) || 0,
        balance: Number(backendData.paymentTerms?.balance) || 0
      },
      paymentType: backendData.paymentType || 'full',
      bank: {
        accountName: backendData.bank?.accountName || COMPANY.bank.accountName,
        bankName: backendData.bank?.bankName || COMPANY.bank.bankName,
        accountNumber: backendData.bank?.accountNumber || COMPANY.bank.accountNumber,
        ifscCode: backendData.bank?.ifscCode || COMPANY.bank.ifscCode,
        branch: backendData.bank?.branch || COMPANY.bank.branch
      },
      termsAndConditions: backendData.termsAndConditions || {},
      additionalNotes: backendData.additionalNotes || '',
      productImages: backendData.productImages || [],
      isInterState: backendData.isInterState || false,
      gstBreakup: backendData.gstBreakup || { cgstPercent: 0, cgstAmount: 0, sgstPercent: 0, sgstAmount: 0, igstPercent: 0, igstAmount: 0 },
      plantOverview: backendData.plantOverview || { model: '', productionCapacity: '', bricksSize: '', palletSize: '', requiredShedArea: '', totalLand: '', connectedPower: '', labourRequirement: '' },
      approval: backendData.approval || { approvedBy: '', approvalDate: '', notes: '' },
      history: Array.isArray(backendData.history) ? backendData.history : []
    };
  }

  // ============================================================
  // SAMPLE QUOTATIONS
  // ============================================================
  function generateSampleQuotations() {
    const q1 = makeQuotation({
      customer: {
        name: 'YASHPAL SINGH',
        mobilePrimary: '6395840394',
        mobileSecondary: '',
        email: 'yashpal@example.com',
        address: 'Shamshabad',
        city: 'Agra',
        state: 'Uttar Pradesh',
        pincode: '282001'
      },
      items: [
        { id: newItemId(), name: 'FLYASH BRICKS MACHINE 10 CAVITY', category: 'Brick Machine', qty: 1, rate: 1900000 },
        { id: newItemId(), name: 'PAN MIXER 500 KG', category: 'Component', qty: 2, rate: 500000 },
        { id: newItemId(), name: 'CONVEYOR BELT 22 Feet', category: 'Component', qty: 1, rate: 350000 },
        { id: newItemId(), name: 'POWER PACK SYSTEM', category: 'Component', qty: 1, rate: 450000 },
        { id: newItemId(), name: 'PLC PANEL FULLY AI BASED', category: 'Component', qty: 1, rate: 400000 },
        { id: newItemId(), name: 'BRICK TROLLY', category: 'Accessory', qty: 6, rate: 7500 },
        { id: newItemId(), name: 'MATERIAL TROLLY', category: 'Accessory', qty: 10, rate: 9000 },
        { id: newItemId(), name: 'VIBRATOR TABLE', category: 'Accessory', qty: 1, rate: 90000 },
        { id: newItemId(), name: 'MIXER MACHINE WITH MOTOR', category: 'Brick Machine', qty: 1, rate: 150000 },
        { id: newItemId(), name: 'COLOUR MIXER', category: 'Brick Machine', qty: 1, rate: 90000 },
        { id: newItemId(), name: 'MOULD ZIG ZAG WITH DUMBLE', category: 'Mould', qty: 5000, rate: 55 },
        { id: newItemId(), name: 'CHEMICAL DRUM', category: 'Accessory', qty: 10, rate: 12000 },
        { id: newItemId(), name: 'COLOUR BAG RED & YELLOW', category: 'Accessory', qty: 10, rate: 7500 },
        { id: newItemId(), name: 'PLY BOARD 8X4', category: 'Accessory', qty: 50, rate: 2500 }
      ],
      status: 'Pending',
      date: '2026-06-22',
      deliveryTimeline: '45 days from advance payment',
      plantOverview: {
        model: 'VKM-FB10', productionCapacity: '4200-4800 Bricks per Hour', bricksSize: '230mm x 110mm x 75mm',
        palletSize: '880mm x 1100mm x 30mm', requiredShedArea: '60 ft X 80 ft', totalLand: '1-1.25 Acre',
        connectedPower: '95 HP / 71.25 KW', labourRequirement: '1 Skilled Operator / 20-22 Unskilled laborer'
      }
    });
    q1.quoteNo = 'SQ-1001';
    addHistoryEntry(q1, 'Created', 'Sample quotation generated on first load');

    const q2 = makeQuotation({
      customer: {
        name: 'Ramesh Traders',
        mobilePrimary: '9876500001',
        mobileSecondary: '',
        email: 'ramesh@example.com',
        address: 'MG Road',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '380001',
        gst: '24ABCDE5678F1Z2'
      },
      items: [
        { id: newItemId(), name: 'FLYASH BRICKS MACHINE 10 CAVITY', category: 'Brick Machine', qty: 1, rate: 1900000 },
        { id: newItemId(), name: 'PAN MIXER 500 KG', category: 'Component', qty: 1, rate: 500000 }
      ],
      status: 'Accepted',
      date: '2026-07-14',
      approval: { approvedBy: 'Admin', approvalDate: '2026-07-15', notes: 'Customer confirmed telephonically.' }
    });
    q2.quoteNo = 'SQ-1002';
    addHistoryEntry(q2, 'Created', 'Sample quotation generated on first load');
    addHistoryEntry(q2, 'Approved', 'Customer confirmed telephonically.');

    const q3 = makeQuotation({
      customer: {
        name: 'Priya Nair',
        mobilePrimary: '9876500002',
        mobileSecondary: '',
        email: 'priya@example.com',
        address: 'Marine Drive',
        city: 'Kochi',
        state: 'Kerala',
        pincode: '682001'
      },
      items: [
        { id: newItemId(), name: 'CONVEYOR BELT 22 Feet', category: 'Component', qty: 2, rate: 350000 },
        { id: newItemId(), name: 'VIBRATOR TABLE', category: 'Accessory', qty: 1, rate: 90000 }
      ],
      status: 'Rejected',
      date: '2026-07-13',
      approval: { approvedBy: 'Admin', approvalDate: '2026-07-14', notes: 'Budget mismatch.' }
    });
    q3.quoteNo = 'SQ-1003';
    addHistoryEntry(q3, 'Created', 'Sample quotation generated on first load');
    addHistoryEntry(q3, 'Rejected', 'Budget mismatch.');

    const q4 = makeQuotation({
      customer: {
        name: 'Suresh Patel',
        mobilePrimary: '9876500003',
        mobileSecondary: '',
        email: 'suresh@example.com',
        address: 'Ring Road',
        city: 'Rajkot',
        state: 'Gujarat',
        pincode: '360001'
      },
      items: [
        { id: newItemId(), name: 'FLYASH BRICKS MACHINE 10 CAVITY', category: 'Brick Machine', qty: 1, rate: 1900000 },
        { id: newItemId(), name: 'PAN MIXER 500 KG', category: 'Component', qty: 1, rate: 500000 },
        { id: newItemId(), name: 'CONVEYOR BELT 22 Feet', category: 'Component', qty: 1, rate: 350000 },
        { id: newItemId(), name: 'PLC PANEL FULLY AI BASED', category: 'Component', qty: 1, rate: 400000 }
      ],
      status: 'Pending',
      date: '2026-07-12'
    });
    q4.quoteNo = 'SQ-1004';
    addHistoryEntry(q4, 'Created', 'Sample quotation generated on first load');

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

  function getFiltered() {
    const q = $('#search-input')?.value.trim().toLowerCase() || '';
    const status = $('#filter-status')?.value || '';
    let list = quotations.filter(row => {
      const matchesSearch = !q || row.customer.name.toLowerCase().includes(q) || row.quoteNo.toLowerCase().includes(q);
      const matchesStatus = !status || row.status === status;
      return matchesSearch && matchesStatus;
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
        <td data-label="Amount">${formatINR(row.amount)}</td>
        <td data-label="Status"><span class="badge ${badgeClass(row.status)}">${row.status}</span></td>
        <td data-label="Date">${row.date ? new Date(row.date).toLocaleDateString('en-GB') : '—'}</td>
        <td data-label="Actions" class="text-right">
          <div class="action-icons">
            <button class="icon-action-btn" title="View / Approve" data-action="view" data-quote="${escapeAttr(row.quoteNo)}"><i class="fas fa-eye"></i></button>
            <button class="icon-action-btn" title="Edit" data-action="edit" data-quote="${escapeAttr(row.quoteNo)}"><i class="fas fa-pen"></i></button>
            ${row.status === 'Accepted' ? `<button class="icon-action-btn report-btn" title="Generate Report" data-action="report" data-quote="${escapeAttr(row.quoteNo)}"><i class="fas fa-file-circle-check"></i></button>` : ''}
            <button class="icon-action-btn" title="History" data-action="history" data-quote="${escapeAttr(row.quoteNo)}"><i class="fas fa-clock-rotate-left"></i></button>
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
        if (btn.dataset.action === 'report') openReportModal(quote);
        if (btn.dataset.action === 'history') openHistoryModal(quote);
        if (btn.dataset.action === 'delete') openDeleteModal(quote);
      });
    });
  }

  // ============================================================
  // PRODUCT IMAGE GALLERY
  // ============================================================
  function collectProductImages(items) {
    const catalog = getProductCatalog();
    const seen = new Set();
    const images = [];
    (items || []).forEach(it => {
      const p = findCatalogProduct(catalog, it.productId);
      const imageUrl = it.imageUrl || p?.imageUrl;
      const productId = it.productId || p?.id;
      if (imageUrl && productId && !seen.has(productId)) {
        seen.add(productId);
        images.push({ productId, productName: it.name || p?.name || '', imageUrl });
      }
    });
    return images;
  }

  // ------------------------------------------------------------
  // Groups the quotation's items into "Sections" (A, B, C, ...)
  // by their product category
  // ------------------------------------------------------------
  function groupItemsBySection(items) {
    const letters = 'ABCDEFGHIJ';
    const order = [];
    const map = {};
    (items || []).forEach(it => {
      const cat = it.category || 'Other';
      if (!map[cat]) { map[cat] = []; order.push(cat); }
      map[cat].push(it);
    });
    return order.map((cat, idx) => ({
      code: letters[idx] || String(idx + 1),
      title: cat,
      items: map[cat]
    }));
  }

  // ------------------------------------------------------------
  // Plant Overview table — renders only the rows that were
  // actually filled in, matching the reference PDF layout.
  // ------------------------------------------------------------
  function buildPlantOverviewMarkup(q) {
    const po = q.plantOverview || {};
    const rows = [
      ['Model', po.model],
      ['Production Capacity', po.productionCapacity],
      ['Bricks Size', po.bricksSize],
      ['Pallet Size', po.palletSize],
      ['Required Shed Area', po.requiredShedArea],
      ['Total Land', po.totalLand],
      ['Connected Power', po.connectedPower],
      ['Labour Requirement', po.labourRequirement]
    ].filter(r => (r[1] || '').toString().trim());

    if (!rows.length) return '';

    return `
      <div class="section-block">
        <div class="section-header">Plant Overview</div>
        <table class="plant-overview-table section-table">
          ${rows.map(r => `<tr><td>${escapeHtml(r[0])}</td><td>${escapeHtml(r[1])}</td></tr>`).join('')}
        </table>
      </div>`;
  }

  // ============================================================
  // INVOICE MARKUP
  // ============================================================
  function buildInvoiceMarkup(q) {
    const sections = groupItemsBySection(q.items || []);
    const badgeCls = badgeClass(q.status);

    let sectionsHtml = '';
    sections.forEach(sec => {
      let secTotal = 0;
      let secPower = 0;

      const rows = sec.items.map((it, i) => {
        const amount = (Number(it.qty) || 0) * (Number(it.rate) || 0);
        if (!it.inCustomerScope) secTotal += amount;
        const powerHP = Number(it.powerHP) || 0;
        secPower += powerHP * (Number(it.qty) || 0);

        const specBits = [
          it.production ? it.production : '',
          it.power ? `Power: ${it.power}` : '',
          it.shedSize ? `Shed: ${it.shedSize}` : '',
          it.labor ? `Labour: ${it.labor}` : ''
        ].filter(Boolean).join(' • ');

        return `
          <tr>
            <td>${i + 1}</td>
            <td class="section-particulars">
              <b>${escapeHtml(it.name || '—')}</b>
              ${specBits ? `<div class="section-spec">${escapeHtml(specBits)}</div>` : ''}
            </td>
            <td class="num">${it.qty}</td>
            <td class="num">${powerHP ? powerHP : '—'}</td>
            <td class="num">${it.inCustomerScope ? 'In Customer Scope' : formatINR(amount)}</td>
          </tr>`;
      }).join('');

      sectionsHtml += `
        <div class="section-block">
          <div class="section-header">Section: ${sec.code} <span>${escapeHtml(sec.title)}</span></div>
          <table class="inv-items-table section-table">
            <thead>
              <tr><th>Sr.No</th><th>Particulars</th><th class="num">Qty</th><th class="num">Power HP</th><th class="num">Price</th></tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr class="section-subtotal-row">
                <td colspan="2">Total: Section ${sec.code} Value INR</td>
                <td class="num"></td>
                <td class="num">${secPower ? secPower.toFixed(2) + ' HP' : '—'}</td>
                <td class="num">${formatINR(secTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>`;
    });

    const extraRows = [];
    if (q.costs.transport) extraRows.push(['Transportation / Freight Charges', q.costs.transport]);
    if (q.costs.loading) extraRows.push(['Loading Charges', q.costs.loading]);
    if (q.costs.other) extraRows.push([q.costs.otherLabel || 'Other Charges', q.costs.other]);

    const extraHtml = extraRows.length ? `
      <div class="section-block">
        <div class="section-header">Additional Charges</div>
        <table class="inv-items-table section-table">
          <thead><tr><th>Particulars</th><th class="num">Amount</th></tr></thead>
          <tbody>
            ${extraRows.map(r => `<tr><td>${escapeHtml(r[0])}</td><td class="num">${formatINR(r[1])}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>` : '';

    let summaryRows = sections.map(sec => {
      const secTotal = sec.items.reduce((s, it) => s + (it.inCustomerScope ? 0 : (Number(it.qty) || 0) * (Number(it.rate) || 0)), 0);
      return `<tr><td>Section ${sec.code}: ${escapeHtml(sec.title)}</td><td class="num">${formatINR(secTotal)}</td></tr>`;
    }).join('');
    const extraTotal = (q.costs.transport || 0) + (q.costs.loading || 0) + (q.costs.other || 0);
    if (extraTotal) summaryRows += `<tr><td>Additional Charges</td><td class="num">${formatINR(extraTotal)}</td></tr>`;

    const gb = q.gstBreakup || { cgstPercent: (q.gstPercent || 0) / 2, cgstAmount: q.cgst || 0, sgstPercent: (q.gstPercent || 0) / 2, sgstAmount: q.sgst || 0, igstPercent: 0, igstAmount: 0 };
    const taxRowsSummary = q.isInterState
      ? `<tr><td>IGST (${gb.igstPercent}%)</td><td class="num">${formatINR(gb.igstAmount)}</td></tr>`
      : `<tr><td>SGST (${gb.sgstPercent}%)</td><td class="num">${formatINR(gb.sgstAmount)}</td></tr>
         <tr><td>CGST (${gb.cgstPercent}%)</td><td class="num">${formatINR(gb.cgstAmount)}</td></tr>`;

    const priceSummaryHtml = `
      <div class="section-block">
        <div class="section-header">Price Summary</div>
        <table class="inv-totals-table price-summary-table">
          ${summaryRows}
          <tr><td>Sub Total</td><td class="num">${formatINR(q.subtotal)}</td></tr>
          <tr><td>Discount</td><td class="num">- ${formatINR(q.discountAmount)}</td></tr>
          ${taxRowsSummary}
          <tr class="total-row"><td>Grand Total</td><td class="num">${formatINR(q.total)}</td></tr>
        </table>
      </div>`;

    const terms = buildTermsText(q.items);
    const termsEnglishHtml = terms.english.map(line => `<div>• ${escapeHtml(line)}</div>`).join('');
    const termsHindiHtml = terms.hindi.map(line => `<div>• ${escapeHtml(line)}</div>`).join('');
    const additionalNotes = (q.additionalNotes || '').trim();

    const productImages = q.productImages && q.productImages.length ? q.productImages : collectProductImages(q.items);
    const galleryHtml = productImages.length ? `
      <div class="product-gallery">
        <div class="inv-label">Product Images</div>
        <div class="gallery-grid">
          ${productImages.map(img => `
            <div class="gallery-item">
              <img src="${escapeAttr(img.imageUrl)}" alt="${escapeAttr(img.productName)}" crossorigin="anonymous">
              <div class="gallery-caption">${escapeHtml(img.productName)}</div>
            </div>`).join('')}
        </div>
      </div>` : '';

    const bank = q.bank || COMPANY.bank;
    const paymentTerms = q.paymentTerms || { advance: 50, material: 25, installation: 15, balance: 10 };
    const paymentType = q.paymentType || 'full';
    const paymentScheduleHtml = paymentType === 'full'
      ? `<tr><td>Full Advance</td><td>100%</td></tr>`
      : `<tr><td>Advance</td><td>${paymentTerms.advance || 0}%</td></tr>
         <tr><td>Before Dispatch</td><td>${paymentTerms.material || 0}%</td></tr>
         <tr><td>On Delivery</td><td>${paymentTerms.installation || 0}%</td></tr>
         <tr><td>Balance</td><td>${paymentTerms.balance || 0}%</td></tr>`;

    const plantOverviewHtml = buildPlantOverviewMarkup(q);

    const approvalLineHtml = (q.status === 'Accepted' || q.status === 'Rejected') && q.approval?.approvedBy ? `
      <div class="section-block">
        <div class="section-header">Approval</div>
        <table class="plant-overview-table section-table">
          <tr><td>Status</td><td>${escapeHtml(q.status)}</td></tr>
          <tr><td>${q.status === 'Accepted' ? 'Approved By' : 'Rejected By'}</td><td>${escapeHtml(q.approval.approvedBy || '—')}</td></tr>
          <tr><td>Date</td><td>${q.approval.approvalDate ? new Date(q.approval.approvalDate).toLocaleDateString('en-GB') : '—'}</td></tr>
          ${q.approval.notes ? `<tr><td>Notes</td><td>${escapeHtml(q.approval.notes)}</td></tr>` : ''}
        </table>
      </div>` : '';

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
          <div>Contact No.: ${escapeHtml(q.customer.mobilePrimary || '—')}${q.customer.mobileSecondary ? ' / ' + escapeHtml(q.customer.mobileSecondary) : ''}</div>
          ${q.customer.email ? `<div>Email: ${escapeHtml(q.customer.email)}</div>` : ''}
          <div>GSTIN No.: ${escapeHtml(q.customer.gst || '—')}</div>
          <div>State: ${escapeHtml(q.customer.state || '—')} ${q.isInterState ? '(Inter-State)' : '(Intra-State)'}</div>
          ${q.deliveryTimeline ? `<div>Delivery Timeline: ${escapeHtml(q.deliveryTimeline)}</div>` : ''}
          <span class="badge ${badgeCls} inv-status">${q.status}</span>
        </div>
        <div class="inv-meta">
          <div><span>Quotation No.:</span> <b>${escapeHtml(q.quoteNo)}</b></div>
          <div><span>Quotation Date:</span> <b>${new Date(q.date).toLocaleDateString('en-GB')}</b></div>
          <div><span>Valid Until:</span> <b>${q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-GB') : '—'}</b></div>
        </div>
      </div>

      ${plantOverviewHtml}
      ${sectionsHtml}
      ${extraHtml}
      ${priceSummaryHtml}

      <div class="inv-words">
        <div class="inv-label">Amount in Words:</div>
        <div>${numberToWordsIndian(q.total)}</div>
      </div>

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

      ${approvalLineHtml}

      <div class="inv-terms">
        <div class="inv-label">Terms &amp; Conditions / नियम और शर्तें</div>
        <div class="terms-columns">
          <div class="terms-col">
            <div class="terms-col-title">English</div>
            <div class="terms-text">${termsEnglishHtml}</div>
          </div>
          <div class="terms-col hindi-col">
            <div class="terms-col-title">हिन्दी</div>
            <div class="terms-text">${termsHindiHtml}</div>
          </div>
        </div>
        ${additionalNotes ? `<div class="terms-text" style="margin-top:6px;"><b>Additional Notes:</b><br>${escapeHtml(additionalNotes).replace(/\n/g, '<br>')}</div>` : ''}
      </div>

      <div class="inv-seal">Company Seal &amp; Signature</div>
      ${galleryHtml}
    `;
  }

  // ============================================================
  // GENERATE REPORT — GST-style report for APPROVED (Accepted)
  // quotations only. Layout inspired by the GSTR2 report
  // reference: centered company header, underlined report title,
  // bordered metadata rows, a bordered data table with a
  // highlighted "Totals" row, followed by an items summary table.
  // ============================================================
  function buildGstReportMarkup(q) {
    const gb = q.gstBreakup || {
      cgstPercent: (q.gstPercent || 0) / 2, cgstAmount: q.cgst || 0,
      sgstPercent: (q.gstPercent || 0) / 2, sgstAmount: q.sgst || 0,
      igstPercent: 0, igstAmount: 0
    };
    const dateObj = q.date ? new Date(q.date) : new Date();
    const monthName = dateObj.toLocaleString('en-US', { month: 'long' });
    const year = dateObj.getFullYear();

    const igstVal = q.isInterState ? gb.igstAmount : 0;
    const cgstVal = q.isInterState ? 0 : gb.cgstAmount;
    const sgstVal = q.isInterState ? 0 : gb.sgstAmount;

    const itemsRows = (q.items || []).map((it, i) => `
      <tr>
        <td>${i + 1}</td>
        <td class="report-left">${escapeHtml(it.name || '—')}</td>
        <td>${it.qty}</td>
        <td>${formatINR(it.rate)}</td>
        <td>${it.inCustomerScope ? 'In Customer Scope' : formatINR((Number(it.qty) || 0) * (Number(it.rate) || 0))}</td>
      </tr>`).join('');

    return `
      <div class="report-header">
        <div class="report-company-name">${escapeHtml(COMPANY.name)}</div>
        <div class="report-company-line">${escapeHtml(COMPANY.address)}</div>
        <div class="report-company-line">Phone no.: ${escapeHtml(COMPANY.phone)} Email: ${escapeHtml(COMPANY.email)}</div>
        <div class="report-company-line">GSTIN: ${escapeHtml(COMPANY.gstin)}, State: ${escapeHtml(COMPANY.state)}</div>
      </div>

      <div class="report-title">Approved Quotation — Sales Report</div>

      <table class="report-meta-table">
        <tr><td>From Year</td><td>${year}</td><td>To Year</td><td>${year}</td></tr>
        <tr><td>From Month</td><td>${escapeHtml(monthName)}</td><td>To Month</td><td>${escapeHtml(monthName)}</td></tr>
      </table>

      <table class="report-info-table">
        <tr><td>1. GSTIN:</td><td>${escapeHtml(COMPANY.gstin)}</td></tr>
        <tr><td>2.(a) Legal name of the registered person:</td><td>${escapeHtml(COMPANY.name)}</td></tr>
        <tr><td>(b) Customer / Buyer name:</td><td>${escapeHtml(q.customer.name || '—')}</td></tr>
        <tr><td>3.(a) Quotation Status:</td><td><span class="badge ${badgeClass(q.status)}">${escapeHtml(q.status)}</span></td></tr>
        <tr><td>(b) Approved By / Date:</td><td>${escapeHtml(q.approval?.approvedBy || '—')}${q.approval?.approvalDate ? ' on ' + new Date(q.approval.approvalDate).toLocaleDateString('en-GB') : ''}</td></tr>
      </table>

      <div class="report-section-title">Sales</div>
      <table class="report-data-table">
        <thead>
          <tr>
            <th rowspan="2">GSTIN/UIN No.</th>
            <th colspan="3">Invoice</th>
            <th rowspan="2">Reverse Charge</th>
            <th rowspan="2">Rate</th>
            <th rowspan="2">CESS Rate</th>
            <th rowspan="2">Taxable Value</th>
            <th colspan="4">Amount</th>
            <th rowspan="2">Place Of Supply</th>
          </tr>
          <tr>
            <th>No.</th><th>Date</th><th>Value</th>
            <th>Integrated Tax</th><th>Central Tax</th><th>State/UT Tax</th><th>CESS</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${escapeHtml(q.customer.gst || '—')}</td>
            <td>${escapeHtml(q.quoteNo)}</td>
            <td>${q.date ? new Date(q.date).toLocaleDateString('en-GB') : '—'}</td>
            <td>${formatNumberPlain(q.total)}</td>
            <td>No</td>
            <td>${(Number(q.gstPercent) || 0).toFixed(2)}</td>
            <td>0.00</td>
            <td>${formatNumberPlain(q.taxable)}</td>
            <td>${formatNumberPlain(igstVal)}</td>
            <td>${formatNumberPlain(cgstVal)}</td>
            <td>${formatNumberPlain(sgstVal)}</td>
            <td>0.00</td>
            <td>${escapeHtml(q.customer.state || '—')}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="report-totals-row">
            <td colspan="3">Totals</td>
            <td>${formatNumberPlain(q.total)}</td>
            <td></td><td></td><td></td>
            <td>${formatNumberPlain(q.taxable)}</td>
            <td>${formatNumberPlain(igstVal)}</td>
            <td>${formatNumberPlain(cgstVal)}</td>
            <td>${formatNumberPlain(sgstVal)}</td>
            <td>0.00</td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <div class="report-section-title">Items Summary</div>
      <table class="report-data-table">
        <thead>
          <tr><th>#</th><th>Particulars</th><th>Qty</th><th>Rate (₹)</th><th>Amount (₹)</th></tr>
        </thead>
        <tbody>
          ${itemsRows || `<tr><td colspan="5">No items in this quotation.</td></tr>`}
        </tbody>
        <tfoot>
          <tr class="report-totals-row"><td colspan="4">Grand Total</td><td>${formatINR(q.total)}</td></tr>
        </tfoot>
      </table>
    `;
  }

  // ============================================================
  // HINDI TERMS RASTERIZATION
  // (fix: robust font loading + fallback font stack + correct
  //  CSS targeting so the rasterized text is crisp both on
  //  screen and in the exported PDF)
  // ============================================================
  const DEVANAGARI_FONT_STACK = "'Noto Sans Devanagari', 'Nirmala UI', 'Mangal', 'Poppins', sans-serif";

  function wrapCanvasText(ctx, text, maxWidthPx) {
    const words = text.split(' ');
    const lines = [];
    let current = '';
    words.forEach(word => {
      const test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidthPx && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    });
    if (current) lines.push(current);
    return lines;
  }

  function renderHindiTermsCanvas(bulletLines, cssWidthPx) {
    const scale = 2;
    const fontSizePx = 10;
    const lineHeightPx = fontSizePx * 1.5;
    const bulletGapPx = 3;
    const fontStack = DEVANAGARI_FONT_STACK;
    const safeWidth = Math.max(160, cssWidthPx || 260);

    const measureCanvas = document.createElement('canvas');
    const mctx = measureCanvas.getContext('2d');
    mctx.font = `400 ${fontSizePx * scale}px ${fontStack}`;
    const maxTextWidthPx = Math.max(40, safeWidth * scale - 14 * scale);

    const wrappedBullets = bulletLines.map(line => wrapCanvasText(mctx, line, maxTextWidthPx));
    const totalLines = wrappedBullets.reduce((sum, arr) => sum + arr.length, 0);
    const totalHeightPx = totalLines * lineHeightPx * scale + bulletLines.length * bulletGapPx * scale + 6 * scale;

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(safeWidth * scale);
    canvas.height = Math.ceil(totalHeightPx);
    canvas.style.width = safeWidth + 'px';
    canvas.style.height = (canvas.height / scale) + 'px';
    canvas.style.display = 'block';

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#555555';
    ctx.font = `400 ${fontSizePx * scale}px ${fontStack}`;
    ctx.textBaseline = 'top';

    let y = 3 * scale;
    wrappedBullets.forEach(wrapped => {
      wrapped.forEach((ln, idx) => {
        const prefix = idx === 0 ? '• ' : '   ';
        ctx.fillText(prefix + ln, 0, y);
        y += lineHeightPx * scale;
      });
      y += bulletGapPx * scale;
    });

    return canvas;
  }

  // Loads the Devanagari webfont (both weights actually used) and
  // resolves even if the network request fails, so PDF export never
  // hangs — it just falls back to the OS's own Devanagari font.
  async function ensureDevanagariFontLoaded() {
    const loaders = [
      `400 20px 'Noto Sans Devanagari'`,
      `600 20px 'Noto Sans Devanagari'`,
      `700 20px 'Noto Sans Devanagari'`
    ];
    try {
      await Promise.race([
        Promise.all(loaders.map(f => document.fonts.load(f).catch(() => null))),
        new Promise(resolve => setTimeout(resolve, 2500)) // don't block export forever
      ]);
      if (document.fonts.ready) {
        await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 2500))]);
      }
    } catch (_) { /* font API unavailable — canvas will still draw with a fallback font */ }
  }

  async function prepareHindiTextForExport(container) {
    await ensureDevanagariFontLoaded();

    const blocks = container.querySelectorAll('.hindi-col .terms-text');
    const restoreFns = [];

    blocks.forEach(block => {
      const bulletLines = Array.from(block.children)
        .map(div => div.textContent.replace(/^•\s*/, '').trim())
        .filter(Boolean);
      if (!bulletLines.length) return;

      const cssWidth = block.clientWidth || block.parentElement?.clientWidth || 260;
      const canvas = renderHindiTermsCanvas(bulletLines, cssWidth);

      const originalHTML = block.innerHTML;
      block.classList.add('hindi-canvas-block');
      block.innerHTML = '';
      block.appendChild(canvas);

      restoreFns.push(() => {
        block.classList.remove('hindi-canvas-block');
        block.innerHTML = originalHTML;
      });
    });

    return () => restoreFns.forEach(fn => fn());
  }

  async function downloadInvoicePDF(elementId, filename) {
    const element = document.getElementById(elementId);
    if (!element || typeof html2pdf === 'undefined') {
      showToast('PDF library failed to load. Check your internet connection.', 'error');
      return;
    }

    const restoreHindiText = await prepareHindiTextForExport(element);

    const opt = {
      margin: 8,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } finally {
      restoreHindiText();
    }
  }

  // ============================================================
  // VIEW MODAL (+ Approval section)
  // ============================================================
  let viewingQuoteNo = null;

  function renderApprovalBox(q) {
    const box = $('#approval-box');
    if (!box) return;

    const isDecided = q.status === 'Accepted' || q.status === 'Rejected';
    const metaHtml = isDecided ? `
      <div class="approval-meta">
        <div><b>${q.status === 'Accepted' ? 'Approved' : 'Rejected'} by:</b> ${escapeHtml(q.approval?.approvedBy || 'Admin')}</div>
        <div><b>Date:</b> ${q.approval?.approvalDate ? new Date(q.approval.approvalDate).toLocaleDateString('en-GB') : '—'}</div>
        ${q.approval?.notes ? `<div><b>Notes:</b> ${escapeHtml(q.approval.notes)}</div>` : ''}
      </div>` : `<div class="approval-meta">This quotation is awaiting a decision.</div>`;

    box.innerHTML = `
      <div class="approval-head">
        <div class="sub-title"><i class="fas fa-stamp"></i> Approval</div>
        <span class="badge ${badgeClass(q.status)}">${q.status}</span>
      </div>
      ${metaHtml}
      <div class="form-field approval-notes-field">
        <label>Approval / Rejection Notes (optional)</label>
        <textarea id="approval-notes-input" placeholder="e.g. Customer confirmed on call...">${q.status === 'Pending' ? '' : escapeAttr(q.approval?.notes || '')}</textarea>
      </div>
      <div class="approval-actions">
        <button class="btn-success" id="btn-approve-quote" ${q.status === 'Accepted' ? 'disabled' : ''}><i class="fas fa-check"></i> Approve</button>
        <button class="btn-danger" id="btn-reject-quote" ${q.status === 'Rejected' ? 'disabled' : ''}><i class="fas fa-xmark"></i> Reject</button>
        ${q.status !== 'Pending' ? `<button class="btn-outline" id="btn-reset-pending"><i class="fas fa-rotate-left"></i> Reset to Pending</button>` : ''}
      </div>
    `;

    $('#btn-approve-quote')?.addEventListener('click', () => decideQuotation(q.quoteNo, 'Accepted'));
    $('#btn-reject-quote')?.addEventListener('click', () => decideQuotation(q.quoteNo, 'Rejected'));
    $('#btn-reset-pending')?.addEventListener('click', () => decideQuotation(q.quoteNo, 'Pending'));
  }

  function decideQuotation(quoteNo, newStatus) {
    const q = quotations.find(x => x.quoteNo === quoteNo);
    if (!q) return;
    const notes = $('#approval-notes-input')?.value.trim() || '';

    q.status = newStatus;
    if (newStatus === 'Pending') {
      q.approval = { approvedBy: '', approvalDate: '', notes: '' };
      addHistoryEntry(q, 'Reset to Pending', notes);
    } else {
      q.approval = {
        approvedBy: 'Admin',
        approvalDate: new Date().toISOString().slice(0, 10),
        notes: notes
      };
      addHistoryEntry(q, newStatus === 'Accepted' ? 'Approved' : 'Rejected', notes);
    }

    persistQuotations();
    renderTable();
    renderApprovalBox(q);
    const preview = $('#view-invoice-preview');
    if (preview) preview.innerHTML = buildInvoiceMarkup(q);
    showToast(`${q.quoteNo} marked as ${newStatus}`, newStatus === 'Rejected' ? 'error' : 'success');
  }

  function openViewModal(q) {
    viewingQuoteNo = q.quoteNo;
    const preview = $('#view-invoice-preview');
    if (preview) preview.innerHTML = buildInvoiceMarkup(q);
    renderApprovalBox(q);
    openModal('modal-view');
  }

  $('#btn-view-download-pdf')?.addEventListener('click', () => {
    if (!viewingQuoteNo) return;
    downloadInvoicePDF('view-invoice-preview', `${viewingQuoteNo}.pdf`);
  });

  // ============================================================
  // GENERATE REPORT MODAL — only reachable via the report-btn
  // action icon, which renderTable() only shows for quotations
  // whose status is "Accepted".
  // ============================================================
  let reportingQuoteNo = null;

  function openReportModal(q) {
    if (q.status !== 'Accepted') {
      showToast('Report is available only for Accepted quotations.', 'error');
      return;
    }
    reportingQuoteNo = q.quoteNo;
    const titleEl = $('#report-quoteno');
    if (titleEl) titleEl.textContent = q.quoteNo;
    const preview = $('#report-preview');
    if (preview) preview.innerHTML = buildGstReportMarkup(q);
    openModal('modal-report');
  }

  $('#btn-report-download-pdf')?.addEventListener('click', () => {
    if (!reportingQuoteNo) return;
    downloadInvoicePDF('report-preview', `${reportingQuoteNo}-Report.pdf`);
  });

  // ============================================================
  // HISTORY MODAL
  // ============================================================
  function openHistoryModal(q) {
    const titleEl = $('#history-quoteno');
    if (titleEl) titleEl.textContent = q.quoteNo;
    const list = $('#history-list');
    if (!list) return;

    const entries = Array.isArray(q.history) ? q.history : [];
    if (!entries.length) {
      list.innerHTML = `<div class="history-empty">No history recorded yet for ${escapeHtml(q.quoteNo)}.</div>`;
    } else {
      list.innerHTML = entries.map(e => `
        <div class="history-item">
          <div class="hi-main">
            <div class="hi-title">${escapeHtml(e.action)}</div>
            <div class="hi-sub">${formatDateTime(e.ts)} · by ${escapeHtml(e.by || 'Admin')}${e.details ? ' — ' + escapeHtml(e.details) : ''}</div>
          </div>
        </div>
      `).join('');
    }
    openModal('modal-history');
  }

  function openGlobalHistoryModal() {
    const titleEl = $('#history-quoteno');
    if (titleEl) titleEl.textContent = 'All Quotations';
    const list = $('#history-list');
    if (!list) return;

    const log = getGlobalHistoryLog();
    if (!log.length) {
      list.innerHTML = `<div class="history-empty">No activity recorded yet.</div>`;
    } else {
      list.innerHTML = log.map(e => `
        <div class="history-item">
          <div class="hi-main">
            <div class="hi-title">${escapeHtml(e.quoteNo || '—')} — ${escapeHtml(e.action)}</div>
            <div class="hi-sub">${formatDateTime(e.ts)} · ${escapeHtml(e.customer || '')}${e.details ? ' — ' + escapeHtml(e.details) : ''}</div>
          </div>
        </div>
      `).join('');
    }
    openModal('modal-history');
  }
  $('#btn-view-history-log')?.addEventListener('click', openGlobalHistoryModal);

  // ============================================================
  // EDIT MODAL
  // ============================================================
  let editingQuoteNo = null;

  function openEditModal(q) {
    editingQuoteNo = q.quoteNo;
    $('#edit-quoteno').textContent = q.quoteNo;
    $('#edit-customerName').value = q.customer.name || '';
    $('#edit-mobile').value = q.customer.mobilePrimary || '';
    $('#edit-email').value = q.customer.email || '';
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
    const discountValue = parseFloat($('#edit-discountValue')?.value) || 0;
    const totals = computeTotals(q.itemsTotal, q.costs, q.gstPercent, q.discountType, discountValue, q.customer.state);
    const el = $('#edit-summary');
    if (el) {
      const taxLine = totals.isInterState
        ? `<div class="row"><span>IGST</span><b>${formatINR(totals.gstBreakup.igstAmount)}</b></div>`
        : `<div class="row"><span>SGST + CGST</span><b>${formatINR(totals.gstBreakup.sgstAmount + totals.gstBreakup.cgstAmount)}</b></div>`;
      el.innerHTML = `
        <div class="row"><span>Sub Total</span><b>${formatINR(totals.subtotal)}</b></div>
        <div class="row"><span>Discount</span><b>- ${formatINR(totals.discountAmount)}</b></div>
        ${taxLine}
        <div class="row total"><span>New Total</span><b>${formatINR(totals.total)}</b></div>
      `;
    }
  }
  document.getElementById('edit-discountValue')?.addEventListener('input', updateEditSummary);

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

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { $('#err-edit-email').textContent = 'Enter valid email'; valid = false; }
    else { $('#err-edit-email').textContent = ''; }

    if (!valid) { showToast('Please fix the highlighted fields.', 'error'); return; }

    const changeNotes = [];
    if (q.customer.name !== name) changeNotes.push(`name → ${name}`);
    if (q.customer.mobilePrimary !== mobile) changeNotes.push(`mobile → ${mobile}`);
    if (q.customer.email !== email) changeNotes.push(`email → ${email}`);
    const newDiscount = parseFloat($('#edit-discountValue')?.value) || 0;
    if (q.discountValue !== newDiscount) changeNotes.push(`discount → ${newDiscount}`);
    const newStatus = $('#edit-status')?.value || 'Pending';
    const statusChanged = q.status !== newStatus;

    q.customer.name = name;
    q.customer.mobilePrimary = mobile;
    q.customer.email = email;
    q.discountValue = newDiscount;
    q.status = newStatus;
    if (statusChanged && newStatus !== 'Pending') {
      q.approval = { approvedBy: 'Admin', approvalDate: new Date().toISOString().slice(0, 10), notes: q.approval?.notes || '' };
    } else if (statusChanged && newStatus === 'Pending') {
      q.approval = { approvedBy: '', approvalDate: '', notes: '' };
    }

    const totals = computeTotals(q.itemsTotal, q.costs, q.gstPercent, q.discountType, q.discountValue, q.customer.state);
    Object.assign(q, totals);
    q.amount = Math.round(totals.total);

    if (changeNotes.length) addHistoryEntry(q, 'Edited', changeNotes.join(', '));
    if (statusChanged) addHistoryEntry(q, `Status changed to ${newStatus}`, '');

    persistQuotations();
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
    persistQuotations();
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
    const p = findCatalogProduct(catalog, select.value);
    if (!p) return;

    const qty = parseFloat(qtyInput?.value) || 1;
    const rate = parseFloat(rateInput?.value) || Number(p.pricing?.sellingPrice ?? p.price) || 0;
    const inCustomerScope = !!(p.pricing?.inCustomerScope ?? p.inCustomerScope);

    wizardItems.push({
      id: newItemId(),
      productId: p.id,
      name: p.name,
      qty: qty,
      rate: inCustomerScope ? 0 : rate,
      category: p.category || '',
      sectionCode: p.sectionCode || '',
      hsnCode: p.hsnCode || '',
      gstRate: p.gstRate ?? 18,
      powerHP: p.machineInfo?.powerHP ?? p.powerHP ?? null,
      powerKW: p.machineInfo?.powerKW ?? p.powerKW ?? null,
      inCustomerScope: inCustomerScope,
      imageUrl: p.imageUrl || '',
      shedSize: p.machineInfo?.shedRequired || p.shedSize || '',
      labor: p.machineInfo?.labourRequired || p.labor || 0,
      production: p.production || '',
      power: p.power || ''
    });
    renderItemsTable();

    if (select) select.value = '';
    if (qtyInput) qtyInput.value = 1;
    if (rateInput) rateInput.value = 0;

    if (inCustomerScope) {
      showToast(`${p.name} added — price is In Customer Scope`, 'info');
    } else if (p.category === 'Brick Machine' && (p.shedSize || p.labor)) {
      showToast(`${p.name} added — needs ${p.shedSize || 'N/A'} shed & ~${p.labor || 'N/A'} laborers`, 'info');
    } else {
      showToast(`${p.name} added to quotation`, 'success');
    }
  });

 $('#chip-custom')?.addEventListener('click', () => {
    wizardItems.push({ id: newItemId(), name: '', qty: 1, rate: 0, isCustom: true });
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
          <td>${it.inCustomerScope
              ? `<span style="font-size:10.5px; color:var(--accent-dark); font-weight:600;">In Customer Scope</span>`
              : `<input type="number" class="item-rate" value="${it.rate}" min="0" step="any">`}</td>
          <td class="item-amount-cell" id="amt-${it.id}">${it.inCustomerScope ? '—' : formatINR((Number(it.qty) || 0) * (Number(it.rate) || 0))}</td>
          <td class="item-remove-cell"><button type="button" class="btn-icon-sm item-remove" title="Remove"><i class="fas fa-trash"></i></button></td>
        </tr>
      `).join('');
    }

   tbody.querySelectorAll('tr[data-id]').forEach(row => {
      const id = row.dataset.id;
      const item = wizardItems.find(i => i.id === id);
      if (!item) return;
      row.querySelector('.item-name')?.addEventListener('input', e => { item.name = e.target.value; });
      row.querySelector('.item-name')?.addEventListener('blur', () => {
        if (item.isCustom && !item.productId && !item._synced) {
          syncCustomItemToProductCatalog(item);
        }
      });
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

  function updateSiteRequirementsBox() {
    const box = $('#site-requirements-box');
    if (!box) return;

    const machineItems = wizardItems.filter(it => it.category === 'Brick Machine' && (it.shedSize || it.labor || it.production));
    if (!machineItems.length) { box.classList.add('hidden'); box.innerHTML = ''; return; }

    const totalLabor = machineItems.reduce((s, it) => s + (Number(it.labor) || 0), 0);
    const shedList = [...new Set(machineItems.map(it => it.shedSize).filter(Boolean))];

    box.classList.remove('hidden');
    box.innerHTML = `
      <i class="fas fa-warehouse"></i>
      <div>
        <b>Site Requirements for selected machine(s):</b><br>
        Shed / space needed: ${shedList.length ? escapeHtml(shedList.join(', ')) : 'N/A'}<br>
        Estimated labor required: ${totalLabor || 'N/A'} worker(s)
      </div>
    `;
  }

  function updateItemAmount(item) {
    const amt = (Number(item.qty) || 0) * (Number(item.rate) || 0);
    const cell = document.getElementById('amt-' + item.id);
    if (cell) cell.textContent = item.inCustomerScope ? '—' : formatINR(amt);
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
   // Check if we have prefilled customer data to preserve
  const hasPrefilledData = window._prefilledCustomer !== null;

  ['f-customerName', 'f-mobilePrimary', 'f-mobileSecondary', 'f-email', 'f-address', 'f-city', 'f-state', 'f-pincode', 'f-gst'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      // Don't clear if we have prefilled data
      if (!hasPrefilledData) {
        el.value = '';
      }
    }
  });

    // Plant Overview fields — always reset (per-quotation, not per-customer)
    ['f-plantModel', 'f-plantProduction', 'f-plantBrickSize', 'f-plantPalletSize',
     'f-plantShedArea', 'f-plantLand', 'f-plantPower', 'f-plantLabour'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

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

    $('#edit-terms').value = '';

    wizardItems = [];
    renderItemsTable();
    populateProductPicker();

    $('#product-picker-qty').value = 1;
    $('#product-picker-rate').value = 0;

    ['cost-transport', 'cost-loading', 'cost-other'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = 0;
    });
    const costOtherLabelEl = $('#cost-other-label');
    if (costOtherLabelEl) costOtherLabelEl.value = 'Other Charges';
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

  // If we have prefilled customer data, fill the form
  if (window._prefilledCustomer) {
    fillCustomerForm(window._prefilledCustomer);
  }

  // Refresh product catalog from backend
  fetchProductsFromBackend();
  currentStep = 1;
  goToStep(1);
  openModal('modal-wizard');
}

/* ============================================================
   Fill Customer Form with Data from Customer Management
   ============================================================ */
function fillCustomerForm(customerData) {
  if (!customerData) return;

  console.log('Filling customer form with:', customerData);

  // Step 1 fields - Customer Details
  const nameField = document.getElementById('f-customerName');
  const mobileField = document.getElementById('f-mobilePrimary');
  const mobileSecondaryField = document.getElementById('f-mobileSecondary');
  const emailField = document.getElementById('f-email');
  const addressField = document.getElementById('f-address');
  const cityField = document.getElementById('f-city');
  const stateField = document.getElementById('f-state');
  const pincodeField = document.getElementById('f-pincode');
  const gstField = document.getElementById('f-gst');

  if (nameField) nameField.value = customerData.name || '';
  if (mobileField) mobileField.value = customerData.mobilePrimary || '';
  if (mobileSecondaryField) mobileSecondaryField.value = customerData.mobileSecondary || '';
  if (emailField) emailField.value = customerData.email || '';
  if (addressField) addressField.value = customerData.address || '';
  if (cityField) cityField.value = customerData.city || '';
  if (stateField) stateField.value = customerData.state || '';
  if (pincodeField) pincodeField.value = customerData.pincode || '';
  if (gstField) gstField.value = customerData.gst || '';

  // Update state field for GST calculation
  if (stateField) {
    // Trigger change event to update GST calculations
    const event = new Event('input');
    stateField.dispatchEvent(event);
  }

  // Also update the edit modal fields if they exist
  const editNameField = document.getElementById('edit-customerName');
  const editMobileField = document.getElementById('edit-mobile');
  const editEmailField = document.getElementById('edit-email');

  if (editNameField) editNameField.value = customerData.name || '';
  if (editMobileField) editMobileField.value = customerData.mobilePrimary || '';
  if (editEmailField) editEmailField.value = customerData.email || '';

  // Show toast notification
  showToast(`Customer ${customerData.name} details loaded automatically`, 'success');

  // Clear session storage after loading
  sessionStorage.removeItem('quotationCustomerData');
  sessionStorage.removeItem('quotationCustomerId');
  window._prefilledCustomer = null;
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

  const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  function validateStep1() {
    let ok = true;
    const name = $('#f-customerName')?.value.trim() || '';
    ok = markError('f-customerName', 'err-customerName', name ? '' : 'Customer name is required') && ok;

    const mobilePrimary = $('#f-mobilePrimary')?.value.trim() || '';
    ok = markError('f-mobilePrimary', 'err-mobilePrimary', /^[6-9]\d{9}$/.test(mobilePrimary) ? '' : 'Enter a valid 10-digit mobile number') && ok;

    const mobileSecondary = $('#f-mobileSecondary')?.value.trim() || '';
    if (mobileSecondary) {
      ok = markError('f-mobileSecondary', 'err-mobileSecondary', /^[6-9]\d{9}$/.test(mobileSecondary) ? '' : 'Enter a valid 10-digit mobile number') && ok;
    } else {
      document.getElementById('err-mobileSecondary').textContent = '';
      document.getElementById('f-mobileSecondary')?.classList.remove('invalid');
    }

    const email = $('#f-email')?.value.trim() || '';
    if (email) {
      ok = markError('f-email', 'err-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Enter a valid email address') && ok;
    } else {
      document.getElementById('err-email').textContent = '';
      document.getElementById('f-email')?.classList.remove('invalid');
    }

    const address = $('#f-address')?.value.trim() || '';
    ok = markError('f-address', 'err-address', address ? '' : 'Installation address is required') && ok;

    const state = $('#f-state')?.value.trim() || '';
    ok = markError('f-state', 'err-state', state ? '' : 'State is required') && ok;

    const pincode = $('#f-pincode')?.value.trim() || '';
    ok = markError('f-pincode', 'err-pincode', /^\d{6}$/.test(pincode) ? '' : 'Enter a valid 6-digit pincode') && ok;

    const gst = $('#f-gst')?.value.trim().toUpperCase() || '';
    if (gst) {
      ok = markError('f-gst', 'err-gst', GSTIN_REGEX.test(gst) ? '' : 'Enter a valid GSTIN (e.g. 09AMXPS4725R1ZO)') && ok;
    } else {
      document.getElementById('err-gst').textContent = '';
      document.getElementById('f-gst')?.classList.remove('invalid');
    }

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
      const invalidRow = wizardItems.some(it => !it.name || !it.name.trim() || !(Number(it.qty) > 0) || (!it.inCustomerScope && !(Number(it.rate) >= 0)));
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
    const transport = parseFloat($('#cost-transport')?.value) || 0;
    const loading = parseFloat($('#cost-loading')?.value) || 0;
    const otherLabel = $('#cost-other-label')?.value || 'Other Charges';
    const other = parseFloat($('#cost-other')?.value) || 0;

    return { transport, loading, otherLabel, other };
  }

  function computeCosts() {
    const el = $('#cost-items');
    if (el) el.textContent = formatINR(itemsSubtotal(wizardItems));
  }
  ['cost-transport', 'cost-loading', 'cost-other'].forEach(id => {
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
    const customerState = $('#f-state')?.value.trim() || '';
    const totals = computeTotals(itTotal, costs, gstPercent, discountType, discountValue, customerState);

    const el = $('#summary-gst');
    if (el) {
      const taxLine = totals.isInterState
        ? `<div class="row"><span>IGST (${totals.gstBreakup.igstPercent}%)</span><b>${formatINR(totals.gstBreakup.igstAmount)}</b></div>`
        : `<div class="row"><span>SGST (${totals.gstBreakup.sgstPercent}%)</span><b>${formatINR(totals.gstBreakup.sgstAmount)}</b></div>
           <div class="row"><span>CGST (${totals.gstBreakup.cgstPercent}%)</span><b>${formatINR(totals.gstBreakup.cgstAmount)}</b></div>`;
      el.innerHTML = `
        <div class="row"><span>Items Subtotal</span><b>${formatINR(itTotal)}</b></div>
        <div class="row"><span>Additional Charges</span><b>${formatINR(costs.transport + costs.loading + costs.other)}</b></div>
        <div class="row"><span>Discount</span><b>- ${formatINR(totals.discountAmount)}</b></div>
        ${taxLine}
        <div class="row total"><span>Grand Total</span><b>${formatINR(totals.total)}</b></div>
      `;
    }
  }
  ['f-gstPercent', 'f-discountType', 'f-discountValue', 'f-state'].forEach(id => {
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

  // ============================================================
  // collectWizardRecord()
  // ============================================================
  function collectWizardRecord(quoteNo) {
    const costs = getCostTotalsFromForm();
    const itTotal = itemsSubtotal(wizardItems);
    const gstPercent = parseFloat($('#f-gstPercent')?.value) || 0;
    const discountType = $('#f-discountType')?.value || 'percent';
    const discountValue = parseFloat($('#f-discountValue')?.value) || 0;
    const customerState = $('#f-state')?.value.trim() || '';
    const totals = computeTotals(itTotal, costs, gstPercent, discountType, discountValue, customerState);

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

    const items = wizardItems.map(it => ({ ...it }));

    const terms = buildTermsText(items);
    const productImages = collectProductImages(items);

    const totalPowerHP = items.reduce((s, it) => s + (Number(it.powerHP) || 0) * (Number(it.qty) || 0), 0);
    const totalPowerKW = items.reduce((s, it) => s + (Number(it.powerKW) || 0) * (Number(it.qty) || 0), 0);

    const plantOverview = {
      model: $('#f-plantModel')?.value.trim() || '',
      productionCapacity: $('#f-plantProduction')?.value.trim() || '',
      bricksSize: $('#f-plantBrickSize')?.value.trim() || '',
      palletSize: $('#f-plantPalletSize')?.value.trim() || '',
      requiredShedArea: $('#f-plantShedArea')?.value.trim() || '',
      totalLand: $('#f-plantLand')?.value.trim() || '',
      connectedPower: $('#f-plantPower')?.value.trim() || '',
      labourRequirement: $('#f-plantLabour')?.value.trim() || ''
    };

    return {
      quoteNo: quoteNo,
      quoteDate: new Date().toISOString().slice(0, 10),
      date: new Date().toISOString().slice(0, 10),
      status: 'Pending',
      customer: {
        name: $('#f-customerName')?.value.trim() || '',
        mobilePrimary: $('#f-mobilePrimary')?.value.trim() || '',
        mobileSecondary: $('#f-mobileSecondary')?.value.trim() || '',
        email: $('#f-email')?.value.trim() || '',
        address: $('#f-address')?.value.trim() || '',
        city: $('#f-city')?.value.trim() || '',
        state: customerState,
        pincode: $('#f-pincode')?.value.trim() || '',
        gst: $('#f-gst')?.value.trim().toUpperCase() || ''
      },
      isInterState: totals.isInterState,
      deliveryTimeline: $('#f-deliveryTimeline')?.value.trim() || '',
      items: items,
      itemsTotal: itTotal,
      totalPowerHP: totalPowerHP,
      totalPowerKW: Math.round(totalPowerKW * 100) / 100,
      costs: costs,
      gstPercent: gstPercent,
      discountType: discountType,
      discountValue: discountValue,
      ...totals,
      amount: Math.round(totals.total),
      bank: bank,
      paymentTerms: paymentTerms,
      paymentType: paymentType,
      termsAndConditions: { templateVersion: terms.version, categoriesApplied: terms.categoriesApplied },
      additionalNotes: $('#edit-terms')?.value.trim() || '',
      productImages: productImages,
      plantOverview: plantOverview,
      approval: { approvedBy: '', approvalDate: '', notes: '' },
      history: [],
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

  $('#btn-generate')?.addEventListener('click', async () => {
    const btn = $('#btn-generate');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...'; }

    const record = collectWizardRecord(draftQuoteNo || nextQuoteNo());

    // Save to backend
    const savedQuotation = await saveQuotationToBackend(record);

    let finalQuotation;
    if (savedQuotation) {
      // Convert backend response to frontend format and add to list
      finalQuotation = convertBackendToFrontend(savedQuotation);
    } else {
      // Fallback: save locally if backend fails
      finalQuotation = record;
      finalQuotation.history = [];
    }

    addHistoryEntry(finalQuotation, 'Created', `Quotation generated for ${finalQuotation.customer?.name || 'customer'}`);
    quotations.unshift(finalQuotation);
    persistQuotations();

    draftQuoteNo = null;

    const preview = $('#invoice-preview');
    if (preview) preview.innerHTML = buildInvoiceMarkup(finalQuotation);
    $('#share-grid')?.classList.remove('hidden');
    if (btn) btn.classList.add('hidden');

    renderTable();

    downloadInvoicePDF('invoice-preview', `${finalQuotation.quoteNo}.pdf`).then(() => {
      showToast(`Quotation ${finalQuotation.quoteNo} generated & PDF downloaded`, 'success');
    }).catch(() => {
      showToast(`Quotation ${finalQuotation.quoteNo} generated successfully`, 'success');
    });

    $('#btn-download-pdf').onclick = () => downloadInvoicePDF('invoice-preview', `${finalQuotation.quoteNo}.pdf`);
    $('#btn-share-email').onclick = () => {
      const subject = encodeURIComponent(`Quotation ${finalQuotation.quoteNo}`);
      const body = encodeURIComponent(`Hi ${finalQuotation.customer.name || ''},\n\nPlease find your quotation ${finalQuotation.quoteNo} (Total: ${formatINR(finalQuotation.total)}). We have downloaded the PDF — please attach it to this email before sending.\n\nThanks,\n${COMPANY.name}`);
      window.location.href = `mailto:${finalQuotation.customer.email || ''}?subject=${subject}&body=${body}`;
    };
    $('#btn-share-whatsapp').onclick = () => {
      const text = encodeURIComponent(`Hi ${finalQuotation.customer.name || ''}, here is your quotation ${finalQuotation.quoteNo} — Total: ${formatINR(finalQuotation.total)}. (PDF downloaded separately)`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    setTimeout(() => closeModal('modal-wizard'), 1200);
  });

  // ============================================================
  // EXPORTS
  // ============================================================
  function exportToCSV() {
    const filtered = getFiltered();
    const headers = ['Quotation No.', 'Customer', 'Primary Mobile', 'Email', 'Amount', 'Status', 'Date'];
    const rows = filtered.map(q => [
      q.quoteNo,
      q.customer.name || '',
      q.customer.mobilePrimary || '',
      q.customer.email || '',
      q.amount || 0,
      q.status || '',
      q.date || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `quotations_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('CSV exported successfully', 'success');
  }

  $('#btn-export-csv')?.addEventListener('click', exportToCSV);

  // ============================================================
  // FILTER EVENTS
  // ============================================================
  ['search-input', 'filter-status'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => { currentPage = 1; renderTable(); });
  });
  $('#rows-per-page')?.addEventListener('change', (e) => {
    rowsPerPage = Number(e.target.value);
    currentPage = 1;
    renderTable();
  });
  document.querySelectorAll('.data-table th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      sortDir = (sortKey === key) ? -sortDir : 1;
      sortKey = key;
      renderTable();
    });
  });
  $('#btn-reset-filters')?.addEventListener('click', () => {
    if ($('#search-input')) $('#search-input').value = '';
    if ($('#filter-status')) $('#filter-status').value = '';
    currentPage = 1;
    renderTable();
  });

  // ============================================================
  // INIT
  // ============================================================
  async function init() {
  // ============================================================
  // CHECK FOR CUSTOMER DATA FROM CUSTOMER MANAGEMENT
  // ============================================================
  const customerDataStr = sessionStorage.getItem('quotationCustomerData');
  const customerId = sessionStorage.getItem('quotationCustomerId');

  if (customerDataStr) {
    try {
      const customerData = JSON.parse(customerDataStr);
      console.log('Loading customer data:', customerData);

      // Store customer data globally for later use
      window._prefilledCustomer = customerData;

      // Pre-fill customer details in the wizard (will be applied when wizard opens)
      setTimeout(() => {
        fillCustomerForm(customerData);
      }, 500);

    } catch (err) {
      console.error('Error loading customer data:', err);
    }
  }

  // ============================================================
  // LOAD QUOTATIONS
  // ============================================================
  // Try to load from localStorage first
  const stored = localStorage.getItem(QUOTATIONS_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length) {
        // backfill new fields for quotations saved before this revision
        quotations = parsed.map(q => ({
          plantOverview: { model: '', productionCapacity: '', bricksSize: '', palletSize: '', requiredShedArea: '', totalLand: '', connectedPower: '', labourRequirement: '' },
          approval: { approvedBy: '', approvalDate: '', notes: '' },
          history: [],
          ...q
        }));
        populateProductPicker();
        togglePaymentFields();
        renderTable();

        // If customer data exists and wizard is not open, open it
        if (window._prefilledCustomer) {
          setTimeout(() => {
            openWizard();
          }, 300);
        }
        return;
      }
    } catch (_) {}
  }

  // If nothing in localStorage, try backend
  try {
    const backendQuotations = await fetchQuotationsFromBackend();
    if (backendQuotations && backendQuotations.length) {
      quotations = backendQuotations;
      persistQuotations();
    } else {
      quotations = generateSampleQuotations();
      persistQuotations();
    }
  } catch (err) {
    console.error('Error loading quotations:', err);
    quotations = generateSampleQuotations();
    persistQuotations();
  }

  // If customer data exists and wizard is not open, open it
  if (window._prefilledCustomer) {
    setTimeout(() => {
      openWizard();
    }, 300);
  }

  // Refresh product catalog from backend
  await fetchProductsFromBackend();

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