// API Configuration
const API_BASE = import.meta.env.DEV ? '/.netlify/functions' : '/api';

// Global State
const state = {
  fabricTypes: [],
  broochCategories: [],
  laceCategories: [],
  extraCharges: [],
  widthRules: [],
  invoiceItems: [],
  currentPage: 'invoice',
  numberOfSets: 0,
  profitSettings: {
    type: 'none',
    value: 0
  },
  // Edit state tracking
  editMode: {
    fabric: null,
    brooch: null,
    lace: null,
    extra: null,
    widthRule: null
  }
};

// Local persistence keys
const PROFIT_STORAGE_KEY = 'profitSettings';
const LOCAL_ONLY = true;
const STORAGE_KEYS = {
  broochCategories: 'broochCategories',
  laceCategories: 'laceCategories',
  fabricTypes: 'fabricTypes',
  extraCharges: 'extraCharges',
  widthRules: 'widthRules'
};

// Local storage helpers
function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Failed to parse localStorage key ${key}:`, error);
    return fallback;
  }
}

function writeLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Backup helpers
function buildBackupPayload() {
  const safeParse = (key) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn(`Failed to parse key ${key} for backup`, error);
      return null;
    }
  };

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      broochCategories: readLocal(STORAGE_KEYS.broochCategories, []),
      laceCategories: readLocal(STORAGE_KEYS.laceCategories, []),
      fabricTypes: readLocal(STORAGE_KEYS.fabricTypes, []),
      extraCharges: readLocal(STORAGE_KEYS.extraCharges, []),
      widthRules: readLocal(STORAGE_KEYS.widthRules, []),
      profitSettings: readLocal(PROFIT_STORAGE_KEY, { type: 'none', value: 0 }),
      invoiceData: safeParse('invoiceData')
    }
  };
}

function applyBackupData(payload) {
  const data = payload?.data || payload;
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid backup file');
  }

  if (data.broochCategories) writeLocal(STORAGE_KEYS.broochCategories, data.broochCategories);
  if (data.laceCategories) writeLocal(STORAGE_KEYS.laceCategories, data.laceCategories);
  if (data.fabricTypes) writeLocal(STORAGE_KEYS.fabricTypes, data.fabricTypes);
  if (data.extraCharges) writeLocal(STORAGE_KEYS.extraCharges, data.extraCharges);
  if (data.widthRules) writeLocal(STORAGE_KEYS.widthRules, data.widthRules);
  if (data.profitSettings) saveProfitToLocalStorage(data.profitSettings);
  if (data.invoiceData !== undefined) {
    localStorage.setItem('invoiceData', JSON.stringify(data.invoiceData));
  }

  // Refresh state/UI from restored values
  hydrateStateFromLocalStorage();
  renderBroochCategories();
  populateBroochCategorySelects();
  renderLaceCategories();
  populateLaceCategorySelects();
  renderFabricTypes();
  populateFabricSelect();
  renderExtraCharges();
  populateExtraChargeCheckboxes();
  renderWidthRules();
  populateWidthDropdown();
  updateProfitDisplay();
  loadInvoiceFromLocalStorage();
}

function setBackupStatus(message, type = 'info') {
  const el = document.getElementById('backup-status');
  if (!el) return;
  el.textContent = message;
  el.style.color = type === 'error' ? '#c0392b' : '#666';
}

// Preload state from localStorage so UI works even if API calls fail
function hydrateStateFromLocalStorage() {
  state.broochCategories = readLocal(STORAGE_KEYS.broochCategories, []);
  state.laceCategories = readLocal(STORAGE_KEYS.laceCategories, []);
  state.fabricTypes = readLocal(STORAGE_KEYS.fabricTypes, []);
  state.extraCharges = readLocal(STORAGE_KEYS.extraCharges, []);
  state.widthRules = readLocal(STORAGE_KEYS.widthRules, []);

  const storedProfit = readLocal(PROFIT_STORAGE_KEY, null);
  if (storedProfit) {
    state.profitSettings = storedProfit;
  }
}

function nextId(list) {
  const max = list.reduce((m, item) => Math.max(m, item.id || 0), 0);
  return max + 1;
}

function jsonResponse(payload) {
  return {
    ok: true,
    status: 200,
    json: async () => payload
  };
}

function handleBroochEndpoint(method, body) {
  const store = readLocal(STORAGE_KEYS.broochCategories, []);
  if (method === 'GET') {
    return jsonResponse({ success: true, data: store });
  }
  if (method === 'POST') {
    const newItem = { id: nextId(store), name: body.name, price: body.price };
    const updated = [...store, newItem];
    writeLocal(STORAGE_KEYS.broochCategories, updated);
    return jsonResponse({ success: true, data: newItem });
  }
  if (method === 'PUT') {
    const updated = store.map((item) =>
      item.id === body.id ? { ...item, name: body.name, price: body.price } : item
    );
    writeLocal(STORAGE_KEYS.broochCategories, updated);
    return jsonResponse({ success: true });
  }
  if (method === 'DELETE') {
    const updated = store.filter((item) => item.id !== body.id);
    writeLocal(STORAGE_KEYS.broochCategories, updated);
    return jsonResponse({ success: true });
  }
  return jsonResponse({ success: false });
}

function handleLaceEndpoint(method, body) {
  const store = readLocal(STORAGE_KEYS.laceCategories, []);
  if (method === 'GET') {
    return jsonResponse({ success: true, data: store });
  }
  if (method === 'POST') {
    const newItem = { id: nextId(store), name: body.name, price: body.price };
    const updated = [...store, newItem];
    writeLocal(STORAGE_KEYS.laceCategories, updated);
    return jsonResponse({ success: true, data: newItem });
  }
  if (method === 'PUT') {
    const updated = store.map((item) =>
      item.id === body.id ? { ...item, name: body.name, price: body.price } : item
    );
    writeLocal(STORAGE_KEYS.laceCategories, updated);
    return jsonResponse({ success: true });
  }
  if (method === 'DELETE') {
    const updated = store.filter((item) => item.id !== body.id);
    writeLocal(STORAGE_KEYS.laceCategories, updated);
    return jsonResponse({ success: true });
  }
  return jsonResponse({ success: false });
}

function handleFabricEndpoint(method, body, searchParams) {
  const store = readLocal(STORAGE_KEYS.fabricTypes, []);
  if (method === 'GET') {
    const widthFilter = searchParams?.get('width');
    const data = widthFilter ? store.filter((item) => String(item.width) === String(widthFilter)) : store;
    return jsonResponse({ success: true, data });
  }
  if (method === 'POST') {
    const newItem = {
      id: nextId(store),
      name: body.name,
      price_per_meter: body.price_per_meter,
      width: body.width
    };
    const updated = [...store, newItem];
    writeLocal(STORAGE_KEYS.fabricTypes, updated);
    return jsonResponse({ success: true, data: newItem });
  }
  if (method === 'PUT') {
    const updated = store.map((item) =>
      item.id === body.id
        ? { ...item, name: body.name, price_per_meter: body.price_per_meter, width: body.width }
        : item
    );
    writeLocal(STORAGE_KEYS.fabricTypes, updated);
    return jsonResponse({ success: true });
  }
  if (method === 'DELETE') {
    const updated = store.filter((item) => item.id !== body.id);
    writeLocal(STORAGE_KEYS.fabricTypes, updated);
    return jsonResponse({ success: true });
  }
  return jsonResponse({ success: false });
}

function handleExtraEndpoint(method, body) {
  const store = readLocal(STORAGE_KEYS.extraCharges, []);
  if (method === 'GET') {
    return jsonResponse({ success: true, data: store });
  }
  if (method === 'POST') {
    const newItem = { id: nextId(store), name: body.name, price: body.price };
    const updated = [...store, newItem];
    writeLocal(STORAGE_KEYS.extraCharges, updated);
    return jsonResponse({ success: true, data: newItem });
  }
  if (method === 'PUT') {
    const updated = store.map((item) =>
      item.id === body.id ? { ...item, name: body.name, price: body.price } : item
    );
    writeLocal(STORAGE_KEYS.extraCharges, updated);
    return jsonResponse({ success: true });
  }
  if (method === 'DELETE') {
    const updated = store.filter((item) => item.id !== body.id);
    writeLocal(STORAGE_KEYS.extraCharges, updated);
    return jsonResponse({ success: true });
  }
  return jsonResponse({ success: false });
}

function handleWidthEndpoint(method, body) {
  const store = readLocal(STORAGE_KEYS.widthRules, []);
  if (method === 'GET') {
    return jsonResponse({ success: true, data: store });
  }
  if (method === 'POST') {
    const newItem = {
      id: nextId(store),
      width: body.width,
      sets: body.sets,
      meters: body.meters,
      lace_rolls: body.lace_rolls
    };
    const updated = [...store, newItem];
    writeLocal(STORAGE_KEYS.widthRules, updated);
    return jsonResponse({ success: true, data: newItem });
  }
  if (method === 'PUT') {
    const updated = store.map((item) =>
      item.id === body.id
        ? { ...item, width: body.width, sets: body.sets, meters: body.meters, lace_rolls: body.lace_rolls }
        : item
    );
    writeLocal(STORAGE_KEYS.widthRules, updated);
    return jsonResponse({ success: true });
  }
  if (method === 'DELETE') {
    const updated = store.filter((item) => item.id !== body.id);
    writeLocal(STORAGE_KEYS.widthRules, updated);
    return jsonResponse({ success: true });
  }
  return jsonResponse({ success: false });
}

function handleProfitEndpoint(method, body) {
  const stored = readLocal(PROFIT_STORAGE_KEY, null);
  if (method === 'GET') {
    if (!stored) {
      return jsonResponse({ success: true, data: { profit_type: 'none', profit_value: 0 } });
    }
    return jsonResponse({
      success: true,
      data: { profit_type: stored.type || 'none', profit_value: Number(stored.value) || 0 }
    });
  }
  if (method === 'POST') {
    const settings = {
      type: body.profit_type || 'none',
      value: Number(body.profit_value) || 0
    };
    writeLocal(PROFIT_STORAGE_KEY, settings);
    return jsonResponse({ success: true, message: 'Saved locally' });
  }
  return jsonResponse({ success: false });
}

// Local-friendly API helper: routes to local handlers when LOCAL_ONLY is true, otherwise calls real API
async function callLocalEndpoint(endpoint, method, body, searchParams) {
  if (endpoint === 'brooch-categories') return handleBroochEndpoint(method, body);
  if (endpoint === 'lace-categories') return handleLaceEndpoint(method, body);
  if (endpoint === 'fabric-types') return handleFabricEndpoint(method, body, searchParams);
  if (endpoint === 'extra-charges') return handleExtraEndpoint(method, body);
  if (endpoint === 'width-rules') return handleWidthEndpoint(method, body);
  if (endpoint === 'profit-settings') return handleProfitEndpoint(method, body);
  return jsonResponse({ success: false });
}

async function apiRequest(endpoint, { method = 'GET', body = null, searchParams = null } = {}) {
  if (LOCAL_ONLY) {
    const paramsObj =
      searchParams instanceof URLSearchParams
        ? searchParams
        : searchParams
        ? new URLSearchParams(searchParams)
        : null;
    const response = await callLocalEndpoint(endpoint, method, body, paramsObj);
    return response.json();
  }

  let url = `${API_BASE}/${endpoint}`;
  if (searchParams) {
    const qs =
      typeof searchParams === 'string'
        ? searchParams
        : new URLSearchParams(searchParams).toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'GET' ? null : JSON.stringify(body)
  });
  return res.json();
}

// Intercept fetch to work fully offline/local
if (LOCAL_ONLY && typeof window !== 'undefined') {
  const realFetch = window.fetch.bind(window);
  window.fetch = async (url, options = {}) => {
    const method = (options.method || 'GET').toUpperCase();
    let body = null;
    try {
      body = options.body ? JSON.parse(options.body) : null;
    } catch (error) {
      body = null;
    }

    const parsed = new URL(url, window.location.origin);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const endpoint = segments[segments.length - 1];

    if (endpoint === 'brooch-categories') return handleBroochEndpoint(method, body);
    if (endpoint === 'lace-categories') return handleLaceEndpoint(method, body);
    if (endpoint === 'fabric-types') return handleFabricEndpoint(method, body, parsed.searchParams);
    if (endpoint === 'extra-charges') return handleExtraEndpoint(method, body);
    if (endpoint === 'width-rules') return handleWidthEndpoint(method, body);
    if (endpoint === 'profit-settings') return handleProfitEndpoint(method, body);

    // Fallback to real fetch if it's some other resource
    return realFetch(url, options);
  };
}

// Utility Functions
function showStatus(message, type = 'success') {
  const statusEl = document.getElementById('status-message');
  statusEl.textContent = message;
  statusEl.className = `status-message ${type} show`;
  setTimeout(() => statusEl.classList.remove('show'), 3000);
}

function formatCurrency(amount) {
  return `₹${parseFloat(amount).toFixed(2)}`;
}

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.dataset.page;
    switchPage(page);
  });
});

function switchPage(pageName) {
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
  
  // Update pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`${pageName}-page`).classList.add('active');
  
  state.currentPage = pageName;
}

// ==================== BROOCH CATEGORIES ====================
async function loadBroochCategories() {
  try {
    const data = await apiRequest('brooch-categories');
    if (data.success) {
      state.broochCategories = data.data;
      renderBroochCategories();
      populateBroochCategorySelects();
    }
  } catch (error) {
    console.error('Error loading brooch categories:', error);
  }
}

function renderBroochCategories() {
  const list = document.getElementById('brooch-category-list');
  if (!list) return;
  if (state.broochCategories.length === 0) {
    list.innerHTML = '<div class="empty-state">No categories yet</div>';
    return;
  }
  list.innerHTML = state.broochCategories.map(c => `
    <div class="item-card">
      <div class="item-info">
        <div class="item-name">${c.name}</div>
        <div class="item-price">${formatCurrency(c.price)}</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-primary btn-sm" onclick="editBroochCategory(${c.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteBroochCategory(${c.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function populateBroochCategorySelects() {
  const select = document.getElementById('brooch-category-invoice-select');
  if (select) {
    select.innerHTML = '<option value="">Select category</option>' +
      state.broochCategories.map(c => `<option value="${c.id}" data-price="${c.price}">${c.name} - ${formatCurrency(c.price)}</option>`).join('');
  }
}

window.editBroochCategory = (id) => {
  const brooch = state.broochCategories.find(b => b.id === id);
  if (!brooch) return;

  // Populate form
  document.getElementById('brooch-category-name').value = brooch.name;
  document.getElementById('brooch-category-price').value = brooch.price;

  // Update button and store edit state
  const submitBtn = document.querySelector('#brooch-category-form button[type="submit"]');
  submitBtn.textContent = 'Update Brooch';
  state.editMode.brooch = id;

  // Scroll to form
  document.getElementById('brooch-category-form').scrollIntoView({ behavior: 'smooth' });
};

window.cancelBroochEdit = () => {
  document.getElementById('brooch-category-form').reset();
  const submitBtn = document.querySelector('#brooch-category-form button[type="submit"]');
  submitBtn.textContent = 'Add Brooch';
  state.editMode.brooch = null;
};

document.getElementById('brooch-category-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('brooch-category-name').value.trim();
  const price = parseFloat(document.getElementById('brooch-category-price').value);

  if (!price) {
    showStatus('Please enter a price', 'error');
    return;
  }

  const isEditMode = state.editMode.brooch !== null;
  const method = isEditMode ? 'PUT' : 'POST';
  const body = isEditMode
    ? { id: state.editMode.brooch, name, price }
    : { name, price };

  try {
    const result = await apiRequest('brooch-categories', { method, body });
    if (result.success) {
      showStatus(isEditMode ? 'Brooch category updated!' : 'Brooch category added!', 'success');
      document.getElementById('brooch-category-form').reset();
      const submitBtn = document.querySelector('#brooch-category-form button[type="submit"]');
      submitBtn.textContent = 'Add Brooch';
      state.editMode.brooch = null;
      await loadBroochCategories();
    }
  } catch (error) {
    showStatus(isEditMode ? 'Error updating category' : 'Error adding category', 'error');
  }
});

window.deleteBroochCategory = async (id) => {
  if (!confirm('Delete this category?')) return;
  try {
    const result = await apiRequest('brooch-categories', { method: 'DELETE', body: { id } });
    if (result.success) {
      showStatus('Category deleted', 'success');
      await loadBroochCategories();
    }
  } catch (error) {
    showStatus('Error deleting category', 'error');
  }
};

// ==================== LACE CATEGORIES ====================
async function loadLaceCategories() {
  try {
    const data = await apiRequest('lace-categories');
    if (data.success) {
      state.laceCategories = data.data;
      renderLaceCategories();
      populateLaceCategorySelects();
    }
  } catch (error) {
    console.error('Error loading lace categories:', error);
  }
}

function renderLaceCategories() {
  const list = document.getElementById('lace-category-list');
  if (!list) return;
  if (state.laceCategories.length === 0) {
    list.innerHTML = '<div class="empty-state">No categories yet</div>';
    return;
  }
  list.innerHTML = state.laceCategories.map(c => `
    <div class="item-card">
      <div class="item-info">
        <div class="item-name">${c.name}</div>
        <div class="item-price">${formatCurrency(c.price)}</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-primary btn-sm" onclick="editLaceCategory(${c.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteLaceCategory(${c.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function populateLaceCategorySelects() {
  const select = document.getElementById('lace-category-invoice-select');
  if (select) {
    select.innerHTML = '<option value="">Select category</option>' +
      state.laceCategories.map(c => `<option value="${c.id}" data-price="${c.price}">${c.name} - ${formatCurrency(c.price)}</option>`).join('');
  }
}

window.editLaceCategory = (id) => {
  const lace = state.laceCategories.find(l => l.id === id);
  if (!lace) return;

  // Populate form
  document.getElementById('lace-category-name').value = lace.name;
  document.getElementById('lace-category-price').value = lace.price;

  // Update button and store edit state
  const submitBtn = document.querySelector('#lace-category-form button[type="submit"]');
  submitBtn.textContent = 'Update Lace';
  state.editMode.lace = id;

  // Scroll to form
  document.getElementById('lace-category-form').scrollIntoView({ behavior: 'smooth' });
};

window.cancelLaceEdit = () => {
  document.getElementById('lace-category-form').reset();
  const submitBtn = document.querySelector('#lace-category-form button[type="submit"]');
  submitBtn.textContent = 'Add Lace';
  state.editMode.lace = null;
};

document.getElementById('lace-category-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('lace-category-name').value.trim();
  const price = parseFloat(document.getElementById('lace-category-price').value);

  if (!price) {
    showStatus('Please enter a price', 'error');
    return;
  }

  const isEditMode = state.editMode.lace !== null;
  const method = isEditMode ? 'PUT' : 'POST';
  const body = isEditMode
    ? { id: state.editMode.lace, name, price }
    : { name, price };

  try {
    const result = await apiRequest('lace-categories', { method, body });
    if (result.success) {
      showStatus(isEditMode ? 'Lace category updated!' : 'Lace category added!', 'success');
      document.getElementById('lace-category-form').reset();
      const submitBtn = document.querySelector('#lace-category-form button[type="submit"]');
      submitBtn.textContent = 'Add Lace';
      state.editMode.lace = null;
      await loadLaceCategories();
    }
  } catch (error) {
    showStatus(isEditMode ? 'Error updating category' : 'Error adding category', 'error');
  }
});

window.deleteLaceCategory = async (id) => {
  if (!confirm('Delete this category?')) return;
  try {
    const result = await apiRequest('lace-categories', { method: 'DELETE', body: { id } });
    if (result.success) {
      showStatus('Category deleted', 'success');
      await loadLaceCategories();
    }
  } catch (error) {
    showStatus('Error deleting category', 'error');
  }
};

// ==================== FABRIC TYPES ====================
async function loadFabricTypes(width = null) {
  try {
    const data = await apiRequest('fabric-types', {
      searchParams: width ? { width } : null
    });
    if (data.success) {
      state.fabricTypes = data.data;
      renderFabricTypes();
      if (!width) {
        populateFabricSelect();
      }
    }
  } catch (error) {
    console.error('Error loading fabric types:', error);
    showStatus('Error loading fabric types', 'error');
  }
}

function renderFabricTypes() {
  const list = document.getElementById('fabric-list');
  if (state.fabricTypes.length === 0) {
    list.innerHTML = '<div class="empty-state">No fabric types yet</div>';
    return;
  }

  list.innerHTML = state.fabricTypes.map(f => `
    <div class="item-card">
      <div class="item-info">
        <div class="item-name">${f.name} (Width ${f.width})</div>
        <div class="item-price">${formatCurrency(f.price_per_meter)}/meter</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-primary btn-sm" onclick="editFabricType(${f.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteFabricType(${f.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function populateFabricSelect() {
  const select = document.getElementById('fabric-type-select');
  select.innerHTML = '<option value="">Select fabric type</option>' +
    state.fabricTypes.map(f => 
      `<option value="${f.id}" data-price="${f.price_per_meter}">${f.name} - ${formatCurrency(f.price_per_meter)}/m</option>`
    ).join('');
}

window.editFabricType = (id) => {
  const fabric = state.fabricTypes.find(f => f.id === id);
  if (!fabric) return;

  // Populate form
  document.getElementById('fabric-name').value = fabric.name;
  document.getElementById('fabric-price').value = fabric.price_per_meter;
  document.getElementById('fabric-width').value = fabric.width;

  // Update button and store edit state
  const submitBtn = document.querySelector('#fabric-form button[type="submit"]');
  submitBtn.textContent = 'Update Fabric';
  state.editMode.fabric = id;

  // Scroll to form
  document.getElementById('fabric-form').scrollIntoView({ behavior: 'smooth' });
};

window.cancelFabricEdit = () => {
  document.getElementById('fabric-form').reset();
  const submitBtn = document.querySelector('#fabric-form button[type="submit"]');
  submitBtn.textContent = 'Add Fabric';
  state.editMode.fabric = null;
};

document.getElementById('fabric-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('fabric-name').value.trim();
  const price = parseFloat(document.getElementById('fabric-price').value);
  const width = document.getElementById('fabric-width').value;

  if (!width) {
    showStatus('Please select a width', 'error');
    return;
  }

  const isEditMode = state.editMode.fabric !== null;
  const method = isEditMode ? 'PUT' : 'POST';
  const body = isEditMode
    ? { id: state.editMode.fabric, name, price_per_meter: price, width }
    : { name, price_per_meter: price, width };

  try {
    const result = await apiRequest('fabric-types', { method, body });
    if (result.success) {
      showStatus(isEditMode ? 'Fabric type updated!' : 'Fabric type added!', 'success');
      document.getElementById('fabric-form').reset();
      const submitBtn = document.querySelector('#fabric-form button[type="submit"]');
      submitBtn.textContent = 'Add Fabric';
      state.editMode.fabric = null;
      await loadFabricTypes();
    }
  } catch (error) {
    showStatus(isEditMode ? 'Error updating fabric type' : 'Error adding fabric type', 'error');
  }
});

window.deleteFabricType = async (id) => {
  if (!confirm('Delete this fabric type?')) return;
  try {
    const result = await apiRequest('fabric-types', { method: 'DELETE', body: { id } });
    if (result.success) {
      showStatus('Fabric type deleted', 'success');
      await loadFabricTypes();
    }
  } catch (error) {
    showStatus('Error deleting fabric type', 'error');
  }
};


// ==================== EXTRA CHARGES ====================
async function loadExtraCharges() {
  try {
    const data = await apiRequest('extra-charges');
    if (data.success) {
      state.extraCharges = data.data;
      renderExtraCharges();
      populateExtraChargeCheckboxes();
    }
  } catch (error) {
    console.error('Error loading extra charges:', error);
  }
}

function populateExtraChargeCheckboxes() {
  const container = document.getElementById('extra-charges-checkboxes');
  if (!container) return;

  if (state.extraCharges.length === 0) {
    container.innerHTML = '<p style="color: #666; font-size: 14px;">No extra charges available. Add some in the Extras page.</p>';
    return;
  }

  container.innerHTML = state.extraCharges.map(e => `
    <label style="display: block; margin-bottom: 8px; cursor: pointer;">
      <input type="checkbox" class="extra-charge-checkbox" value="${e.id}" data-name="${e.name}" data-price="${e.price}">
      ${e.name} - ${formatCurrency(e.price)}
    </label>
  `).join('');
}

// Handle custom charge checkbox toggle
document.getElementById('custom-charge-checkbox')?.addEventListener('change', (e) => {
  const customFields = document.getElementById('custom-charge-fields');
  if (e.target.checked) {
    customFields.style.display = 'block';
  } else {
    customFields.style.display = 'none';
    // Clear custom fields
    document.getElementById('custom-charge-name').value = '';
    document.getElementById('custom-charge-price').value = '';
    document.getElementById('custom-charge-quantity').value = '1';
  }
});

function renderExtraCharges() {
  const list = document.getElementById('extra-charge-list');
  if (!list) return;
  if (state.extraCharges.length === 0) {
    list.innerHTML = '<div class="empty-state">No extra charges yet</div>';
    return;
  }
  list.innerHTML = state.extraCharges.map(e => `
    <div class="item-card">
      <div class="item-info">
        <div class="item-name">${e.name}</div>
        <div class="item-price">${formatCurrency(e.price)}</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-primary btn-sm" onclick="editExtraCharge(${e.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteExtraCharge(${e.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

window.editExtraCharge = (id) => {
  const extra = state.extraCharges.find(e => e.id === id);
  if (!extra) return;

  // Populate form
  document.getElementById('extra-charge-name').value = extra.name;
  document.getElementById('extra-charge-price').value = extra.price;

  // Update button and store edit state
  const submitBtn = document.querySelector('#extra-charge-form button[type="submit"]');
  submitBtn.textContent = 'Update Extra Charge';
  state.editMode.extra = id;

  // Scroll to form
  document.getElementById('extra-charge-form').scrollIntoView({ behavior: 'smooth' });
};

window.cancelExtraEdit = () => {
  document.getElementById('extra-charge-form').reset();
  const submitBtn = document.querySelector('#extra-charge-form button[type="submit"]');
  submitBtn.textContent = 'Add Extra Charge';
  state.editMode.extra = null;
};

document.getElementById('extra-charge-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('extra-charge-name').value.trim();
  const price = parseFloat(document.getElementById('extra-charge-price').value);

  const isEditMode = state.editMode.extra !== null;
  const method = isEditMode ? 'PUT' : 'POST';
  const body = isEditMode
    ? { id: state.editMode.extra, name, price }
    : { name, price };

  try {
    const result = await apiRequest('extra-charges', { method, body });
    if (result.success) {
      showStatus(isEditMode ? 'Extra charge updated!' : 'Extra charge added!', 'success');
      document.getElementById('extra-charge-form').reset();
      const submitBtn = document.querySelector('#extra-charge-form button[type="submit"]');
      submitBtn.textContent = 'Add Extra Charge';
      state.editMode.extra = null;
      await loadExtraCharges();
    }
  } catch (error) {
    showStatus(isEditMode ? 'Error updating extra charge' : 'Error adding extra charge', 'error');
  }
});

window.deleteExtraCharge = async (id) => {
  if (!confirm('Delete this extra charge?')) return;
  try {
    const result = await apiRequest('extra-charges', { method: 'DELETE', body: { id } });
    if (result.success) {
      showStatus('Extra charge deleted', 'success');
      await loadExtraCharges();
    }
  } catch (error) {
    showStatus('Error deleting extra charge', 'error');
  }
};

// ==================== PROFIT SETTINGS ====================
function loadProfitFromLocalStorage() {
  try {
    const raw = localStorage.getItem(PROFIT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      type: parsed.type || 'none',
      value: Number(parsed.value) || 0
    };
  } catch (error) {
    console.warn('Failed to read profit settings from localStorage:', error);
    return null;
  }
}

function saveProfitToLocalStorage(settings) {
  localStorage.setItem(PROFIT_STORAGE_KEY, JSON.stringify(settings));
}

async function loadProfitSettings() {
  // Prefer local settings to remove dependency on database availability
  const localSettings = loadProfitFromLocalStorage();
  if (localSettings) {
    state.profitSettings = localSettings;
    updateProfitDisplay();
    const profitTypeEl = document.getElementById('profit-type');
    const profitValueEl = document.getElementById('profit-value');
    if (profitTypeEl && profitValueEl) {
      profitTypeEl.value = state.profitSettings.type;
      profitValueEl.value = state.profitSettings.value;
    }
  }

  try {
    const data = await apiRequest('profit-settings');
    if (data.success) {
      state.profitSettings = {
        type: data.data.profit_type,
        value: data.data.profit_value
      };
      saveProfitToLocalStorage(state.profitSettings);
      updateProfitDisplay();
      // Populate form if on profit settings page
      const profitTypeEl = document.getElementById('profit-type');
      const profitValueEl = document.getElementById('profit-value');
      if (profitTypeEl && profitValueEl) {
        profitTypeEl.value = state.profitSettings.type;
        profitValueEl.value = state.profitSettings.value;
      }
    }
  } catch (error) {
    console.error('Error loading profit settings:', error);
    // Fallback to local or default
    if (!localSettings) {
      state.profitSettings = { type: 'none', value: 0 };
      updateProfitDisplay();
    }
  }
}

async function saveProfitSettings() {
  // Always persist locally first
  saveProfitToLocalStorage(state.profitSettings);
  let synced = false;

  try {
    const data = await apiRequest('profit-settings', {
      method: 'POST',
      body: {
        profit_type: state.profitSettings.type,
        profit_value: state.profitSettings.value
      }
    });
    if (data.success) {
      updateProfitDisplay();
      synced = true;
    }
  } catch (error) {
    console.error('Error saving profit settings:', error);
  }

  return { success: true, synced };
}

function updateProfitDisplay() {
  const display = document.getElementById('profit-display');
  if (!display) return;

  if (state.profitSettings.type === 'none') {
    display.textContent = 'No profit configured';
  } else if (state.profitSettings.type === 'percentage') {
    display.textContent = `Profit: ${state.profitSettings.value}% on per-set price`;
  } else if (state.profitSettings.type === 'fixed') {
    display.textContent = `Profit: ${formatCurrency(state.profitSettings.value)} per set`;
  }
}

document.getElementById('profit-settings-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const type = document.getElementById('profit-type').value;
  const value = parseFloat(document.getElementById('profit-value').value) || 0;

  state.profitSettings = { type, value };
  const result = await saveProfitSettings();

  if (result.success) {
    if (result.synced) {
      showStatus('Profit settings saved successfully!', 'success');
    } else {
      showStatus('Saved locally. Server sync unavailable.', 'success');
    }
  } else {
    showStatus('Error saving profit settings', 'error');
  }
});

// ==================== WIDTH RULES ====================
async function loadWidthRules() {
  try {
    const data = await apiRequest('width-rules');
    if (data.success) {
      state.widthRules = data.data;
      renderWidthRules();
      populateWidthDropdown();
    }
  } catch (error) {
    console.error('Error loading width rules:', error);
  }
}

function renderWidthRules() {
  const list = document.getElementById('width-rule-list');
  if (!list) return;
  if (state.widthRules.length === 0) {
    list.innerHTML = '<div class="empty-state">No width rules yet</div>';
    return;
  }

  list.innerHTML = state.widthRules.map(r => `
    <div class="item-card">
      <div class="item-info">
        <div class="item-name">Width ${r.width} | ${r.sets} Sets → ${r.meters}m, ${r.lace_rolls} lace</div>
      </div>
      <div class="item-actions">
        <button class="btn btn-primary btn-sm" onclick="editWidthRule(${r.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteWidthRule(${r.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

window.editWidthRule = (id) => {
  const rule = state.widthRules.find(r => r.id === id);
  if (!rule) return;

  // Populate form
  document.getElementById('width-rule-width').value = rule.width;
  document.getElementById('width-rule-sets').value = rule.sets;
  document.getElementById('width-rule-meters').value = rule.meters;
  document.getElementById('width-rule-lace').value = rule.lace_rolls;

  // Update button and store edit state
  const submitBtn = document.querySelector('#width-rule-form button[type="submit"]');
  submitBtn.textContent = 'Update Width Rule';
  state.editMode.widthRule = id;

  // Scroll to form
  document.getElementById('width-rule-form').scrollIntoView({ behavior: 'smooth' });
};

window.cancelWidthRuleEdit = () => {
  document.getElementById('width-rule-form').reset();
  const submitBtn = document.querySelector('#width-rule-form button[type="submit"]');
  submitBtn.textContent = 'Add Width Rule';
  state.editMode.widthRule = null;
};

document.getElementById('width-rule-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const width = document.getElementById('width-rule-width').value.trim();
  const sets = parseInt(document.getElementById('width-rule-sets').value);
  const meters = parseFloat(document.getElementById('width-rule-meters').value);
  const lace_rolls = parseInt(document.getElementById('width-rule-lace').value);

  const isEditMode = state.editMode.widthRule !== null;
  const method = isEditMode ? 'PUT' : 'POST';
  const body = isEditMode
    ? { id: state.editMode.widthRule, width, sets, meters, lace_rolls }
    : { width, sets, meters, lace_rolls };

  try {
    const result = await apiRequest('width-rules', { method, body });
    if (result.success) {
      showStatus(isEditMode ? 'Width rule updated!' : 'Width rule added!', 'success');
      document.getElementById('width-rule-form').reset();
      const submitBtn = document.querySelector('#width-rule-form button[type="submit"]');
      submitBtn.textContent = 'Add Width Rule';
      state.editMode.widthRule = null;
      await loadWidthRules();
      populateWidthDropdown();
    }
  } catch (error) {
    showStatus(isEditMode ? 'Error updating width rule' : 'Error adding width rule', 'error');
  }
});

window.deleteWidthRule = async (id) => {
  if (!confirm('Delete this width rule?')) return;
  try {
    const result = await apiRequest('width-rules', { method: 'DELETE', body: { id } });
    if (result.success) {
      showStatus('Width rule deleted', 'success');
      await loadWidthRules();
    }
  } catch (error) {
    showStatus('Error deleting width rule', 'error');
  }
};

// ==================== INVOICE ====================
const widthSelect = document.getElementById('fabric-width-select');
const fabricTypeSelect = document.getElementById('fabric-type-select');
const setsInput = document.getElementById('fabric-sets-input');
const metersInput = document.getElementById('fabric-meters');

// When width is selected, load fabric types for that width
widthSelect.addEventListener('change', async () => {
  const width = widthSelect.value;
  if (!width) {
    fabricTypeSelect.disabled = true;
    fabricTypeSelect.innerHTML = '<option value="">Select width first</option>';
    setsInput.disabled = true;
    setsInput.value = '';
    metersInput.value = '';
    return;
  }

  // Load fabric types for selected width
  try {
    const data = await apiRequest('fabric-types', { searchParams: { width } });
    if (data.success) {
      const fabrics = data.data;
      if (fabrics.length === 0) {
        fabricTypeSelect.innerHTML = '<option value="">No fabrics for this width</option>';
        fabricTypeSelect.disabled = true;
      } else {
        fabricTypeSelect.innerHTML = '<option value="">Select fabric type</option>' +
          fabrics.map(f =>
            `<option value="${f.id}" data-price="${f.price_per_meter}">${f.name} - ${formatCurrency(f.price_per_meter)}/m</option>`
          ).join('');
        fabricTypeSelect.disabled = false;
      }
    }
  } catch (error) {
    console.error('Error loading fabrics for width:', error);
    showStatus('Error loading fabric types', 'error');
  }

  setsInput.disabled = false;
  setsInput.value = '';
  metersInput.value = '';
});

// Calculate meters dynamically when sets is entered
setsInput.addEventListener('input', () => {
  const width = widthSelect.value;
  const sets = parseInt(setsInput.value);

  if (!width || !sets) {
    metersInput.value = '';
    // Clear brooch and lace quantities
    document.getElementById('brooch-quantity').value = '';
    document.getElementById('lace-quantity').value = '';
    return;
  }

  // Find base rule for this width
  const baseRule = state.widthRules.find(r => r.width == width);

  if (!baseRule) {
    metersInput.value = 'Error: No rule for this width';
    document.getElementById('brooch-quantity').value = '';
    document.getElementById('lace-quantity').value = '';
    return;
  }

  // Calculate meters: (meters for base sets / base sets) * entered sets
  const metersPerSet = parseFloat(baseRule.meters) / baseRule.sets;
  const calculatedMeters = metersPerSet * sets;

  metersInput.value = calculatedMeters.toFixed(1);

  // Auto-populate brooch quantity (equals sets)
  document.getElementById('brooch-quantity').value = sets;

  // Auto-calculate lace quantity: (sets / base_sets) * base_lace_rolls
  const laceQuantity = (sets / baseRule.sets) * baseRule.lace_rolls;
  document.getElementById('lace-quantity').value = Math.round(laceQuantity);
});

// ==================== CALCULATE INVOICE BUTTON ====================
document.getElementById('calculate-invoice-btn')?.addEventListener('click', () => {
  const fabricId = fabricTypeSelect.value;
  const width = widthSelect.value;
  const sets = setsInput.value;
  const meters = metersInput.value;
  const broochId = document.getElementById('brooch-category-invoice-select').value;
  const broochQuantity = parseInt(document.getElementById('brooch-quantity').value);
  const laceId = document.getElementById('lace-category-invoice-select').value;
  const laceQuantity = parseInt(document.getElementById('lace-quantity').value);

  // Clear existing items
  state.invoiceItems = [];

  // Validate required fields
  if (!fabricId || !width || !sets || !meters || meters.includes('Error')) {
    showStatus('Please fill all fabric fields correctly', 'error');
    return;
  }

  // Add Fabric Item
  const fabricOption = fabricTypeSelect.options[fabricTypeSelect.selectedIndex];
  const fabricName = fabricOption.text.split(' - ')[0];
  const pricePerMeter = parseFloat(fabricOption.dataset.price);
  const fabricTotal = pricePerMeter * parseFloat(meters);

  state.invoiceItems.push({
    type: 'fabric',
    name: `${fabricName} (W:${width}, ${sets} sets, ${meters}m)`,
    price: pricePerMeter,
    quantity: parseFloat(meters),
    total: fabricTotal
  });

  // Add Brooch Item (if selected)
  if (broochId && broochQuantity) {
    const brooch = state.broochCategories.find(b => b.id == broochId);
    if (brooch) {
      const broochPrice = parseFloat(brooch.price);
      const broochTotal = broochPrice * broochQuantity;
      state.invoiceItems.push({
        type: 'brooch',
        name: `${brooch.name} Brooch`,
        price: broochPrice,
        quantity: broochQuantity,
        total: broochTotal
      });
    }
  }

  // Add Lace Item (if selected)
  if (laceId && laceQuantity) {
    const lace = state.laceCategories.find(l => l.id == laceId);
    if (lace) {
      const lacePrice = parseFloat(lace.price);
      const laceTotal = lacePrice * laceQuantity;
      state.invoiceItems.push({
        type: 'lace',
        name: `${lace.name} Lace`,
        price: lacePrice,
        quantity: laceQuantity,
        total: laceTotal
      });
    }
  }

  // Get number of sets for extra charges calculation
  const numberOfSets = parseInt(sets);

  // Add Extra Charges (multiple checkboxes) - MULTIPLY BY NUMBER OF SETS
  const selectedExtraCharges = document.querySelectorAll('.extra-charge-checkbox:checked');
  selectedExtraCharges.forEach(checkbox => {
    const extraPrice = parseFloat(checkbox.dataset.price);
    const extraName = checkbox.dataset.name;
    const extraTotalPrice = extraPrice * numberOfSets;
    state.invoiceItems.push({
      type: 'extra',
      name: `${extraName} (${numberOfSets} sets)`,
      price: extraPrice,
      quantity: numberOfSets,
      total: extraTotalPrice
    });
  });

  // Add Custom Charge (if checkbox is checked) - MULTIPLY BY NUMBER OF SETS
  const customChargeChecked = document.getElementById('custom-charge-checkbox').checked;
  if (customChargeChecked) {
    const customName = document.getElementById('custom-charge-name').value.trim();
    const customPrice = parseFloat(document.getElementById('custom-charge-price').value);
    const customQuantity = parseInt(document.getElementById('custom-charge-quantity').value) || 1;

    if (customName && customPrice) {
      const customTotal = customPrice * customQuantity * numberOfSets;
      state.invoiceItems.push({
        type: 'custom',
        name: `${customName} (${customQuantity} × ${numberOfSets} sets)`,
        price: customPrice,
        quantity: customQuantity * numberOfSets,
        total: customTotal
      });
    } else if (customName || customPrice) {
      showStatus('Please fill both custom charge name and price', 'error');
      return;
    }
  }

  // Store numberOfSets in state for later use (PDF generation)
  state.numberOfSets = numberOfSets;

  renderInvoiceItems(numberOfSets);
  saveInvoiceToLocalStorage();
  showStatus('Invoice calculated successfully!', 'success');
});

// ==================== CLEAR INVOICE BUTTON ====================
document.getElementById('clear-invoice-btn')?.addEventListener('click', () => {
  if (!confirm('Are you sure you want to clear all invoice data?')) return;

  // Clear form fields
  widthSelect.value = '';
  fabricTypeSelect.value = '';
  fabricTypeSelect.disabled = true;
  setsInput.value = '';
  setsInput.disabled = true;
  metersInput.value = '';
  document.getElementById('brooch-category-invoice-select').value = '';
  document.getElementById('brooch-quantity').value = '';
  document.getElementById('lace-category-invoice-select').value = '';
  document.getElementById('lace-quantity').value = '';

  // Clear extra charge checkboxes
  document.querySelectorAll('.extra-charge-checkbox').forEach(cb => cb.checked = false);

  // Clear custom charge
  document.getElementById('custom-charge-checkbox').checked = false;
  document.getElementById('custom-charge-fields').style.display = 'none';
  document.getElementById('custom-charge-name').value = '';
  document.getElementById('custom-charge-price').value = '';
  document.getElementById('custom-charge-quantity').value = '1';

  // Clear invoice items (but keep profit settings)
  state.invoiceItems = [];
  state.numberOfSets = 0;
  renderInvoiceItems();

  // Clear localStorage
  localStorage.removeItem('invoiceData');

  showStatus('Invoice form cleared', 'success');
});

// ==================== LOCALSTORAGE FUNCTIONS ====================
function saveInvoiceToLocalStorage() {
  const invoiceData = {
    width: widthSelect.value,
    fabricId: fabricTypeSelect.value,
    sets: setsInput.value,
    meters: metersInput.value,
    broochId: document.getElementById('brooch-category-invoice-select').value,
    broochQuantity: document.getElementById('brooch-quantity').value,
    laceId: document.getElementById('lace-category-invoice-select').value,
    laceQuantity: document.getElementById('lace-quantity').value,
    extraChargeId: document.getElementById('extra-charge-invoice-select').value,
    invoiceItems: state.invoiceItems,
    numberOfSets: state.numberOfSets
  };
  localStorage.setItem('invoiceData', JSON.stringify(invoiceData));
}

function loadInvoiceFromLocalStorage() {
  const saved = localStorage.getItem('invoiceData');
  if (!saved) return;

  try {
    const invoiceData = JSON.parse(saved);

    // Restore form fields
    if (invoiceData.width) {
      widthSelect.value = invoiceData.width;
      widthSelect.dispatchEvent(new Event('change'));
    }

    // Wait a bit for fabric types to load, then restore selections
    setTimeout(() => {
      if (invoiceData.fabricId) fabricTypeSelect.value = invoiceData.fabricId;
      if (invoiceData.sets) setsInput.value = invoiceData.sets;
      if (invoiceData.meters) metersInput.value = invoiceData.meters;
      if (invoiceData.broochId) document.getElementById('brooch-category-invoice-select').value = invoiceData.broochId;
      if (invoiceData.broochQuantity) document.getElementById('brooch-quantity').value = invoiceData.broochQuantity;
      if (invoiceData.laceId) document.getElementById('lace-category-invoice-select').value = invoiceData.laceId;
      if (invoiceData.laceQuantity) document.getElementById('lace-quantity').value = invoiceData.laceQuantity;
      if (invoiceData.extraChargeId) document.getElementById('extra-charge-invoice-select').value = invoiceData.extraChargeId;

      // Restore invoice items
      if (invoiceData.invoiceItems) {
        state.invoiceItems = invoiceData.invoiceItems;
        state.numberOfSets = invoiceData.numberOfSets || 0;
        renderInvoiceItems(state.numberOfSets);
      }
    }, 500);
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
}

function wireBackupControls() {
  const exportBtn = document.getElementById('export-backup-btn');
  const importInput = document.getElementById('import-backup-input');

  exportBtn?.addEventListener('click', () => {
    try {
      const payload = buildBackupPayload();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sk-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setBackupStatus('Exported backup file.');
      showStatus('Backup exported', 'success');
    } catch (error) {
      console.error('Export backup failed', error);
      setBackupStatus('Failed to export backup', 'error');
      showStatus('Failed to export backup', 'error');
    }
  });

  importInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        applyBackupData(parsed);
        setBackupStatus(`Imported backup (${file.name})`);
        showStatus('Backup imported', 'success');
      } catch (error) {
        console.error('Import backup failed', error);
        setBackupStatus('Invalid backup file', 'error');
        showStatus('Failed to import backup', 'error');
      } finally {
        importInput.value = '';
      }
    };
    reader.readAsText(file);
  });
}

// Save to localStorage on input changes
setsInput?.addEventListener('input', saveInvoiceToLocalStorage);

function renderInvoiceItems(numberOfSets = null) {
  const list = document.getElementById('invoice-items-list');
  if (state.invoiceItems.length === 0) {
    list.innerHTML = '<div class="empty-state">No items added yet</div>';
    document.getElementById('invoice-total').textContent = '₹0.00';
    document.getElementById('per-set-display').style.display = 'none';
    document.getElementById('total-sets-display').textContent = '0';
    return;
  }

  list.innerHTML = state.invoiceItems.map((item, idx) => `
    <div class="invoice-item-row">
      <div class="invoice-item-details">
        <div class="invoice-item-name">${item.name}</div>
        <div class="invoice-item-meta">Qty: ${item.quantity} × ${formatCurrency(item.price)}</div>
      </div>
      <div class="invoice-item-total">${formatCurrency(item.total)}</div>
      <button class="btn btn-danger btn-sm" onclick="removeInvoiceItem(${idx})">×</button>
    </div>
  `).join('');

  // Calculate base total (visible in invoice)
  const baseTotal = state.invoiceItems.reduce((sum, item) => sum + parseFloat(item.total), 0);

  // Calculate per-set price if number of sets is provided
  if (numberOfSets && numberOfSets > 0) {
    const perSetPrice = baseTotal / numberOfSets;

    // Get profit settings from state
    let profitAmount = 0;
    if (state.profitSettings.type === 'percentage') {
      profitAmount = (perSetPrice * state.profitSettings.value) / 100;
    } else if (state.profitSettings.type === 'fixed') {
      profitAmount = state.profitSettings.value;
    }

    // Add profit per set (hidden from invoice display)
    const perSetWithProfit = perSetPrice + profitAmount;
    const finalTotal = perSetWithProfit * numberOfSets;

    // Display calculations
    document.getElementById('total-sets-display').textContent = numberOfSets;
    document.getElementById('invoice-total').textContent = formatCurrency(finalTotal);
    document.getElementById('per-set-total').textContent = formatCurrency(perSetWithProfit);
    document.getElementById('per-set-display').style.display = 'flex';
  } else {
    // No per-set calculation
    document.getElementById('total-sets-display').textContent = '0';
    document.getElementById('per-set-display').style.display = 'none';
    document.getElementById('invoice-total').textContent = formatCurrency(baseTotal);
  }
}

window.removeInvoiceItem = (idx) => {
  state.invoiceItems.splice(idx, 1);
  // Re-render with saved numberOfSets to maintain proper display
  renderInvoiceItems(state.numberOfSets);
};

// Initialize
async function init() {
  wireBackupControls();
  // Hydrate UI from localStorage immediately so dropdowns work offline
  hydrateStateFromLocalStorage();
  renderBroochCategories();
  populateBroochCategorySelects();
  renderLaceCategories();
  populateLaceCategorySelects();
  renderFabricTypes();
  populateFabricSelect();
  renderExtraCharges();
  populateExtraChargeCheckboxes();
  renderWidthRules();
  populateWidthDropdown();
  updateProfitDisplay();
  loadInvoiceFromLocalStorage();

  await Promise.all([
    loadFabricTypes(),
    loadBroochCategories(),
    loadLaceCategories(),
    loadExtraCharges(),
    loadWidthRules()
  ]);

  // Populate width dropdown from width rules
  populateWidthDropdown();

  // Load profit settings
  loadProfitSettings();

  // Load saved invoice data from localStorage
  loadInvoiceFromLocalStorage();
}

function populateWidthDropdown() {
  // Populate invoice page width dropdown
  const widthSelectInvoice = document.getElementById('fabric-width-select');
  if (widthSelectInvoice && state.widthRules.length > 0) {
    widthSelectInvoice.innerHTML = '<option value="">Select width</option>' +
      state.widthRules.map(r => `<option value="${r.width}">Width ${r.width} (${r.sets} Sets → ${r.meters}m, ${r.lace_rolls} lace)</option>`).join('');
  }

  // Populate fabrics page width dropdown
  const widthSelectFabric = document.getElementById('fabric-width');
  if (widthSelectFabric && state.widthRules.length > 0) {
    widthSelectFabric.innerHTML = '<option value="">Select width</option>' +
      state.widthRules.map(r => `<option value="${r.width}">Width ${r.width}</option>`).join('');
  }
}

init();
