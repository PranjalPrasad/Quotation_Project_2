(function() {
  'use strict';

  // =============================================================
  // STATE
  // =============================================================
  let products = [];
  let filteredProducts = [];
  let currentPage = 1;
  let rowsPerPage = 10;
  let sortField = 'name';
  let sortDirection = 'asc';
  let editingId = null;
  let deletingId = null;
  let viewingId = null;
  let stockProductId = null;
  let specLines = [];

  // =============================================================
  // DOM REFS
  // =============================================================
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const tbody = $('#product-tbody');
  const emptyState = $('#empty-state');
  const pagination = $('#pagination');
  const searchInput = $('#search-input');
  const filterType = $('#filter-producttype');
  const filterCategory = $('#filter-category');
  const filterStatus = $('#filter-status');
  const rowsSelect = $('#rows-per-page');

  const modalProduct = $('#modal-product');
  const modalView = $('#modal-view-product');
  const modalDelete = $('#modal-delete-product');
  const modalStock = $('#modal-stock-history');

  const pfId = $('#pf-id');
  const pfName = $('#pf-name');
  const pfProducttype = $('#pf-producttype');
  const pfCategory = $('#pf-category');
  const pfOtherCategory = $('#pf-other-category');
  const pfOtherWrap = $('#pf-other-category-wrap');
  const pfModelcode = $('#pf-modelcode');
  const pfBrand = $('#pf-brand');
  const pfSku = $('#pf-sku');
  const pfSpec = $('#pf-spec');
  const pfUnit = $('#pf-unit');
  const pfHsn = $('#pf-hsn');
  const pfGst = $('#pf-gst');
  const pfWarranty = $('#pf-warranty');
  const pfMrp = $('#pf-mrp');
  const pfDiscount = $('#pf-discount');
  const pfPrice = $('#pf-price');
  const pfStock = $('#pf-stock');
  const pfThreshold = $('#pf-threshold');
  const pfQtyPerKw = $('#pf-qtyperkw');
  const pfStatus = $('#pf-status');
  const pfDescription = $('#pf-description');

  // Machine fields
  const miOutput = $('#mi-output');
  const miTonnage = $('#mi-tonnage');
  const miCycletime = $('#mi-cycletime');
  const miOiltank = $('#mi-oiltank');
  const miPowerHp = $('#mi-power-hp');
  const miGensetKva = $('#mi-genset-kva');
  const tsAutomation = $('#ts-automation');
  const tsVibration = $('#ts-vibration');
  const tsPalletsize = $('#ts-palletsize');
  const miLabour = $('#mi-labour');
  const miShed = $('#mi-shed');
  const miWeight = $('#mi-weight');
  const miDimensions = $('#mi-dimensions');
  const miMotor = $('#mi-motor');
  const miOrigin = $('#mi-origin');
  const miVideo = $('#mi-video');
  const miBundled = $('#mi-bundled');
  const tsPlc = $('#ts-plc');
  const tsControlpanel = $('#ts-controlpanel');
  const tsSafety = $('#ts-safety');
  const miAccessories = $('#mi-accessories');

  // Component fields
  const coCapacity = $('#co-capacity');
  const coLength = $('#co-length');
  const coMotor = $('#co-motor');
  const coFeatures = $('#co-features');
  const coCompatible = $('#co-compatible');

  // Accessory fields
  const acSizetype = $('#ac-sizetype');
  const acPackunit = $('#ac-packunit');
  const acMoq = $('#ac-moq');

  const specList = $('#specmaster-list');
  const btnAddSpec = $('#btn-add-specline');

  const statTotal = $('#stat-total');
  const statActive = $('#stat-active');
  const statLow = $('#stat-low');
  const statValue = $('#stat-value');

  const toastContainer = $('#toast-container');

  // =============================================================
  // TOAST
  // =============================================================
  function showToast(message, type) {
    const colors = {
      success: 'bg-emerald-500',
      error: 'bg-rose-500',
      info: 'bg-blue-500'
    };
    const div = document.createElement('div');
    div.className = `toast-animate px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-lg ${colors[type] || colors.info}`;
    div.textContent = message;
    toastContainer.appendChild(div);
    setTimeout(() => {
      if (div.parentNode) div.remove();
    }, 3500);
  }

  // =============================================================
  // SAMPLE DATA (for demo — replace with API calls)
  // =============================================================
  function generateSampleProducts() {
    return [
      {
        id: 1,
        name: 'Hydraulic Brick Making Machine VKM-40',
        productType: 'machine',
        category: 'Brick Machine',
        brand: 'VKM',
        sku: 'VKM-BM-40',
        spec: 'Fully Automatic, 4 Station',
        unit: 'Set',
        hsn: '84743100',
        gst: 18,
        warranty: 1,
        mrp: 1380000,
        discount: 9,
        price: 1250000,
        stock: 5,
        threshold: 2,
        qtyPerKw: 1,
        status: 'Active',
        description: 'High performance hydraulic brick making machine with 4 station turntable.',
        modelCode: 'VK001',
        // Machine fields
        output: '4500–5000 bricks/8hrs',
        tonnage: 120,
        cycletime: 12,
        oiltank: 300,
        powerHp: 60,
        gensetKva: 82.5,
        automation: 'Fully Automatic',
        vibration: 'yes',
        palletsize: '14x24',
        labour: 6,
        shed: '20x15 ft',
        weight: '12,500 kg',
        dimensions: '8.5m x 3.2m x 3.8m',
        motor: '60 HP, Crompton, 1440 RPM, 3-Phase',
        origin: 'India',
        video: '',
        bundled: '500kg Pan Mixer + 20ft Conveyor',
        plc: 'Siemens S7-1200 with 7-inch HMI',
        controlpanel: 'IP54, MCB + contactor based',
        safety: 'Emergency stop, safety guards, overload cutoff',
        accessories: 'Pallet feeding conveyor\nPLC control panel\nHydraulic power pack',
        specMaster: ['A - Heavy duty steel structure', 'B - 4 station turntable', 'C - Hydraulic system with 120 ton pressure']
      },
      {
        id: 2,
        name: '500kg Pan Mixer',
        productType: 'component',
        category: 'Pan Mixer',
        brand: 'VKM',
        sku: 'VKM-PM-500',
        spec: 'Heavy Duty, 500kg Batch',
        unit: 'Set',
        hsn: '84743900',
        gst: 18,
        warranty: 1,
        mrp: 450000,
        discount: 5,
        price: 427500,
        stock: 8,
        threshold: 2,
        qtyPerKw: 1,
        status: 'Active',
        description: '500kg capacity pan mixer for brick manufacturing.',
        modelCode: 'PM500',
        // Component fields
        capacity: '500kg',
        length: '',
        motor: '30 HP, 1440 RPM, 3-Phase, Crompton',
        features: 'Auto material feeding system\nAccident proof locking system\nStainless steel mixing arms',
        compatible: 'VKM-BM-40, VKM-BM-80'
      },
      {
        id: 3,
        name: 'Zig Zag Mould with Dumble',
        productType: 'accessory',
        category: 'Mould',
        brand: 'VKM',
        sku: 'VKM-MD-ZZ',
        spec: 'Zig Zag Pattern with Dumble',
        unit: 'Piece',
        hsn: '84804100',
        gst: 18,
        warranty: 0,
        mrp: 8500,
        discount: 0,
        price: 8500,
        stock: 150,
        threshold: 50,
        qtyPerKw: 100,
        status: 'Active',
        description: 'Zig Zag mould with dumble pattern for interlocking bricks.',
        modelCode: 'MZZ100',
        // Accessory fields
        sizetype: 'Zig Zag with Dumble',
        packunit: 'per piece',
        moq: 100
      }
    ];
  }

  // =============================================================
  // CRUD OPERATIONS (mock — replace with API)
  // =============================================================
  function loadProducts() {
    const stored = localStorage.getItem('vkm_products');
    if (stored) {
      try {
        products = JSON.parse(stored);
        return;
      } catch (_) {}
    }
    products = generateSampleProducts();
    saveProducts();
  }

  function saveProducts() {
    localStorage.setItem('vkm_products', JSON.stringify(products));
  }

  function getNextId() {
    return products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
  }

  function getProduct(id) {
    return products.find(p => p.id === id);
  }

  function addProduct(data) {
    data.id = getNextId();
    products.push(data);
    saveProducts();
    render();
    showToast('Product added successfully!', 'success');
  }

  function updateProduct(id, data) {
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    data.id = id;
    products[idx] = data;
    saveProducts();
    render();
    showToast('Product updated successfully!', 'success');
    return true;
  }

  function deleteProduct(id) {
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    products.splice(idx, 1);
    saveProducts();
    render();
    showToast('Product deleted successfully!', 'error');
    return true;
  }

  // =============================================================
  // STOCK LEDGER (mock)
  // =============================================================
  let stockLedger = {};

  function loadLedger() {
    const stored = localStorage.getItem('vkm_stock_ledger');
    if (stored) {
      try {
        stockLedger = JSON.parse(stored);
        return;
      } catch (_) {}
    }
    stockLedger = {};
  }

  function saveLedger() {
    localStorage.setItem('vkm_stock_ledger', JSON.stringify(stockLedger));
  }

  function addStockEntry(productId, type, qty, reason) {
    if (!stockLedger[productId]) stockLedger[productId] = [];
    const entry = {
      id: Date.now(),
      type: type,
      qty: parseInt(qty),
      reason: reason || (type === 'in' ? 'Stock In' : 'Stock Out'),
      date: new Date().toISOString()
    };
    stockLedger[productId].push(entry);
    saveLedger();

    // Update product stock
    const product = getProduct(parseInt(productId));
    if (product) {
      if (type === 'in') {
        product.stock = (parseInt(product.stock) || 0) + parseInt(qty);
      } else {
        product.stock = Math.max(0, (parseInt(product.stock) || 0) - parseInt(qty));
      }
      saveProducts();
      render();
    }
    showToast('Stock entry added!', 'success');
    renderStockHistory(productId);
  }

  function getStockEntries(productId) {
    return stockLedger[productId] || [];
  }

  // =============================================================
  // RENDER TABLE
  // =============================================================
  function render() {
    const search = searchInput.value.toLowerCase().trim();
    const typeFilter = filterType.value;
    const catFilter = filterCategory.value;
    const statusFilter = filterStatus.value;

    filteredProducts = products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search) ||
                         p.brand.toLowerCase().includes(search) ||
                         (p.sku && p.sku.toLowerCase().includes(search));
      const matchType = !typeFilter || p.productType === typeFilter;
      const matchCat = !catFilter || p.category === catFilter;
      const matchStatus = !statusFilter || p.status === statusFilter;
      return matchSearch && matchType && matchCat && matchStatus;
    });

    // Sort
    filteredProducts.sort((a, b) => {
      let va = a[sortField] || '';
      let vb = b[sortField] || '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDirection === 'asc' ? -1 : 1;
      if (va > vb) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Pagination
    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / rowsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, total);
    const pageItems = filteredProducts.slice(start, end);

    // Update stats
    statTotal.textContent = products.length;
    statActive.textContent = products.filter(p => p.status === 'Active').length;
    statLow.textContent = products.filter(p => {
      const stock = parseInt(p.stock) || 0;
      const threshold = parseInt(p.threshold) || 0;
      return stock <= threshold;
    }).length;
    const totalValue = products.reduce((sum, p) => sum + (parseFloat(p.price) || 0) * (parseInt(p.stock) || 0), 0);
    statValue.textContent = '₹' + totalValue.toLocaleString('en-IN');

    // Render rows
    if (pageItems.length === 0) {
      tbody.innerHTML = '';
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
      tbody.innerHTML = pageItems.map(p => renderRow(p)).join('');
    }

    renderPagination(totalPages);
    updateSortIcons();
  }

 function renderRow(p) {
  const statusBadge = getStatusBadge(p);
  const typeBadge = getTypeBadge(p.productType);
  const iconBg = getIconBg(p.category);

  return `
    <tr>
      <td data-label="Product">
        <div class="product-cell">
          <div class="row-icon ${iconBg}">${getIconChar(p.category)}</div>
          <div>
            <div class="product-name">${escapeHtml(p.name)}</div>
            <div class="product-sub">${escapeHtml(p.brand)} ${p.sku ? '· ' + escapeHtml(p.sku) : ''}</div>
          </div>
        </div>
      </td>
      <td data-label="Type">${typeBadge}</td>
      <td data-label="Category">${escapeHtml(p.category)}</td>
      <td data-label="Brand">${escapeHtml(p.brand)}</td>
      <td data-label="Qty / Set">${p.qtyPerKw || 0}</td>
      <td data-label="HSN">${escapeHtml(p.hsn || '—')}</td>
      <td data-label="GST">${p.gst || 0}%</td>
      <td data-label="Selling Price">
        <div class="price-cell">
          ${p.mrp ? `<div class="price-mrp">₹${Number(p.mrp).toLocaleString('en-IN')}</div>` : ''}
          <div class="price-selling">₹${Number(p.price).toLocaleString('en-IN')}
            ${p.discount && p.discount > 0 ? `<span class="discount-badge">${p.discount}% off</span>` : ''}
          </div>
        </div>
      </td>
      <td data-label="Stock">
        <div class="stock-cell">
          <span>${p.stock || 0}</span>
          <button class="stock-history-btn" data-id="${p.id}" title="Stock History">
            <i class="fas fa-clock-rotate-left"></i>
          </button>
        </div>
      </td>
      <td data-label="Status">${statusBadge}</td>
      <td data-label="Actions">
        <div class="row-actions">
          <button class="action-icon-btn icon-view" data-id="${p.id}" title="View">
            <i class="fas fa-eye"></i>
          </button>
          <button class="action-icon-btn icon-edit" data-id="${p.id}" title="Edit">
            <i class="fas fa-pen"></i>
          </button>
          <button class="action-icon-btn danger" data-id="${p.id}" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `;
}
  function getStatusBadge(p) {
    const stock = parseInt(p.stock) || 0;
    const threshold = parseInt(p.threshold) || 0;
    if (p.status === 'Inactive' || p.status === 'Discontinued') {
      return `<span class="badge badge-inactive">${p.status}</span>`;
    }
    if (stock === 0) {
      return `<span class="badge badge-out">Out of Stock</span>`;
    }
    if (stock <= threshold) {
      return `<span class="badge badge-low">Low Stock</span>`;
    }
    return `<span class="badge badge-active">Active</span>`;
  }

  function getTypeBadge(type) {
    const map = {
      machine: 'Machine',
      component: 'Component',
      accessory: 'Accessory'
    };
    const cls = {
      machine: 'badge-type-machine',
      component: 'badge-type-component',
      accessory: 'badge-type-accessory'
    };
    return `<span class="badge ${cls[type] || ''}">${map[type] || type}</span>`;
  }

  function getIconBg(category) {
    const map = {
      'Brick Machine': 'bg-brick',
      'Pan Mixer': 'bg-panmixer',
      'Conveyor Belt': 'bg-conveyor',
      'Power Pack System': 'bg-powerpack',
      'PLC Panel': 'bg-plc',
      'Trolley': 'bg-trolley',
      'Mould': 'bg-mould',
      'Vibrator Table': 'bg-vibrator',
      'Chemical/Consumable': 'bg-consumables',
      'Mixer Machine': 'bg-mixer'
    };
    return map[category] || 'bg-slate';
  }

  function getIconChar(category) {
    const map = {
      'Brick Machine': '🧱',
      'Pan Mixer': '🔄',
      'Conveyor Belt': '➡️',
      'Power Pack System': '⚡',
      'PLC Panel': '💻',
      'Trolley': '🛒',
      'Mould': '🔨',
      'Vibrator Table': '📳',
      'Chemical/Consumable': '🧪',
      'Mixer Machine': '🥄'
    };
    return map[category] || '📦';
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderPagination(totalPages) {
    let html = '';
    html += `<button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" data-page="prev"><i class="fas fa-chevron-left"></i></button>`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    html += `<button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" data-page="next"><i class="fas fa-chevron-right"></i></button>`;
    pagination.innerHTML = html;
  }

  function updateSortIcons() {
    $$('.data-table thead th').forEach(th => {
      th.classList.remove('sorted');
      if (th.dataset.sort === sortField) {
        th.classList.add('sorted');
      }
    });
  }

  // =============================================================
  // MODAL HELPERS
  // =============================================================
  function openModal(modal) {
    modal.classList.remove('hidden');
  }

  function closeModal(modal) {
    modal.classList.add('hidden');
  }

  function closeAllModals() {
    [modalProduct, modalView, modalDelete, modalStock].forEach(m => closeModal(m));
  }

  // =============================================================
  // PRODUCT FORM - COLLECT DATA
  // =============================================================
  function collectFormData() {
    const type = pfProducttype.value;
    const data = {
      name: pfName.value.trim(),
      productType: type,
      category: pfCategory.value === '__other__' ? pfOtherCategory.value.trim() : pfCategory.value,
      brand: pfBrand.value.trim(),
      sku: pfSku.value.trim(),
      spec: pfSpec.value.trim(),
      unit: pfUnit.value,
      hsn: pfHsn.value.trim(),
      gst: parseFloat(pfGst.value) || 0,
      warranty: parseInt(pfWarranty.value) || 0,
      mrp: parseFloat(pfMrp.value) || 0,
      discount: parseFloat(pfDiscount.value) || 0,
      price: parseFloat(pfPrice.value) || 0,
      stock: parseInt(pfStock.value) || 0,
      threshold: parseInt(pfThreshold.value) || 0,
      qtyPerKw: parseFloat(pfQtyPerKw.value) || 0,
      status: pfStatus.value,
      description: pfDescription.value.trim(),
      modelCode: pfModelcode.value.trim()
    };

    // Machine fields
    if (type === 'machine') {
      data.output = miOutput.value.trim();
      data.tonnage = parseFloat(miTonnage.value) || 0;
      data.cycletime = parseFloat(miCycletime.value) || 0;
      data.oiltank = parseInt(miOiltank.value) || 0;
      data.powerHp = parseFloat(miPowerHp.value) || 0;
      data.gensetKva = parseFloat(miGensetKva.value) || 0;
      data.automation = tsAutomation.value;
      data.vibration = tsVibration.value;
      data.palletsize = tsPalletsize.value.trim();
      data.labour = parseInt(miLabour.value) || 0;
      data.shed = miShed.value.trim();
      data.weight = miWeight.value.trim();
      data.dimensions = miDimensions.value.trim();
      data.motor = miMotor.value.trim();
      data.origin = miOrigin.value.trim();
      data.video = miVideo.value.trim();
      data.bundled = miBundled.value.trim();
      data.plc = tsPlc.value.trim();
      data.controlpanel = tsControlpanel.value.trim();
      data.safety = tsSafety.value.trim();
      data.accessories = miAccessories.value.trim();
    }

    // Component fields
    if (type === 'component') {
      data.capacity = coCapacity.value.trim();
      data.length = coLength.value.trim();
      data.motor = coMotor.value.trim();
      data.features = coFeatures.value.trim();
      data.compatible = coCompatible.value.trim();
    }

    // Accessory fields
    if (type === 'accessory') {
      data.sizetype = acSizetype.value.trim();
      data.packunit = acPackunit.value.trim();
      data.moq = parseInt(acMoq.value) || 0;
    }

    // Spec Master
    data.specMaster = specLines.filter(s => s.trim());

    return data;
  }

  function populateForm(data) {
    if (!data) return;
    pfId.value = data.id || '';
    pfName.value = data.name || '';
    pfProducttype.value = data.productType || '';
    pfCategory.value = data.category || '';
    pfBrand.value = data.brand || '';
    pfSku.value = data.sku || '';
    pfSpec.value = data.spec || '';
    pfUnit.value = data.unit || 'Piece';
    pfHsn.value = data.hsn || '';
    pfGst.value = data.gst || 18;
    pfWarranty.value = data.warranty || 0;
    pfMrp.value = data.mrp || 0;
    pfDiscount.value = data.discount || 0;
    pfPrice.value = data.price || 0;
    pfStock.value = data.stock || 0;
    pfThreshold.value = data.threshold || 2;
    pfQtyPerKw.value = data.qtyPerKw || 0;
    pfStatus.value = data.status || 'Active';
    pfDescription.value = data.description || '';
    pfModelcode.value = data.modelCode || '';

    // Machine
    miOutput.value = data.output || '';
    miTonnage.value = data.tonnage || '';
    miCycletime.value = data.cycletime || '';
    miOiltank.value = data.oiltank || '';
    miPowerHp.value = data.powerHp || '';
    miGensetKva.value = data.gensetKva || '';
    tsAutomation.value = data.automation || 'Manual';
    tsVibration.value = data.vibration || 'no';
    tsPalletsize.value = data.palletsize || '';
    miLabour.value = data.labour || '';
    miShed.value = data.shed || '';
    miWeight.value = data.weight || '';
    miDimensions.value = data.dimensions || '';
    miMotor.value = data.motor || '';
    miOrigin.value = data.origin || '';
    miVideo.value = data.video || '';
    miBundled.value = data.bundled || '';
    tsPlc.value = data.plc || '';
    tsControlpanel.value = data.controlpanel || '';
    tsSafety.value = data.safety || '';
    miAccessories.value = data.accessories || '';

    // Component
    coCapacity.value = data.capacity || '';
    coLength.value = data.length || '';
    coMotor.value = data.motor || '';
    coFeatures.value = data.features || '';
    coCompatible.value = data.compatible || '';

    // Accessory
    acSizetype.value = data.sizetype || '';
    acPackunit.value = data.packunit || '';
    acMoq.value = data.moq || '';

    // Spec Master
    specLines = data.specMaster ? [...data.specMaster] : [];
    renderSpecMaster();

    // Toggle sections
    toggleSections(data.productType || '');
    updateTypeToggle(data.productType || '');
    updateYNToggle(tsVibration.value);
  }

  function resetForm() {
    pfId.value = '';
    pfName.value = '';
    pfProducttype.value = '';
    pfCategory.value = '';
    pfOtherCategory.value = '';
    pfBrand.value = '';
    pfSku.value = '';
    pfSpec.value = '';
    pfUnit.value = 'Piece';
    pfHsn.value = '';
    pfGst.value = '18';
    pfWarranty.value = '';
    pfMrp.value = '';
    pfDiscount.value = '';
    pfPrice.value = '';
    pfStock.value = '';
    pfThreshold.value = '2';
    pfQtyPerKw.value = '';
    pfStatus.value = 'Active';
    pfDescription.value = '';
    pfModelcode.value = '';

    miOutput.value = '';
    miTonnage.value = '';
    miCycletime.value = '';
    miOiltank.value = '';
    miPowerHp.value = '';
    miGensetKva.value = '';
    tsAutomation.value = 'Manual';
    tsVibration.value = 'no';
    tsPalletsize.value = '';
    miLabour.value = '';
    miShed.value = '';
    miWeight.value = '';
    miDimensions.value = '';
    miMotor.value = '';
    miOrigin.value = '';
    miVideo.value = '';
    miBundled.value = '';
    tsPlc.value = '';
    tsControlpanel.value = '';
    tsSafety.value = '';
    miAccessories.value = '';

    coCapacity.value = '';
    coLength.value = '';
    coMotor.value = '';
    coFeatures.value = '';
    coCompatible.value = '';

    acSizetype.value = '';
    acPackunit.value = '';
    acMoq.value = '';

    specLines = [];
    renderSpecMaster();

    toggleSections('');
    updateTypeToggle('');
    updateYNToggle('no');
    pfOtherWrap.classList.add('hidden');
    pfOtherCategory.value = '';
    editingId = null;
    document.getElementById('product-modal-title').innerHTML = '<i class="fas fa-box"></i> Add Product';
  }

  function toggleSections(type) {
    const sections = {
      machine: 'machineInfoSection',
      component: 'componentSection',
      accessory: 'accessorySection'
    };
    const all = ['machineInfoSection', 'componentSection', 'accessorySection'];
    all.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = (id === sections[type]) ? 'grid' : 'none';
      }
    });
    // Spec Master always visible
    const specSection = document.getElementById('specMasterSection');
    if (specSection) specSection.style.display = 'grid';
  }

  function updateTypeToggle(type) {
    const btns = document.querySelectorAll('#pf-producttype-toggle button');
    btns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.val === type);
    });
  }

  function updateYNToggle(value) {
    const btns = document.querySelectorAll('#ts-vibration-toggle button');
    btns.forEach(btn => {
      btn.classList.remove('active-yes', 'active-no');
      if (btn.dataset.val === value) {
        btn.classList.add(value === 'yes' ? 'active-yes' : 'active-no');
      }
    });
  }

  function renderSpecMaster() {
    if (specLines.length === 0) {
      specList.innerHTML = '<div class="specmaster-empty">No specification lines added yet.</div>';
      return;
    }
    specList.innerHTML = specLines.map((line, idx) => {
      const sr = String.fromCharCode(65 + idx);
      return `
        <div class="specmaster-row">
          <div class="specmaster-sr">${sr}</div>
          <input type="text" class="field-input specmaster-input" value="${escapeHtml(line)}" data-index="${idx}">
          <button class="specmaster-remove" data-index="${idx}"><i class="fas fa-xmark"></i></button>
        </div>
      `;
    }).join('');

    // Update specLines from inputs
    document.querySelectorAll('.specmaster-input').forEach(inp => {
      inp.addEventListener('input', function() {
        const idx = parseInt(this.dataset.index);
        specLines[idx] = this.value;
      });
    });

    document.querySelectorAll('.specmaster-remove').forEach(btn => {
      btn.addEventListener('click', function() {
        const idx = parseInt(this.dataset.index);
        specLines.splice(idx, 1);
        renderSpecMaster();
      });
    });
  }

  // =============================================================
  // VIEW PRODUCT
  // =============================================================
  function renderViewProduct(data) {
    if (!data) return;
    const body = document.getElementById('view-product-body');
    let html = `
      <div class="view-head">
        <div class="row-icon ${getIconBg(data.category)}">${getIconChar(data.category)}</div>
        <div>
          <div style="font-weight:700;font-size:14px;color:#1F2937;">${escapeHtml(data.name)}</div>
          <div style="font-size:11px;color:#9CA3AF;">${escapeHtml(data.brand)} ${data.sku ? '· ' + escapeHtml(data.sku) : ''}</div>
        </div>
      </div>
      <div class="view-grid">
        <div class="view-item"><div class="view-label">Type</div><div class="view-value">${data.productType || '—'}</div></div>
        <div class="view-item"><div class="view-label">Category</div><div class="view-value">${escapeHtml(data.category) || '—'}</div></div>
        <div class="view-item"><div class="view-label">Brand</div><div class="view-value">${escapeHtml(data.brand) || '—'}</div></div>
        <div class="view-item"><div class="view-label">SKU</div><div class="view-value">${escapeHtml(data.sku) || '—'}</div></div>
        <div class="view-item"><div class="view-label">Model Code</div><div class="view-value">${escapeHtml(data.modelCode) || '—'}</div></div>
        <div class="view-item"><div class="view-label">Specification</div><div class="view-value">${escapeHtml(data.spec) || '—'}</div></div>
        <div class="view-item"><div class="view-label">Unit</div><div class="view-value">${escapeHtml(data.unit) || '—'}</div></div>
        <div class="view-item"><div class="view-label">HSN Code</div><div class="view-value">${escapeHtml(data.hsn) || '—'}</div></div>
        <div class="view-item"><div class="view-label">GST</div><div class="view-value">${data.gst || 0}%</div></div>
        <div class="view-item"><div class="view-label">Warranty</div><div class="view-value">${data.warranty || 0} Years</div></div>
        <div class="view-item"><div class="view-label">MRP</div><div class="view-value">₹${Number(data.mrp).toLocaleString('en-IN') || 0}</div></div>
        <div class="view-item"><div class="view-label">Discount</div><div class="view-value">${data.discount || 0}%</div></div>
        <div class="view-item"><div class="view-label">Selling Price</div><div class="view-value">₹${Number(data.price).toLocaleString('en-IN') || 0}</div></div>
        <div class="view-item"><div class="view-label">Stock</div><div class="view-value">${data.stock || 0}</div></div>
        <div class="view-item"><div class="view-label">Low Stock Threshold</div><div class="view-value">${data.threshold || 0}</div></div>
        <div class="view-item"><div class="view-label">Qty per Set</div><div class="view-value">${data.qtyPerKw || 0}</div></div>
        <div class="view-item"><div class="view-label">Status</div><div class="view-value">${data.status || '—'}</div></div>
      </div>
    `;

    // Machine details
    if (data.productType === 'machine') {
      html += `
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid #EFC8DC;">
          <div style="font-weight:700;font-size:12px;color:#800021;margin-bottom:8px;"><i class="fas fa-gears"></i> Machine Information</div>
          <div class="view-grid">
            <div class="view-item"><div class="view-label">Production Capacity</div><div class="view-value">${escapeHtml(data.output) || '—'}</div></div>
            <div class="view-item"><div class="view-label">Tonnage</div><div class="view-value">${data.tonnage || 0} Ton</div></div>
            <div class="view-item"><div class="view-label">Cycle Time</div><div class="view-value">${data.cycletime || 0} Sec</div></div>
            <div class="view-item"><div class="view-label">Oil Tank</div><div class="view-value">${data.oiltank || 0} Ltr</div></div>
            <div class="view-item"><div class="view-label">Power</div><div class="view-value">${data.powerHp || 0} HP</div></div>
            <div class="view-item"><div class="view-label">Genset</div><div class="view-value">${data.gensetKva || 0} KVA</div></div>
            <div class="view-item"><div class="view-label">Automation</div><div class="view-value">${escapeHtml(data.automation) || '—'}</div></div>
            <div class="view-item"><div class="view-label">Vibration Table</div><div class="view-value">${data.vibration === 'yes' ? '✅ Yes' : '❌ No'}</div></div>
            <div class="view-item"><div class="view-label">Pallet Size</div><div class="view-value">${escapeHtml(data.palletsize) || '—'}</div></div>
            <div class="view-item"><div class="view-label">Labour Required</div><div class="view-value">${data.labour || 0} Persons</div></div>
            <div class="view-item"><div class="view-label">Shed Required</div><div class="view-value">${escapeHtml(data.shed) || '—'}</div></div>
            <div class="view-item"><div class="view-label">Weight</div><div class="view-value">${escapeHtml(data.weight) || '—'}</div></div>
            <div class="view-item"><div class="view-label">Dimensions</div><div class="view-value">${escapeHtml(data.dimensions) || '—'}</div></div>
            <div class="view-item"><div class="view-label">Motor</div><div class="view-value">${escapeHtml(data.motor) || '—'}</div></div>
            <div class="view-item"><div class="view-label">Origin</div><div class="view-value">${escapeHtml(data.origin) || '—'}</div></div>
          </div>
          ${data.bundled ? `<div class="view-item" style="margin-top:8px;"><div class="view-label">Bundled Equipment</div><div class="view-value">${escapeHtml(data.bundled)}</div></div>` : ''}
          ${data.plc ? `<div class="view-item"><div class="view-label">PLC Details</div><div class="view-value">${escapeHtml(data.plc)}</div></div>` : ''}
          ${data.controlpanel ? `<div class="view-item"><div class="view-label">Control Panel</div><div class="view-value">${escapeHtml(data.controlpanel)}</div></div>` : ''}
          ${data.safety ? `<div class="view-item"><div class="view-label">Safety Features</div><div class="view-value">${escapeHtml(data.safety)}</div></div>` : ''}
          ${data.accessories ? `<div class="view-item"><div class="view-label">Accessories</div><div class="view-value" style="white-space:pre-line;">${escapeHtml(data.accessories)}</div></div>` : ''}
        </div>
      `;
    }

    // Component details
    if (data.productType === 'component') {
      html += `
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid #EFC8DC;">
          <div style="font-weight:700;font-size:12px;color:#800021;margin-bottom:8px;"><i class="fas fa-puzzle-piece"></i> Component Details</div>
          <div class="view-grid">
            <div class="view-item"><div class="view-label">Capacity</div><div class="view-value">${escapeHtml(data.capacity) || '—'}</div></div>
            <div class="view-item"><div class="view-label">Length</div><div class="view-value">${escapeHtml(data.length) || '—'}</div></div>
            <div class="view-item"><div class="view-label">Motor</div><div class="view-value">${escapeHtml(data.motor) || '—'}</div></div>
            <div class="view-item"><div class="view-label">Compatible Models</div><div class="view-value">${escapeHtml(data.compatible) || '—'}</div></div>
          </div>
          ${data.features ? `<div class="view-item"><div class="view-label">Features</div><div class="view-value" style="white-space:pre-line;">${escapeHtml(data.features)}</div></div>` : ''}
        </div>
      `;
    }

    // Accessory details
    if (data.productType === 'accessory') {
      html += `
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid #EFC8DC;">
          <div style="font-weight:700;font-size:12px;color:#800021;margin-bottom:8px;"><i class="fas fa-toolbox"></i> Accessory Details</div>
          <div class="view-grid">
            <div class="view-item"><div class="view-label">Size / Type</div><div class="view-value">${escapeHtml(data.sizetype) || '—'}</div></div>
            <div class="view-item"><div class="view-label">Pack Unit</div><div class="view-value">${escapeHtml(data.packunit) || '—'}</div></div>
            <div class="view-item"><div class="view-label">Minimum Order Qty</div><div class="view-value">${data.moq || 0}</div></div>
          </div>
        </div>
      `;
    }

    // Spec Master
    if (data.specMaster && data.specMaster.length) {
      html += `
        <div class="view-specmaster">
          <div style="font-weight:700;font-size:12px;color:#800021;margin-bottom:6px;"><i class="fas fa-list-ol"></i> Specification Master</div>
          ${data.specMaster.map((line, i) => `
            <div class="view-specmaster-row">
              <span class="vs-sr">${String.fromCharCode(65 + i)}</span>
              <span>${escapeHtml(line)}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    if (data.description) {
      html += `<div class="view-desc">${escapeHtml(data.description)}</div>`;
    }

    body.innerHTML = html;
    openModal(modalView);
  }

  // =============================================================
  // STOCK HISTORY
  // =============================================================
  function renderStockHistory(productId) {
    const product = getProduct(parseInt(productId));
    if (!product) return;
    stockProductId = productId;
    document.getElementById('stock-history-product-name').textContent = product.name;
    document.getElementById('stock-history-current-stock').textContent = `Current Stock: ${product.stock || 0} ${product.unit || 'units'}`;

    const entries = getStockEntries(productId);
    const container = document.getElementById('stock-ledger-body');

    if (entries.length === 0) {
      container.innerHTML = '<div class="ledger-empty">No stock entries yet.</div>';
      return;
    }

    container.innerHTML = entries.slice().reverse().map(e => {
      const isIn = e.type === 'in';
      return `
        <div class="ledger-item">
          <div class="ledger-icon ${isIn ? 'ledger-in' : 'ledger-out'}">
            <i class="fas ${isIn ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
          </div>
          <div class="ledger-info">
            <div class="ledger-reason">${escapeHtml(e.reason)}</div>
            <div class="ledger-date">${new Date(e.date).toLocaleString()}</div>
          </div>
          <div class="ledger-qty ${isIn ? 'ledger-in' : 'ledger-out'}">${isIn ? '+' : '-'}${e.qty}</div>
        </div>
      `;
    }).join('');

    openModal(modalStock);
  }

  // =============================================================
  // EVENT BINDING
  // =============================================================
  function bindEvents() {
    // Add Product button
    document.getElementById('btn-add-product').addEventListener('click', function() {
      resetForm();
      editingId = null;
      document.getElementById('product-modal-title').innerHTML = '<i class="fas fa-box"></i> Add Product';
      openModal(modalProduct);
    });

    // Close buttons
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.dataset.close;
        const modal = document.getElementById(id);
        if (modal) closeModal(modal);
      });
    });

    // Click outside modal to close
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', function(e) {
        if (e.target === this) {
          closeModal(this);
        }
      });
    });

    // Product type toggle
    document.querySelectorAll('#pf-producttype-toggle button').forEach(btn => {
      btn.addEventListener('click', function() {
        const val = this.dataset.val;
        pfProducttype.value = val;
        updateTypeToggle(val);
        toggleSections(val);
      });
    });

    // YN toggle
    document.querySelectorAll('#ts-vibration-toggle button').forEach(btn => {
      btn.addEventListener('click', function() {
        const val = this.dataset.val;
        tsVibration.value = val;
        updateYNToggle(val);
      });
    });

    // Other category
    pfCategory.addEventListener('change', function() {
      pfOtherWrap.classList.toggle('hidden', this.value !== '__other__');
    });

    document.getElementById('btn-add-other-category').addEventListener('click', function() {
      const val = pfOtherCategory.value.trim();
      if (!val) {
        document.getElementById('err-pf-other-category').textContent = 'Please enter a category name.';
        return;
      }
      const opt = document.createElement('option');
      opt.textContent = val;
      opt.value = val;
      pfCategory.insertBefore(opt, pfCategory.querySelector('option[value="__other__"]'));
      pfCategory.value = val;
      pfOtherCategory.value = '';
      pfOtherWrap.classList.add('hidden');
      document.getElementById('err-pf-other-category').textContent = '';
      showToast('Category added!', 'success');
    });

    // Spec Master
    btnAddSpec.addEventListener('click', function() {
      specLines.push('');
      renderSpecMaster();
      // Focus the new input
      const inputs = document.querySelectorAll('.specmaster-input');
      if (inputs.length) {
        inputs[inputs.length - 1].focus();
      }
    });

    // Save Product
    document.getElementById('btn-save-product').addEventListener('click', function() {
      const data = collectFormData();

      // Validate
      let errors = [];
      if (!data.name) errors.push('Product Name is required');
      if (!data.productType) errors.push('Product Type is required');
      if (!data.category) errors.push('Category is required');
      if (!data.brand) errors.push('Brand is required');
      if (!data.price || data.price <= 0) errors.push('Selling Price is required');
      if (!data.mrp || data.mrp <= 0) errors.push('MRP is required');
      if (data.stock < 0) errors.push('Stock quantity cannot be negative');
      if (!data.qtyPerKw && data.qtyPerKw !== 0) errors.push('Qty per Set is required');

      if (errors.length) {
        showToast(errors[0], 'error');
        return;
      }

      const id = pfId.value ? parseInt(pfId.value) : null;
      if (id) {
        updateProduct(id, data);
      } else {
        addProduct(data);
      }
      closeModal(modalProduct);
    });

    // Table events (delegated)
    tbody.addEventListener('click', function(e) {
      const target = e.target.closest('button');
      if (!target) return;

      // View
      if (target.classList.contains('icon-view')) {
        const id = parseInt(target.dataset.id);
        const product = getProduct(id);
        if (product) renderViewProduct(product);
      }

      // Edit
      if (target.classList.contains('icon-edit')) {
        const id = parseInt(target.dataset.id);
        const product = getProduct(id);
        if (product) {
          resetForm();
          populateForm(product);
          editingId = id;
          document.getElementById('product-modal-title').innerHTML = '<i class="fas fa-pen"></i> Edit Product';
          openModal(modalProduct);
        }
      }

      // Delete
      if (target.classList.contains('danger')) {
        const id = parseInt(target.dataset.id);
        const product = getProduct(id);
        if (product) {
          deletingId = id;
          document.getElementById('delete-product-name').textContent = product.name;
          openModal(modalDelete);
        }
      }

      // Stock history
      if (target.classList.contains('stock-history-btn')) {
        const id = target.dataset.id;
        renderStockHistory(id);
      }
    });

    // Confirm Delete
    document.getElementById('btn-confirm-delete-product').addEventListener('click', function() {
      if (deletingId) {
        deleteProduct(deletingId);
        deletingId = null;
        closeModal(modalDelete);
      }
    });

    // Stock entry
    document.getElementById('btn-add-stock-entry').addEventListener('click', function() {
      const type = document.getElementById('sl-type').value;
      const qty = parseInt(document.getElementById('sl-qty').value);
      const reason = document.getElementById('sl-reason').value.trim();

      if (!qty || qty <= 0) {
        showToast('Please enter a valid quantity.', 'error');
        return;
      }

      if (stockProductId) {
        addStockEntry(stockProductId, type, qty, reason);
        document.getElementById('sl-qty').value = '';
        document.getElementById('sl-reason').value = '';
      }
    });

    // Search
    searchInput.addEventListener('input', render);

    // Filters
    filterType.addEventListener('change', render);
    filterCategory.addEventListener('change', render);
    filterStatus.addEventListener('change', render);

    // Rows per page
    rowsSelect.addEventListener('change', function() {
      rowsPerPage = parseInt(this.value);
      currentPage = 1;
      render();
    });

    // Pagination
    pagination.addEventListener('click', function(e) {
      const btn = e.target.closest('.pagination-btn');
      if (!btn || btn.classList.contains('disabled')) return;
      const page = btn.dataset.page;
      if (page === 'prev') {
        if (currentPage > 1) currentPage--;
      } else if (page === 'next') {
        const total = Math.ceil(filteredProducts.length / rowsPerPage);
        if (currentPage < total) currentPage++;
      } else {
        currentPage = parseInt(page);
      }
      render();
    });

    // Sort
    document.querySelectorAll('.data-table thead th[data-sort]').forEach(th => {
      th.addEventListener('click', function() {
        const field = this.dataset.sort;
        if (sortField === field) {
          sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          sortField = field;
          sortDirection = 'asc';
        }
        render();
      });
    });

    // ---------------------------------------------------------
    // Profile & Notifications (simple toggle)
    // NOTE: these are guarded with null-checks because the
    // notification bell markup is currently commented out in
    // productm.html. Previously this block called
    // document.getElementById('notifBtn').addEventListener(...)
    // directly — since #notifBtn doesn't exist, that threw a
    // TypeError and silently aborted the rest of bindEvents(),
    // which meant the sidebar toggle listener (registered further
    // down) never got attached in ANY view. Guarding every lookup
    // here fixes that and makes this function resilient to future
    // markup changes too.
    // ---------------------------------------------------------
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
      profileBtn.addEventListener('click', function() {
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown) dropdown.classList.toggle('hidden');
      });
    }

    const notifBtn = document.getElementById('notifBtn');
    if (notifBtn) {
      notifBtn.addEventListener('click', function() {
        const dropdown = document.getElementById('notifDropdown');
        if (dropdown) dropdown.classList.toggle('hidden');
      });
    }

    // Close dropdowns on outside click
    document.addEventListener('click', function(e) {
      const profileDropdown = document.getElementById('profileDropdown');
      if (profileDropdown && !e.target.closest('#profileBtn') && !e.target.closest('#profileDropdown')) {
        profileDropdown.classList.add('hidden');
      }
      const notifDropdown = document.getElementById('notifDropdown');
      if (notifDropdown && !e.target.closest('#notifBtn') && !e.target.closest('#notifDropdown')) {
        notifDropdown.classList.add('hidden');
      }
    });

    // ---------------------------------------------------------
    // Sidebar toggle
    // Rewritten to explicitly set the expanded/collapsed state
    // (instead of blindly toggling both classes, which could
    // briefly leave both classes on the element at once) and to
    // guard every element lookup so a missing node never breaks
    // the toggle again.
    // ---------------------------------------------------------
    const sidebarToggleBtn = document.getElementById('sidebarToggle');
    if (sidebarToggleBtn) {
      sidebarToggleBtn.addEventListener('click', function() {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) return;
        const icon = document.getElementById('toggleIcon');
        const backdrop = document.getElementById('sidebarBackdrop');
        const willExpand = !sidebar.classList.contains('expanded');

        sidebar.classList.toggle('expanded', willExpand);
        sidebar.classList.toggle('collapsed', !willExpand);
        if (icon) icon.classList.toggle('rotate-180', willExpand);
        if (backdrop) backdrop.classList.toggle('visible', willExpand);
      });
    }

    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    if (sidebarBackdrop) {
      sidebarBackdrop.addEventListener('click', function() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
          sidebar.classList.remove('expanded');
          sidebar.classList.add('collapsed');
        }
        this.classList.remove('visible');
        const icon = document.getElementById('toggleIcon');
        if (icon) icon.classList.remove('rotate-180');
      });
    }

    // Session / Logout (from session.js)
    const logoutBtn = document.getElementById('profileLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function() {
        if (typeof logout === 'function') {
          logout();
        } else {
          window.location.href = '/login.html';
        }
      });
    }

    // Profile role label
    const roleLabel = document.getElementById('profileRoleLabel');
    if (roleLabel && typeof getUserRole === 'function') {
      roleLabel.textContent = 'Logged in as: ' + getUserRole();
    } else if (roleLabel) {
      roleLabel.textContent = 'Logged in as: User';
    }
  }

  // =============================================================
  // INIT
  // =============================================================
  function init() {
    loadProducts();
    loadLedger();
    render();
    bindEvents();
    toggleSections('');
    updateTypeToggle('');
    updateYNToggle('no');
    console.log('✅ Product Management initialized. Products loaded:', products.length);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();