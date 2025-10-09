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
  // Edit state tracking
  editMode: {
    fabric: null,
    brooch: null,
    lace: null,
    extra: null,
    widthRule: null
  }
};

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
    const res = await fetch(`${API_BASE}/brooch-categories`);
    const data = await res.json();
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
    const res = await fetch(`${API_BASE}/brooch-categories`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if ((await res.json()).success) {
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
    const res = await fetch(`${API_BASE}/brooch-categories`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if ((await res.json()).success) {
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
    const res = await fetch(`${API_BASE}/lace-categories`);
    const data = await res.json();
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
    const res = await fetch(`${API_BASE}/lace-categories`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if ((await res.json()).success) {
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
    const res = await fetch(`${API_BASE}/lace-categories`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if ((await res.json()).success) {
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
    let url = `${API_BASE}/fabric-types`;
    if (width) {
      url += `?width=${width}`;
    }
    const res = await fetch(url);
    const data = await res.json();
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
    const res = await fetch(`${API_BASE}/fabric-types`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.success) {
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
    const res = await fetch(`${API_BASE}/fabric-types`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if ((await res.json()).success) {
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
    const res = await fetch(`${API_BASE}/extra-charges`);
    const data = await res.json();
    if (data.success) {
      state.extraCharges = data.data;
      renderExtraCharges();
      populateExtraChargeSelect();
    }
  } catch (error) {
    console.error('Error loading extra charges:', error);
  }
}

function populateExtraChargeSelect() {
  const select = document.getElementById('extra-charge-invoice-select');
  if (select && state.extraCharges.length > 0) {
    select.innerHTML = '<option value="">Select extra charge (optional)</option>' +
      state.extraCharges.map(e => `<option value="${e.id}" data-price="${e.price}">${e.name} - ${formatCurrency(e.price)}</option>`).join('');
  }
}

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
    const res = await fetch(`${API_BASE}/extra-charges`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if ((await res.json()).success) {
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
    const res = await fetch(`${API_BASE}/extra-charges`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if ((await res.json()).success) {
      showStatus('Extra charge deleted', 'success');
      await loadExtraCharges();
    }
  } catch (error) {
    showStatus('Error deleting extra charge', 'error');
  }
};

// ==================== WIDTH RULES ====================
async function loadWidthRules() {
  try {
    const res = await fetch(`${API_BASE}/width-rules`);
    const data = await res.json();
    if (data.success) {
      state.widthRules = data.data;
      renderWidthRules();
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
  const width = parseInt(document.getElementById('width-rule-width').value);
  const sets = parseInt(document.getElementById('width-rule-sets').value);
  const meters = parseFloat(document.getElementById('width-rule-meters').value);
  const lace_rolls = parseInt(document.getElementById('width-rule-lace').value);

  const isEditMode = state.editMode.widthRule !== null;
  const method = isEditMode ? 'PUT' : 'POST';
  const body = isEditMode
    ? { id: state.editMode.widthRule, width, sets, meters, lace_rolls }
    : { width, sets, meters, lace_rolls };

  try {
    const res = await fetch(`${API_BASE}/width-rules`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if ((await res.json()).success) {
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
    const res = await fetch(`${API_BASE}/width-rules`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if ((await res.json()).success) {
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
    const res = await fetch(`${API_BASE}/fabric-types?width=${width}`);
    const data = await res.json();
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
  const width = parseInt(widthSelect.value);
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
  const customerName = document.getElementById('customer-name').value.trim();
  const fabricId = fabricTypeSelect.value;
  const width = widthSelect.value;
  const sets = setsInput.value;
  const meters = metersInput.value;
  const broochId = document.getElementById('brooch-category-invoice-select').value;
  const broochQuantity = parseInt(document.getElementById('brooch-quantity').value);
  const laceId = document.getElementById('lace-category-invoice-select').value;
  const laceQuantity = parseInt(document.getElementById('lace-quantity').value);
  const extraChargeId = document.getElementById('extra-charge-invoice-select').value;

  // Clear existing items
  state.invoiceItems = [];

  // Validate required fields
  if (!customerName) {
    showStatus('Please enter customer name', 'error');
    return;
  }

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
      const broochTotal = brooch.price * broochQuantity;
      state.invoiceItems.push({
        type: 'brooch',
        name: `${brooch.name} Brooch`,
        price: brooch.price,
        quantity: broochQuantity,
        total: broochTotal
      });
    }
  }

  // Add Lace Item (if selected)
  if (laceId && laceQuantity) {
    const lace = state.laceCategories.find(l => l.id == laceId);
    if (lace) {
      const laceTotal = lace.price * laceQuantity;
      state.invoiceItems.push({
        type: 'lace',
        name: `${lace.name} Lace`,
        price: lace.price,
        quantity: laceQuantity,
        total: laceTotal
      });
    }
  }

  // Add Extra Charge (if selected)
  if (extraChargeId) {
    const extra = state.extraCharges.find(e => e.id == extraChargeId);
    if (extra) {
      state.invoiceItems.push({
        type: 'extra',
        name: extra.name,
        price: extra.price,
        quantity: 1,
        total: extra.price
      });
    }
  }

  renderInvoiceItems();
  saveInvoiceToLocalStorage();
  showStatus('Invoice calculated successfully!', 'success');
});

// ==================== CLEAR INVOICE BUTTON ====================
document.getElementById('clear-invoice-btn')?.addEventListener('click', () => {
  if (!confirm('Are you sure you want to clear all invoice data?')) return;

  // Clear form fields
  document.getElementById('customer-name').value = '';
  document.getElementById('invoice-date').valueAsDate = new Date();
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
  document.getElementById('extra-charge-invoice-select').value = '';

  // Clear invoice items
  state.invoiceItems = [];
  renderInvoiceItems();

  // Clear localStorage
  localStorage.removeItem('invoiceData');

  showStatus('Invoice form cleared', 'success');
});

// ==================== LOCALSTORAGE FUNCTIONS ====================
function saveInvoiceToLocalStorage() {
  const invoiceData = {
    customerName: document.getElementById('customer-name').value,
    invoiceDate: document.getElementById('invoice-date').value,
    width: widthSelect.value,
    fabricId: fabricTypeSelect.value,
    sets: setsInput.value,
    meters: metersInput.value,
    broochId: document.getElementById('brooch-category-invoice-select').value,
    broochQuantity: document.getElementById('brooch-quantity').value,
    laceId: document.getElementById('lace-category-invoice-select').value,
    laceQuantity: document.getElementById('lace-quantity').value,
    extraChargeId: document.getElementById('extra-charge-invoice-select').value,
    invoiceItems: state.invoiceItems
  };
  localStorage.setItem('invoiceData', JSON.stringify(invoiceData));
}

function loadInvoiceFromLocalStorage() {
  const saved = localStorage.getItem('invoiceData');
  if (!saved) return;

  try {
    const invoiceData = JSON.parse(saved);

    // Restore form fields
    if (invoiceData.customerName) document.getElementById('customer-name').value = invoiceData.customerName;
    if (invoiceData.invoiceDate) document.getElementById('invoice-date').value = invoiceData.invoiceDate;
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
        renderInvoiceItems();
      }
    }, 500);
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
}

// Save to localStorage on input changes
document.getElementById('customer-name')?.addEventListener('input', saveInvoiceToLocalStorage);
setsInput?.addEventListener('input', saveInvoiceToLocalStorage);

function renderInvoiceItems() {
  const list = document.getElementById('invoice-items-list');
  if (state.invoiceItems.length === 0) {
    list.innerHTML = '<div class="empty-state">No items added yet</div>';
    document.getElementById('invoice-total').textContent = '₹0.00';
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
  
  const total = state.invoiceItems.reduce((sum, item) => sum + item.total, 0);
  document.getElementById('invoice-total').textContent = formatCurrency(total);
}

window.removeInvoiceItem = (idx) => {
  state.invoiceItems.splice(idx, 1);
  renderInvoiceItems();
};

// PDF Download
document.getElementById('download-invoice-btn').addEventListener('click', async () => {
  const customerName = document.getElementById('customer-name').value.trim();
  const invoiceDate = document.getElementById('invoice-date').value;
  
  if (!customerName) {
    showStatus('Please enter customer name', 'error');
    return;
  }
  
  if (state.invoiceItems.length === 0) {
    showStatus('Please add items to invoice', 'error');
    return;
  }
  
  try {
    const { jsPDF } = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm');
    const doc = new jsPDF();
    
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('SK ENTERPRISE', 105, 20, { align: 'center' });
    
    doc.setFontSize(18);
    doc.text('INVOICE', 105, 32, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.line(20, 38, 190, 38);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Customer: ${customerName}`, 20, 48);
    doc.text(`Date: ${invoiceDate || new Date().toISOString().split('T')[0]}`, 20, 55);
    
    const startY = 70;
    doc.setFillColor(240, 240, 240);
    doc.rect(20, startY - 6, 170, 8, 'F');
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Item', 25, startY);
    doc.text('Qty', 130, startY, { align: 'center' });
    doc.text('Total', 185, startY, { align: 'right' });
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    let yPos = startY + 10;
    
    state.invoiceItems.forEach((item, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(20, yPos - 5, 170, 7, 'F');
      }
      doc.text(item.name, 25, yPos);
      doc.text(item.quantity.toString(), 130, yPos, { align: 'center' });
      doc.text(formatCurrency(item.total), 185, yPos, { align: 'right' });
      yPos += 7;
    });
    
    doc.setLineWidth(0.5);
    doc.line(20, yPos + 2, 190, yPos + 2);
    yPos += 10;
    
    const total = state.invoiceItems.reduce((sum, item) => sum + item.total, 0);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('TOTAL:', 130, yPos);
    doc.text(formatCurrency(total), 185, yPos, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    doc.text('Thank you for your business!', 105, yPos + 20, { align: 'center' });
    
    doc.save(`Invoice_${customerName.replace(/\s+/g, '_')}_${invoiceDate || new Date().toISOString().split('T')[0]}.pdf`);
    showStatus('PDF downloaded!', 'success');
  } catch (error) {
    console.error('PDF Error:', error);
    showStatus('Error generating PDF', 'error');
  }
});

// Initialize
document.getElementById('invoice-date').valueAsDate = new Date();

async function init() {
  await Promise.all([
    loadFabricTypes(),
    loadBroochCategories(),
    loadLaceCategories(),
    loadExtraCharges(),
    loadWidthRules()
  ]);

  // Populate width dropdown from width rules
  populateWidthDropdown();

  // Load saved invoice data from localStorage
  loadInvoiceFromLocalStorage();
}

function populateWidthDropdown() {
  // Populate invoice page width dropdown
  const widthSelectInvoice = document.getElementById('fabric-width-select');
  if (widthSelectInvoice && state.widthRules.length > 0) {
    widthSelectInvoice.innerHTML = '<option value="">Select width</option>' +
      state.widthRules.map(r => `<option value="${r.width}">${r.width}</option>`).join('');
  }

  // Populate fabrics page width dropdown
  const widthSelectFabric = document.getElementById('fabric-width');
  if (widthSelectFabric && state.widthRules.length > 0) {
    widthSelectFabric.innerHTML = '<option value="">Select width</option>' +
      state.widthRules.map(r => `<option value="${r.width}">${r.width}</option>`).join('');
  }
}

init();
