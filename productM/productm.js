(function() {
  'use strict';

  // =============================================================
  // API CONFIG  (NEW)
  // =============================================================
  const API_BASE = 'http://localhost:8092/api';

  // Fields your form collects that DO NOT have a matching column in
  // ProductRequestDto. We pack them into the `features` list (which the
  // backend already stores as List<Map<String,String>>) using the field
  // name itself as the `id`, so they survive a save/reload round trip.
  // Feature lines coming from your "Spec Master" UI keep using ids F1,F2...
  // so the two are never confused.
  const EXTRA_FIELD_KEYS = [
    'spec', 'unit', 'qtyPerKw',
    'output', 'tonnage', 'cycletime', 'oiltank', 'gensetKva', 'automation',
    'vibration', 'palletsize', 'labour', 'shed', 'motor', 'origin', 'video',
    'bundled', 'plc', 'controlpanel', 'safety', 'accessories',
    'capacity', 'length', 'features', 'compatible',
    'sizetype', 'packunit', 'moq'
  ];
  const EXTRA_NUMERIC_FIELD_KEYS = ['qtyPerKw', 'tonnage', 'cycletime', 'oiltank', 'gensetKva', 'labour', 'moq'];

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
  let specLines = []; // [{ label, value }] -> mapped to payload.specifications.features [{id,label,value}]
  let galleryImages = []; // [{ name, dataUrl }] -> preview only
  let brochureFile = null; // { name, dataUrl } | null -> preview only

  // NEW: actual File objects to send to the backend as multipart parts.
  let thumbnailFileObj = null;
  let galleryFileObjs = [];
  let brochureFileObj = null;

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

  // --- productIdentity ---
  const pfId = $('#pf-id');
  const pfName = $('#pf-name');
  const pfModelcode = $('#pf-modelcode');
  const pfBrand = $('#pf-brand');
  const pfSku = $('#pf-sku');

  // --- classification ---
  const pfProducttype = $('#pf-producttype');
  const pfCategory = $('#pf-category');
  const pfOtherCategory = $('#pf-other-category');
  const pfOtherWrap = $('#pf-other-category-wrap');
  const pfSubcategory = $('#pf-subcategory');
  const pfHsn = $('#pf-hsn');
  const pfGst = $('#pf-gst');

  // --- pricing ---
  const pfMrp = $('#pf-mrp');
  const pfDiscountType = $('#pf-discounttype');
  const pfDiscount = $('#pf-discount');
  const pfPrice = $('#pf-price');

  // --- inventory ---
  const pfStock = $('#pf-stock');
  const pfThreshold = $('#pf-threshold');
  const pfReorderQty = $('#pf-reorderqty');
  const pfLeadTime = $('#pf-leadtime');
  const pfStatus = $('#pf-status');

  const pfSpec = $('#pf-spec');
  const pfUnit = $('#pf-unit');
  const pfQtyPerKw = $('#pf-qtyperkw');
  const pfDescription = $('#pf-description');

  // --- media (file upload + base64 preview) ---
  const pfThumbnail = $('#pf-thumbnail'); // hidden input holding the current base64 data URL (preview)
  const pfThumbnailFile = $('#pf-thumbnail-file');
  const pfThumbnailPreviewWrap = $('#pf-thumbnail-preview-wrap');
  const pfThumbnailPreview = $('#pf-thumbnail-preview');
  const pfThumbnailRemove = $('#pf-thumbnail-remove');

  const pfGalleryFile = $('#pf-gallery-file');
  const pfGalleryPreviewWrap = $('#pf-gallery-preview-wrap');

  const pfBrochure = $('#pf-brochure'); // hidden input holding the current base64 data URL (preview)
  const pfBrochureFile = $('#pf-brochure-file');
  const pfBrochurePreviewWrap = $('#pf-brochure-preview-wrap');
  const pfBrochurePreview = $('#pf-brochure-preview');
  const pfBrochureFilename = $('#pf-brochure-filename');
  const pfBrochureRemove = $('#pf-brochure-remove');

  // --- specifications: machine ---
  const miOutput = $('#mi-output');
  const miTonnage = $('#mi-tonnage');
  const miCycletime = $('#mi-cycletime');
  const miOiltank = $('#mi-oiltank');
  const miPowerKw = $('#mi-power-kw');
  const miGensetKva = $('#mi-genset-kva');
  const tsAutomation = $('#ts-automation');
  const tsVibration = $('#ts-vibration');
  const tsPalletsize = $('#ts-palletsize');
  const miLabour = $('#mi-labour');
  const miShed = $('#mi-shed');
  const miWeightKg = $('#mi-weight-kg');
  const miLengthCm = $('#mi-length-cm');
  const miWidthCm = $('#mi-width-cm');
  const miHeightCm = $('#mi-height-cm');
  const miMotor = $('#mi-motor');
  const miOrigin = $('#mi-origin');
  const miVideo = $('#mi-video');
  const miBundled = $('#mi-bundled');
  const tsPlc = $('#ts-plc');
  const tsControlpanel = $('#ts-controlpanel');
  const tsSafety = $('#ts-safety');
  const miAccessories = $('#mi-accessories');

  // --- specifications: warranty ---
  const pfWarranty = $('#pf-warranty');
  const miWarrantyType = $('#mi-warranty-type');
  const miWarrantyParts = $('#mi-warranty-parts');

  // --- specifications: component ---
  const coCapacity = $('#co-capacity');
  const coLength = $('#co-length');
  const coMotor = $('#co-motor');
  const coFeatures = $('#co-features');
  const coCompatible = $('#co-compatible');

  // --- specifications: accessory ---
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
  // PAYLOAD MAPPING
  // =============================================================
  function calcFinalPrice(mrp, discountType, discountValue) {
    mrp = parseFloat(mrp) || 0;
    discountValue = parseFloat(discountValue) || 0;
    if (discountType === 'flat') {
      return Math.max(0, mrp - discountValue);
    }
    // percentage (default)
    return Math.max(0, mrp - (mrp * discountValue / 100));
  }

  // NEW: builds the extra "features" entries (Spec Master lines + the
  // form fields that ProductRequestDto has no column for).
  function buildFeaturesArray(data) {
    const arr = (data.specMaster || [])
      .filter(s => (s.label && s.label.trim()) || (s.value && s.value.trim()))
      .map((f, idx) => ({ id: f.id || ('F' + (idx + 1)), label: f.label || '', value: f.value || '' }));

    EXTRA_FIELD_KEYS.forEach(key => {
      const val = data[key];
      if (val !== undefined && val !== null && val !== '') {
        arr.push({ id: key, label: key, value: String(val) });
      }
    });
    return arr;
  }

  // NEW: builds the exact flat JSON shape ProductRequestDto expects,
  // plus a FormData object bundling it with any selected files.
  function buildFormData(data) {
    const requestDto = {
        name: data.name || '',
        sku: data.sku || '',
        modelCode: data.modelCode || '',
        brand: data.brand || '',
        type: data.productType || '',
        category: data.category || '',
        subCategory: data.subCategory || '',
        hsn: data.hsn || '',
        gst: parseInt(data.gst) || 0,
        mrp: data.mrp || 0,
        discountType: data.discountType || 'percentage',
        discountValue: data.discount || 0,
        calculatedPrice: calcFinalPrice(data.mrp, data.discountType, data.discount),
        finalPrice: data.price || 0,
        stock: data.stock || 0,
        threshold: data.threshold || 0,
        reorderQuantity: data.reorderQty || 0,
        leadTimeDays: data.leadTime || 0,
        status: data.status || 'Active',
        powerConsumptionKw: data.powerKw || 0,
        weightKg: data.weightKg || 0,
        dimensions: {
            lengthCm: data.lengthCm || 0,
            widthCm: data.widthCm || 0,
            heightCm: data.heightCm || 0
        },
        warranty: {
            periodYears: data.warranty || 0,
            type: data.warrantyType || '',
            partsCovered: data.warrantyParts || ''
        },
        features: buildFeaturesArray(data),
        description: data.description || ''
    };

    const formData = new FormData();
    // Send as JSON string directly, not as a Blob
    formData.append('product', JSON.stringify(requestDto));
    if (thumbnailFileObj) formData.append('thumbnailFile', thumbnailFileObj);
    if (galleryFileObjs && galleryFileObjs.length) {
        galleryFileObjs.forEach(f => formData.append('galleryFiles', f));
    }
    if (brochureFileObj) formData.append('brochurePdfFile', brochureFileObj);
    return formData;
}

  // NEW: turns a ProductResponseDto (from the backend) back into the flat
  // `product` shape the rest of this file (table, form, view modal) uses.
  function mapDtoToProduct(dto) {
    const product = {
      id: dto.id,
      name: dto.name || '',
      sku: dto.sku || '',
      modelCode: dto.modelCode || '',
      brand: dto.brand || '',
      productType: dto.type || '',
      category: dto.category || '',
      subCategory: dto.subCategory || '',
      hsn: dto.hsn || '',
      gst: dto.gst || 0,
      mrp: dto.mrp || 0,
      discountType: dto.discountType || 'percentage',
      discount: dto.discountValue || 0,
      price: dto.finalPrice || 0,
      stock: dto.stock || 0,
      threshold: dto.threshold || 0,
      reorderQty: dto.reorderQuantity || 0,
      leadTime: dto.leadTimeDays || 0,
      status: dto.status || 'Active',
      description: dto.description || '',
      powerKw: dto.powerConsumptionKw || 0,
      weightKg: dto.weightKg || 0,
      lengthCm: (dto.dimensions && dto.dimensions.lengthCm) || 0,
      widthCm: (dto.dimensions && dto.dimensions.widthCm) || 0,
      heightCm: (dto.dimensions && dto.dimensions.heightCm) || 0,
      warranty: (dto.warranty && dto.warranty.periodYears) || 0,
      warrantyType: (dto.warranty && dto.warranty.type) || '',
      warrantyParts: (dto.warranty && dto.warranty.partsCovered) || '',
      thumbnail: dto.thumbnail || '',
      gallery: Array.isArray(dto.gallery) ? dto.gallery.map(url => ({ name: '', dataUrl: url })) : [],
      brochure: dto.brochurePdf || '',
      brochureName: dto.brochurePdf ? dto.brochurePdf.split('/').pop() : '',
      specMaster: []
    };

    const features = Array.isArray(dto.features) ? dto.features : [];
    features.forEach(f => {
      if (f.id && /^F\d+$/.test(f.id)) {
        product.specMaster.push({ id: f.id, label: f.label || '', value: f.value || '' });
      } else if (f.id && EXTRA_FIELD_KEYS.indexOf(f.id) !== -1) {
        product[f.id] = EXTRA_NUMERIC_FIELD_KEYS.indexOf(f.id) !== -1
          ? (parseFloat(f.value) || 0)
          : (f.value || '');
      }
    });

    return product;
  }

  // =============================================================
  // CRUD OPERATIONS  (now backed by the REST API on port 8092)
  // =============================================================
  async function fetchProductsFromServer() {
    try {
      const res = await fetch(`${API_BASE}/products/get-all-products`);
      const json = await res.json();
      if (res.ok && json && json.success) {
        products = (json.data || []).map(mapDtoToProduct);
      } else {
        showToast((json && json.message) || 'Failed to load products', 'error');
        products = [];
      }
    } catch (err) {
      showToast('Could not connect to server on port 8092.', 'error');
      products = [];
    }
    render();
  }

  function getProduct(id) {
    return products.find(p => p.id === id);
  }

  async function addProduct(data) {
    try {
      const formData = buildFormData(data);
      const res = await fetch(`${API_BASE}/create-product`, {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      if (res.ok && json && json.success) {
        await fetchProductsFromServer();
        showToast('Product added successfully!', 'success');
        return true;
      }
      showToast((json && json.message) || 'Failed to add product', 'error');
      return false;
    } catch (err) {
      showToast('Could not connect to server on port 8092.', 'error');
      return false;
    }
  }

  async function updateProduct(id, data, silent) {
    try {
      const formData = buildFormData(data);
      const res = await fetch(`${API_BASE}/products/update-product/${id}`, {
        method: 'PUT',
        body: formData
      });
      const json = await res.json();
      if (res.ok && json && json.success) {
        await fetchProductsFromServer();
        if (!silent) showToast('Product updated successfully!', 'success');
        return true;
      }
      if (!silent) showToast((json && json.message) || 'Failed to update product', 'error');
      return false;
    } catch (err) {
      if (!silent) showToast('Could not connect to server on port 8092.', 'error');
      return false;
    }
  }

  async function deleteProduct(id) {
    try {
      const res = await fetch(`${API_BASE}/products/delete-product/${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (res.ok && json && json.success) {
        await fetchProductsFromServer();
        showToast('Product deleted successfully!', 'error');
        return true;
      }
      showToast((json && json.message) || 'Failed to delete product', 'error');
      return false;
    } catch (err) {
      showToast('Could not connect to server on port 8092.', 'error');
      return false;
    }
  }

  // =============================================================
  // STOCK LEDGER (kept in localStorage — backend has no stock-ledger
  // endpoint — but stock quantity itself is now synced to the server)
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

  async function addStockEntry(productId, type, qty, reason) {
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

    const product = getProduct(parseInt(productId));
    if (product) {
      let newStock = parseInt(product.stock) || 0;
      if (type === 'in') {
        newStock += parseInt(qty);
      } else {
        newStock = Math.max(0, newStock - parseInt(qty));
      }
      const updatedData = Object.assign({}, product, { stock: newStock });

      // A stock adjustment shouldn't re-upload/replace existing media files.
      thumbnailFileObj = null;
      galleryFileObjs = [];
      brochureFileObj = null;

      await updateProduct(parseInt(productId), updatedData, true);
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

    filteredProducts.sort((a, b) => {
      let va = a[sortField] || '';
      let vb = b[sortField] || '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDirection === 'asc' ? -1 : 1;
      if (va > vb) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / rowsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * rowsPerPage;
    const end = Math.min(start + rowsPerPage, total);
    const pageItems = filteredProducts.slice(start, end);

    statTotal.textContent = products.length;
    statActive.textContent = products.filter(p => p.status === 'Active').length;
    statLow.textContent = products.filter(p => {
      const stock = parseInt(p.stock) || 0;
      const threshold = parseInt(p.threshold) || 0;
      return stock <= threshold;
    }).length;
    const totalValue = products.reduce((sum, p) => sum + (parseFloat(p.price) || 0) * (parseInt(p.stock) || 0), 0);
    statValue.textContent = '₹' + totalValue.toLocaleString('en-IN');

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
              ${p.discount && p.discount > 0 ? `<span class="discount-badge">${p.discount}${p.discountType === 'flat' ? ' ₹ off' : '% off'}</span>` : ''}
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
  // PRODUCT FORM
  // =============================================================
  function collectFormData() {
    const type = pfProducttype.value;
    const mrp = parseFloat(pfMrp.value) || 0;
    const discountType = pfDiscountType.value || 'percentage';
    const discount = parseFloat(pfDiscount.value) || 0;
    // If the user hasn't typed a final price, auto-calc it from MRP + discount.
    const enteredPrice = parseFloat(pfPrice.value);
    const price = (pfPrice.value === '' || isNaN(enteredPrice))
      ? calcFinalPrice(mrp, discountType, discount)
      : enteredPrice;

    const data = {
      // productIdentity
      name: pfName.value.trim(),
      modelCode: pfModelcode.value.trim(),
      brand: pfBrand.value.trim(),
      sku: pfSku.value.trim(),

      // classification
      productType: type,
      category: pfCategory.value === '__other__' ? pfOtherCategory.value.trim() : pfCategory.value,
      subCategory: pfSubcategory.value.trim(),
      hsn: pfHsn.value.trim(),
      gst: parseFloat(pfGst.value) || 0,

      // pricing
      mrp: mrp,
      discountType: discountType,
      discount: discount,
      price: price,

      // inventory
      stock: parseInt(pfStock.value) || 0,
      threshold: parseInt(pfThreshold.value) || 0,
      reorderQty: parseInt(pfReorderQty.value) || 0,
      leadTime: parseInt(pfLeadTime.value) || 0,
      status: pfStatus.value,

      spec: pfSpec.value.trim(),
      unit: pfUnit.value,
      qtyPerKw: parseFloat(pfQtyPerKw.value) || 0,
      description: pfDescription.value.trim(),

      // media (base64 data URLs for preview only — the actual files travel
      // separately as multipart parts, see thumbnailFileObj/galleryFileObjs/brochureFileObj)
      thumbnail: pfThumbnail.value || '',
      gallery: galleryImages.slice(),
      brochure: pfBrochure.value || '',
      brochureName: brochureFile ? brochureFile.name : '',

      // warranty (shared)
      warranty: parseInt(pfWarranty.value) || 0,
      warrantyType: miWarrantyType.value.trim(),
      warrantyParts: miWarrantyParts.value.trim()
    };

    if (type === 'machine') {
      data.output = miOutput.value.trim();
      data.tonnage = parseFloat(miTonnage.value) || 0;
      data.cycletime = parseFloat(miCycletime.value) || 0;
      data.oiltank = parseInt(miOiltank.value) || 0;
      data.powerKw = parseFloat(miPowerKw.value) || 0;
      data.gensetKva = parseFloat(miGensetKva.value) || 0;
      data.automation = tsAutomation.value;
      data.vibration = tsVibration.value;
      data.palletsize = tsPalletsize.value.trim();
      data.labour = parseInt(miLabour.value) || 0;
      data.shed = miShed.value.trim();
      data.weightKg = parseFloat(miWeightKg.value) || 0;
      data.lengthCm = parseFloat(miLengthCm.value) || 0;
      data.widthCm = parseFloat(miWidthCm.value) || 0;
      data.heightCm = parseFloat(miHeightCm.value) || 0;
      data.motor = miMotor.value.trim();
      data.origin = miOrigin.value.trim();
      data.video = miVideo.value.trim();
      data.bundled = miBundled.value.trim();
      data.plc = tsPlc.value.trim();
      data.controlpanel = tsControlpanel.value.trim();
      data.safety = tsSafety.value.trim();
      data.accessories = miAccessories.value.trim();
    }

    if (type === 'component') {
      data.capacity = coCapacity.value.trim();
      data.length = coLength.value.trim();
      data.motor = coMotor.value.trim();
      data.features = coFeatures.value.trim();
      data.compatible = coCompatible.value.trim();
    }

    if (type === 'accessory') {
      data.sizetype = acSizetype.value.trim();
      data.packunit = acPackunit.value.trim();
      data.moq = parseInt(acMoq.value) || 0;
    }

    // specifications.features -> [{id, label, value}]
    data.specMaster = specLines
      .filter(s => (s.label && s.label.trim()) || (s.value && s.value.trim()))
      .map((s, idx) => ({ id: 'F' + (idx + 1), label: s.label.trim(), value: s.value.trim() }));

    return data;
  }

  function populateForm(data) {
    if (!data) return;
    pfId.value = data.id || '';
    pfName.value = data.name || '';
    pfModelcode.value = data.modelCode || '';
    pfBrand.value = data.brand || '';
    pfSku.value = data.sku || '';

    pfProducttype.value = data.productType || '';
    pfCategory.value = data.category || '';
    pfSubcategory.value = data.subCategory || '';
    pfHsn.value = data.hsn || '';
    pfGst.value = data.gst || 18;

    pfMrp.value = data.mrp || 0;
    pfDiscountType.value = data.discountType || 'percentage';
    pfDiscount.value = data.discount || 0;
    pfPrice.value = data.price || 0;

    pfStock.value = data.stock || 0;
    pfThreshold.value = data.threshold || 2;
    pfReorderQty.value = data.reorderQty || 0;
    pfLeadTime.value = data.leadTime || 0;
    pfStatus.value = data.status || 'Active';

    pfSpec.value = data.spec || '';
    pfUnit.value = data.unit || 'Piece';
    pfQtyPerKw.value = data.qtyPerKw || 0;
    pfDescription.value = data.description || '';

    // Editing an existing product: no new files chosen yet.
    thumbnailFileObj = null;
    galleryFileObjs = [];
    brochureFileObj = null;

    setThumbnailPreview(data.thumbnail || '');
    galleryImages = Array.isArray(data.gallery) ? data.gallery.slice() : [];
    renderGalleryPreview();
    setBrochurePreview(data.brochure || '', data.brochureName || '');

    pfWarranty.value = data.warranty || 0;
    miWarrantyType.value = data.warrantyType || '';
    miWarrantyParts.value = data.warrantyParts || '';

    miOutput.value = data.output || '';
    miTonnage.value = data.tonnage || '';
    miCycletime.value = data.cycletime || '';
    miOiltank.value = data.oiltank || '';
    miPowerKw.value = data.powerKw || '';
    miGensetKva.value = data.gensetKva || '';
    tsAutomation.value = data.automation || 'Manual';
    tsVibration.value = data.vibration || 'no';
    tsPalletsize.value = data.palletsize || '';
    miLabour.value = data.labour || '';
    miShed.value = data.shed || '';
    miWeightKg.value = data.weightKg || '';
    miLengthCm.value = data.lengthCm || '';
    miWidthCm.value = data.widthCm || '';
    miHeightCm.value = data.heightCm || '';
    miMotor.value = data.motor || '';
    miOrigin.value = data.origin || '';
    miVideo.value = data.video || '';
    miBundled.value = data.bundled || '';
    tsPlc.value = data.plc || '';
    tsControlpanel.value = data.controlpanel || '';
    tsSafety.value = data.safety || '';
    miAccessories.value = data.accessories || '';

    coCapacity.value = data.capacity || '';
    coLength.value = data.length || '';
    coMotor.value = (data.productType === 'component' ? data.motor : '') || '';
    coFeatures.value = data.features || '';
    coCompatible.value = data.compatible || '';

    acSizetype.value = data.sizetype || '';
    acPackunit.value = data.packunit || '';
    acMoq.value = data.moq || '';

    specLines = data.specMaster ? data.specMaster.map(s => ({ label: s.label || '', value: s.value || '' })) : [];
    renderSpecMaster();

    toggleSections(data.productType || '');
    updateTypeToggle(data.productType || '');
    updateYNToggle(tsVibration.value);
  }

  function resetForm() {
    pfId.value = '';
    pfName.value = '';
    pfModelcode.value = '';
    pfBrand.value = '';
    pfSku.value = '';

    pfProducttype.value = '';
    pfCategory.value = '';
    pfOtherCategory.value = '';
    pfSubcategory.value = '';
    pfHsn.value = '';
    pfGst.value = '18';

    pfMrp.value = '';
    pfDiscountType.value = 'percentage';
    pfDiscount.value = '';
    pfPrice.value = '';

    pfStock.value = '';
    pfThreshold.value = '2';
    pfReorderQty.value = '';
    pfLeadTime.value = '';
    pfStatus.value = 'Active';

    pfSpec.value = '';
    pfUnit.value = 'Piece';
    pfQtyPerKw.value = '';
    pfDescription.value = '';

    thumbnailFileObj = null;
    galleryFileObjs = [];
    brochureFileObj = null;

    setThumbnailPreview('');
    if (pfThumbnailFile) pfThumbnailFile.value = '';
    galleryImages = [];
    renderGalleryPreview();
    if (pfGalleryFile) pfGalleryFile.value = '';
    setBrochurePreview('', '');
    if (pfBrochureFile) pfBrochureFile.value = '';

    pfWarranty.value = '';
    miWarrantyType.value = '';
    miWarrantyParts.value = '';

    miOutput.value = '';
    miTonnage.value = '';
    miCycletime.value = '';
    miOiltank.value = '';
    miPowerKw.value = '';
    miGensetKva.value = '';
    tsAutomation.value = 'Manual';
    tsVibration.value = 'no';
    tsPalletsize.value = '';
    miLabour.value = '';
    miShed.value = '';
    miWeightKg.value = '';
    miLengthCm.value = '';
    miWidthCm.value = '';
    miHeightCm.value = '';
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
    const specSection = document.getElementById('specMasterSection');
    if (specSection) specSection.style.display = 'grid';
    const mediaSection = document.getElementById('mediaSection');
    if (mediaSection) mediaSection.style.display = 'grid';
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

  // Auto-calc Final Price whenever MRP / Discount Type / Discount Value change,
  // matching payload.pricing.calculatedPrice -> finalPrice.
  function recalcPrice() {
    const mrp = parseFloat(pfMrp.value) || 0;
    const discountType = pfDiscountType.value || 'percentage';
    const discount = parseFloat(pfDiscount.value) || 0;
    pfPrice.value = calcFinalPrice(mrp, discountType, discount) || '';
  }

  // =============================================================
  // MEDIA UPLOAD HELPERS
  // Files are read client-side into base64 data URLs so they can be
  // previewed immediately, and the raw File objects are kept in
  // thumbnailFileObj / galleryFileObjs / brochureFileObj so they can be
  // sent to the backend as multipart parts on save.
  // =============================================================
  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function setThumbnailPreview(dataUrl) {
    pfThumbnail.value = dataUrl || '';
    if (dataUrl) {
      pfThumbnailPreview.src = dataUrl;
      pfThumbnailPreviewWrap.style.display = 'flex';
    } else {
      pfThumbnailPreview.src = '';
      pfThumbnailPreviewWrap.style.display = 'none';
    }
  }

  function renderGalleryPreview() {
    if (!galleryImages.length) {
      pfGalleryPreviewWrap.innerHTML = '';
      return;
    }
    pfGalleryPreviewWrap.innerHTML = galleryImages.map((img, idx) => `
      <div class="media-gallery-item">
        <img src="${img.dataUrl}" alt="${escapeHtml(img.name || 'Gallery image')}">
        <button type="button" class="media-remove-btn" data-gallery-index="${idx}"><i class="fas fa-xmark"></i></button>
      </div>
    `).join('');

    pfGalleryPreviewWrap.querySelectorAll('.media-remove-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const idx = parseInt(this.dataset.galleryIndex);
        galleryImages.splice(idx, 1);
        if (galleryFileObjs[idx]) galleryFileObjs.splice(idx, 1);
        renderGalleryPreview();
      });
    });
  }

  function setBrochurePreview(dataUrl, name) {
    pfBrochure.value = dataUrl || '';
    brochureFile = dataUrl ? { name: name || 'brochure.pdf', dataUrl } : null;
    if (dataUrl) {
      pfBrochureFilename.textContent = name || 'brochure.pdf';
      pfBrochurePreviewWrap.style.display = 'flex';
    } else {
      pfBrochureFilename.textContent = '';
      pfBrochurePreviewWrap.style.display = 'none';
    }
  }

  function renderSpecMaster() {
    if (specLines.length === 0) {
      specList.innerHTML = '<div class="specmaster-empty">No feature lines added yet.</div>';
      return;
    }
    specList.innerHTML = specLines.map((line, idx) => {
      const sr = 'F' + (idx + 1);
      return `
        <div class="specmaster-row">
          <div class="specmaster-sr">${sr}</div>
          <input type="text" class="field-input specmaster-input" placeholder="Label (e.g. Structure)" value="${escapeHtml(line.label)}" data-index="${idx}" data-part="label">
          <input type="text" class="field-input specmaster-input" placeholder="Value (e.g. Heavy duty steel)" value="${escapeHtml(line.value)}" data-index="${idx}" data-part="value">
          <button class="specmaster-remove" data-index="${idx}"><i class="fas fa-xmark"></i></button>
        </div>
      `;
    }).join('');

    document.querySelectorAll('.specmaster-input').forEach(inp => {
      inp.addEventListener('input', function() {
        const idx = parseInt(this.dataset.index);
        const part = this.dataset.part;
        specLines[idx][part] = this.value;
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
        <div class="view-item"><div class="view-label">Sub Category</div><div class="view-value">${escapeHtml(data.subCategory) || '—'}</div></div>
        <div class="view-item"><div class="view-label">Brand</div><div class="view-value">${escapeHtml(data.brand) || '—'}</div></div>
        <div class="view-item"><div class="view-label">SKU</div><div class="view-value">${escapeHtml(data.sku) || '—'}</div></div>
        <div class="view-item"><div class="view-label">Model Code</div><div class="view-value">${escapeHtml(data.modelCode) || '—'}</div></div>
        <div class="view-item"><div class="view-label">Specification</div><div class="view-value">${escapeHtml(data.spec) || '—'}</div></div>
        <div class="view-item"><div class="view-label">Unit</div><div class="view-value">${escapeHtml(data.unit) || '—'}</div></div>
        <div class="view-item"><div class="view-label">HSN Code</div><div class="view-value">${escapeHtml(data.hsn) || '—'}</div></div>
        <div class="view-item"><div class="view-label">GST</div><div class="view-value">${data.gst || 0}%</div></div>
        <div class="view-item"><div class="view-label">Warranty</div><div class="view-value">${data.warranty || 0} Yr${data.warrantyType ? ' · ' + escapeHtml(data.warrantyType) : ''}</div></div>
        <div class="view-item"><div class="view-label">MRP</div><div class="view-value">₹${Number(data.mrp).toLocaleString('en-IN') || 0}</div></div>
        <div class="view-item"><div class="view-label">Discount</div><div class="view-value">${data.discount || 0}${data.discountType === 'flat' ? ' ₹' : '%'}</div></div>
        <div class="view-item"><div class="view-label">Final Price</div><div class="view-value">₹${Number(data.price).toLocaleString('en-IN') || 0}</div></div>
        <div class="view-item"><div class="view-label">Stock</div><div class="view-value">${data.stock || 0}</div></div>
        <div class="view-item"><div class="view-label">Low Stock Threshold</div><div class="view-value">${data.threshold || 0}</div></div>
        <div class="view-item"><div class="view-label">Reorder Qty</div><div class="view-value">${data.reorderQty || 0}</div></div>
        <div class="view-item"><div class="view-label">Lead Time</div><div class="view-value">${data.leadTime || 0} Days</div></div>
        <div class="view-item"><div class="view-label">Qty per Set</div><div class="view-value">${data.qtyPerKw || 0}</div></div>
        <div class="view-item"><div class="view-label">Status</div><div class="view-value">${data.status || '—'}</div></div>
      </div>
    `;

    if (data.productType === 'machine') {
      html += `
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid #EFC8DC;">
          <div style="font-weight:700;font-size:12px;color:#800021;margin-bottom:8px;"><i class="fas fa-gears"></i> Machine Information</div>
          <div class="view-grid">
            <div class="view-item"><div class="view-label">Production Capacity</div><div class="view-value">${escapeHtml(data.output) || '—'}</div></div>
            <div class="view-item"><div class="view-label">Tonnage</div><div class="view-value">${data.tonnage || 0} Ton</div></div>
            <div class="view-item"><div class="view-label">Cycle Time</div><div class="view-value">${data.cycletime || 0} Sec</div></div>
            <div class="view-item"><div class="view-label">Oil Tank</div><div class="view-value">${data.oiltank || 0} Ltr</div></div>
            <div class="view-item"><div class="view-label">Power</div><div class="view-value">${data.powerKw || 0} kW</div></div>
            <div class="view-item"><div class="view-label">Genset</div><div class="view-value">${data.gensetKva || 0} KVA</div></div>
            <div class="view-item"><div class="view-label">Automation</div><div class="view-value">${escapeHtml(data.automation) || '—'}</div></div>
            <div class="view-item"><div class="view-label">Vibration Table</div><div class="view-value">${data.vibration === 'yes' ? '✅ Yes' : '❌ No'}</div></div>
            <div class="view-item"><div class="view-label">Pallet Size</div><div class="view-value">${escapeHtml(data.palletsize) || '—'}</div></div>
            <div class="view-item"><div class="view-label">Labour Required</div><div class="view-value">${data.labour || 0} Persons</div></div>
            <div class="view-item"><div class="view-label">Shed Required</div><div class="view-value">${escapeHtml(data.shed) || '—'}</div></div>
            <div class="view-item"><div class="view-label">Weight</div><div class="view-value">${data.weightKg || 0} Kg</div></div>
            <div class="view-item"><div class="view-label">Dimensions (L×W×H)</div><div class="view-value">${data.lengthCm || 0} × ${data.widthCm || 0} × ${data.heightCm || 0} cm</div></div>
            <div class="view-item"><div class="view-label">Motor</div><div class="view-value">${escapeHtml(data.motor) || '—'}</div></div>
            <div class="view-item"><div class="view-label">Origin</div><div class="view-value">${escapeHtml(data.origin) || '—'}</div></div>
          </div>
          ${data.warrantyParts ? `<div class="view-item" style="margin-top:8px;"><div class="view-label">Warranty Parts Covered</div><div class="view-value">${escapeHtml(data.warrantyParts)}</div></div>` : ''}
          ${data.bundled ? `<div class="view-item"><div class="view-label">Bundled Equipment</div><div class="view-value">${escapeHtml(data.bundled)}</div></div>` : ''}
          ${data.plc ? `<div class="view-item"><div class="view-label">PLC Details</div><div class="view-value">${escapeHtml(data.plc)}</div></div>` : ''}
          ${data.controlpanel ? `<div class="view-item"><div class="view-label">Control Panel</div><div class="view-value">${escapeHtml(data.controlpanel)}</div></div>` : ''}
          ${data.safety ? `<div class="view-item"><div class="view-label">Safety Features</div><div class="view-value">${escapeHtml(data.safety)}</div></div>` : ''}
          ${data.accessories ? `<div class="view-item"><div class="view-label">Accessories</div><div class="view-value" style="white-space:pre-line;">${escapeHtml(data.accessories)}</div></div>` : ''}
        </div>
      `;
    }

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

    if (data.specMaster && data.specMaster.length) {
      html += `
        <div class="view-specmaster">
          <div style="font-weight:700;font-size:12px;color:#800021;margin-bottom:6px;"><i class="fas fa-list-ol"></i> Feature Specifications</div>
          ${data.specMaster.map((f) => `
            <div class="view-specmaster-row">
              <span class="vs-sr">${escapeHtml(f.id)}</span>
              <span>${escapeHtml(f.label)}${f.label ? ' — ' : ''}${escapeHtml(f.value)}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    const hasGallery = Array.isArray(data.gallery) && data.gallery.length > 0;
    if (data.thumbnail || hasGallery || data.brochure) {
      html += `
        <div class="view-specmaster">
          <div style="font-weight:700;font-size:12px;color:#800021;margin-bottom:6px;"><i class="fas fa-photo-film"></i> Media</div>
          ${data.thumbnail ? `<img class="view-media-thumb" src="${data.thumbnail}" alt="Thumbnail">` : `<div class="view-item"><div class="view-label">Thumbnail</div><div class="view-value">—</div></div>`}
          ${hasGallery ? `<div class="view-media-gallery">${data.gallery.map(g => `<img src="${g.dataUrl || g}" alt="Gallery image">`).join('')}</div>` : ''}
          <div class="view-item" style="margin-top:8px;">
            <div class="view-label">Brochure PDF</div>
            <div class="view-value">${data.brochure ? `<a href="${data.brochure}" download="${escapeHtml(data.brochureName || 'brochure.pdf')}" title="${escapeHtml(data.brochureName || 'brochure.pdf')}" target="_blank" rel="noopener"><i class="fas fa-file-pdf"></i> View Brochure</a>` : '—'}</div>
          </div>
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
  // SIDEBAR (single, consolidated implementation)
  // =============================================================
  function isMobileWidth() {
    return window.innerWidth <= 1023;
  }

  function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    const icon = document.getElementById('toggleIcon');

    if (!sidebar) return;

    sidebar.classList.remove('expanded', 'collapsed', 'open');
    sidebar.style.transform = '';
    if (backdrop) backdrop.classList.remove('visible');
    if (icon) icon.classList.remove('rotate-180');

    if (isMobileWidth()) {
      // drawer starts closed on phone/tablet
    } else {
      // sidebar starts expanded on desktop
      sidebar.classList.add('expanded');
    }
  }

  function openSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    const icon = document.getElementById('toggleIcon');
    if (!sidebar) return;

    if (isMobileWidth()) {
      sidebar.classList.add('open');
      if (backdrop) backdrop.classList.add('visible');
    } else {
      sidebar.classList.remove('collapsed');
      sidebar.classList.add('expanded');
      if (icon) icon.classList.remove('rotate-180');
    }
  }

  function closeSidebarMobile() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    if (!sidebar) return;

    if (isMobileWidth()) {
      sidebar.classList.remove('open');
      if (backdrop) backdrop.classList.remove('visible');
    }
  }

  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    const icon = document.getElementById('toggleIcon');
    if (!sidebar) return;

    if (isMobileWidth()) {
      // Off-canvas drawer: toggle the 'open' class (CSS handles the slide)
      const isOpen = sidebar.classList.contains('open');
      sidebar.classList.toggle('open', !isOpen);
      if (backdrop) backdrop.classList.toggle('visible', !isOpen);
    } else {
      // Desktop: toggle collapsed/expanded width
      const isCollapsed = sidebar.classList.contains('collapsed');
      sidebar.classList.toggle('collapsed', !isCollapsed);
      sidebar.classList.toggle('expanded', isCollapsed);
      if (icon) icon.classList.toggle('rotate-180', isCollapsed);
    }
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
    menu.style.left = '0px'; menu.style.right = 'auto';
    requestAnimationFrame(() => {
      const rect = menu.getBoundingClientRect();
      if (rect.right > window.innerWidth - 8) {
        menu.style.left = 'auto'; menu.style.right = '0px';
      }
      if (rect.left < 8) { menu.style.left = (8 - rect.left) + 'px'; menu.style.right = 'auto'; }
    });
  });

  syncTrigger();
  select.addEventListener('change', syncTrigger);
}
document.addEventListener('click', () => document.querySelectorAll('.custom-select-menu').forEach(m => m.classList.add('hidden')));

  // =============================================================
  // EVENT BINDING
  // =============================================================
  function bindEvents() {
    // Add Product button
    const addBtn = document.getElementById('btn-add-product');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        resetForm();
        editingId = null;
        document.getElementById('product-modal-title').innerHTML = '<i class="fas fa-box"></i> Add Product';
        openModal(modalProduct);
      });
    }

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

    const addOtherCatBtn = document.getElementById('btn-add-other-category');
    if (addOtherCatBtn) {
      addOtherCatBtn.addEventListener('click', function() {
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
    }

    // Media uploads: thumbnail (single), gallery (multiple), brochure (single PDF)
    if (pfThumbnailFile) {
      pfThumbnailFile.addEventListener('change', async function() {
        const file = this.files && this.files[0];
        if (!file) return;
        thumbnailFileObj = file; // NEW: keep the real File for upload
        try {
          const dataUrl = await readFileAsDataURL(file);
          setThumbnailPreview(dataUrl);
        } catch (_) {
          showToast('Could not read the image file.', 'error');
        }
      });
    }
    if (pfThumbnailRemove) {
      pfThumbnailRemove.addEventListener('click', function() {
        thumbnailFileObj = null;
        setThumbnailPreview('');
        if (pfThumbnailFile) pfThumbnailFile.value = '';
      });
    }

    if (pfGalleryFile) {
      pfGalleryFile.addEventListener('change', async function() {
        const files = Array.from(this.files || []);
        if (!files.length) return;
        galleryFileObjs = galleryFileObjs.concat(files); // NEW: keep the real Files for upload
        try {
          const reads = await Promise.all(files.map(async f => ({ name: f.name, dataUrl: await readFileAsDataURL(f) })));
          galleryImages = galleryImages.concat(reads);
          renderGalleryPreview();
        } catch (_) {
          showToast('Could not read one or more gallery images.', 'error');
        }
        this.value = '';
      });
    }

    if (pfBrochureFile) {
      pfBrochureFile.addEventListener('change', async function() {
        const file = this.files && this.files[0];
        if (!file) return;
        brochureFileObj = file; // NEW: keep the real File for upload
        try {
          const dataUrl = await readFileAsDataURL(file);
          setBrochurePreview(dataUrl, file.name);
        } catch (_) {
          showToast('Could not read the PDF file.', 'error');
        }
      });
    }
    if (pfBrochureRemove) {
      pfBrochureRemove.addEventListener('click', function() {
        brochureFileObj = null;
        setBrochurePreview('', '');
        if (pfBrochureFile) pfBrochureFile.value = '';
      });
    }

    // Pricing auto-calc: MRP / discount type / discount value -> Final Price
    [pfMrp, pfDiscountType, pfDiscount].forEach(el => {
      if (el) el.addEventListener('input', recalcPrice);
    });
    if (pfDiscountType) pfDiscountType.addEventListener('change', recalcPrice);

    // Spec Master (feature list)
    if (btnAddSpec) {
      btnAddSpec.addEventListener('click', function() {
        specLines.push({ label: '', value: '' });
        renderSpecMaster();
        const inputs = document.querySelectorAll('.specmaster-input');
        if (inputs.length) {
          inputs[inputs.length - 2].focus();
        }
      });
    }

    // Save Product  (NOW async — calls the backend)
    const saveBtn = document.getElementById('btn-save-product');
    if (saveBtn) {
      saveBtn.addEventListener('click', async function() {
        const data = collectFormData();

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
        saveBtn.disabled = true;
        let ok;
        if (id) {
          ok = await updateProduct(id, data);
        } else {
          ok = await addProduct(data);
        }
        saveBtn.disabled = false;
        if (ok) closeModal(modalProduct);
      });
    }

    // Table events (delegated)
    if (tbody) {
      tbody.addEventListener('click', function(e) {
        const target = e.target.closest('button');
        if (!target) return;

        if (target.classList.contains('icon-view')) {
          const id = parseInt(target.dataset.id);
          const product = getProduct(id);
          if (product) renderViewProduct(product);
        }

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

        if (target.classList.contains('danger')) {
          const id = parseInt(target.dataset.id);
          const product = getProduct(id);
          if (product) {
            deletingId = id;
            document.getElementById('delete-product-name').textContent = product.name;
            openModal(modalDelete);
          }
        }

        if (target.classList.contains('stock-history-btn')) {
          const id = target.dataset.id;
          renderStockHistory(id);
        }
      });
    }

    // Confirm Delete  (NOW async — calls the backend)
    const confirmDeleteBtn = document.getElementById('btn-confirm-delete-product');
    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener('click', async function() {
        if (deletingId) {
          confirmDeleteBtn.disabled = true;
          const ok = await deleteProduct(deletingId);
          confirmDeleteBtn.disabled = false;
          deletingId = null;
          if (ok) closeModal(modalDelete);
        }
      });
    }

    // Stock entry  (NOW async — syncs new stock qty to the backend)
    const addStockBtn = document.getElementById('btn-add-stock-entry');
    if (addStockBtn) {
      addStockBtn.addEventListener('click', async function() {
        const type = document.getElementById('sl-type').value;
        const qty = parseInt(document.getElementById('sl-qty').value);
        const reason = document.getElementById('sl-reason').value.trim();

        if (!qty || qty <= 0) {
          showToast('Please enter a valid quantity.', 'error');
          return;
        }

        if (stockProductId) {
          addStockBtn.disabled = true;
          await addStockEntry(stockProductId, type, qty, reason);
          addStockBtn.disabled = false;
          document.getElementById('sl-qty').value = '';
          document.getElementById('sl-reason').value = '';
        }
      });
    }

    // Search
    if (searchInput) searchInput.addEventListener('input', render);

    // Filters
    if (filterType) filterType.addEventListener('change', render);
    if (filterCategory) filterCategory.addEventListener('change', render);
    if (filterStatus) filterStatus.addEventListener('change', render);

    // Rows per page
    if (rowsSelect) {
      rowsSelect.addEventListener('change', function() {
        rowsPerPage = parseInt(this.value);
        currentPage = 1;
        render();
      });
    }

    // Pagination
    if (pagination) {
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
    }

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

    // Profile Button
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

    // Profile Button
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
      profileBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const dropdown = document.getElementById('profileDropdown');
        if (!dropdown) return;
        const willOpen = dropdown.classList.contains('hidden');
        dropdown.classList.add('hidden');
        if (willOpen) {
          positionFixedDropdown(profileBtn, dropdown);
        }
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

    // =============================================================
    // SIDEBAR TOGGLE — desktop collapse/expand arrow (only relevant/visible on desktop)
    // =============================================================
    const sidebarToggleBtn = document.getElementById('sidebarToggle');
    if (sidebarToggleBtn) {
      sidebarToggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleSidebar();
      });
    }

    // Mobile/tablet hamburger button — lives outside #sidebar so it's never
    // carried off-screen by the drawer's own transform.
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleSidebar();
      });
    }

    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    if (sidebarBackdrop) {
      sidebarBackdrop.addEventListener('click', function() {
        closeSidebarMobile();
      });
    }

    // Re-sync sidebar state when crossing the desktop/mobile breakpoint
    window.addEventListener('resize', function() {
      initSidebar();
    });

    // Session / Logout
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

    console.log('✅ Events bound successfully');





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

  // Reflect programmatic changes (e.g. resetForm/populateForm) back to trigger label
  const observer = new MutationObserver(syncTrigger);
  observer.observe(select, { attributes: true, childList: true });
  select.addEventListener('change', syncTrigger);
}


document.addEventListener('click', () => document.querySelectorAll('.custom-select-menu').forEach(m => m.classList.add('hidden')));
  }

  

  // =============================================================
  // INIT  (NOW async — loads products from the backend first)
  // =============================================================
  async function init() {
    loadLedger();

    initSidebar();

    await fetchProductsFromServer(); // calls render() internally
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

['filter-producttype', 'filter-category', 'filter-status', 'rows-per-page', 'sl-type'].forEach(enhanceSelectDropdown);
})();