/* ============================================================
   Quotation Management — Complete Module
   VKM Brick & Block Machinery (Vaishnokripa Mercantile)
   ============================================================ */

(function () {
  'use strict';

  // ============================================================
  // COMPANY INFO
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

  function normState(s) { return String(s || '').trim().toLowerCase(); }

  // Backend date fields (LocalDate) throw a 500 ("Text '' could not be
  // parsed") if sent as an empty string instead of null/omitted.
  function dateOrNull(v) {
    const s = (v === null || v === undefined) ? '' : String(v).trim();
    return s ? s : null;
  }

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
    const categories = [...new Set((items || []).map(it => it.category || '').filter(Boolean))];
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
  let quotations = [];
  let wizardItems = [];
  let itemIdCounter = 1;
  function newItemId() { return 'it' + (itemIdCounter++); }

  function itemsSubtotal(items) {
    return items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
  }

  function makeQuotation(overrides) {
    const base = {
      quoteNo: '',
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
      plantOverview: { model: '', productionCapacity: '', bricksSize: '', palletSize: '', requiredShedArea: '', totalLand: '', connectedPower: '', labourRequirement: '' },
      approval: { approvedBy: '', approvalDate: '', notes: '' },
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
  // BACKEND API INTEGRATION - PRODUCTS
  // ============================================================
  // In-memory cache only (per page load). No localStorage — always sourced
  // fresh from the backend (/api/products/get-all-products).
  let productCatalog = [];

  async function fetchProductsFromBackend() {
    try {
      const response = await fetch(`${API_BASE}/products/get-all-products`);
      const json = await response.json();
      if (response.ok && json && json.success && json.data) {
        const products = json.data.map(dto => ({
          id: dto.id,
          name: dto.name,
          category: dto.category || 'Other',
          brand: dto.brand || 'VKM',
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
        productCatalog = products;
        return products;
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      showToast('Could not load products from server (port 8092).', 'error');
    }
    productCatalog = [];
    return [];
  }

  function getProductCatalog() {
    return (productCatalog || []).filter(p => p.status !== 'Inactive');
  }

  function findCatalogProduct(catalog, productId) {
    return catalog.find(c => String(c.id) === String(productId));
  }

  // ============================================================
  // BACKEND API INTEGRATION - CUSTOMERS
  // ============================================================
  let customersCache = [];
  let selectedCustomerId = null;

  async function fetchCustomersFromBackend(name) {
    try {
      const url = name ? `${API_BASE}/customers/get-all-customers?name=${encodeURIComponent(name)}` : `${API_BASE}/customers/get-all-customers`;
      const response = await fetch(url);
      const json = await response.json();
      if (response.ok && json && json.success && Array.isArray(json.data)) {
        return json.data;
      }
      return [];
    } catch (err) {
      console.error('Error fetching customers:', err);
      return [];
    }
  }

  async function getCustomerFromBackend(id) {
    try {
      const response = await fetch(`${API_BASE}/customers/get-customer/${id}`);
      const json = await response.json();
      if (response.ok && json && json.success && json.data) return json.data;
      return null;
    } catch (err) {
      console.error('Error fetching customer:', err);
      return null;
    }
  }

  async function createCustomerInBackend(customerDto) {
    try {
      const response = await fetch(`${API_BASE}/customers/create-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerDto)
      });
      const json = await response.json();
      if (response.ok && json && json.success && json.data) return json.data;
      console.error('Backend error creating customer:', json);
      return null;
    } catch (err) {
      console.error('Error creating customer:', err);
      return null;
    }
  }

  // Populate a <datalist> with customer names for the customer-name field so
  // suggestions come straight from the backend (no hard-coded/dummy names).
  async function refreshCustomerSuggestions(query) {
    customersCache = await fetchCustomersFromBackend(query || '');
    let datalist = document.getElementById('customer-name-suggestions');
    if (!datalist) {
      datalist = document.createElement('datalist');
      datalist.id = 'customer-name-suggestions';
      document.body.appendChild(datalist);
      const nameInput = document.getElementById('f-customerName');
      if (nameInput) nameInput.setAttribute('list', 'customer-name-suggestions');
    }
    datalist.innerHTML = customersCache.map(c => `<option value="${escapeAttr(c.name || '')}">`).join('');
  }

  let customerSearchTimer = null;
  document.getElementById('f-customerName')?.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    clearTimeout(customerSearchTimer);
    customerSearchTimer = setTimeout(async () => {
      if (val.length < 2) return;
      await refreshCustomerSuggestions(val);
      const match = customersCache.find(c => (c.name || '').toLowerCase() === val.toLowerCase());
      if (match) {
        selectedCustomerId = match.id;
        fillCustomerForm({
          name: match.name,
          mobilePrimary: match.mobilePrimary || match.mobile || '',
          mobileSecondary: match.mobileSecondary || '',
          email: match.email || '',
          address: match.address || '',
          city: match.city || '',
          state: match.state || '',
          pincode: match.pincode || '',
          gst: match.gst || ''
        }, true);
      } else {
        selectedCustomerId = null;
      }
    }, 350);
  });

  // Create quotation in backend
  async function createQuotationInBackend(quotationData) {
    try {
      const requestDto = {
        quoteNo: quotationData.quoteNo,
        date: quotationData.date,
        status: quotationData.status,
        customerId: quotationData.customer.id || selectedCustomerId || null,
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
          imageUrl: (item.imageUrl || '').substring(0, 255) 
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
        validUntil: dateOrNull(quotationData.validUntil),
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
        approval: {
          approvedBy: quotationData.approval?.approvedBy || '',
          approvalDate: dateOrNull(quotationData.approval?.approvalDate),
          notes: quotationData.approval?.notes || ''
        },
        history: quotationData.history || []
      };

      const response = await fetch(`${API_BASE}/quotations/create-quotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestDto)
      });
      const json = await response.json();
      if (response.ok && json && json.success && json.data) {
        return json.data;
      } else {
        console.error('Backend error:', json);
        showToast(json?.message || 'Failed to create quotation', 'error');
        return null;
      }
    } catch (err) {
      console.error('Error creating quotation:', err);
      showToast('Could not connect to server on port 8092.', 'error');
      return null;
    }
  }

  // Fetch quotations from backend
  async function fetchQuotationsFromBackend(page = 0, size = 100) {
    try {
      const response = await fetch(`${API_BASE}/quotations/get-quotations?page=${page}&size=${size}`);
      const json = await response.json();
      if (response.ok && json && json.success && json.data) {
        const content = json.data.content || [];
        return content.map(q => convertBackendToFrontend(q));
      }
      return [];
    } catch (err) {
      console.error('Error fetching quotations:', err);
      return [];
    }
  }

  // Update quotation in backend
  async function updateQuotationInBackend(id, quotationData) {
    try {
      const requestDto = {
        quoteNo: quotationData.quoteNo,
        date: quotationData.date,
        status: quotationData.status,
        customerId: quotationData.customer.id || null,
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
        validUntil: dateOrNull(quotationData.validUntil),
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
        approval: {
          approvedBy: quotationData.approval?.approvedBy || '',
          approvalDate: dateOrNull(quotationData.approval?.approvalDate),
          notes: quotationData.approval?.notes || ''
        },
        history: quotationData.history || []
      };

      const response = await fetch(`${API_BASE}/quotations/update-quotation/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestDto)
      });
      const json = await response.json();
      if (response.ok && json && json.success && json.data) {
        return json.data;
      } else {
        console.error('Backend error:', json);
        showToast(json?.message || 'Failed to update quotation', 'error');
        return null;
      }
    } catch (err) {
      console.error('Error updating quotation:', err);
      showToast('Could not connect to server.', 'error');
      return null;
    }
  }

  // Update status in backend
  async function updateStatusInBackend(id, status, notes) {
    try {
      const response = await fetch(`${API_BASE}/quotations/update-status/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes })
      });
      const json = await response.json();
      if (response.ok && json && json.success && json.data) {
        return json.data;
      } else {
        console.error('Backend error:', json);
        return null;
      }
    } catch (err) {
      console.error('Error updating status:', err);
      return null;
    }
  }

  // Delete quotation in backend
  async function deleteQuotationInBackend(id) {
    try {
      const response = await fetch(`${API_BASE}/quotations/delete-quotation/${id}`, {
        method: 'DELETE'
      });
      const json = await response.json();
      if (response.ok && json && json.success) {
        return true;
      } else {
        console.error('Backend error:', json);
        return false;
      }
    } catch (err) {
      console.error('Error deleting quotation:', err);
      return false;
    }
  }

  // Duplicate quotation in backend
  async function duplicateQuotationInBackend(id) {
    try {
      const response = await fetch(`${API_BASE}/quotations/duplicate-quotation/${id}/duplicate`, {
        method: 'POST'
      });
      const json = await response.json();
      if (response.ok && json && json.success && json.data) {
        return json.data;
      } else {
        console.error('Backend error:', json);
        return null;
      }
    } catch (err) {
      console.error('Error duplicating quotation:', err);
      return null;
    }
  }

  function convertBackendToFrontend(backendData) {
    return {
      id: backendData.id,
      quoteNo: backendData.quoteNo || '',
      date: backendData.date || new Date().toISOString().slice(0, 10),
      status: backendData.status || 'Pending',
      customer: {
        id: backendData.customer?.id || backendData.customerId || null,
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
  // DOM SHORTCUTS
  // ============================================================
  const $ = (s) => document.querySelector(s);

  // ============================================================
  // SIDEBAR
  // ============================================================
  const sidebar = $('#sidebar');
  const sidebarToggle = $('#sidebarToggle');
  const toggleIcon = $('#toggleIcon');
  const sidebarBackdrop = $('#sidebarBackdrop');

  function isMobileView() { return window.innerWidth < 1024; }

  function setSidebarExpanded(expand) {
    if (isMobileView()) {
      sidebar?.classList.toggle('expanded', expand);
      sidebar?.classList.toggle('collapsed', !expand);
      sidebarBackdrop?.classList.toggle('visible', expand);
    } else {
      sidebar?.classList.toggle('expanded', expand);
      sidebar?.classList.toggle('collapsed', !expand);
      sidebarBackdrop?.classList.remove('visible');
    }
    if (toggleIcon) {
      toggleIcon.style.transform = expand ? 'rotate(180deg)' : 'rotate(0deg)';
    }
  }

  // Start collapsed on every screen size (desktop, tablet, mobile alike) —
  // matches dashboard.js, which never auto-expands the sidebar on load.
  // On mobile/tablet this shows a persistent compact icon rail; on desktop
  // it shows the same compact rail until the user opens it themselves.
  setSidebarExpanded(false);

  sidebarToggle?.addEventListener('click', () => {
    const isExpanded = sidebar?.classList.contains('expanded');
    setSidebarExpanded(!isExpanded);
  });

  sidebarBackdrop?.addEventListener('click', () => setSidebarExpanded(false));

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (isMobileView() && sidebar?.classList.contains('expanded')) setSidebarExpanded(false);
    });
  });

  window.addEventListener('resize', () => {
    if (!isMobileView()) {
      sidebarBackdrop?.classList.remove('visible');
    }
  });

  function setupDropdown(btnId, menuId) {
  const btn = document.getElementById(btnId);
  const menu = document.getElementById(menuId);
  btn?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.topbar-dropdown').forEach(m => { if (m !== menu) m.classList.add('hidden'); });
    const willOpen = menu?.classList.contains('hidden');
    menu?.classList.toggle('hidden');
    if (willOpen && menu) {
      menu.style.left = ''; menu.style.right = '0';
      requestAnimationFrame(() => {
        const rect = menu.getBoundingClientRect();
        if (rect.left < 8) { menu.style.right = 'auto'; menu.style.left = (8 - rect.left) + 'px'; }
      });
    }
  });
}

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
    const customerFilter = $('#filter-customer')?.value || '';
    const dateFilter = $('#filter-date')?.value || '';

    let list = quotations.filter(row => {
      const matchesSearch = !q || row.customer.name.toLowerCase().includes(q) || row.quoteNo.toLowerCase().includes(q);
      const matchesStatus = !status || row.status === status;
      const matchesCustomer = !customerFilter || row.customer.name === customerFilter;
      let matchesDate = true;
      if (dateFilter === 'today') {
        const today = new Date().toISOString().slice(0, 10);
        matchesDate = row.date === today;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesDate = new Date(row.date) >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        matchesDate = new Date(row.date) >= monthAgo;
      }
      return matchesSearch && matchesStatus && matchesCustomer && matchesDate;
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

  function populateCustomerFilter() {
    const select = $('#filter-customer');
    if (!select) return;
    const customers = [...new Set(quotations.map(q => q.customer.name).filter(Boolean))].sort();
    const currentVal = select.value;
    select.innerHTML = '<option value="">All Customers</option>' +
      customers.map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');
    if (currentVal) select.value = currentVal;
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
    populateCustomerFilter();
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
        <td data-label="Actions" style="text-align:center;">
          <div class="action-icons" style="justify-content:center;">
            <button class="icon-action-btn" title="View / Approve" data-action="view" data-quote="${escapeAttr(row.quoteNo)}" data-id="${row.id || ''}"><i class="fas fa-eye"></i></button>
            <button class="icon-action-btn" title="Edit" data-action="edit" data-quote="${escapeAttr(row.quoteNo)}" data-id="${row.id || ''}"><i class="fas fa-pen"></i></button>
            ${row.status === 'Accepted' ? `<button class="icon-action-btn report-btn" title="Generate Report" data-action="report" data-quote="${escapeAttr(row.quoteNo)}" data-id="${row.id || ''}"><i class="fas fa-file-circle-check"></i></button>` : ''}
            <button class="icon-action-btn" title="Duplicate" data-action="duplicate" data-quote="${escapeAttr(row.quoteNo)}" data-id="${row.id || ''}"><i class="fas fa-copy"></i></button>
            <button class="icon-action-btn" title="History" data-action="history" data-quote="${escapeAttr(row.quoteNo)}" data-id="${row.id || ''}"><i class="fas fa-clock-rotate-left"></i></button>
            <button class="icon-action-btn danger" title="Delete" data-action="delete" data-quote="${escapeAttr(row.quoteNo)}" data-id="${row.id || ''}"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('') || `<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px;">No quotations found. Create a new quotation to get started.</td></tr>`;

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
        if (btn.dataset.action === 'duplicate') duplicateQuotation(quote);
      });
    });
  }


  function enhanceSelectDropdown(selectId) {
  const select = document.getElementById(selectId);
  if (!select || select.dataset.enhanced) return;
  select.dataset.enhanced = 'true';

  const wrapper = document.createElement('div');
  wrapper.className = 'custom-select-wrapper';
  select.parentNode.insertBefore(wrapper, select);
  wrapper.appendChild(select);
  select.classList.add('custom-select-native');

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'custom-select-trigger select-input';
  wrapper.appendChild(trigger);

  const menu = document.createElement('div');
  menu.className = 'custom-select-menu hidden';
  wrapper.appendChild(menu);

  function buildMenu() {
    menu.innerHTML = '';
    Array.from(select.options).forEach(opt => {
      const item = document.createElement('div');
      item.className = 'custom-select-option' + (opt.value === select.value ? ' active' : '');
      item.textContent = opt.textContent;
      item.addEventListener('click', () => {
        select.value = opt.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        menu.classList.add('hidden');
        syncTrigger();
      });
      menu.appendChild(item);
    });
  }

  function syncTrigger() {
    const opt = select.options[select.selectedIndex];
    trigger.innerHTML = `<span>${opt ? opt.textContent : ''}</span><i class="fas fa-chevron-down"></i>`;
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = !menu.classList.contains('hidden');
    document.querySelectorAll('.custom-select-menu').forEach(m => m.classList.add('hidden'));
    if (isOpen) return;
    buildMenu();
    menu.classList.remove('hidden');
    menu.style.left = ''; menu.style.right = '0';
    requestAnimationFrame(() => {
      const rect = menu.getBoundingClientRect();
      if (rect.left < 8) { menu.style.right = 'auto'; menu.style.left = (8 - rect.left) + 'px'; }
    });
  });

  syncTrigger();
}
document.addEventListener('click', () => document.querySelectorAll('.custom-select-menu').forEach(m => m.classList.add('hidden')));
['filter-status', 'filter-customer', 'filter-date', 'rows-per-page'].forEach(enhanceSelectDropdown);



  // ============================================================
  // DUPLICATE QUOTATION
  // ============================================================
  async function duplicateQuotation(q) {
    if (!q.id) {
      showToast('Cannot duplicate: quotation ID not found.', 'error');
      return;
    }
    try {
      const result = await duplicateQuotationInBackend(q.id);
      if (result) {
        const newQuote = convertBackendToFrontend(result);
        quotations.unshift(newQuote);
        renderTable();
        showToast(`Quotation ${q.quoteNo} duplicated successfully as ${newQuote.quoteNo}`, 'success');
      } else {
        showToast('Failed to duplicate quotation.', 'error');
      }
    } catch (err) {
      console.error('Error duplicating:', err);
      showToast('Error duplicating quotation.', 'error');
    }
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
  // GST REPORT MARKUP
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

  async function ensureDevanagariFontLoaded() {
    const loaders = [
      `400 20px 'Noto Sans Devanagari'`,
      `600 20px 'Noto Sans Devanagari'`,
      `700 20px 'Noto Sans Devanagari'`
    ];
    try {
      await Promise.race([
        Promise.all(loaders.map(f => document.fonts.load(f).catch(() => null))),
        new Promise(resolve => setTimeout(resolve, 2500))
      ]);
      if (document.fonts.ready) {
        await Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 2500))]);
      }
    } catch (_) {}
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
      showToast('PDF library failed to load.', 'error');
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
  // VIEW MODAL
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

    $('#btn-approve-quote')?.addEventListener('click', () => decideQuotation(q, 'Accepted'));
    $('#btn-reject-quote')?.addEventListener('click', () => decideQuotation(q, 'Rejected'));
    $('#btn-reset-pending')?.addEventListener('click', () => decideQuotation(q, 'Pending'));
  }

  async function decideQuotation(q, newStatus) {
    if (!q || !q.id) {
      showToast('Quotation ID not found.', 'error');
      return;
    }
    const notes = $('#approval-notes-input')?.value.trim() || '';

    try {
      const result = await updateStatusInBackend(q.id, newStatus, notes);
      if (result) {
        const updated = convertBackendToFrontend(result);
        const index = quotations.findIndex(x => x.id === q.id);
        if (index !== -1) {
          quotations[index] = updated;
        }
        renderTable();
        renderApprovalBox(updated);
        const preview = $('#view-invoice-preview');
        if (preview) preview.innerHTML = buildInvoiceMarkup(updated);
        showToast(`${q.quoteNo} marked as ${newStatus}`, newStatus === 'Rejected' ? 'error' : 'success');
      } else {
        showToast('Failed to update status.', 'error');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Error updating status.', 'error');
    }
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
  // REPORT MODAL
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
  // BULK GST REPORT
  // ============================================================
  function openBulkReportModal() {
    const acceptedQuotes = quotations.filter(q => q.status === 'Accepted');
    if (!acceptedQuotes.length) {
      showToast('No Accepted quotations found to generate report.', 'error');
      return;
    }

    const preview = $('#bulk-report-preview');
    if (!preview) return;

    let combinedHtml = `
      <div class="report-header">
        <div class="report-company-name">${escapeHtml(COMPANY.name)}</div>
        <div class="report-company-line">${escapeHtml(COMPANY.address)}</div>
        <div class="report-company-line">Phone no.: ${escapeHtml(COMPANY.phone)} Email: ${escapeHtml(COMPANY.email)}</div>
        <div class="report-company-line">GSTIN: ${escapeHtml(COMPANY.gstin)}, State: ${escapeHtml(COMPANY.state)}</div>
      </div>
      <div class="report-title">Bulk GST Report — All Accepted Quotations</div>
      <div style="font-size:11px;text-align:center;margin-bottom:12px;color:#555;">
        Total: ${acceptedQuotes.length} quotations | Total Value: ${formatINR(acceptedQuotes.reduce((s, q) => s + q.total, 0))}
      </div>
    `;

    acceptedQuotes.forEach((q, idx) => {
      combinedHtml += `
        <div style="page-break-after:always;margin-top:20px;border-top:2px dashed #ccc;padding-top:16px;">
          <div style="font-size:12px;font-weight:700;color:var(--accent-dark);margin-bottom:6px;">${idx + 1}. ${escapeHtml(q.quoteNo)} — ${escapeHtml(q.customer.name || '')}</div>
          ${buildGstReportMarkup(q)}
        </div>
      `;
    });

    preview.innerHTML = combinedHtml;
    openModal('modal-bulk-report');
  }

  $('#btn-bulk-report-download-pdf')?.addEventListener('click', () => {
    downloadInvoicePDF('bulk-report-preview', 'Bulk-GST-Report.pdf');
  });

  $('#btn-bulk-gst-report')?.addEventListener('click', openBulkReportModal);

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
    // Build history from all quotations
    const allHistory = [];
    quotations.forEach(q => {
      if (Array.isArray(q.history)) {
        q.history.forEach(e => {
          allHistory.push({ quoteNo: q.quoteNo, customer: q.customer.name || '', ...e });
        });
      }
    });
    allHistory.sort((a, b) => new Date(b.ts) - new Date(a.ts));

    if (!allHistory.length) {
      list.innerHTML = `<div class="history-empty">No activity recorded yet.</div>`;
    } else {
      list.innerHTML = allHistory.map(e => `
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
  let editingQuote = null;

  function openEditModal(q) {
    editingQuote = q;
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
    if (!editingQuote) return;
    const discountValue = parseFloat($('#edit-discountValue')?.value) || 0;
    const totals = computeTotals(editingQuote.itemsTotal, editingQuote.costs, editingQuote.gstPercent, editingQuote.discountType, discountValue, editingQuote.customer.state);
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

  $('#btn-save-edit')?.addEventListener('click', async () => {
    if (!editingQuote) return;

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

    const newDiscount = parseFloat($('#edit-discountValue')?.value) || 0;
    const newStatus = $('#edit-status')?.value || 'Pending';

    // Update the quotation object
    editingQuote.customer.name = name;
    editingQuote.customer.mobilePrimary = mobile;
    editingQuote.customer.email = email;
    editingQuote.discountValue = newDiscount;
    editingQuote.status = newStatus;

    const totals = computeTotals(editingQuote.itemsTotal, editingQuote.costs, editingQuote.gstPercent, editingQuote.discountType, editingQuote.discountValue, editingQuote.customer.state);
    Object.assign(editingQuote, totals);
    editingQuote.amount = Math.round(totals.total);

    try {
      const result = await updateQuotationInBackend(editingQuote.id, editingQuote);
      if (result) {
        const updated = convertBackendToFrontend(result);
        const index = quotations.findIndex(x => x.id === editingQuote.id);
        if (index !== -1) {
          quotations[index] = updated;
        }
        closeModal('modal-edit');
        renderTable();
        showToast(`${editingQuote.quoteNo} updated successfully`, 'success');
      } else {
        showToast('Failed to update quotation.', 'error');
      }
    } catch (err) {
      console.error('Error updating:', err);
      showToast('Error updating quotation.', 'error');
    }
  });

  // ============================================================
  // DELETE MODAL
  // ============================================================
  let deletingQuote = null;

  function openDeleteModal(q) {
    deletingQuote = q;
    $('#delete-quoteno').textContent = q.quoteNo;
    openModal('modal-delete');
  }

  $('#btn-confirm-delete')?.addEventListener('click', async () => {
    if (!deletingQuote || !deletingQuote.id) {
      showToast('Cannot delete: quotation ID not found.', 'error');
      return;
    }
    try {
      const success = await deleteQuotationInBackend(deletingQuote.id);
      if (success) {
        quotations = quotations.filter(q => q.id !== deletingQuote.id);
        closeModal('modal-delete');
        showToast(`${deletingQuote.quoteNo} deleted`, 'success');
        renderTable();
      } else {
        showToast('Failed to delete quotation.', 'error');
      }
    } catch (err) {
      console.error('Error deleting:', err);
      showToast('Error deleting quotation.', 'error');
    }
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

    const catalog = getProductCatalog();
    const p = findCatalogProduct(catalog, select.value);
    if (!p) return;

    const qty = parseFloat(qtyInput?.value) || 1;
    const rate = parseFloat(rateInput?.value) || Number(p.price) || 0;
    const inCustomerScope = p.inCustomerScope || false;

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
      powerHP: p.powerHP || 0,
      powerKW: p.powerKW || 0,
      inCustomerScope: inCustomerScope,
      imageUrl: p.imageUrl || '',
      shedSize: p.shedSize || '',
      labor: p.labor || 0,
      production: p.production || '',
      power: p.power || ''
    });
    renderItemsTable();

    if (select) select.value = '';
    if (qtyInput) qtyInput.value = 1;
    if (rateInput) rateInput.value = 0;
    showToast(`${p.name} added to quotation`, 'success');
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
    const hasPrefilledData = window._prefilledCustomer !== null;
    ['f-customerName', 'f-mobilePrimary', 'f-mobileSecondary', 'f-email', 'f-address', 'f-city', 'f-state', 'f-pincode', 'f-gst'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !hasPrefilledData) el.value = '';
    });
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
    if (!hasPrefilledData) selectedCustomerId = null;
  }

  function fillCustomerForm(customerData, skipToast) {
    if (!customerData) return;
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

    if (stateField) {
      const event = new Event('input');
      stateField.dispatchEvent(event);
    }

    const editNameField = document.getElementById('edit-customerName');
    const editMobileField = document.getElementById('edit-mobile');
    const editEmailField = document.getElementById('edit-email');
    if (editNameField) editNameField.value = customerData.name || '';
    if (editMobileField) editMobileField.value = customerData.mobilePrimary || '';
    if (editEmailField) editEmailField.value = customerData.email || '';

    if (!skipToast) {
      showToast(`Customer ${customerData.name} details loaded automatically`, 'success');
      sessionStorage.removeItem('quotationCustomerData');
      sessionStorage.removeItem('quotationCustomerId');
      window._prefilledCustomer = null;
    }
  }

  async function openWizard() {
    draftQuoteNo = null;
    resetWizardForm();
    if (window._prefilledCustomer) {
      fillCustomerForm(window._prefilledCustomer);
      selectedCustomerId = window._prefilledCustomer.id || null;
    }
    currentStep = 1;
    goToStep(1);
    openModal('modal-wizard');
    // Always pull the freshest product catalog from the backend before the
    // picker is used (no stale/cached/dummy data).
    await fetchProductsFromBackend();
    populateProductPicker();
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
        id: selectedCustomerId || null,
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
    draftQuoteNo = draftQuoteNo || 'SQ-' + Date.now().toString().slice(-6);
    const record = collectWizardRecord(draftQuoteNo);
    const preview = $('#invoice-preview');
    if (preview) preview.innerHTML = buildInvoiceMarkup(record);
  }

  $('#btn-generate')?.addEventListener('click', async () => {
    const btn = $('#btn-generate');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...'; }

    const record = collectWizardRecord(draftQuoteNo || 'SQ-' + Date.now().toString().slice(-6));
    const savedQuotation = await createQuotationInBackend(record);

    if (savedQuotation) {
      const finalQuotation = convertBackendToFrontend(savedQuotation);
      quotations.unshift(finalQuotation);
      renderTable();

      const preview = $('#invoice-preview');
      if (preview) preview.innerHTML = buildInvoiceMarkup(finalQuotation);
      $('#share-grid')?.classList.remove('hidden');
      if (btn) btn.classList.add('hidden');

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
    } else {
      showToast('Failed to create quotation. Please try again.', 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-file-invoice"></i> Generate Quotation'; }
    }
  });

  // ============================================================
  // FILTER EVENTS
  // ============================================================
  ['search-input', 'filter-status', 'filter-customer', 'filter-date'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', () => { currentPage = 1; renderTable(); });
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
    if ($('#filter-customer')) $('#filter-customer').value = '';
    if ($('#filter-date')) $('#filter-date').value = '';
    currentPage = 1;
    renderTable();
  });

  // ============================================================
  // INIT
  // ============================================================
  async function init() {
    // Check for customer data handed off from Customer Management page
    // (kept in sessionStorage only for the single cross-page handoff — this
    // is navigation state, not a data cache; the customer record itself
    // always lives in the backend).
    const customerDataStr = sessionStorage.getItem('quotationCustomerData');
    if (customerDataStr) {
      try {
        const customerData = JSON.parse(customerDataStr);
        window._prefilledCustomer = customerData;
        setTimeout(() => {
          fillCustomerForm(customerData);
        }, 500);
      } catch (err) {
        console.error('Error loading customer data:', err);
      }
    }

    // Load quotations from backend only
    try {
      const backendQuotations = await fetchQuotationsFromBackend();
      quotations = backendQuotations || [];
    } catch (err) {
      console.error('Error loading quotations:', err);
      quotations = [];
    }

    // Load product catalog from backend only (in-memory, no localStorage)
    await fetchProductsFromBackend();
    populateProductPicker();

    if (window._prefilledCustomer) {
      setTimeout(openWizard, 300);
    }

    togglePaymentFields();
    renderTable();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();