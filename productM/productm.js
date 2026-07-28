// TODO: replace mock data array below with API call to /api/products

/* =========================================================
   VKM Brick & Block Machinery — Product Management
   Sidebar / topbar behaviour mirrors dashboard.js exactly.
   ========================================================= */

(function () {
    'use strict';

    // ---------------------------------------------------
    // 0. Auth guard (wire to your auth.js)
    // ---------------------------------------------------
    (async function initAuth() {
        try {
            if (typeof requireAuth === 'function') await requireAuth();
            if (typeof getAdminInfo === 'function') {
                const admin = getAdminInfo();
                const profileBtn = document.getElementById('profileBtn');
                if (profileBtn && admin?.name) profileBtn.textContent = admin.name.charAt(0).toUpperCase();
            }
        } catch (e) { /* auth.js not wired yet in this preview */ }
    })();

    // ---------------------------------------------------
    // 1. Sidebar (collapse / expand + mobile drawer) — identical to dashboard.js
    // ---------------------------------------------------
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const toggleIcon = document.getElementById('toggleIcon');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');

    let sidebarExpanded = false;

    function isMobile() {
        return window.innerWidth < 1024;
    }

    function updateChevron() {
        if (!toggleIcon) return;
        toggleIcon.style.transform = sidebarExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
    }

    function openSidebar() {
        sidebarExpanded = true;
        sidebar?.classList.add('expanded');
        sidebar?.classList.remove('collapsed');
        if (isMobile()) {
            sidebarBackdrop?.classList.remove('hidden');
            sidebarBackdrop?.classList.add('visible');
        }
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

    sidebarToggle?.addEventListener('click', () => {
        sidebarExpanded ? closeSidebar() : openSidebar();
    });

    sidebarBackdrop?.addEventListener('click', closeSidebar);

    // Auto-close mobile drawer when a nav item is clicked / resized to desktop
    document.querySelectorAll('.nav-item').forEach((item) => {
        item.addEventListener('click', () => {
            if (isMobile()) closeSidebar();
        });
    });

    window.addEventListener('resize', () => {
        if (!isMobile() && sidebarExpanded) {
            // keep expanded state but drop the mobile-only backdrop
            sidebarBackdrop?.classList.remove('visible');
            sidebarBackdrop?.classList.add('hidden');
        }
    });

    // Sidebar starts collapsed by default (icon rail), same as dashboard
    closeSidebar();

    // ---------------------------------------------------
    // 2. Topbar dropdowns (notification / profile) — identical to dashboard.js
    // ---------------------------------------------------
    const notifBtn = document.getElementById('notifBtn');
    const notifDropdown = document.getElementById('notifDropdown');
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    const profileLogoutBtn = document.getElementById('profileLogoutBtn');

    notifBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        notifDropdown?.classList.toggle('hidden');
        profileDropdown?.classList.add('hidden');
    });

    profileBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown?.classList.toggle('hidden');
        notifDropdown?.classList.add('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!profileBtn?.contains(e.target) && !profileDropdown?.contains(e.target)) profileDropdown?.classList.add('hidden');
        if (!notifBtn?.contains(e.target) && !notifDropdown?.contains(e.target)) notifDropdown?.classList.add('hidden');
    });

    profileLogoutBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        if (typeof logout === 'function') await logout();
        else window.location.href = '../index.html';
    });

    // ---------------------------------------------------
    // 3. Generic modal open/close
    // ---------------------------------------------------
    function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
    function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.dataset.close));
    });
    document.querySelectorAll('.modal-overlay').forEach(ov => {
        ov.addEventListener('click', (e) => { if (e.target === ov) closeModal(ov.id); });
    });

    // ---------------------------------------------------
    // 4. Toast helper
    // ---------------------------------------------------
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-xmark';
        const color = type === 'success' ? 'text-emerald-600' : 'text-rose-500';
        const toast = document.createElement('div');
        toast.className = 'toast-animate bg-cream border border-peach-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-700 shadow-lg flex items-center gap-2';
        toast.innerHTML = `<i class="fas ${icon} ${color}"></i><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.transition = 'opacity .25s ease';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 250);
        }, 2600);
    }

    // ---------------------------------------------------
    // 5. Seed data (replace with API call to your backend)
    //    Pricing: mrp (₹), price = selling price (₹), discount (%)
    //    qtyPerKw = default quantity of this item required per machine set
    //               (unit follows p.unit) — used on quotation lines.
    //    hsn (HSN Code), gst (GST Rate %), warranty (Years)
    //    machineInfo / techSpec / specMaster — only meaningful for
    //    Brick Machine (and, for specMaster, Mould) categories.
    // ---------------------------------------------------
    const CATEGORY_META = {
        'Brick Machine': { icon: 'fa-industry', cls: 'bg-brick' },
        'Pan Mixer': { icon: 'fa-circle-notch', cls: 'bg-panmixer' },
        'Conveyor Belt': { icon: 'fa-arrows-left-right', cls: 'bg-conveyor' },
        'Power Pack System': { icon: 'fa-bolt', cls: 'bg-powerpack' },
        'PLC Panel': { icon: 'fa-microchip', cls: 'bg-plc' },
        'Trolley': { icon: 'fa-cart-flatbed', cls: 'bg-trolley' },
        'Mould': { icon: 'fa-shapes', cls: 'bg-mould' },
        'Vibrator Table': { icon: 'fa-wave-square', cls: 'bg-vibrator' },
        'Consumables': { icon: 'fa-flask', cls: 'bg-consumables' }
    };

    // Categories that show the Machine Information + Technical Specification sections
    const MACHINE_INFO_CATEGORIES = ['Brick Machine'];
    // Categories that show the Product Specification Master row-adder
    const SPEC_MASTER_CATEGORIES = ['Brick Machine', 'Mould'];

    // Fallback icon/colour cycle used whenever a user adds a brand-new
    // category via the "Other" option in the Add/Edit Product form.
    const CUSTOM_CATEGORY_STYLES = [
        { icon: 'fa-cube', cls: 'bg-slate' },
        { icon: 'fa-gear', cls: 'bg-brick' },
        { icon: 'fa-layer-group', cls: 'bg-panmixer' },
        { icon: 'fa-toolbox', cls: 'bg-conveyor' },
        { icon: 'fa-screwdriver-wrench', cls: 'bg-powerpack' }
    ];
    let customCategoryCount = 0;

    function addCustomCategory(name) {
        if (!name) return;
        if (!CATEGORY_META[name]) {
            const style = CUSTOM_CATEGORY_STYLES[customCategoryCount % CUSTOM_CATEGORY_STYLES.length];
            customCategoryCount++;
            CATEGORY_META[name] = { icon: style.icon, cls: style.cls };
        }
        addCategoryOptionIfMissing(form.category, name);
        addCategoryOptionIfMissing(filterCategoryEl, name);
    }

    function addCategoryOptionIfMissing(selectEl, name) {
        if (!selectEl) return;
        const exists = Array.from(selectEl.options).some(o => o.value === name);
        if (exists) return;
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        // Insert right before the "Other" option if present, else append.
        const otherOpt = Array.from(selectEl.options).find(o => o.value === '__other__');
        if (otherOpt) selectEl.insertBefore(opt, otherOpt);
        else selectEl.appendChild(opt);
    }

    let products = [
        {
            id: 'P-2001', name: 'Hydraulic Brick Making Machine VKM-40', category: 'Brick Machine', brand: 'VKM', sku: 'VKM-BM-40',
            spec: 'Fully Automatic, 4 Station', unit: 'Set', mrp: 1650000, price: 1500000, discount: 9, qtyPerKw: 1,
            stock: 3, threshold: 1, status: 'Active',
            description: 'Fully automatic hydraulic brick making machine with PLC control and auto pallet handling.',
            hsn: '84743100', gst: 18, warranty: 1,
            machineInfo: { tonnage: 120, output: '8,000–10,000 bricks', cycleTime: 12, oilTank: 300, powerHP: 60, gensetKVA: 82.5, motor: '60 HP x 2, 3-Phase', weight: '12,500 kg', dimensions: '8.5m x 3.2m x 3.8m', shed: '15m x 10m', labour: 6, accessories: 'Pallet feeding conveyor\nPLC control panel\nHydraulic power pack\nVibration unit', origin: 'India' },
            techSpec: { automation: 'Fully Automatic', plc: 'Siemens S7-1200 with 7-inch HMI', controlPanel: 'IP54, MCB + contactor based', safety: 'Emergency stop, safety guards, overload cutoff', vibration: 'yes', palletSize: '900mm x 500mm' },
            specMaster: [
                { sr: 'A', text: 'Hydraulic Cylinder Bore Size: 200mm' },
                { sr: 'B', text: 'Main Motor: 60 HP x 2 Nos' },
                { sr: 'C', text: 'Conveyor Motor: 2 HP' },
                { sr: 'D', text: 'Vibration Motor: 3 HP x 2' },
                { sr: 'E', text: 'Pallet Size: 900mm x 500mm' },
                { sr: 'F', text: 'Mould Change Time: 15 minutes' }
            ]
        },
        {
            id: 'P-2002', name: 'Semi-Automatic Brick Machine VKM-20', category: 'Brick Machine', brand: 'VKM', sku: 'VKM-BM-20',
            spec: 'Semi-Automatic, 2 Station', unit: 'Set', mrp: 780000, price: 720000, discount: 8, qtyPerKw: 1,
            stock: 2, threshold: 1, status: 'Active',
            description: 'Compact semi-automatic brick machine, ideal for small and mid-scale units.',
            hsn: '84743100', gst: 18, warranty: 1,
            machineInfo: { tonnage: 60, output: '3,500–4,500 bricks', cycleTime: 15, oilTank: 150, powerHP: 30, gensetKVA: 41, motor: '30 HP, 3-Phase', weight: '6,200 kg', dimensions: '5.2m x 2.4m x 3.0m', shed: '10m x 8m', labour: 4, accessories: 'Manual pallet handling trolley\nControl panel\nHydraulic power pack', origin: 'India' },
            techSpec: { automation: 'Semi-Automatic', plc: 'Delta DVP with 4.3-inch HMI', controlPanel: 'IP54, MCB based', safety: 'Emergency stop, safety guards', vibration: 'yes', palletSize: '700mm x 400mm' },
            specMaster: [
                { sr: 'A', text: 'Hydraulic Cylinder Bore Size: 150mm' },
                { sr: 'B', text: 'Main Motor: 30 HP' },
                { sr: 'C', text: 'Vibration Motor: 2 HP x 2' },
                { sr: 'D', text: 'Pallet Size: 700mm x 400mm' }
            ]
        },
        {
            id: 'P-2003', name: 'Pan Mixer 500L', category: 'Pan Mixer', brand: 'VKM', sku: 'VKM-PM-500',
            spec: '500 Litre, Twin Shaft', unit: 'Nos', mrp: 310000, price: 285000, discount: 8, qtyPerKw: 1,
            stock: 4, threshold: 1, status: 'Active',
            description: 'Twin-shaft forced action pan mixer for consistent concrete mixing.',
            hsn: '84748000', gst: 18, warranty: 1
        },
        {
            id: 'P-2004', name: 'Belt Conveyor 6 Meter', category: 'Conveyor Belt', brand: 'VKM', sku: 'VKM-CB-6M',
            spec: '6m Length, Motorized', unit: 'Nos', mrp: 105000, price: 95000, discount: 10, qtyPerKw: 1,
            stock: 6, threshold: 2, status: 'Active',
            description: 'Motorized belt conveyor for pallet and material handling.',
            hsn: '84283900', gst: 18, warranty: 1
        },
        {
            id: 'P-2005', name: 'Hydraulic Power Pack 60HP', category: 'Power Pack System', brand: 'VKM', sku: 'VKM-PP-60',
            spec: '60HP, Twin Pump', unit: 'Nos', mrp: 460000, price: 420000, discount: 9, qtyPerKw: 1,
            stock: 2, threshold: 1, status: 'Active',
            description: 'Twin-pump hydraulic power pack sized for VKM-40 series brick machines.',
            hsn: '84136000', gst: 18, warranty: 1
        },
        {
            id: 'P-2006', name: 'PLC Control Panel (Siemens)', category: 'PLC Panel', brand: 'Siemens', sku: 'VKM-PLC-S7',
            spec: 'Siemens S7-1200, 7-inch HMI', unit: 'Nos', mrp: 210000, price: 185000, discount: 12, qtyPerKw: 1,
            stock: 0, threshold: 1, status: 'Active',
            description: 'Pre-wired PLC control panel with HMI, ready for machine integration.',
            hsn: '85371000', gst: 18, warranty: 1
        },
        {
            id: 'P-2007', name: 'Battery Operated Trolley', category: 'Trolley', brand: 'VKM', sku: 'VKM-TR-1T',
            spec: '1 Ton Capacity', unit: 'Nos', mrp: 82000, price: 75000, discount: 9, qtyPerKw: 2,
            stock: 5, threshold: 2, status: 'Active',
            description: 'Battery operated pallet transfer trolley for brick yard movement.',
            hsn: '84279000', gst: 18, warranty: 1
        },
        {
            id: 'P-2008', name: 'Paver Block Mould 200x100x60', category: 'Mould', brand: 'VKM', sku: 'VKM-MLD-PB1',
            spec: '6 Cavity, Rubber Coated', unit: 'Set', mrp: 20500, price: 18500, discount: 10, qtyPerKw: 4,
            stock: 12, threshold: 4, status: 'Active',
            description: 'EN-31 steel paver block mould, hard chrome plated for long service life.',
            hsn: '84805000', gst: 18, warranty: 1,
            specMaster: [
                { sr: 'A', text: 'Cavity: 6' },
                { sr: 'B', text: 'Material: EN-31 Steel, Hard Chrome Plated' },
                { sr: 'C', text: 'Product Size: 200mm x 100mm x 60mm' },
                { sr: 'D', text: 'Weight: 45 kg' }
            ]
        },
        {
            id: 'P-2009', name: 'Vibrator Table Heavy Duty', category: 'Vibrator Table', brand: 'VKM', sku: 'VKM-VT-1.5T',
            spec: '1.5 Ton Capacity', unit: 'Nos', mrp: 68000, price: 62000, discount: 9, qtyPerKw: 1,
            stock: 3, threshold: 3, status: 'Active',
            description: 'Heavy duty vibrator table for paver and mould compaction.',
            hsn: '84796000', gst: 18, warranty: 1
        },
        {
            id: 'P-2010', name: 'Shuttering / Release Oil', category: 'Consumables', brand: 'VKM', sku: 'VKM-OIL-20L',
            spec: '20 Ltr Can', unit: 'Box', mrp: 2450, price: 2200, discount: 10, qtyPerKw: 10,
            stock: 40, threshold: 10, status: 'Active',
            description: 'Mould release oil for smooth demoulding of paver and brick products.',
            hsn: '27101990', gst: 18, warranty: 0
        },
        {
            id: 'P-2011', name: 'Fully Automatic Brick Machine VKM-80', category: 'Brick Machine', brand: 'VKM', sku: 'VKM-BM-80',
            spec: 'Fully Automatic, 8 Station', unit: 'Set', mrp: 3200000, price: 2950000, discount: 8, qtyPerKw: 1,
            stock: 1, threshold: 1, status: 'Active',
            description: 'High-output fully automatic brick machine for large-scale production units.',
            hsn: '84743100', gst: 18, warranty: 2,
            machineInfo: { tonnage: 200, output: '16,000–18,000 bricks', cycleTime: 10, oilTank: 500, powerHP: 100, gensetKVA: 137.5, motor: '100 HP x 2, 3-Phase', weight: '22,000 kg', dimensions: '11m x 4m x 4.2m', shed: '20m x 14m', labour: 8, accessories: 'Auto pallet feeding conveyor\nPLC control panel with SCADA\nDual hydraulic power pack\nVibration unit\nCuring rack loader', origin: 'India' },
            techSpec: { automation: 'Fully Automatic', plc: 'Siemens S7-1500 with 10-inch HMI', controlPanel: 'IP54, PLC + SCADA based', safety: 'Emergency stop, safety guards, overload cutoff, light curtains', vibration: 'yes', palletSize: '1100mm x 600mm' },
            specMaster: [
                { sr: 'A', text: 'Hydraulic Cylinder Bore Size: 250mm' },
                { sr: 'B', text: 'Main Motor: 100 HP x 2 Nos' },
                { sr: 'C', text: 'Conveyor Motor: 3 HP x 2' },
                { sr: 'D', text: 'Vibration Motor: 5 HP x 2' },
                { sr: 'E', text: 'Pallet Size: 1100mm x 600mm' },
                { sr: 'F', text: 'Mould Change Time: 10 minutes' }
            ]
        }
    ];

    // ---------------------------------------------------
    // 5b. Stock Ledger — logs manual stock in / stock out entries
    // ---------------------------------------------------
    let stockLedger = [
        { id: 'SL-1', productId: 'P-2001', type: 'in', qty: 5, reason: 'Initial stock', date: '2026-07-01' },
        { id: 'SL-2', productId: 'P-2001', type: 'out', qty: 2, reason: 'Dispatched against SQ-0998', date: '2026-07-13' },
        { id: 'SL-3', productId: 'P-2008', type: 'in', qty: 15, reason: 'Purchase order PO-221', date: '2026-07-05' }
    ];
    let ledgerCounter = stockLedger.length;

    // ---------------------------------------------------
    // 6. State
    // ---------------------------------------------------
    let state = {
        search: '',
        category: '',
        status: '',
        sortKey: 'name',
        sortDir: 'asc',
        page: 1,
        pageSize: 10
    };

    function computeStatusLabel(p) {
        if (p.status === 'Inactive') return 'Inactive';
        if (p.stock <= 0) return 'Out of Stock';
        if (p.stock <= p.threshold) return 'Low Stock';
        return 'Active';
    }

    function badgeClass(label) {
        switch (label) {
            case 'Active': return 'badge-active';
            case 'Inactive': return 'badge-inactive';
            case 'Low Stock': return 'badge-low';
            case 'Out of Stock': return 'badge-out';
            default: return 'badge-inactive';
        }
    }

    function getFiltered() {
        let list = products.filter(p => {
            const matchesSearch = !state.search ||
                p.name.toLowerCase().includes(state.search) ||
                p.brand.toLowerCase().includes(state.search) ||
                (p.sku || '').toLowerCase().includes(state.search);
            const matchesCategory = !state.category || p.category === state.category;
            const label = computeStatusLabel(p);
            const matchesStatus = !state.status || label === state.status;
            return matchesSearch && matchesCategory && matchesStatus;
        });

        list.sort((a, b) => {
            let av, bv;
            switch (state.sortKey) {
                case 'category': av = a.category; bv = b.category; break;
                case 'brand': av = a.brand; bv = b.brand; break;
                case 'spec': av = a.spec; bv = b.spec; break;
                case 'qtyPerKw': av = a.qtyPerKw; bv = b.qtyPerKw; break;
                case 'price': av = a.price; bv = b.price; break;
                case 'stock': av = a.stock; bv = b.stock; break;
                case 'status': av = computeStatusLabel(a); bv = computeStatusLabel(b); break;
                case 'hsn': av = a.hsn || ''; bv = b.hsn || ''; break;
                case 'gst': av = a.gst || 0; bv = b.gst || 0; break;
                default: av = a.name; bv = b.name;
            }
            if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
            if (av < bv) return state.sortDir === 'asc' ? -1 : 1;
            if (av > bv) return state.sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return list;
    }

    // ---------------------------------------------------
    // 7. Render
    // ---------------------------------------------------
    const tbody = document.getElementById('product-tbody');
    const emptyState = document.getElementById('empty-state');
    const paginationEl = document.getElementById('pagination');
    const filterCategoryEl = document.getElementById('filter-category');

    function formatINR(num) {
        if (num >= 100000) return '₹' + (num / 100000).toFixed(1) + 'L';
        return '₹' + num.toLocaleString('en-IN');
    }

    function renderStats() {
        document.getElementById('stat-total').textContent = products.length.toLocaleString('en-IN');
        document.getElementById('stat-active').textContent = products.filter(p => computeStatusLabel(p) === 'Active').length.toLocaleString('en-IN');
        document.getElementById('stat-low').textContent = products.filter(p => ['Low Stock', 'Out of Stock'].includes(computeStatusLabel(p))).length.toLocaleString('en-IN');
        const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
        document.getElementById('stat-value').textContent = formatINR(totalValue);
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str ?? '';
        return div.innerHTML;
    }

    function formatQtyPerKw(p) {
        const val = (p.qtyPerKw ?? 0);
        const formatted = Number.isInteger(val) ? val : val.toFixed(2).replace(/\.?0+$/, '');
        return `<span class="qtykw-value">${formatted}</span><span class="qtykw-unit">${escapeHtml(p.unit)}/set</span>`;
    }

    function render() {
        const filtered = getFiltered();
        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
        if (state.page > totalPages) state.page = totalPages;
        const start = (state.page - 1) * state.pageSize;
        const pageItems = filtered.slice(start, start + state.pageSize);

        tbody.innerHTML = '';
        emptyState.classList.toggle('hidden', pageItems.length > 0);

        pageItems.forEach(p => {
            const label = computeStatusLabel(p);
            const meta = CATEGORY_META[p.category] || { icon: 'fa-box', cls: 'bg-slate' };
            const hasDiscount = p.mrp && p.mrp > p.price;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Product">
                    <div class="product-cell">
                        <div class="row-icon ${meta.cls}"><i class="fas ${meta.icon}"></i></div>
                        <div class="min-w-0">
                            <div class="product-name">${escapeHtml(p.name)}</div>
                            <div class="product-sub">${escapeHtml(p.brand)} · ${escapeHtml(p.sku || '—')}</div>
                        </div>
                    </div>
                </td>
                <td data-label="Category">${escapeHtml(p.category)}</td>
                <td data-label="Brand">${escapeHtml(p.brand)}</td>
                <td data-label="Specification">${escapeHtml(p.spec || '—')}</td>
                <td data-label="Qty / Set">${formatQtyPerKw(p)}</td>
                <td data-label="HSN Code">${escapeHtml(p.hsn || '—')}</td>
                <td data-label="GST %">${p.gst !== undefined ? p.gst + '%' : '—'}</td>
                <td data-label="Selling Price">
                    <div class="price-cell">
                        ${hasDiscount ? `<span class="price-mrp">₹${p.mrp.toLocaleString('en-IN')}</span>` : ''}
                        <span class="price-selling">₹${p.price.toLocaleString('en-IN')}${hasDiscount ? `<span class="discount-badge">${p.discount || Math.round((p.mrp - p.price) / p.mrp * 100)}% OFF</span>` : ''}</span>
                    </div>
                </td>
                <td data-label="Stock">
                    <div class="stock-cell">
                        <span>${p.stock} ${escapeHtml(p.unit)}</span>
                        <button class="stock-history-btn" data-action="stock" data-id="${p.id}" title="Stock History"><i class="fas fa-clock-rotate-left"></i></button>
                    </div>
                </td>
                <td data-label="Status"><span class="badge ${badgeClass(label)}">${label}</span></td>
                <td data-label="Actions">
                    <div class="row-actions">
                        <button class="action-icon-btn icon-view" data-action="view" data-id="${p.id}" title="View"><i class="fas fa-eye"></i></button>
                        <button class="action-icon-btn icon-edit" data-action="edit" data-id="${p.id}" title="Edit"><i class="fas fa-pen"></i></button>
                        <button class="action-icon-btn danger" data-action="delete" data-id="${p.id}" title="Delete"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        renderPagination(totalPages, total);
        renderStats();
    }

    function renderPagination(totalPages) {
        paginationEl.innerHTML = '';

        const prev = document.createElement('button');
        prev.className = 'pagination-btn' + (state.page === 1 ? ' disabled' : '');
        prev.innerHTML = '<i class="fas fa-chevron-left" style="font-size:9px"></i>';
        prev.disabled = state.page === 1;
        prev.addEventListener('click', () => { state.page--; render(); });
        paginationEl.appendChild(prev);

        const maxButtons = 5;
        let startPage = Math.max(1, state.page - 2);
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        startPage = Math.max(1, endPage - maxButtons + 1);

        for (let i = startPage; i <= endPage; i++) {
            const btn = document.createElement('button');
            btn.className = 'pagination-btn' + (i === state.page ? ' active' : '');
            btn.textContent = i;
            btn.addEventListener('click', () => { state.page = i; render(); });
            paginationEl.appendChild(btn);
        }

        const next = document.createElement('button');
        next.className = 'pagination-btn' + (state.page === totalPages ? ' disabled' : '');
        next.innerHTML = '<i class="fas fa-chevron-right" style="font-size:9px"></i>';
        next.disabled = state.page === totalPages;
        next.addEventListener('click', () => { state.page++; render(); });
        paginationEl.appendChild(next);
    }

    // ---------------------------------------------------
    // 8. Filters / search / sort / pagination wiring
    // ---------------------------------------------------
    let searchTimer;
    document.getElementById('search-input').addEventListener('input', (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            state.search = e.target.value.trim().toLowerCase();
            state.page = 1;
            render();
        }, 200);
    });

    document.getElementById('filter-category').addEventListener('change', (e) => {
        state.category = e.target.value;
        state.page = 1;
        render();
    });

    document.getElementById('filter-status').addEventListener('change', (e) => {
        state.status = e.target.value;
        state.page = 1;
        render();
    });

    document.getElementById('rows-per-page').addEventListener('change', (e) => {
        state.pageSize = parseInt(e.target.value, 10);
        state.page = 1;
        render();
    });

    document.querySelectorAll('.data-table thead th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const key = th.dataset.sort;
            if (state.sortKey === key) {
                state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
            } else {
                state.sortKey = key;
                state.sortDir = 'asc';
            }
            document.querySelectorAll('.data-table thead th').forEach(h => h.classList.remove('sorted'));
            th.classList.add('sorted');
            render();
        });
    });

    // Row action buttons (View / Edit / Stock History / Delete)
    tbody.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        const product = products.find(p => p.id === id);
        if (!product) return;

        if (action === 'view') openViewModal(product);
        if (action === 'edit') openProductModal(product);
        if (action === 'stock') openStockHistoryModal(product);
        if (action === 'delete') openDeleteModal(product);
    });

    // ---------------------------------------------------
    // 9. Add / Edit modal + validation
    // ---------------------------------------------------
    const form = {
        id: document.getElementById('pf-id'),
        name: document.getElementById('pf-name'),
        category: document.getElementById('pf-category'),
        brand: document.getElementById('pf-brand'),
        sku: document.getElementById('pf-sku'),
        spec: document.getElementById('pf-spec'),
        unit: document.getElementById('pf-unit'),
        hsn: document.getElementById('pf-hsn'),
        gst: document.getElementById('pf-gst'),
        warranty: document.getElementById('pf-warranty'),
        mrp: document.getElementById('pf-mrp'),
        discount: document.getElementById('pf-discount'),
        price: document.getElementById('pf-price'),
        stock: document.getElementById('pf-stock'),
        threshold: document.getElementById('pf-threshold'),
        qtyPerKw: document.getElementById('pf-qtyperkw'),
        status: document.getElementById('pf-status'),
        description: document.getElementById('pf-description')
    };
    const modalTitle = document.getElementById('product-modal-title');

    // ---- "Other" category: reveal a free-text field to add a brand-new category ----
    const otherCategoryWrap = document.getElementById('pf-other-category-wrap');
    const otherCategoryInput = document.getElementById('pf-other-category');

    function toggleOtherCategoryField() {
        const isOther = form.category.value === '__other__';
        otherCategoryWrap.classList.toggle('hidden', !isOther);
        if (!isOther) otherCategoryInput.value = '';
    }

    form.category.addEventListener('change', () => {
        toggleOtherCategoryField();
        updateConditionalSections(form.category.value === '__other__' ? '' : form.category.value);
    });

    // Clicking "Add" next to the new-category field adds it to the dropdown
    // immediately (no need to save the whole product first) and selects it.
    document.getElementById('btn-add-other-category').addEventListener('click', () => {
        const name = otherCategoryInput.value.trim();
        otherCategoryInput.classList.remove('invalid');
        document.getElementById('err-pf-other-category').textContent = '';
        if (!name) {
            otherCategoryInput.classList.add('invalid');
            document.getElementById('err-pf-other-category').textContent = 'Enter a category name first';
            return;
        }
        addCustomCategory(name);
        form.category.value = name;
        toggleOtherCategoryField();
        updateConditionalSections(name);
        showToast(`Category "${name}" added`, 'success');
    });

    // ---- Machine Information / Technical Specification fields ----
    const miFields = {
        tonnage: document.getElementById('mi-tonnage'),
        output: document.getElementById('mi-output'),
        cycleTime: document.getElementById('mi-cycletime'),
        oilTank: document.getElementById('mi-oiltank'),
        powerHP: document.getElementById('mi-power-hp'),
        gensetKVA: document.getElementById('mi-genset-kva'),
        motor: document.getElementById('mi-motor'),
        weight: document.getElementById('mi-weight'),
        dimensions: document.getElementById('mi-dimensions'),
        shed: document.getElementById('mi-shed'),
        labour: document.getElementById('mi-labour'),
        origin: document.getElementById('mi-origin'),
        accessories: document.getElementById('mi-accessories')
    };
    const tsFields = {
        automation: document.getElementById('ts-automation'),
        plc: document.getElementById('ts-plc'),
        controlPanel: document.getElementById('ts-controlpanel'),
        safety: document.getElementById('ts-safety'),
        vibration: document.getElementById('ts-vibration'),
        palletSize: document.getElementById('ts-palletsize')
    };
    const machineInfoSection = document.getElementById('machineInfoSection');
    const techSpecSection = document.getElementById('techSpecSection');
    const specMasterSection = document.getElementById('specMasterSection');

    // Vibration Yes/No toggle
    const vibrationToggle = document.getElementById('ts-vibration-toggle');
    function setVibrationToggle(val) {
        tsFields.vibration.value = val;
        vibrationToggle.querySelectorAll('button').forEach(btn => {
            btn.classList.remove('active-yes', 'active-no');
            if (btn.dataset.val === val) btn.classList.add(btn.dataset.val === 'yes' ? 'active-yes' : 'active-no');
        });
    }
    vibrationToggle.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => setVibrationToggle(btn.dataset.val));
    });

    // ---- Product Specification Master (dynamic Sr A, B, C… rows) ----
    let specMasterRows = []; // array of { text }
    const specMasterListEl = document.getElementById('specmaster-list');

    function srLabel(index) {
        return String.fromCharCode(65 + index); // A, B, C...
    }

    function renderSpecMasterRows() {
        if (specMasterRows.length === 0) {
            specMasterListEl.innerHTML = `<div class="specmaster-empty">No specification lines added yet.</div>`;
            return;
        }
        specMasterListEl.innerHTML = specMasterRows.map((row, i) => `
            <div class="specmaster-row" data-index="${i}">
                <div class="specmaster-sr">${srLabel(i)}</div>
                <input type="text" class="field-input specmaster-input" data-index="${i}" placeholder="e.g. Main Motor: 60 HP x 2 Nos" value="${escapeHtml(row.text)}">
                <button type="button" class="specmaster-remove" data-index="${i}" title="Remove line"><i class="fas fa-xmark"></i></button>
            </div>
        `).join('');
    }

    specMasterListEl.addEventListener('input', (e) => {
        const input = e.target.closest('.specmaster-input');
        if (!input) return;
        const idx = parseInt(input.dataset.index, 10);
        if (specMasterRows[idx]) specMasterRows[idx].text = input.value;
    });

    specMasterListEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.specmaster-remove');
        if (!btn) return;
        const idx = parseInt(btn.dataset.index, 10);
        specMasterRows.splice(idx, 1);
        renderSpecMasterRows();
    });

    document.getElementById('btn-add-specline').addEventListener('click', () => {
        specMasterRows.push({ text: '' });
        renderSpecMasterRows();
    });

    // ---- Toggle conditional sections based on selected category ----
    function updateConditionalSections(category) {
        const showMachineInfo = MACHINE_INFO_CATEGORIES.includes(category);
        const showSpecMaster = SPEC_MASTER_CATEGORIES.includes(category);

        machineInfoSection.classList.toggle('hidden', !showMachineInfo);
        techSpecSection.classList.toggle('hidden', !showMachineInfo);
        specMasterSection.classList.toggle('hidden', !showSpecMaster);

        if (!showMachineInfo) {
            Object.values(miFields).forEach(f => { f.value = ''; });
            tsFields.automation.value = 'Manual';
            tsFields.plc.value = '';
            tsFields.controlPanel.value = '';
            tsFields.safety.value = '';
            tsFields.palletSize.value = '';
            setVibrationToggle('no');
        }
        if (!showSpecMaster) {
            specMasterRows = [];
            renderSpecMasterRows();
        }
    }

    // ---- Auto-calc: MRP + Discount% -> Selling Price (still manually overridable) ----
    let priceManuallyEdited = false;

    function recalcPriceFromDiscount() {
        const mrp = parseFloat(form.mrp.value);
        const discount = parseFloat(form.discount.value);
        if (!isNaN(mrp) && mrp > 0 && !isNaN(discount) && discount >= 0 && discount <= 100) {
            const calculated = mrp - (mrp * discount / 100);
            form.price.value = Math.round(calculated * 100) / 100;
            priceManuallyEdited = false;
        }
    }

    function recalcDiscountFromPrice() {
        const mrp = parseFloat(form.mrp.value);
        const price = parseFloat(form.price.value);
        if (!isNaN(mrp) && mrp > 0 && !isNaN(price) && price >= 0) {
            const calculated = ((mrp - price) / mrp) * 100;
            form.discount.value = Math.round(calculated * 100) / 100;
        }
    }

    form.mrp.addEventListener('input', () => {
        if (priceManuallyEdited && form.price.value !== '') {
            recalcDiscountFromPrice();
        } else {
            recalcPriceFromDiscount();
        }
    });
    form.discount.addEventListener('input', recalcPriceFromDiscount);
    form.price.addEventListener('input', () => {
        priceManuallyEdited = true;
        recalcDiscountFromPrice();
    });

    function openProductModal(product) {
        clearErrors();
        priceManuallyEdited = false;
        if (product) {
            modalTitle.innerHTML = '<i class="fas fa-pen"></i> Edit Product';
            form.id.value = product.id;
            form.name.value = product.name;

            // If this product's category isn't a built-in option yet (e.g. it was
            // added earlier via "Other"), make sure the dropdown has it.
            addCategoryOptionIfMissing(form.category, product.category);
            form.category.value = product.category;
            toggleOtherCategoryField();

            form.brand.value = product.brand;
            form.sku.value = product.sku;
            form.spec.value = product.spec;
            form.unit.value = product.unit;
            form.hsn.value = product.hsn || '';
            form.gst.value = product.gst !== undefined ? product.gst : 18;
            form.warranty.value = product.warranty !== undefined ? product.warranty : '';
            form.mrp.value = product.mrp ?? '';
            form.discount.value = product.discount ?? '';
            form.price.value = product.price;
            form.stock.value = product.stock;
            form.threshold.value = product.threshold;
            form.qtyPerKw.value = product.qtyPerKw ?? '';
            form.status.value = product.status;
            form.description.value = product.description || '';

            const mi = product.machineInfo || {};
            miFields.tonnage.value = mi.tonnage ?? '';
            miFields.output.value = mi.output || '';
            miFields.cycleTime.value = mi.cycleTime ?? '';
            miFields.oilTank.value = mi.oilTank ?? '';
            miFields.powerHP.value = mi.powerHP ?? '';
            miFields.gensetKVA.value = mi.gensetKVA ?? '';
            miFields.motor.value = mi.motor || '';
            miFields.weight.value = mi.weight || '';
            miFields.dimensions.value = mi.dimensions || '';
            miFields.shed.value = mi.shed || '';
            miFields.labour.value = mi.labour ?? '';
            miFields.origin.value = mi.origin || '';
            miFields.accessories.value = mi.accessories || '';

            const ts = product.techSpec || {};
            tsFields.automation.value = ts.automation || 'Manual';
            tsFields.plc.value = ts.plc || '';
            tsFields.controlPanel.value = ts.controlPanel || '';
            tsFields.safety.value = ts.safety || '';
            tsFields.palletSize.value = ts.palletSize || '';
            setVibrationToggle(ts.vibration === 'yes' ? 'yes' : 'no');

            specMasterRows = (product.specMaster || []).map(row => ({ text: row.text }));
            renderSpecMasterRows();

            updateConditionalSections(product.category);
        } else {
            modalTitle.innerHTML = '<i class="fas fa-box"></i> Add Product';
            Object.values(form).forEach(f => { if (f.tagName !== 'SELECT') f.value = ''; });
            form.id.value = '';
            form.unit.value = 'Nos';
            form.status.value = 'Active';
            form.threshold.value = 2;
            form.gst.value = 18;
            form.warranty.value = '';
            form.category.value = '';
            toggleOtherCategoryField();

            specMasterRows = [];
            renderSpecMasterRows();
            updateConditionalSections('');
        }
        openModal('modal-product');
    }

    document.getElementById('btn-add-product').addEventListener('click', () => openProductModal(null));

    function clearErrors() {
        document.querySelectorAll('#modal-product .field-input')
            .forEach(f => f.classList.remove('invalid'));
        document.querySelectorAll('#modal-product .field-error').forEach(e => e.textContent = '');
    }

    function setFieldError(fieldEl, errorId, message) {
        fieldEl.classList.add('invalid');
        const err = document.getElementById(errorId);
        if (err) err.textContent = message;
    }

    function validateProductForm() {
        clearErrors();
        let valid = true;

        if (!form.name.value.trim()) {
            setFieldError(form.name, 'err-pf-name', 'Product name is required');
            valid = false;
        }
        if (!form.category.value) {
            setFieldError(form.category, 'err-pf-category', 'Please select a category');
            valid = false;
        }
        if (form.category.value === '__other__' && !otherCategoryInput.value.trim()) {
            setFieldError(otherCategoryInput, 'err-pf-other-category', 'Enter a name for the new category');
            valid = false;
        }
        if (!form.brand.value.trim()) {
            setFieldError(form.brand, 'err-pf-brand', 'Brand is required');
            valid = false;
        }
        if (form.mrp.value === '' || Number(form.mrp.value) < 0) {
            setFieldError(form.mrp, 'err-pf-mrp', 'Enter a valid MRP');
            valid = false;
        }
        if (form.discount.value !== '' && (Number(form.discount.value) < 0 || Number(form.discount.value) > 100)) {
            setFieldError(form.discount, 'err-pf-discount', 'Discount must be between 0–100%');
            valid = false;
        }
        if (form.price.value === '' || Number(form.price.value) < 0) {
            setFieldError(form.price, 'err-pf-price', 'Enter a valid selling price');
            valid = false;
        }
        if (form.mrp.value !== '' && form.price.value !== '' && Number(form.price.value) > Number(form.mrp.value)) {
            setFieldError(form.price, 'err-pf-price', 'Selling price cannot exceed MRP');
            valid = false;
        }
        if (form.stock.value === '' || Number(form.stock.value) < 0) {
            setFieldError(form.stock, 'err-pf-stock', 'Enter a valid stock quantity');
            valid = false;
        }
        if (form.qtyPerKw.value === '' || Number(form.qtyPerKw.value) < 0) {
            setFieldError(form.qtyPerKw, 'err-pf-qtyperkw', 'Enter a valid quantity per machine set (0 if not applicable)');
            valid = false;
        }
        return valid;
    }

    document.getElementById('btn-save-product').addEventListener('click', () => {
        if (!validateProductForm()) {
            showToast('Please fill all required fields correctly', 'error');
            return;
        }
        const isEdit = !!form.id.value;

        // Resolve the actual category name — either a picked one, or a brand-new
        // one typed into the "Other" field.
        let category = form.category.value;
        if (category === '__other__') {
            category = otherCategoryInput.value.trim();
            addCustomCategory(category);
        }

        const showMachineInfo = MACHINE_INFO_CATEGORIES.includes(category);
        const showSpecMaster = SPEC_MASTER_CATEGORIES.includes(category);

        const payload = {
            id: form.id.value || 'P-' + (2000 + products.length + 1),
            name: form.name.value.trim(),
            category: category,
            brand: form.brand.value.trim(),
            sku: form.sku.value.trim(),
            spec: form.spec.value.trim(),
            unit: form.unit.value,
            hsn: form.hsn.value.trim(),
            gst: Number(form.gst.value) || 0,
            warranty: form.warranty.value !== '' ? Number(form.warranty.value) : 0,
            mrp: Number(form.mrp.value),
            discount: form.discount.value !== '' ? Number(form.discount.value) : Math.round(((Number(form.mrp.value) - Number(form.price.value)) / Number(form.mrp.value)) * 100),
            price: Number(form.price.value),
            stock: Number(form.stock.value),
            threshold: Number(form.threshold.value || 2),
            qtyPerKw: Number(form.qtyPerKw.value),
            status: form.status.value,
            description: form.description.value.trim()
        };

        if (showMachineInfo) {
            payload.machineInfo = {
                tonnage: miFields.tonnage.value !== '' ? Number(miFields.tonnage.value) : undefined,
                output: miFields.output.value.trim(),
                cycleTime: miFields.cycleTime.value !== '' ? Number(miFields.cycleTime.value) : undefined,
                oilTank: miFields.oilTank.value !== '' ? Number(miFields.oilTank.value) : undefined,
                powerHP: miFields.powerHP.value !== '' ? Number(miFields.powerHP.value) : undefined,
                gensetKVA: miFields.gensetKVA.value !== '' ? Number(miFields.gensetKVA.value) : undefined,
                motor: miFields.motor.value.trim(),
                weight: miFields.weight.value.trim(),
                dimensions: miFields.dimensions.value.trim(),
                shed: miFields.shed.value.trim(),
                labour: miFields.labour.value !== '' ? Number(miFields.labour.value) : undefined,
                origin: miFields.origin.value.trim(),
                accessories: miFields.accessories.value.trim()
            };
            payload.techSpec = {
                automation: tsFields.automation.value,
                plc: tsFields.plc.value.trim(),
                controlPanel: tsFields.controlPanel.value.trim(),
                safety: tsFields.safety.value.trim(),
                vibration: tsFields.vibration.value,
                palletSize: tsFields.palletSize.value.trim()
            };
        }

        if (showSpecMaster) {
            payload.specMaster = specMasterRows
                .filter(row => row.text.trim() !== '')
                .map((row, i) => ({ sr: srLabel(i), text: row.text.trim() }));
        }

        if (isEdit) {
            const idx = products.findIndex(p => p.id === payload.id);
            if (idx !== -1) products[idx] = payload;
            showToast('Product updated successfully', 'success');
        } else {
            products.unshift(payload);
            showToast('Product added successfully', 'success');
        }
        closeModal('modal-product');
        render();
    });

    // ---------------------------------------------------
    // 10. View modal
    // ---------------------------------------------------
    const viewBody = document.getElementById('view-product-body');

    function openViewModal(p) {
        const label = computeStatusLabel(p);
        const meta = CATEGORY_META[p.category] || { icon: 'fa-box', cls: 'bg-slate' };
        const hasDiscount = p.mrp && p.mrp > p.price;

        let machineInfoHtml = '';
        if (p.machineInfo) {
            const mi = p.machineInfo;
            machineInfoHtml = `
                <div class="view-desc">
                    <b>Machine Information</b><br>
                    ${mi.tonnage ? `Tonnage: ${mi.tonnage} Ton &nbsp;·&nbsp; ` : ''}${mi.output ? `Output/8Hr: ${escapeHtml(mi.output)} &nbsp;·&nbsp; ` : ''}${mi.cycleTime ? `Cycle Time: ${mi.cycleTime}s` : ''}<br>
                    ${mi.powerHP ? `Power: ${mi.powerHP} HP &nbsp;·&nbsp; ` : ''}${mi.gensetKVA ? `Genset: ${mi.gensetKVA} KVA &nbsp;·&nbsp; ` : ''}${mi.oilTank ? `Oil Tank: ${mi.oilTank} Ltr` : ''}<br>
                    ${mi.motor ? `Motor: ${escapeHtml(mi.motor)}<br>` : ''}
                    ${mi.weight ? `Weight: ${escapeHtml(mi.weight)} &nbsp;·&nbsp; ` : ''}${mi.dimensions ? `Dimensions: ${escapeHtml(mi.dimensions)}` : ''}<br>
                    ${mi.shed ? `Shed/Space: ${escapeHtml(mi.shed)} &nbsp;·&nbsp; ` : ''}${mi.labour ? `Labour: ${mi.labour} workers` : ''}<br>
                    ${mi.origin ? `Origin: ${escapeHtml(mi.origin)}<br>` : ''}
                    ${mi.accessories ? `Accessories: ${escapeHtml(mi.accessories).replace(/\n/g, ', ')}` : ''}
                </div>
            `;
        }

        let techSpecHtml = '';
        if (p.techSpec) {
            const ts = p.techSpec;
            techSpecHtml = `
                <div class="view-desc">
                    <b>Technical Specification</b><br>
                    ${ts.automation ? `Automation: ${escapeHtml(ts.automation)} &nbsp;·&nbsp; ` : ''}${ts.palletSize ? `Pallet Size: ${escapeHtml(ts.palletSize)}` : ''}<br>
                    ${ts.plc ? `PLC: ${escapeHtml(ts.plc)}<br>` : ''}
                    ${ts.controlPanel ? `Control Panel: ${escapeHtml(ts.controlPanel)}<br>` : ''}
                    ${ts.safety ? `Safety: ${escapeHtml(ts.safety)}<br>` : ''}
                    Vibration System: ${ts.vibration === 'yes' ? 'Yes' : 'No'}
                </div>
            `;
        }

        let specMasterHtml = '';
        if (p.specMaster && p.specMaster.length) {
            specMasterHtml = `
                <div class="view-specmaster">
                    <b>Product Specification Master</b>
                    ${p.specMaster.map(row => `
                        <div class="view-specmaster-row">
                            <div class="vs-sr">${escapeHtml(row.sr)}</div>
                            <div>${escapeHtml(row.text)}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        viewBody.innerHTML = `
            <div class="view-head">
                <div class="row-icon ${meta.cls}"><i class="fas ${meta.icon}"></i></div>
                <div>
                    <div class="product-name" style="font-size:13px">${escapeHtml(p.name)}</div>
                    <div class="product-sub">${escapeHtml(p.brand)} · SKU: ${escapeHtml(p.sku || '—')}</div>
                </div>
            </div>
            <div class="view-grid">
                <div class="view-item"><div class="view-label">Category</div><div class="view-value">${escapeHtml(p.category)}</div></div>
                <div class="view-item"><div class="view-label">Specification</div><div class="view-value">${escapeHtml(p.spec || '—')}</div></div>
                <div class="view-item"><div class="view-label">HSN Code</div><div class="view-value">${escapeHtml(p.hsn || '—')}</div></div>
                <div class="view-item"><div class="view-label">GST Rate</div><div class="view-value">${p.gst !== undefined ? p.gst + '%' : '—'}</div></div>
                <div class="view-item"><div class="view-label">Warranty</div><div class="view-value">${p.warranty !== undefined && p.warranty > 0 ? p.warranty + ' Years' : '—'}</div></div>
                <div class="view-item"><div class="view-label">MRP</div><div class="view-value">₹${(p.mrp ?? p.price).toLocaleString('en-IN')}</div></div>
                <div class="view-item"><div class="view-label">Selling Price</div><div class="view-value">₹${p.price.toLocaleString('en-IN')} / ${escapeHtml(p.unit)}${hasDiscount ? ` <span class="discount-badge">${p.discount || Math.round((p.mrp - p.price) / p.mrp * 100)}% OFF</span>` : ''}</div></div>
                <div class="view-item"><div class="view-label">Stock</div><div class="view-value">${p.stock} ${escapeHtml(p.unit)}</div></div>
                <div class="view-item"><div class="view-label">Status</div><div class="view-value"><span class="badge ${badgeClass(label)}">${label}</span></div></div>
                <div class="view-item"><div class="view-label">Qty per Machine Set</div><div class="view-value">${p.qtyPerKw ?? 0} ${escapeHtml(p.unit)}/set</div></div>
                <div class="view-item"><div class="view-label">Low Stock Threshold</div><div class="view-value">${p.threshold}</div></div>
            </div>
            ${p.description ? `<div class="view-desc">${escapeHtml(p.description)}</div>` : ''}
            ${machineInfoHtml}
            ${techSpecHtml}
            ${specMasterHtml}
        `;
        openModal('modal-view-product');
    }

    // ---------------------------------------------------
    // 10b. Stock History modal (ledger of stock in / out)
    // ---------------------------------------------------
    let stockHistoryProduct = null;
    const stockLedgerBody = document.getElementById('stock-ledger-body');
    const stockHistoryProductName = document.getElementById('stock-history-product-name');
    const stockHistoryCurrentStock = document.getElementById('stock-history-current-stock');
    const slType = document.getElementById('sl-type');
    const slQty = document.getElementById('sl-qty');
    const slReason = document.getElementById('sl-reason');

    function renderStockLedger(productId) {
        const entries = stockLedger
            .filter(e => e.productId === productId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (entries.length === 0) {
            stockLedgerBody.innerHTML = `<div class="ledger-empty">No stock movements recorded yet.</div>`;
            return;
        }

        stockLedgerBody.innerHTML = entries.map(e => `
            <div class="ledger-item">
                <div class="ledger-icon ${e.type === 'in' ? 'ledger-in' : 'ledger-out'}">
                    <i class="fas ${e.type === 'in' ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                </div>
                <div class="ledger-info">
                    <div class="ledger-reason">${escapeHtml(e.reason || (e.type === 'in' ? 'Stock added' : 'Stock removed'))}</div>
                    <div class="ledger-date">${e.date}</div>
                </div>
                <div class="ledger-qty ${e.type === 'in' ? 'ledger-in' : 'ledger-out'}">${e.type === 'in' ? '+' : '-'}${e.qty}</div>
            </div>
        `).join('');
    }

    function openStockHistoryModal(product) {
        stockHistoryProduct = product;
        stockHistoryProductName.textContent = product.name;
        stockHistoryCurrentStock.textContent = `${product.stock} ${product.unit} in stock`;
        slType.value = 'in';
        slQty.value = '';
        slReason.value = '';
        renderStockLedger(product.id);
        openModal('modal-stock-history');
    }

    document.getElementById('btn-add-stock-entry')?.addEventListener('click', () => {
        if (!stockHistoryProduct) return;
        const qty = parseInt(slQty.value, 10);
        if (!qty || qty <= 0) {
            showToast('Enter a valid quantity', 'error');
            return;
        }
        const type = slType.value;

        if (type === 'out' && qty > stockHistoryProduct.stock) {
            showToast('Cannot remove more than current stock', 'error');
            return;
        }

        ledgerCounter++;
        stockLedger.unshift({
            id: 'SL-' + ledgerCounter,
            productId: stockHistoryProduct.id,
            type,
            qty,
            reason: slReason.value.trim(),
            date: new Date().toISOString().slice(0, 10)
        });

        stockHistoryProduct.stock += (type === 'in' ? qty : -qty);

        slQty.value = '';
        slReason.value = '';
        renderStockLedger(stockHistoryProduct.id);
        stockHistoryCurrentStock.textContent = `${stockHistoryProduct.stock} ${stockHistoryProduct.unit} in stock`;
        render();
        showToast(type === 'in' ? 'Stock added' : 'Stock removed', 'success');
    });

    // ---------------------------------------------------
    // 11. Delete modal
    // ---------------------------------------------------
    let productToDelete = null;

    function openDeleteModal(p) {
        productToDelete = p;
        document.getElementById('delete-product-name').textContent = p.name;
        openModal('modal-delete-product');
    }

    document.getElementById('btn-confirm-delete-product').addEventListener('click', () => {
        if (productToDelete) {
            products = products.filter(p => p.id !== productToDelete.id);
            showToast('Product deleted', 'success');
        }
        productToDelete = null;
        closeModal('modal-delete-product');
        render();
    });

    // ---------------------------------------------------
    // 12. Initial render
    // ---------------------------------------------------
    render();

    // Expose product data for quotation-line auto-generation logic elsewhere in the app
    window.VKMProducts = {
        getAll: () => products,
        getById: (id) => products.find(p => p.id === id),
        getByCategory: (category) => products.filter(p => p.category === category)
    };

})();