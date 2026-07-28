// TODO: replace mock data array below with API call to /api/quotations

// ============================================================
// Quotation Management — single-module client-side logic (demo data only)
// ============================================================

/* ---------------- Company info (used in sidebar + invoice header) ---------------- */
const COMPANY = {
    name: 'Vaishnokripa Mercantile',
    address: 'Shamshabad, Agra, Uttar Pradesh',
    phone: '+91 6395840394',
    email: 'sales@vaishnokripa.in',
    gstin: '27ABCDE1234F1Z5',
    state: 'Uttar Pradesh',
    logo: '../img/image.png',
    // Bank Details (will be auto-fetched from Settings later)
    bank: {
        accountName: 'Vaishnokripa Mercantile',
        bankName: 'HDFC BANK',
        accountNumber: '50200118886367',
        ifscCode: 'HDFC0003696',
        branch: 'SHASTRIPURAM AGRA'
    }
};

/* =====================================================================
   REFERRAL FUNCTIONS
   ===================================================================== */

// Mock data for referrers (customers and channel partners)
// In production, this would come from an API
const REFERRER_DATA = {
    customers: [
        { id: 'CUST-001', name: 'Amit Sharma', type: 'Existing Customer' },
        { id: 'CUST-002', name: 'Priya Nair', type: 'Existing Customer' },
        { id: 'CUST-003', name: 'Ramesh Traders', type: 'Existing Customer' },
        { id: 'CUST-004', name: 'Suresh Patel', type: 'Existing Customer' },
        { id: 'CUST-005', name: 'Neha Gupta', type: 'Existing Customer' },
        { id: 'CUST-006', name: 'Vikas Enterprises', type: 'Existing Customer' },
        { id: 'CUST-007', name: 'Anjali Deshmukh', type: 'Existing Customer' },
        { id: 'CUST-008', name: 'Rohit Verma', type: 'Existing Customer' },
        { id: 'CUST-009', name: 'Sneha Kulkarni', type: 'Existing Customer' },
        { id: 'CUST-010', name: 'Manoj Yadav', type: 'Existing Customer' },
    ],
    channelPartners: [
        { id: 'CP-001', name: 'Green Energy Solutions', type: 'Channel Partner' },
        { id: 'CP-002', name: 'Solar Hub India', type: 'Channel Partner' },
        { id: 'CP-003', name: 'Eco Power Systems', type: 'Channel Partner' },
        { id: 'CP-004', name: 'Sunrise Renewables', type: 'Channel Partner' },
    ]
};

// Populate the referrer datalist
function populateReferrerList() {
    const datalist = document.getElementById('referrerList');
    if (!datalist) return;
    
    const allReferrers = [
        ...REFERRER_DATA.customers.map(c => ({ ...c, display: `${c.name} (${c.type})` })),
        ...REFERRER_DATA.channelPartners.map(c => ({ ...c, display: `${c.name} (${c.type})` }))
    ];
    
    datalist.innerHTML = allReferrers.map(r => 
        `<option value="${r.name}">${r.display}</option>`
    ).join('');
}

// Get referrer details by name
function getReferrerDetails(name) {
    if (!name) return null;
    const all = [
        ...REFERRER_DATA.customers,
        ...REFERRER_DATA.channelPartners
    ];
    return all.find(r => r.name.toLowerCase() === name.toLowerCase()) || null;
}

// Generate referral code based on referrer name
function generateReferralCode(referrerName) {
    if (!referrerName) return '';
    const parts = referrerName.split(' ');
    const prefix = parts.map(p => p[0]).join('').toUpperCase().slice(0, 3);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${random}`;
}

// Calculate referral amount
function calculateReferralAmount(grandTotal, referralPercent) {
    return grandTotal * (referralPercent / 100);
}

/* =====================================================================
   PRODUCT CATALOG — the wizard's Step 2 "Products & Items" picker reads
   the live product list published by the Product Management module
   (see /product/product.js -> syncProductCatalogToStorage) via
   localStorage. This keeps the two modules in sync on the client without
   a shared backend: add/edit/delete a product there, and it shows up
   here immediately (next time the picker is refreshed).

   FALLBACK_PRODUCTS is only used if Product Management hasn't run yet in
   this browser (e.g. very first visit, storage cleared, etc.) so the
   picker never shows up empty.
   ===================================================================== */
const PRODUCT_CATALOG_STORAGE_KEY = 'solarProductCatalog';

const FALLBACK_PRODUCTS = [
    { id: 'fallback-brick', name: 'FLYASH BRICKS MACHINE 10 CAVITY', category: 'Machines', brand: 'Heavy MS Steel', spec: '180T Pressure, PLC', unit: 'Nos', price: 1900000, stock: null, status: 'Active' },
    { id: 'fallback-panmixer', name: 'PAN MIXER 500 KG', category: 'Machines', brand: 'Rollers replaceable', spec: '1 Stage gear box', unit: 'Nos', price: 10000000, stock: null, status: 'Active' },
    { id: 'fallback-conveyor', name: 'CONVEYOR BELT', category: 'Machines', brand: 'JK Make', spec: '22 Feet, 450mm width', unit: 'Nos', price: 350000, stock: null, status: 'Active' },
    { id: 'fallback-powerpack', name: 'POWER PACK SYSTEM', category: 'Machines', brand: 'Yuken/Polyhydron', spec: '450 ltr, 10 HP', unit: 'Nos', price: 450000, stock: null, status: 'Active' },
    { id: 'fallback-plc', name: 'PLC PANEL FULLY AI BASED', category: 'Machines', brand: 'PLC', spec: 'Hydraulic speed control', unit: 'Nos', price: 400000, stock: null, status: 'Active' },
    { id: 'fallback-trolly', name: 'BRICK TROLLY', category: 'Accessories', brand: '', spec: '', unit: 'Nos', price: 7500, stock: null, status: 'Active' },
    { id: 'fallback-material-trolly', name: 'MATERIAL TROLLY', category: 'Accessories', brand: '', spec: '', unit: 'Nos', price: 9000, stock: null, status: 'Active' },
    { id: 'fallback-vibrator', name: 'VIBRATOR TABLE', category: 'Accessories', brand: '', spec: '', unit: 'Nos', price: 90000, stock: null, status: 'Active' },
    { id: 'fallback-mixer', name: 'MIXER MACHINE WITH MOTOR', category: 'Machines', brand: '', spec: '', unit: 'Nos', price: 150000, stock: null, status: 'Active' },
    { id: 'fallback-colour-mixer', name: 'COLOUR MIXER', category: 'Machines', brand: '', spec: '', unit: 'Nos', price: 90000, stock: null, status: 'Active' },
];

let itemIdCounter = 1;
function newItemId() { return 'it' + (itemIdCounter++); }

/* Reads the latest product catalog from Product Management (localStorage),
   filtered to Active products only. Falls back to a small built-in list
   so the picker is never empty on a fresh browser. */
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
    } catch (e) { /* ignore parse errors and fall back below */ }
    return FALLBACK_PRODUCTS;
}

/* Populates the Step 2 product-selection dropdown from the live catalog,
   grouped by category. Call this whenever the wizard is (re)opened so it
   reflects any changes made in Product Management since it was last built. */
function populateProductPicker() {
    const select = document.getElementById('product-catalog-select');
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
                ${byCategory[cat].map(p => `<option value="${escapeAttr(p.id)}">${escapeAttr(p.name)}${p.brand ? ' — ' + escapeAttr(p.brand) : ''} · ₹${Number(p.price || 0).toLocaleString('en-IN')}/${escapeAttr(p.unit || 'Nos')}</option>`).join('')}
            </optgroup>
        `).join('');
}

document.getElementById('btn-add-catalog-product')?.addEventListener('click', () => {
    const select = document.getElementById('product-catalog-select');
    const qtyInput = document.getElementById('product-picker-qty');
    const rateInput = document.getElementById('product-picker-rate');
    if (!select || !select.value) { showToast('Select a product first.', 'error'); return; }

    const catalog = window.__quotationProductCatalog || [];
    const p = catalog.find(c => String(c.id) === select.value);
    if (!p) return;

    const qty = parseFloat(qtyInput.value) || 1;
    const rate = parseFloat(rateInput.value) || Number(p.price) || 0;
    wizardItems.push({
        id: newItemId(),
        name: p.name,
        qty: qty,
        rate: rate
    });
    renderItemsTable();

    // Reset the picker so the next product can be selected and added
    select.value = '';
    qtyInput.value = 1;
    rateInput.value = 0;
    showToast(`${p.name} added to quotation`, 'success');
});

