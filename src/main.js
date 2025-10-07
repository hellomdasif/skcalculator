// API Configuration
const API_BASE = import.meta.env.DEV ? '/.netlify/functions' : '/api';

// State
let items = [];
let invoiceQuantities = {};

// DOM Elements
const addItemForm = document.getElementById('add-item-form');
const itemNameInput = document.getElementById('item-name');
const itemPriceInput = document.getElementById('item-price');
const itemsList = document.getElementById('items-list');
const invoiceItemsContainer = document.getElementById('invoice-items');
const totalAmountElement = document.getElementById('total-amount');
const statusMessage = document.getElementById('status-message');

// Utility Functions
function showStatus(message, type = 'success') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type} show`;

  setTimeout(() => {
    statusMessage.classList.remove('show');
  }, 3000);
}

function formatCurrency(amount) {
  return `$${parseFloat(amount).toFixed(2)}`;
}

// API Functions
async function fetchItems() {
  try {
    const response = await fetch(`${API_BASE}/get-items`);
    const data = await response.json();

    if (data.success) {
      items = data.items;
      renderItems();
      renderInvoiceItems();
    } else {
      showStatus('Failed to fetch items: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error fetching items:', error);
    showStatus('Error loading items. Check console.', 'error');
  }
}

async function addItem(name, price) {
  try {
    const response = await fetch(`${API_BASE}/add-item`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, price })
    });

    const data = await response.json();

    if (data.success) {
      showStatus('Item added successfully!', 'success');
      await fetchItems();
      itemNameInput.value = '';
      itemPriceInput.value = '';
      itemNameInput.focus();
    } else {
      showStatus('Failed to add item: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error adding item:', error);
    showStatus('Error adding item. Check console.', 'error');
  }
}

async function deleteItem(id) {
  if (!confirm('Are you sure you want to delete this item?')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/delete-item`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id })
    });

    const data = await response.json();

    if (data.success) {
      showStatus('Item deleted successfully!', 'success');
      delete invoiceQuantities[id]; // Remove from invoice
      await fetchItems();
    } else {
      showStatus('Failed to delete item: ' + data.error, 'error');
    }
  } catch (error) {
    console.error('Error deleting item:', error);
    showStatus('Error deleting item. Check console.', 'error');
  }
}

// Render Functions
function renderItems() {
  if (items.length === 0) {
    itemsList.innerHTML = '<div class="empty-state">No items yet. Add your first item above.</div>';
    return;
  }

  itemsList.innerHTML = items.map(item => `
    <div class="item-card">
      <div class="item-info">
        <div class="item-name">${escapeHtml(item.name)}</div>
        <div class="item-price">${formatCurrency(item.price)}</div>
      </div>
      <button class="btn btn-danger" onclick="deleteItem(${item.id})">Delete</button>
    </div>
  `).join('');
}

function renderInvoiceItems() {
  if (items.length === 0) {
    invoiceItemsContainer.innerHTML = '<div class="empty-state">No items available. Add items above first.</div>';
    return;
  }

  invoiceItemsContainer.innerHTML = items.map(item => {
    const quantity = invoiceQuantities[item.id] || 0;
    const itemTotal = quantity * parseFloat(item.price);

    return `
      <div class="invoice-item">
        <div class="invoice-item-name">${escapeHtml(item.name)}</div>
        <div class="invoice-item-price">${formatCurrency(item.price)}</div>
        <input
          type="number"
          class="quantity-input"
          min="0"
          step="1"
          value="${quantity}"
          data-item-id="${item.id}"
          placeholder="Qty"
        >
        <div class="invoice-item-total">${formatCurrency(itemTotal)}</div>
      </div>
    `;
  }).join('');

  // Add event listeners to quantity inputs
  document.querySelectorAll('.quantity-input').forEach(input => {
    input.addEventListener('input', handleQuantityChange);
  });

  calculateTotal();
}

function handleQuantityChange(event) {
  const itemId = event.target.dataset.itemId;
  const quantity = parseInt(event.target.value) || 0;

  if (quantity >= 0) {
    invoiceQuantities[itemId] = quantity;
    updateItemTotal(itemId);
    calculateTotal();
  }
}

function updateItemTotal(itemId) {
  const item = items.find(i => i.id == itemId);
  if (!item) return;

  const quantity = invoiceQuantities[itemId] || 0;
  const total = quantity * parseFloat(item.price);

  const itemElement = document.querySelector(`[data-item-id="${itemId}"]`).closest('.invoice-item');
  const totalElement = itemElement.querySelector('.invoice-item-total');
  totalElement.textContent = formatCurrency(total);
}

function calculateTotal() {
  const total = items.reduce((sum, item) => {
    const quantity = invoiceQuantities[item.id] || 0;
    return sum + (quantity * parseFloat(item.price));
  }, 0);

  totalAmountElement.textContent = formatCurrency(total);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Event Listeners
addItemForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = itemNameInput.value.trim();
  const price = parseFloat(itemPriceInput.value);

  if (!name || !price || price <= 0) {
    showStatus('Please enter valid name and price', 'error');
    return;
  }

  await addItem(name, price);
});

// Make deleteItem globally accessible for onclick handlers
window.deleteItem = deleteItem;

// Initialize App
async function init() {
  console.log('Initializing SK Calculator...');
  await fetchItems();
  console.log('App ready!');
}

// Start the app when DOM is ready
init();
