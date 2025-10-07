// API Configuration
const API_BASE = import.meta.env.DEV ? '/.netlify/functions' : '/api';

// Global State
const state = {
  fabricTypes: [],
  broochTypes: [],
  widthRules: [],
  widthCategories: [],
  invoiceItems: [],
  currentPage: 'invoice'
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

// ==================== WIDTH CATEGORIES ====================
async function loadWidthCategories() {
  try {
    const res = await fetch(`${API_BASE}/width-categories`);
    const data = await res.json();
    if (data.success) {
      state.widthCategories = data.data;
      populateWidthSelects();
      renderWidthCategories();
    }
  } catch (error) {
    console.error('Error loading width categories:', error);
    showStatus('Error loading width categories', 'error');
  }
}

function populateWidthSelects() {
  // Populate width select in fabric form
  const fabricWidthSelect = document.getElementById('fabric-width');
  if (fabricWidthSelect) {
    fabricWidthSelect.innerHTML = '<option value="">Select width</option>' +
      state.widthCategories.map(w =>
        `<option value="${w.width}">${w.width}</option>`
      ).join('');
  }

  // Populate width select in invoice page
  const invoiceWidthSelect = document.getElementById('fabric-width-select');
  if (invoiceWidthSelect) {
    invoiceWidthSelect.innerHTML = '<option value="">Select width</option>' +
      state.widthCategories.map(w =>
        `<option value="${w.width}">${w.width}</option>`
      ).join('');
  }

  // Populate width select in width rules form
  const widthRuleWidthSelect = document.getElementById('width-rule-width');
  if (widthRuleWidthSelect) {
    widthRuleWidthSelect.innerHTML = '<option value="">Select width</option>' +
      state.widthCategories.map(w =>
        `<option value="${w.width}">${w.width}</option>`
      ).join('');
  }
}

function renderWidthCategories() {
  const list = document.getElementById('width-category-list');
  if (state.widthCategories.length === 0) {
    list.innerHTML = '<div class="empty-state">No width categories yet</div>';
    return;
  }

  list.innerHTML = state.widthCategories.map(w => `
    <div class="item-card">
      <div class="item-info">
        <div class="item-name">Width ${w.width}</div>
      </div>
      <button class="btn btn-danger btn-sm" onclick="deleteWidthCategory(${w.id})">Delete</button>
    </div>
  `).join('');
}

document.getElementById('width-category-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const width = document.getElementById('width-category-width').value.trim();

  try {
    const res = await fetch(`${API_BASE}/width-categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ width })
    });
    if ((await res.json()).success) {
      showStatus('Width category added!', 'success');
      document.getElementById('width-category-form').reset();
      await loadWidthCategories();
      renderWidthCategories();
    }
  } catch (error) {
    showStatus('Error adding width category', 'error');
  }
});

window.deleteWidthCategory = async (id) => {
  if (!confirm('Delete this width category?')) return;
  try {
    const res = await fetch(`${API_BASE}/width-categories`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if ((await res.json()).success) {
      showStatus('Width category deleted', 'success');
      await loadWidthCategories();
      renderWidthCategories();
    }
  } catch (error) {
    showStatus('Error deleting width category', 'error');
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
      <button class="btn btn-danger btn-sm" onclick="deleteFabricType(${f.id})">Delete</button>
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

document.getElementById('fabric-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('fabric-name').value.trim();
  const price = parseFloat(document.getElementById('fabric-price').value);
  const width = document.getElementById('fabric-width').value;

  if (!width) {
    showStatus('Please select a width', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/fabric-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price_per_meter: price, width })
    });
    const data = await res.json();
    if (data.success) {
      showStatus('Fabric type added!', 'success');
      document.getElementById('fabric-form').reset();
      await loadFabricTypes();
    }
  } catch (error) {
    showStatus('Error adding fabric type', 'error');
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

// ==================== BROOCH TYPES ====================
async function loadBroochTypes() {
  try {
    const res = await fetch(`${API_BASE}/brooch-types`);
    const data = await res.json();
    if (data.success) {
      state.broochTypes = data.data;
      renderBroochTypes();
      populateBroochSelect();
    }
  } catch (error) {
    console.error('Error loading brooch types:', error);
  }
}

function renderBroochTypes() {
  const list = document.getElementById('brooch-list');
  if (state.broochTypes.length === 0) {
    list.innerHTML = '<div class="empty-state">No brooch types yet</div>';
    return;
  }
  
  list.innerHTML = state.broochTypes.map(b => `
    <div class="item-card">
      <div class="item-info">
        <div class="item-name">${b.name}</div>
        <div class="item-price">${formatCurrency(b.price)}</div>
      </div>
      <button class="btn btn-danger btn-sm" onclick="deleteBroochType(${b.id})">Delete</button>
    </div>
  `).join('');
}

function populateBroochSelect() {
  const select = document.getElementById('brooch-type-select');
  select.innerHTML = '<option value="">Select brooch type</option>' +
    state.broochTypes.map(b => 
      `<option value="${b.id}" data-price="${b.price}">${b.name} - ${formatCurrency(b.price)}</option>`
    ).join('');
}

document.getElementById('brooch-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('brooch-name').value.trim();
  const price = parseFloat(document.getElementById('brooch-price').value);
  
  try {
    const res = await fetch(`${API_BASE}/brooch-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, price })
    });
    if ((await res.json()).success) {
      showStatus('Brooch type added!', 'success');
      document.getElementById('brooch-form').reset();
      await loadBroochTypes();
    }
  } catch (error) {
    showStatus('Error adding brooch type', 'error');
  }
});