document.getElementById('chip-custom')?.addEventListener('click', () => {
    wizardItems.push({ id: newItemId(), name: '', qty: 1, rate: 0 });
    renderItemsTable();
});

/* ---------------- Items table (Step 2) ---------------- */
let wizardItems = [];

function itemsSubtotal(items) {
    return items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.rate) || 0), 0);
}

function renderItemsTable() {
    const tbody = document.getElementById('items-tbody');
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

    // Wire per-row events
    tbody.querySelectorAll('tr[data-id]').forEach(row => {
        const id = row.dataset.id;
        const item = wizardItems.find(i => i.id === id);
        row.querySelector('.item-name')?.addEventListener('input', e => { item.name = e.target.value; });
        row.querySelector('.item-qty')?.addEventListener('input', e => { item.qty = e.target.value; updateItemAmount(item); });
        row.querySelector('.item-rate')?.addEventListener('input', e => { item.rate = e.target.value; updateItemAmount(item); });
        row.querySelector('.item-remove')?.addEventListener('click', () => {
            wizardItems = wizardItems.filter(i => i.id !== id);
            renderItemsTable();
        });
    });

    updateItemsSubtotalDisplay();
}

function updateItemAmount(item) {
    const amt = (Number(item.qty) || 0) * (Number(item.rate) || 0);
    const cell = document.getElementById('amt-' + item.id);
    if (cell) cell.textContent = formatINR(amt);
    updateItemsSubtotalDisplay();
}

function updateItemsSubtotalDisplay() {
    const total = itemsSubtotal(wizardItems);
    const el = document.getElementById('items-subtotal');
    if (el) el.textContent = formatINR(total);
    const costItems = document.getElementById('cost-items');
    if (costItems) costItems.textContent = formatINR(total);
}

function escapeAttr(str) {
    return String(str ?? '').replace(/"/g, '&quot;');
}

/* =====================================================================
   REFERRAL UI FUNCTIONS
   ===================================================================== */

// Toggle referral section visibility
function toggleReferralSection() {
    const isChecked = document.getElementById('f-isReferred').checked;
    const fields = ['referredByField', 'referrerTypeField', 'referralCodeField', 'referralPercentField', 'referralHint'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = isChecked ? '' : 'none';
    });
    if (!isChecked) {
        document.getElementById('f-referredBy').value = '';
        document.getElementById('f-referrerType').value = '';
        document.getElementById('f-referralCode').value = '';
        document.getElementById('f-referralPercent').value = 5;
        document.getElementById('referralHintText').textContent = 'Referral details will be used for commission calculation. Final payout approval happens in Channel Partner module.';
    }
}

// Handle referrer selection
function handleReferrerSelection() {
    const name = document.getElementById('f-referredBy').value.trim();
    if (!name) {
        document.getElementById('f-referralCode').value = '';
        document.getElementById('f-referrerType').value = '';
        return;
    }
    const details = getReferrerDetails(name);
    if (details) {
        document.getElementById('f-referrerType').value = details.type;
        document.getElementById('f-referralCode').value = generateReferralCode(name);
        document.getElementById('referralHintText').textContent = `Referrer: ${details.name} (${details.type}) — Referral code generated.`;
    } else {
        // Manual entry - keep the name but let user select type
        document.getElementById('f-referralCode').value = generateReferralCode(name);
        document.getElementById('referralHintText').textContent = 'Manual referrer entry. Please select the referrer type.';
    }
}

// Update referral amount in summary
function updateReferralAmountInSummary(grandTotal) {
    const referralPercent = parseFloat(document.getElementById('f-referralPercent').value) || 0;
    const isReferred = document.getElementById('f-isReferred').checked;
    const referralAmount = isReferred ? calculateReferralAmount(grandTotal, referralPercent) : 0;
    
    const summaryEl = document.getElementById('summary-gst');
    if (!summaryEl) return;
    
    // Check if referral row already exists
    let referralRow = summaryEl.querySelector('.referral-row');
    if (isReferred && referralPercent > 0) {
        if (referralRow) {
            referralRow.innerHTML = `<span>Referral Amount (Estimated)</span><b>${formatINR(referralAmount)}</b>`;
        } else {
            const row = document.createElement('div');
            row.className = 'row referral-row';
            row.innerHTML = `<span>Referral Amount (Estimated)</span><b>${formatINR(referralAmount)}</b>`;
            summaryEl.appendChild(row);
        }
    } else {
        if (referralRow) referralRow.remove();
    }
}

/* =====================================================================
   QUOTATION DATA MODEL
   ===================================================================== */
function computeTotals(itemsTotal, costs, gstPercent, discountType, discountValue) {
    const subtotal = itemsTotal + (costs.installation || 0) + (costs.transport || 0) + (costs.other || 0);
    const discountAmount = discountType === 'percent' ? subtotal * ((discountValue || 0) / 100) : (discountValue || 0);
    const taxable = Math.max(0, subtotal - discountAmount);
    const sgst = taxable * (gstPercent / 2 / 100);
    const cgst = taxable * (gstPercent / 2 / 100);
    const total = taxable + sgst + cgst;
    return { subtotal, discountAmount, sgst, cgst, total };
}

function numberToWordsIndian(num) {
    num = Math.round(num);
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

let quoteCounter = 1000;
function nextQuoteNo() { quoteCounter += 1; return `SQ-${quoteCounter}`; }

function makeQuotation(overrides = {}) {
    const base = {
        quoteNo: nextQuoteNo(),
        date: new Date().toISOString().slice(0, 10),
        status: 'Pending',
        customer: {
            name: '', company: '', mobile: '', email: '', address: '', city: '', state: '',
            pincode: '', gst: ''
        },
        siteType: '',
        deliveryTimeline: '45 days from advance payment',
        items: [],
        costs: { installation: 0, transport: 0, otherLabel: 'Other Charges', other: 0 },
        gstPercent: 18,
        discountType: 'percent',
        discountValue: 0,
        advance: 0,
        // New fields for quotation form additions
        bank: { ...COMPANY.bank },
        terms: `GST Extra.\nDelivery after Full & Final Payment.\nAll Cheques & Drafts in favour of [Company Name].\nJurisdiction [City] only.\nFreight Extra.`,
        paymentTerms: { advance: 50, material: 25, installation: 15, balance: 10 },
        paymentType: 'full',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        // Referral fields
        referral: {
            isReferred: false,
            referredBy: '',
            referrerType: '',
            referralCode: '',
            referralPercent: 5,
            referralAmount: 0
        }
    };
    const merged = { ...base, ...(overrides || {}) };
    merged.customer = { ...base.customer, ...(overrides?.customer || {}) };
    merged.costs = { ...base.costs, ...(overrides?.costs || {}) };
    if (overrides?.items) merged.items = overrides.items;
    if (overrides?.bank) merged.bank = { ...base.bank, ...(overrides.bank || {}) };
    if (overrides?.paymentTerms) merged.paymentTerms = { ...base.paymentTerms, ...(overrides.paymentTerms || {}) };
    if (overrides?.referral) merged.referral = { ...base.referral, ...(overrides.referral || {}) };
    if (overrides?.paymentType) merged.paymentType = overrides.paymentType;

    const itTotal = itemsSubtotal(merged.items);
    const totals = computeTotals(itTotal, merged.costs, merged.gstPercent, merged.discountType, merged.discountValue);
    Object.assign(merged, totals);
    merged.itemsTotal = itTotal;
    merged.amount = Math.round(totals.total);
    merged.balance = Math.round(totals.total - merged.advance);
    
    // Calculate referral amount
    if (merged.referral.isReferred && merged.referral.referralPercent > 0) {
        merged.referral.referralAmount = calculateReferralAmount(totals.total, merged.referral.referralPercent);
    } else {
        merged.referral.referralAmount = 0;
    }
    
    return merged;
}

let quotations = [
    makeQuotation({ 
        customer: { name: 'YASH PAL SINGH', mobile: '6395840394', email: 'yash@example.com', address: 'Shamshabad', city: 'Agra', state: 'Uttar Pradesh', pincode: '282001' },
        items: [
            { id: 'it1', name: 'FLYASH BRICKS MACHINE 10 CAVITY', qty: 1, rate: 1900000 },
            { id: 'it2', name: 'PAN MIXER 500 KG', qty: 2, rate: 10000000 },
            { id: 'it3', name: 'CONVEYOR BELT', qty: 1, rate: 350000 },
            { id: 'it4', name: 'POWER PACK SYSTEM', qty: 1, rate: 450000 },
            { id: 'it5', name: 'PLC PANEL FULLY AI BASED', qty: 1, rate: 400000 },
        ],
        status: 'Pending',
        date: '2026-07-15',
        gstPercent: 18,
        terms: `GST Extra.\nDelivery after Full & Final Payment.\nAll Cheques & Drafts in favour of Vaishnokripa Mercantile.\nJurisdiction Agra only.\nFreight Extra.`,
        bank: { accountName: 'Vaishnokripa Mercantile', bankName: 'HDFC BANK', accountNumber: '50200118886367', ifscCode: 'HDFC0003696', branch: 'SHASTRIPURAM AGRA' }
    }),
    makeQuotation({ 
        customer: { name: 'Ramesh Traders', company: 'Ramesh Traders', mobile: '9876500001', email: 'ramesh.traders@example.com', address: 'MG Road', city: 'Ahmedabad', state: 'Gujarat', pincode: '380001', gst: '24ABCDE5678F1Z2' },
        items: [
            { id: 'it6', name: 'FLYASH BRICKS MACHINE 10 CAVITY', qty: 2, rate: 1900000 },
            { id: 'it7', name: 'PAN MIXER 500 KG', qty: 3, rate: 10000000 },
        ],
        status: 'Accepted',
        date: '2026-07-14',
        referral: { isReferred: true, referredBy: 'Priya Nair', referrerType: 'Existing Customer', referralCode: 'PN1234', referralPercent: 5, referralAmount: 0 },
        gstPercent: 18
    }),
    makeQuotation({ 
        customer: { name: 'Priya Nair', mobile: '9876500002', email: 'priya.nair@example.com', address: 'Marine Drive', city: 'Kochi', state: 'Karnataka', pincode: '682001' },
        items: [
            { id: 'it8', name: 'CONVEYOR BELT', qty: 2, rate: 350000 },
            { id: 'it9', name: 'VIBRATOR TABLE', qty: 1, rate: 90000 },
        ],
        status: 'Rejected',
        date: '2026-07-13',
        gstPercent: 18
    }),
    makeQuotation({ 
        customer: { name: 'Suresh Patel', mobile: '9876500003', email: 'suresh.patel@example.com', address: 'Ring Road', city: 'Rajkot', state: 'Gujarat', pincode: '360001' },
        items: [
            { id: 'it10', name: 'FLYASH BRICKS MACHINE 10 CAVITY', qty: 1, rate: 1900000 },
            { id: 'it11', name: 'PAN MIXER 500 KG', qty: 1, rate: 10000000 },
            { id: 'it12', name: 'CONVEYOR BELT', qty: 1, rate: 350000 },
            { id: 'it13', name: 'PLC PANEL FULLY AI BASED', qty: 1, rate: 400000 },
        ],
        status: 'Pending',
        date: '2026-07-12',
        referral: { isReferred: true, referredBy: 'Green Energy Solutions', referrerType: 'Channel Partner', referralCode: 'GES5678', referralPercent: 5, referralAmount: 0 },
        gstPercent: 18
    }),
    makeQuotation({ 
        customer: { name: 'Neha Gupta', mobile: '9876500004', email: 'neha.gupta@example.com', address: 'Civil Lines', city: 'Jaipur', state: 'Rajasthan', pincode: '302001' },
        items: [
            { id: 'it14', name: 'POWER PACK SYSTEM', qty: 1, rate: 450000 },
            { id: 'it15', name: 'VIBRATOR TABLE', qty: 1, rate: 90000 },
        ],
        status: 'Accepted',
        date: '2026-07-11',
        gstPercent: 18
    }),
    makeQuotation({ 
        customer: { name: 'Vikas Enterprises', company: 'Vikas Enterprises', mobile: '9876500005', email: 'vikas.ent@example.com', address: 'Industrial Area', city: 'Delhi', state: 'Delhi', pincode: '110001', gst: '07ABCDE1111F1Z9' },
        items: [
            { id: 'it16', name: 'FLYASH BRICKS MACHINE 10 CAVITY', qty: 3, rate: 1900000 },
            { id: 'it17', name: 'PAN MIXER 500 KG', qty: 4, rate: 10000000 },
        ],
        status: 'Pending',
        date: '2026-07-10',
        gstPercent: 18
    }),
    makeQuotation({ 
        customer: { name: 'Anjali Deshmukh', mobile: '9876500006', email: 'anjali.d@example.com', address: 'FC Road', city: 'Pune', state: 'Maharashtra', pincode: '411005' },
        items: [
            { id: 'it18', name: 'COLOUR MIXER', qty: 1, rate: 90000 },
            { id: 'it19', name: 'MIXER MACHINE WITH MOTOR', qty: 1, rate: 150000 },
        ],
        status: 'Accepted',
        date: '2026-07-09',
        gstPercent: 18
    }),
    makeQuotation({ 
        customer: { name: 'Rohit Verma', mobile: '9876500007', email: 'rohit.verma@example.com', address: 'Anna Nagar', city: 'Chennai', state: 'Tamil Nadu', pincode: '600040' },
        items: [
            { id: 'it20', name: 'FLYASH BRICKS MACHINE 10 CAVITY', qty: 1, rate: 1900000 },
            { id: 'it21', name: 'CONVEYOR BELT', qty: 2, rate: 350000 },
        ],
        status: 'Rejected',
        date: '2026-07-08',
        gstPercent: 18
    }),
    makeQuotation({ 
        customer: { name: 'Sneha Kulkarni', mobile: '9876500008', email: 'sneha.k@example.com', address: 'Deccan Gymkhana', city: 'Pune', state: 'Maharashtra', pincode: '411004' },
        items: [
            { id: 'it22', name: 'POWER PACK SYSTEM', qty: 2, rate: 450000 },
            { id: 'it23', name: 'PLC PANEL FULLY AI BASED', qty: 1, rate: 400000 },
        ],
        status: 'Pending',
        date: '2026-07-07',
        gstPercent: 18
    }),
    makeQuotation({ 
        customer: { name: 'Manoj Yadav', mobile: '9876500009', email: 'manoj.y@example.com', address: 'Hazratganj', city: 'Lucknow', state: 'Delhi', pincode: '226001' },
        items: [
            { id: 'it24', name: 'FLYASH BRICKS MACHINE 10 CAVITY', qty: 1, rate: 1900000 },
            { id: 'it25', name: 'PAN MIXER 500 KG', qty: 2, rate: 10000000 },
            { id: 'it26', name: 'CONVEYOR BELT', qty: 1, rate: 350000 },
            { id: 'it27', name: 'POWER PACK SYSTEM', qty: 1, rate: 450000 },
            { id: 'it28', name: 'PLC PANEL FULLY AI BASED', qty: 1, rate: 400000 },
        ],
        status: 'Accepted',
        date: '2026-07-06',
        gstPercent: 18
    }),
];

/* =====================================================================
   SIDEBAR / TOPBAR CHROME
   This block is written to match the Dashboard page 1:1 — same element
   ids (sidebar, sidebarToggle, toggleIcon, sidebarBackdrop, notifBtn,
   notifDropdown, profileBtn, profileDropdown) and the same CSS classes
   (.sidebar.expanded / .sidebar-backdrop.visible / .topbar-dropdown).
   ===================================================================== */
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const toggleIcon = document.getElementById('toggleIcon');
const sidebarBackdrop = document.getElementById('sidebarBackdrop');

let sidebarExpanded = false;

function isDrawerBreakpoint() {
    return window.innerWidth < 1024; // matches the CSS's @media (max-width: 1023px) drawer rule
}

function setSidebarExpanded(expand) {
    sidebarExpanded = expand;
    sidebar?.classList.toggle('expanded', expand);
    sidebar?.classList.toggle('collapsed', !expand);
    toggleIcon?.classList.toggle('rotate-180', expand);
    // The backdrop only makes sense on phone/tablet, where the sidebar
    // opens as an overlay drawer instead of pushing the layout.
    if (isDrawerBreakpoint()) {
        sidebarBackdrop?.classList.toggle('visible', expand);
    } else {
        sidebarBackdrop?.classList.remove('visible');
    }
}

// Start collapsed (icon rail), same as the Dashboard's default state
setSidebarExpanded(false);

sidebarToggle?.addEventListener('click', () => setSidebarExpanded(!sidebarExpanded));
sidebarBackdrop?.addEventListener('click', () => setSidebarExpanded(false));

// Tapping a nav item on phone/tablet should close the drawer behind it
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        if (isDrawerBreakpoint() && sidebarExpanded) setSidebarExpanded(false);
    });
});