window.deleteBroochType = async (id) => {
  if (!confirm('Delete this brooch type?')) return;
  try {
    const res = await fetch(`${API_BASE}/brooch-types`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    if ((await res.json()).success) {
      showStatus('Brooch type deleted', 'success');
      await loadBroochTypes();
    }
  } catch (error) {
    showStatus('Error deleting brooch type', 'error');
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
  if (state.widthRules.length === 0) {
    list.innerHTML = '<div class="empty-state">No width rules yet</div>';
    return;
  }
  
  list.innerHTML = state.widthRules.map(r => `
    <div class="item-card">
      <div class="item-info">
        <div class="item-name">Width ${r.width} | ${r.sets} Sets</div>
        <div class="item-price">${r.meters} meters</div>
      </div>
      <button class="btn btn-danger btn-sm" onclick="deleteWidthRule(${r.id})">Delete</button>
    </div>
  `).join('');
}

document.getElementById('width-rule-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const width = parseInt(document.getElementById('width-rule-width').value);
  const sets = parseInt(document.getElementById('width-rule-sets').value);
  const meters = parseFloat(document.getElementById('width-rule-meters').value);
  
  if (sets % 2 !== 0) {
    showStatus('Sets must be even number', 'error');
    return;
  }
  
  try {
    const res = await fetch(`${API_BASE}/width-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ width, sets, meters })
    });
    if ((await res.json()).success) {
      showStatus('Width rule added!', 'success');
      document.getElementById('width-rule-form').reset();
      await loadWidthRules();
    }
  } catch (error) {
    showStatus('Error adding width rule', 'error');
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

// Other Items Management
let otherItemsCounter = 0;
const otherItemsContainer = document.getElementById('other-items-container');

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
    return;
  }

  // Validate even number
  if (sets % 2 !== 0) {
    metersInput.value = 'Error: Even numbers only';
    return;
  }

  // Find base rule for this width (should be 2 sets)
  const baseRule = state.widthRules.find(r => r.width == width && r.sets == 2);

  if (!baseRule) {
    metersInput.value = 'Error: No rule for this width';
    return;
  }

  // Calculate meters: (meters for 2 sets / 2) * entered sets
  const metersPerSet = parseFloat(baseRule.meters) / 2;
  const calculatedMeters = metersPerSet * sets;

  metersInput.value = calculatedMeters.toFixed(1);
});

document.getElementById('add-fabric-btn').addEventListener('click', async () => {
  const fabricId = fabricTypeSelect.value;
  const width = widthSelect.value;
  const sets = setsInput.value;
  const meters = metersInput.value;

  if (!fabricId || !width || !sets || !meters || meters.includes('Error')) {
    showStatus('Please fill all fabric fields correctly', 'error');
    return;
  }

  // Validate even number
  if (parseInt(sets) % 2 !== 0) {
    showStatus('Sets must be an even number', 'error');
    return;
  }

  // Fetch fabric details
  const fabricOption = fabricTypeSelect.options[fabricTypeSelect.selectedIndex];
  const fabricName = fabricOption.text.split(' - ')[0];
  const pricePerMeter = parseFloat(fabricOption.dataset.price);
  const price = pricePerMeter * parseFloat(meters);

  state.invoiceItems.push({
    type: 'fabric',
    name: `${fabricName} (W:${width}, ${sets} sets, ${meters}m)`,
    price: price,
    quantity: 1,
    total: price
  });

  renderInvoiceItems();
  showStatus('Fabric added to invoice', 'success');

  // Reset fields
  fabricTypeSelect.value = '';
  setsInput.value = '';
  metersInput.value = '';
});

document.getElementById('add-brooch-btn').addEventListener('click', () => {
  const broochId = document.getElementById('brooch-type-select').value;
  const quantity = parseInt(document.getElementById('brooch-quantity').value);
  
  if (!broochId || !quantity) {
    showStatus('Please select brooch and quantity', 'error');
    return;
  }
  
  const brooch = state.broochTypes.find(b => b.id == broochId);
  const total = brooch.price * quantity;
  
  state.invoiceItems.push({
    type: 'brooch',
    name: brooch.name,
    price: brooch.price,
    quantity: quantity,
    total: total
  });
  
  renderInvoiceItems();
  showStatus('Brooch added to invoice', 'success');
});

// ==================== OTHER ITEMS ====================
document.getElementById('add-other-item-btn').addEventListener('click', () => {
  otherItemsCounter++;
  const itemId = `other-item-${otherItemsCounter}`;

  const itemDiv = document.createElement('div');
  itemDiv.className = 'other-item-row';
  itemDiv.id = itemId;
  itemDiv.innerHTML = `
    <div class="form-row" style="gap: 8px; align-items: flex-end;">
      <div class="form-group" style="flex: 2;">
        <label>Item Name</label>
        <input type="text" class="other-item-name" placeholder="e.g., Thread, Button" required>
      </div>
      <div class="form-group" style="flex: 1;">
        <label>Price/Unit (₹)</label>
        <input type="number" class="other-item-price" placeholder="0.00" step="0.01" min="0" required>
      </div>
      <div class="form-group" style="flex: 1;">
        <label>Quantity</label>
        <input type="number" class="other-item-quantity" placeholder="1" min="1" value="1" required>
      </div>
      <button type="button" class="btn btn-success btn-sm" onclick="addOtherItemToInvoice('${itemId}')">Add</button>
      <button type="button" class="btn btn-danger btn-sm" onclick="removeOtherItemInput('${itemId}')">×</button>
    </div>
  `;

  otherItemsContainer.appendChild(itemDiv);
});

window.removeOtherItemInput = (itemId) => {
  const itemDiv = document.getElementById(itemId);
  if (itemDiv) {
    itemDiv.remove();
  }
};

window.addOtherItemToInvoice = (itemId) => {
  const itemDiv = document.getElementById(itemId);
  if (!itemDiv) return;

  const name = itemDiv.querySelector('.other-item-name').value.trim();
  const price = parseFloat(itemDiv.querySelector('.other-item-price').value);
  const quantity = parseInt(itemDiv.querySelector('.other-item-quantity').value);

  if (!name || !price || !quantity) {
    showStatus('Please fill all other item fields', 'error');
    return;
  }

  const total = price * quantity;

  state.invoiceItems.push({
    type: 'other',
    name: name,
    price: price,
    quantity: quantity,
    total: total
  });

  renderInvoiceItems();
  showStatus('Other item added to invoice', 'success');

  // Remove the input row after adding
  itemDiv.remove();
};

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
    loadWidthCategories(),
    loadFabricTypes(),
    loadBroochTypes(),
    loadWidthRules()
  ]);
}

init();