// If the viewport grows past the drawer breakpoint while the drawer is
// open, drop the backdrop/overlay behaviour so it doesn't get stuck.
window.addEventListener('resize', () => {
    if (!isDrawerBreakpoint()) sidebarBackdrop?.classList.remove('visible');
});

/* ---------------- Topbar dropdowns (notification / profile) ---------------- */
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

/* ---------------- Generic modal open/close ---------------- */
function openModal(id) { document.getElementById(id).classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
    document.body.style.overflow = '';
    // Reopening the wizard should always start with a fresh quotation number
    if (id === 'modal-wizard') draftQuoteNo = null;
}

document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
});
document.querySelectorAll('.modal-overlay').forEach(ov => {
    ov.addEventListener('click', (e) => {
        if (e.target === ov) closeModal(ov.id);
    });
});

/* ---------------- Toasts ---------------- */
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i> ${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

function formatINR(n) {
    return '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
}

/* =====================================================================
   TABLE: search / filter / sort / pagination / stats
   ===================================================================== */
let sortKey = null, sortDir = 1, currentPage = 1, rowsPerPage = 10;

function refreshSizeFilterOptions() {
    const sel = document.getElementById('filter-size');
    const current = sel.value;
    const types = [...new Set(quotations.map(q => q.siteType || 'General'))];
    sel.innerHTML = `<option value="">All Types</option>` + types.map(s => `<option value="${s}">${s}</option>`).join('');
    sel.value = types.includes(current) ? current : '';
}

function badgeClass(status) {
    if (status === 'Accepted') return 'badge-accepted';
    if (status === 'Rejected') return 'badge-rejected';
    return 'badge-pending';
}

function referralBadgeClass(isReferred) {
    return isReferred ? 'badge-referred' : 'badge-direct';
}

function referralBadgeText(isReferred) {
    return isReferred ? 'Referred' : 'Direct';
}

function getFiltered() {
    const q = document.getElementById('search-input').value.trim().toLowerCase();
    const status = document.getElementById('filter-status').value;
    const size = document.getElementById('filter-size').value;
    let list = quotations.filter(row => {
        const matchesSearch = !q || row.customer.name.toLowerCase().includes(q) || row.quoteNo.toLowerCase().includes(q);
        const matchesStatus = !status || row.status === status;
        const matchesSize = !size || (row.siteType || 'General') === size;
        return matchesSearch && matchesStatus && matchesSize;
    });
    if (sortKey) {
        list = [...list].sort((a, b) => {
            const map = { quoteNo: a.quoteNo, customer: a.customer.name, amount: a.amount, status: a.status, date: a.date, referral: a.referral?.isReferred ? 1 : 0 };
            const mapB = { quoteNo: b.quoteNo, customer: b.customer.name, amount: b.amount, status: b.status, date: b.date, referral: b.referral?.isReferred ? 1 : 0 };
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
    document.getElementById('stat-total').textContent = quotations.length;
    const todayStr = new Date().toISOString().slice(0, 10);
    document.getElementById('stat-today').textContent = quotations.filter(q => q.date === todayStr).length;
    document.getElementById('stat-value').textContent = formatINR(quotations.reduce((s, q) => s + q.amount, 0));
    document.getElementById('stat-accepted').textContent = quotations.filter(q => q.status === 'Accepted').length;
    document.getElementById('stat-rejected').textContent = quotations.filter(q => q.status === 'Rejected').length;
    document.getElementById('stat-pending').textContent = quotations.filter(q => q.status === 'Pending').length;
}

function buildPaginationButtons(totalPages) {
    // Show all pages up to 7; beyond that, collapse the middle with an ellipsis
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
    refreshSizeFilterOptions();
    const filtered = getFiltered();
    const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * rowsPerPage;
    const pageRows = filtered.slice(start, start + rowsPerPage);

    const tbody = document.getElementById('quotation-tbody');
    tbody.innerHTML = pageRows.map(row => {
        const isReferred = row.referral?.isReferred || false;
        return `
        <tr>
            <td data-label="Quotation No."><b>${row.quoteNo}</b></td>
            <td data-label="Customer">${row.customer.name || '—'}</td>
            <td data-label="Amount">${formatINR(row.amount)}</td>
            <td data-label="Status"><span class="badge ${badgeClass(row.status)}">${row.status}</span></td>
            <td data-label="Referral"><span class="badge ${referralBadgeClass(isReferred)}">${referralBadgeText(isReferred)}</span></td>
            <td data-label="Date">${new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
            <td data-label="Actions" class="text-right">
                <div class="action-icons">
                    <button class="icon-action-btn" title="View" data-action="view" data-quote="${row.quoteNo}"><i class="fas fa-eye"></i></button>
                    <button class="icon-action-btn" title="Edit" data-action="edit" data-quote="${row.quoteNo}"><i class="fas fa-pen"></i></button>
                    <button class="icon-action-btn danger" title="Delete" data-action="delete" data-quote="${row.quoteNo}"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `}).join('') || `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:24px;">No quotations match your filters.</td></tr>`;

    // Range text ("Showing 1-10 of 34")
    const rangeEl = document.getElementById('table-range');
    if (rangeEl) {
        rangeEl.textContent = filtered.length
            ? `· Showing ${start + 1}-${Math.min(start + rowsPerPage, filtered.length)} of ${filtered.length}`
            : '· No results';
    }

    const pagination = document.getElementById('pagination');
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

['search-input', 'filter-status', 'filter-size'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => { currentPage = 1; renderTable(); });
});
document.getElementById('rows-per-page').addEventListener('change', (e) => {
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

// Reset Filters button
document.getElementById('btn-reset-filters')?.addEventListener('click', () => {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-size').value = '';
    currentPage = 1;
    renderTable();
});

/* =====================================================================
   INVOICE MARKUP (shared by wizard preview + view modal)
   ===================================================================== */
function buildInvoiceMarkup(q) {
    const items = (q.items || []).map(it => ({
        name: it.name || '—',
        qty: it.qty,
        rate: it.rate,
        amount: (Number(it.qty) || 0) * (Number(it.rate) || 0)
    }));
    if (q.costs.installation) items.push({ name: 'Installation Charges', type: 'Labor Cost', qty: 1, unit: 'Job', rate: q.costs.installation, amount: q.costs.installation });
    if (q.costs.transport) items.push({ name: 'Transportation Charges', type: 'Logistics', qty: 1, unit: 'Job', rate: q.costs.transport, amount: q.costs.transport });
    if (q.costs.other) items.push({ name: q.costs.otherLabel || 'Other Charges', type: 'Other', qty: 1, unit: '—', rate: q.costs.other, amount: q.costs.other });

    const rowsHtml = items.map((item, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${item.name}</td>
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
    const referral = q.referral || { isReferred: false, referredBy: '', referrerType: '', referralCode: '', referralPercent: 5, referralAmount: 0 };
    const paymentType = q.paymentType || 'full';

    // Referral info HTML (only show if referred)
    const referralHtml = referral.isReferred ? `
        <div class="inv-referral-info">
            <div class="inv-label">Referral Information:</div>
            <table>
                <tr><td>Referred By</td><td>${referral.referredBy || '—'}</td></tr>
                <tr><td>Referrer Type</td><td>${referral.referrerType || '—'}</td></tr>
                <tr><td>Referral Code</td><td>${referral.referralCode || '—'}</td></tr>
                <tr><td>Referral %</td><td>${referral.referralPercent || 0}%</td></tr>
                <tr class="total-row"><td>Referral Amount</td><td>${formatINR(referral.referralAmount || 0)}</td></tr>
            </table>
        </div>
    ` : '';

    // Payment schedule display
    let paymentScheduleHtml = '';
    if (paymentType === 'full') {
        paymentScheduleHtml = `<tr><td>Full Advance</td><td>100%</td></tr>`;
    } else {
        paymentScheduleHtml = `
            <tr><td>Advance</td><td>${paymentTerms.advance || 0}%</td></tr>
            <tr><td>Before Dispatch</td><td>${paymentTerms.material || 0}%</td></tr>
            <tr><td>On Delivery</td><td>${paymentTerms.installation || 0}%</td></tr>
            <tr><td>Balance</td><td>${paymentTerms.balance || 0}%</td></tr>
        `;
    }

    return `
        <div class="inv-header">
            <div class="inv-company">
                <div class="inv-company-name">${COMPANY.name}</div>
                <div>Address: ${COMPANY.address}</div>
                <div>Phone No.: ${COMPANY.phone}</div>
                <div>Email ID: ${COMPANY.email}</div>
                <div>GSTIN: ${COMPANY.gstin}</div>
                <div>State: ${COMPANY.state}</div>
            </div>
            <img src="${COMPANY.logo}" alt="Company Logo" class="inv-logo" crossorigin="anonymous">
        </div>
        <div class="inv-title">Quotation</div>
        <div class="inv-parties">
            <div class="inv-bill-to">
                <div class="inv-label">Bill To:</div>
                <div>Name: ${q.customer.name || '—'}</div>
                <div>Address: ${q.customer.address || '—'}${q.customer.city ? ', ' + q.customer.city : ''}</div>
                <div>Contact No.: ${q.customer.mobile || '—'}</div>
                <div>GSTIN No.: ${q.customer.gst || '—'}</div>
                <div>State: ${q.customer.state || '—'}</div>
                ${q.siteType ? `<div>Site Type: ${q.siteType}</div>` : ''}
                ${q.deliveryTimeline ? `<div>Delivery Timeline: ${q.deliveryTimeline}</div>` : ''}
                <span class="badge ${badgeCls} inv-status">${q.status}</span>
            </div>
            <div class="inv-meta">
                <div><span>Quotation No.:</span> <b>${q.quoteNo}</b></div>
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

                <!-- Bank Details -->
                <div class="inv-bank-details">
                    <div class="inv-label">Bank Details:</div>
                    <table>
                        <tr><td>Account Name</td><td>${bank.accountName || '—'}</td></tr>
                        <tr><td>Bank Name</td><td>${bank.bankName || '—'}</td></tr>
                        <tr><td>Account Number</td><td>${bank.accountNumber || '—'}</td></tr>
                        <tr><td>IFSC Code</td><td>${bank.ifscCode || '—'}</td></tr>
                        <tr><td>Branch</td><td>${bank.branch || '—'}</td></tr>
                    </table>
                </div>

                <!-- Payment Schedule -->
                <div class="inv-payment-terms">
                    <div class="inv-label">Payment Schedule:</div>
                    <table>
                        ${paymentScheduleHtml}
                    </table>
                </div>

                <!-- Referral Info -->
                ${referralHtml}

                <!-- Terms & Conditions -->
                <div class="inv-terms">
                    <div class="inv-label">Terms & Conditions</div>
                    <div class="terms-text">${(q.terms || '').replace(/\n/g, '<br>')}</div>
                </div>
            </div>
            <table class="inv-totals-table">
                <tr><td>Sub Total</td><td>${formatINR(q.subtotal)}</td></tr>
                <tr><td>Discount</td><td>${formatINR(q.discountAmount)}</td></tr>
                <tr><td>SGST</td><td>${formatINR(q.sgst)}</td></tr>
                <tr><td>CGST</td><td>${formatINR(q.cgst)}</td></tr>
                <tr class="total-row"><td>Grand Total</td><td>${formatINR(q.total)}</td></tr>
                ${referral.isReferred && referral.referralAmount > 0 ? `<tr class="referral-row"><td>Referral Amount</td><td>${formatINR(referral.referralAmount)}</td></tr>` : ''}
            </table>
        </div>
        <div class="inv-seal">Company Seal & Signature</div>
    `;
}

/* ---------------- PDF download (used by wizard "Generate" + view modal + share buttons) ---------------- */
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

/* =====================================================================
   VIEW MODAL (read-only)
   ===================================================================== */
let viewingQuoteNo = null;

function openViewModal(q) {
    viewingQuoteNo = q.quoteNo;
    document.getElementById('view-invoice-preview').innerHTML = buildInvoiceMarkup(q);
    openModal('modal-view');
}

document.getElementById('btn-view-download-pdf').addEventListener('click', () => {
    if (!viewingQuoteNo) return;
    downloadInvoicePDF('view-invoice-preview', `${viewingQuoteNo}.pdf`);
});

/* =====================================================================
   EDIT MODAL (essential fields only)
   ===================================================================== */
let editingQuoteNo = null;

function openEditModal(q) {
    editingQuoteNo = q.quoteNo;
    document.getElementById('edit-quoteno').textContent = q.quoteNo;
    document.getElementById('edit-customerName').value = q.customer.name;
    document.getElementById('edit-mobile').value = q.customer.mobile;
    document.getElementById('edit-email').value = q.customer.email;
    document.getElementById('edit-installation').value = q.costs.installation;
    document.getElementById('edit-transport').value = q.costs.transport;
    document.getElementById('edit-discountValue').value = q.discountValue;
    document.getElementById('edit-status').value = q.status;
    ['err-edit-customerName', 'err-edit-mobile', 'err-edit-email'].forEach(id => document.getElementById(id).textContent = '');
    updateEditSummary();
    openModal('modal-edit');
}

function updateEditSummary() {
    const q = quotations.find(x => x.quoteNo === editingQuoteNo);
    if (!q) return;
    const installation = parseFloat(document.getElementById('edit-installation').value) || 0;
    const transport = parseFloat(document.getElementById('edit-transport').value) || 0;
    const discountValue = parseFloat(document.getElementById('edit-discountValue').value) || 0;
    const costs = { ...q.costs, installation, transport };
    const totals = computeTotals(q.itemsTotal, costs, q.gstPercent, q.discountType, discountValue);
    document.getElementById('edit-summary').innerHTML = `
        <div class="row"><span>Sub Total</span><b>${formatINR(totals.subtotal)}</b></div>
        <div class="row"><span>Discount</span><b>- ${formatINR(totals.discountAmount)}</b></div>
        <div class="row"><span>SGST + CGST</span><b>${formatINR(totals.sgst + totals.cgst)}</b></div>
        <div class="row total"><span>New Total</span><b>${formatINR(totals.total)}</b></div>
    `;
}
['edit-installation', 'edit-transport', 'edit-discountValue'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateEditSummary);
});

document.getElementById('btn-save-edit').addEventListener('click', () => {
    const q = quotations.find(x => x.quoteNo === editingQuoteNo);
    if (!q) return;

    const name = document.getElementById('edit-customerName').value.trim();
    const mobile = document.getElementById('edit-mobile').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    let valid = true;

    if (!name) { document.getElementById('err-edit-customerName').textContent = 'Required'; valid = false; }
    else document.getElementById('err-edit-customerName').textContent = '';

    if (!/^[6-9]\d{9}$/.test(mobile)) { document.getElementById('err-edit-mobile').textContent = 'Enter valid 10-digit mobile'; valid = false; }
    else document.getElementById('err-edit-mobile').textContent = '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { document.getElementById('err-edit-email').textContent = 'Enter valid email'; valid = false; }
    else document.getElementById('err-edit-email').textContent = '';

    if (!valid) { showToast('Please fix the highlighted fields.', 'error'); return; }

    q.customer.name = name;
    q.customer.mobile = mobile;
    q.customer.email = email;
    q.costs.installation = parseFloat(document.getElementById('edit-installation').value) || 0;
    q.costs.transport = parseFloat(document.getElementById('edit-transport').value) || 0;
    q.discountValue = parseFloat(document.getElementById('edit-discountValue').value) || 0;
    q.status = document.getElementById('edit-status').value;

    const totals = computeTotals(q.itemsTotal, q.costs, q.gstPercent, q.discountType, q.discountValue);
    Object.assign(q, totals);
    q.amount = Math.round(totals.total);
    q.balance = Math.round(totals.total - q.advance);
    
    // Recalculate referral amount
    if (q.referral?.isReferred && q.referral.referralPercent > 0) {
        q.referral.referralAmount = calculateReferralAmount(totals.total, q.referral.referralPercent);
    }

    closeModal('modal-edit');
    renderTable();
    showToast(`${q.quoteNo} updated successfully`, 'success');
});

/* =====================================================================
   DELETE MODAL (confirmation)
   ===================================================================== */
let deletingQuoteNo = null;

function openDeleteModal(q) {
    deletingQuoteNo = q.quoteNo;
    document.getElementById('delete-quoteno').textContent = q.quoteNo;
    openModal('modal-delete');
}

document.getElementById('btn-confirm-delete').addEventListener('click', () => {
    quotations = quotations.filter(q => q.quoteNo !== deletingQuoteNo);
    closeModal('modal-delete');
    showToast(`${deletingQuoteNo} deleted`, 'success');
    renderTable();
});

/* =====================================================================
   NEW QUOTATION WIZARD (inside modal-wizard)
   ===================================================================== */
let currentStep = 1;
const totalWizardSteps = 5;

// Payment terms validation
function validatePaymentTerms() {
    const paymentType = document.getElementById('f-paymentType').value;
    if (paymentType === 'full') {
        document.getElementById('payment-total').textContent = '100';
        document.getElementById('err-payment').textContent = '';
        return true;
    }
    const advance = parseFloat(document.getElementById('f-payment-advance').value) || 0;
    const material = parseFloat(document.getElementById('f-payment-material').value) || 0;
    const installation = parseFloat(document.getElementById('f-payment-installation').value) || 0;
    const balance = parseFloat(document.getElementById('f-payment-balance').value) || 0;
    const total = advance + material + installation + balance;
    document.getElementById('payment-total').textContent = total;
    const errEl = document.getElementById('err-payment');
    if (Math.abs(total - 100) > 0.01) {
        errEl.textContent = `Total must equal 100% (current: ${total}%)`;
        return false;
    } else {
        errEl.textContent = '';
        return true;
    }
}

// Toggle payment fields based on payment type
function togglePaymentFields() {
    const paymentType = document.getElementById('f-paymentType').value;
    const fields = ['payment-advance-field', 'payment-material-field', 'payment-installation-field', 'payment-balance-field'];
    if (paymentType === 'full') {
        fields.forEach(id => document.getElementById(id).style.display = 'none');
        document.getElementById('f-payment-advance').value = 100;
        document.getElementById('f-payment-material').value = 0;
        document.getElementById('f-payment-installation').value = 0;
        document.getElementById('f-payment-balance').value = 0;
    } else {
        fields.forEach(id => document.getElementById(id).style.display = '');
    }
    validatePaymentTerms();
}

// Set default validity date to 30 days from now
function setDefaultValidity() {
    const dateInput = document.getElementById('f-validUntil');
    const date = new Date();
    date.setDate(date.getDate() + 30);
    dateInput.value = date.toISOString().slice(0, 10);
}

function resetWizardForm() {
    document.getElementById('f-customerName').value = '';
    document.getElementById('f-companyName').value = '';
    document.getElementById('f-mobile').value = '';
    document.getElementById('f-email').value = '';
    document.getElementById('f-address').value = '';
    document.getElementById('f-city').value = '';
    document.getElementById('f-state').value = '';
    document.getElementById('f-pincode').value = '';
    document.getElementById('f-gst').value = '';
    document.getElementById('gst-field').classList.add('hidden');

    // Reset referral fields
    document.getElementById('f-isReferred').checked = false;
    document.getElementById('f-referredBy').value = '';
    document.getElementById('f-referrerType').value = '';
    document.getElementById('f-referralCode').value = '';
    document.getElementById('f-referralPercent').value = 5;
    toggleReferralSection();

    // Reset site type and delivery timeline
    document.getElementById('f-siteType').value = '';
    document.getElementById('f-deliveryTimeline').value = '45 days from advance payment';

    // Reset bank details to company defaults
    document.getElementById('f-accountName').value = COMPANY.bank.accountName || '';
    document.getElementById('f-bankName').value = COMPANY.bank.bankName || '';
    document.getElementById('f-accountNumber').value = COMPANY.bank.accountNumber || '';
    document.getElementById('f-ifscCode').value = COMPANY.bank.ifscCode || '';
    document.getElementById('f-branch').value = COMPANY.bank.branch || '';

    // Reset payment terms
    document.getElementById('f-paymentType').value = 'full';
    togglePaymentFields();

    // Set default validity
    setDefaultValidity();

    // Reset editable terms
    document.getElementById('edit-terms').value = `GST Extra.\nDelivery after Full & Final Payment.\nAll Cheques & Drafts in favour of [Company Name].\nJurisdiction [City] only.\nFreight Extra.`;

    // Reset products/items
    wizardItems = [];
    renderItemsTable();

    // Refresh the product picker from Product Management every time the
    // wizard opens, so newly added/edited products show up immediately.
    populateProductPicker();
    populateReferrerList();
    document.getElementById('product-picker-qty').value = 1;
    document.getElementById('product-picker-rate').value = 0;

    document.getElementById('cost-installation').value = 0;
    document.getElementById('cost-transport').value = 0;
    document.getElementById('cost-other').value = 0;
    document.getElementById('cost-other-label').value = 'Other Charges';
    document.getElementById('f-gstPercent').value = '18';
    document.getElementById('f-discountType').value = 'percent';
    document.getElementById('f-discountValue').value = 0;
    document.querySelectorAll('.field-error').forEach(e => e.textContent = '');
    document.querySelectorAll('.invalid').forEach(e => e.classList.remove('invalid'));
    document.getElementById('share-grid').classList.add('hidden');
    document.getElementById('btn-generate').classList.remove('hidden');
    document.getElementById('btn-generate').disabled = false;
}

function openWizard() {
    draftQuoteNo = null;
    resetWizardForm();
    currentStep = 1;
    goToStep(1);
    openModal('modal-wizard');
}
document.getElementById('btn-new-quotation').addEventListener('click', openWizard);

function goToStep(step) {
    currentStep = step;
    document.querySelectorAll('.step-panel').forEach(p => p.classList.toggle('active', Number(p.dataset.panel) === step));
    document.querySelectorAll('.step').forEach(s => {
        const n = Number(s.dataset.step);
        s.classList.toggle('active', n === step);
        s.classList.toggle('done', n < step);
    });
    document.getElementById('btn-prev').disabled = step === 1;
    document.getElementById('btn-next').classList.toggle('hidden', step === totalWizardSteps);
    document.getElementById('btn-generate').classList.toggle('hidden', step !== totalWizardSteps);

    if (step === 2) populateProductPicker(); // pick up any catalog changes made mid-wizard too
    if (step === 3) computeCosts();
    if (step === 4) computeGstSummary();
    if (step === 5) renderWizardPreview();
}

document.getElementById('btn-next').addEventListener('click', () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 5) {
        // Validate payment terms before proceeding to generate
        if (!validatePaymentTerms()) {
            showToast('Payment terms must total 100%.', 'error');
            return;
        }
    }
    goToStep(Math.min(currentStep + 1, totalWizardSteps));
});
document.getElementById('btn-prev').addEventListener('click', () => goToStep(Math.max(currentStep - 1, 1)));
document.querySelectorAll('#stepper .step').forEach(s => {
    s.addEventListener('click', () => {
        const n = Number(s.dataset.step);
        if (n < currentStep) goToStep(n);
    });
});

function markError(fieldId, errId, message) {
    const field = document.getElementById(fieldId);
    const err = document.getElementById(errId);
    if (message) { field.classList.add('invalid'); err.textContent = message; return false; }
    field.classList.remove('invalid'); err.textContent = ''; return true;
}

function validateStep1() {
    let ok = true;
    const name = document.getElementById('f-customerName').value.trim();
    ok = markError('f-customerName', 'err-customerName', name ? '' : 'Customer name is required') && ok;

    const mobile = document.getElementById('f-mobile').value.trim();
    ok = markError('f-mobile', 'err-mobile', /^[6-9]\d{9}$/.test(mobile) ? '' : 'Enter a valid 10-digit mobile number') && ok;

    const email = document.getElementById('f-email').value.trim();
    ok = markError('f-email', 'err-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Enter a valid email address') && ok;

    const address = document.getElementById('f-address').value.trim();
    ok = markError('f-address', 'err-address', address ? '' : 'Installation address is required') && ok;

    const state = document.getElementById('f-state').value;
    ok = markError('f-state', 'err-state', state ? '' : 'Please select a state') && ok;

    const pincode = document.getElementById('f-pincode').value.trim();
    ok = markError('f-pincode', 'err-pincode', /^\d{6}$/.test(pincode) ? '' : 'Enter a valid 6-digit pincode') && ok;

    // GST is optional now — only validate if entered
    const gst = document.getElementById('f-gst').value.trim();
    if (gst && !/^[0-9A-Z]{15}$/i.test(gst)) {
        ok = markError('f-gst', 'err-gst', 'Enter a valid 15-character GSTIN') && ok;
    } else {
        document.getElementById('err-gst').textContent = '';
    }

    // Validate referral fields if referred
    const isReferred = document.getElementById('f-isReferred').checked;
    if (isReferred) {
        const referredBy = document.getElementById('f-referredBy').value.trim();
        const referrerType = document.getElementById('f-referrerType').value;
        const referralPercent = parseFloat(document.getElementById('f-referralPercent').value) || 0;
        
        if (!referredBy) {
            showToast('Please enter who referred this customer.', 'error');
            ok = false;
        }
        if (!referrerType) {
            showToast('Please select the referrer type.', 'error');
            ok = false;
        }
        if (referralPercent < 0 || referralPercent > 100) {
            showToast('Referral percentage must be between 0 and 100.', 'error');
            ok = false;
        }
    }

    if (!ok) showToast('Please fix the highlighted fields.', 'error');
    return ok;
}

function validateStep2() {
    let ok = true;
    const errEl = document.getElementById('err-items');
    if (!wizardItems.length) {
        errEl.textContent = 'Add at least one product to this quotation.';
        ok = false;
    } else {
        const invalidRow = wizardItems.some(it => !it.name || !it.name.trim() || !(Number(it.qty) > 0) || !(Number(it.rate) >= 0));
        if (invalidRow) {
            errEl.textContent = 'Every product needs a name, quantity > 0, and rate >= 0.';
            ok = false;
        } else {
            errEl.textContent = '';
        }
    }
    
    // Validate delivery timeline
    const deliveryTimeline = document.getElementById('f-deliveryTimeline').value.trim();
    if (!deliveryTimeline) {
        document.getElementById('err-deliveryTimeline').textContent = 'Delivery timeline is required.';
        ok = false;
    } else {
        document.getElementById('err-deliveryTimeline').textContent = '';
    }
    
    if (!ok) showToast('Please fix the highlighted fields.', 'error');
    return ok;
}

// Payment terms validation on input
['f-payment-advance', 'f-payment-material', 'f-payment-installation', 'f-payment-balance'].forEach(id => {
    document.getElementById(id).addEventListener('input', validatePaymentTerms);
});
document.getElementById('f-paymentType').addEventListener('change', togglePaymentFields);

// Referral UI events
document.getElementById('f-isReferred')?.addEventListener('change', toggleReferralSection);
document.getElementById('f-referredBy')?.addEventListener('input', handleReferrerSelection);
document.getElementById('f-referralPercent')?.addEventListener('input', () => {
    if (currentStep === 4) computeGstSummary();
});

// Collapsible referral section toggle
document.getElementById('referralToggle')?.addEventListener('click', () => {
    const body = document.getElementById('referralBody');
    const chevron = document.getElementById('referralChevron');
    body.classList.toggle('collapsed');
    chevron.classList.toggle('fa-chevron-down');
    chevron.classList.toggle('fa-chevron-up');
});

/* ---------------- Cost Calculation (Step 3) ---------------- */
function computeCosts() {
    document.getElementById('cost-items').textContent = formatINR(itemsSubtotal(wizardItems));
}
['cost-installation', 'cost-transport', 'cost-other'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => { if (currentStep === 4) computeGstSummary(); });
});

function getCostTotalsFromForm() {
    const installation = parseFloat(document.getElementById('cost-installation').value) || 0;
    const transport = parseFloat(document.getElementById('cost-transport').value) || 0;
    const otherLabel = document.getElementById('cost-other-label').value || 'Other Charges';
    const other = parseFloat(document.getElementById('cost-other').value) || 0;
    return { installation, transport, otherLabel, other };
}

/* ---------------- GST & Discount (Step 4) ---------------- */
function computeGstSummary() {
    const costs = getCostTotalsFromForm();
    const itTotal = itemsSubtotal(wizardItems);
    const gstPercent = parseFloat(document.getElementById('f-gstPercent').value) || 0;
    const discountType = document.getElementById('f-discountType').value;
    const discountValue = parseFloat(document.getElementById('f-discountValue').value) || 0;
    const totals = computeTotals(itTotal, costs, gstPercent, discountType, discountValue);

    let referralHtml = '';
    const isReferred = document.getElementById('f-isReferred').checked;
    const referralPercent = parseFloat(document.getElementById('f-referralPercent').value) || 0;
    const referralAmount = isReferred ? calculateReferralAmount(totals.total, referralPercent) : 0;

    document.getElementById('summary-gst').innerHTML = `
        <div class="row"><span>Items Subtotal</span><b>${formatINR(itTotal)}</b></div>
        <div class="row"><span>Additional Charges</span><b>${formatINR(costs.installation + costs.transport + costs.other)}</b></div>
        <div class="row"><span>Discount</span><b>- ${formatINR(totals.discountAmount)}</b></div>
        <div class="row"><span>SGST (${(gstPercent / 2).toFixed(1)}%)</span><b>${formatINR(totals.sgst)}</b></div>
        <div class="row"><span>CGST (${(gstPercent / 2).toFixed(1)}%)</span><b>${formatINR(totals.cgst)}</b></div>
        ${isReferred && referralPercent > 0 ? `<div class="row referral-row"><span>Referral Amount (Estimated)</span><b>${formatINR(referralAmount)}</b></div>` : ''}
        <div class="row total"><span>Grand Total</span><b>${formatINR(totals.total)}</b></div>
    `;
    return { ...totals, gstPercent, costs, itemsTotal: itTotal, referralAmount };
}
['f-gstPercent', 'f-discountType', 'f-discountValue'].forEach(id => document.getElementById(id).addEventListener('input', computeGstSummary));

/* ---------------- Build draft record + render preview (Step 5) ---------------- */
function collectWizardRecord(quoteNo) {
    const costs = getCostTotalsFromForm();
    const itTotal = itemsSubtotal(wizardItems);
    const gstPercent = parseFloat(document.getElementById('f-gstPercent').value) || 0;
    const discountType = document.getElementById('f-discountType').value;
    const discountValue = parseFloat(document.getElementById('f-discountValue').value) || 0;
    const totals = computeTotals(itTotal, costs, gstPercent, discountType, discountValue);

    // Collect bank details
    const bank = {
        accountName: document.getElementById('f-accountName').value.trim() || COMPANY.bank.accountName,
        bankName: document.getElementById('f-bankName').value.trim() || COMPANY.bank.bankName,
        accountNumber: document.getElementById('f-accountNumber').value.trim() || COMPANY.bank.accountNumber,
        ifscCode: document.getElementById('f-ifscCode').value.trim() || COMPANY.bank.ifscCode,
        branch: document.getElementById('f-branch').value.trim() || COMPANY.bank.branch
    };

    // Collect payment terms
    const paymentType = document.getElementById('f-paymentType').value;
    let paymentTerms = { advance: 0, material: 0, installation: 0, balance: 0 };
    if (paymentType === 'full') {
        paymentTerms.advance = 100;
    } else {
        paymentTerms.advance = parseFloat(document.getElementById('f-payment-advance').value) || 0;
        paymentTerms.material = parseFloat(document.getElementById('f-payment-material').value) || 0;
        paymentTerms.installation = parseFloat(document.getElementById('f-payment-installation').value) || 0;
        paymentTerms.balance = parseFloat(document.getElementById('f-payment-balance').value) || 0;
    }

    // Collect editable terms
    const terms = document.getElementById('edit-terms').value.trim() || '';

    // Collect validity date
    const validUntil = document.getElementById('f-validUntil').value || '';

    // Collect site type and delivery timeline
    const siteType = document.getElementById('f-siteType').value || '';
    const deliveryTimeline = document.getElementById('f-deliveryTimeline').value.trim() || '';

    // Collect referral details
    const isReferred = document.getElementById('f-isReferred').checked;
    const referredBy = document.getElementById('f-referredBy').value.trim() || '';
    const referrerType = document.getElementById('f-referrerType').value || '';
    const referralCode = document.getElementById('f-referralCode').value.trim() || '';
    const referralPercent = parseFloat(document.getElementById('f-referralPercent').value) || 0;
    const referralAmount = isReferred ? calculateReferralAmount(totals.total, referralPercent) : 0;

    return {
        quoteNo,
        date: new Date().toISOString().slice(0, 10),
        status: 'Pending',
        customer: {
            name: document.getElementById('f-customerName').value.trim(),
            company: document.getElementById('f-companyName').value.trim(),
            mobile: document.getElementById('f-mobile').value.trim(),
            email: document.getElementById('f-email').value.trim(),
            address: document.getElementById('f-address').value.trim(),
            city: document.getElementById('f-city').value.trim(),
            state: document.getElementById('f-state').value,
            pincode: document.getElementById('f-pincode').value.trim(),
            gst: document.getElementById('f-gst').value.trim()
        },
        siteType: siteType,
        deliveryTimeline: deliveryTimeline,
        items: wizardItems.map(it => ({ ...it })),
        itemsTotal: itTotal,
        costs,
        gstPercent, discountType, discountValue,
        advance: 0,
        ...totals,
        amount: Math.round(totals.total),
        balance: Math.round(totals.total),
        // New fields
        bank: bank,
        paymentTerms: paymentTerms,
        paymentType: paymentType,
        terms: terms,
        validUntil: validUntil,
        // Referral fields
        referral: {
            isReferred: isReferred,
            referredBy: referredBy,
            referrerType: referrerType,
            referralCode: referralCode,
            referralPercent: referralPercent,
            referralAmount: referralAmount
        }
    };
}

let draftQuoteNo = null;

function renderWizardPreview() {
    draftQuoteNo = draftQuoteNo || nextQuoteNo();
    const record = collectWizardRecord(draftQuoteNo);
    document.getElementById('invoice-preview').innerHTML = buildInvoiceMarkup(record);
}

document.getElementById('btn-generate').addEventListener('click', () => {
    const btn = document.getElementById('btn-generate');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

    const record = collectWizardRecord(draftQuoteNo || nextQuoteNo());
    quotations.unshift(record);
    draftQuoteNo = null;

    document.getElementById('invoice-preview').innerHTML = buildInvoiceMarkup(record);
    document.getElementById('share-grid').classList.remove('hidden');
    btn.classList.add('hidden');

    renderTable();

    // Auto-download the invoice as a PDF as soon as it is generated
    downloadInvoicePDF('invoice-preview', `${record.quoteNo}.pdf`).then(() => {
        showToast(`Quotation ${record.quoteNo} generated & PDF downloaded`, 'success');
    }).catch(() => {
        showToast(`Quotation ${record.quoteNo} generated successfully`, 'success');
    });

    // Wire the share-grid Download PDF button to re-download the same invoice on demand
    document.getElementById('btn-download-pdf').onclick = () => downloadInvoicePDF('invoice-preview', `${record.quoteNo}.pdf`);
    document.getElementById('btn-share-email').onclick = () => {
        const subject = encodeURIComponent(`Quotation ${record.quoteNo}`);
        const body = encodeURIComponent(`Hi ${record.customer.name || ''},\n\nPlease find your quotation ${record.quoteNo} (Total: ${formatINR(record.total)}). We have downloaded the PDF — please attach it to this email before sending.\n\nThanks,\n${COMPANY.name}`);
        window.location.href = `mailto:${record.customer.email || ''}?subject=${subject}&body=${body}`;
    };
    document.getElementById('btn-share-whatsapp').onclick = () => {
        const text = encodeURIComponent(`Hi ${record.customer.name || ''}, here is your quotation ${record.quoteNo} — Total: ${formatINR(record.total)}. (PDF downloaded separately)`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    setTimeout(() => {
        closeModal('modal-wizard');
    }, 1200);
});

/* =====================================================================
   EXPORT FUNCTIONS (Excel/CSV/PDF/Print)
   ===================================================================== */

// Export to CSV
function exportToCSV() {
    const filtered = getFiltered();
    const headers = ['Quotation No.', 'Customer', 'Company', 'Mobile', 'Email', 'Amount', 'Status', 'Referral', 'Date'];
    const rows = filtered.map(q => [
        q.quoteNo,
        q.customer.name || '',
        q.customer.company || '',
        q.customer.mobile || '',
        q.customer.email || '',
        q.amount || 0,
        q.status || '',
        q.referral?.isReferred ? 'Referred' : 'Direct',
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

// Export to Excel (using CSV with Excel-compatible format)
function exportToExcel() {
    const filtered = getFiltered();
    const headers = ['Quotation No.', 'Customer', 'Company', 'Mobile', 'Email', 'Amount', 'Status', 'Referral', 'Date'];
    const rows = filtered.map(q => [
        q.quoteNo,
        q.customer.name || '',
        q.customer.company || '',
        q.customer.mobile || '',
        q.customer.email || '',
        q.amount || 0,
        q.status || '',
        q.referral?.isReferred ? 'Referred' : 'Direct',
        q.date || ''
    ]);
    // Excel-compatible CSV with BOM
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `quotations_${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
    showToast('Excel exported successfully', 'success');
}

// Export to PDF (full table)
function exportToPDF() {
    const table = document.querySelector('.data-table');
    if (!table || typeof html2pdf === 'undefined') {
        showToast('PDF library failed to load.', 'error');
        return;
    }
    const printArea = document.createElement('div');
    printArea.style.padding = '20px';
    printArea.style.background = '#fff';
    printArea.innerHTML = `
        <h2 style="font-family: Poppins, sans-serif; margin-bottom: 20px;">Quotation List</h2>
        <p style="font-family: Poppins, sans-serif; color: #666; margin-bottom: 15px;">Generated: ${new Date().toLocaleString()}</p>
        ${table.outerHTML}
    `;
    document.body.appendChild(printArea);
    const opt = {
        margin: 10,
        filename: `quotations_${new Date().toISOString().slice(0, 10)}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(printArea).save().then(() => {
        document.body.removeChild(printArea);
        showToast('PDF exported successfully', 'success');
    }).catch(() => {
        document.body.removeChild(printArea);
        showToast('PDF export failed', 'error');
    });
}

// Print
function printQuotations() {
    window.print();
}

// Export buttons
document.getElementById('btn-export-excel').addEventListener('click', exportToExcel);
document.getElementById('btn-export-csv').addEventListener('click', exportToCSV);
document.getElementById('btn-export-pdf').addEventListener('click', exportToPDF);
document.getElementById('btn-print').addEventListener('click', printQuotations);

/* ---------------- Init ---------------- */
populateProductPicker();
populateReferrerList();
// Initialize referral section (hidden by default)
toggleReferralSection();
// Initialize payment fields
togglePaymentFields();
renderTable();