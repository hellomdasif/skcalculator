// API Configuration
const API_BASE = import.meta.env.DEV ? '/.netlify/functions' : '/api';

// State
let items = [];
let invoiceItems = []; // Array of {itemId, quantity} for selected invoice items

// DOM Elements
const addItemForm = document.getElementById('add-item-form');
const itemNameInput = document.getElementById('item-name');
const itemPriceInput = document.getElementById('item-price');
const itemsList = document.getElementById('items-list');
const itemSelect = document.getElementById('item-select');
const addToInvoiceBtn = document.getElementById('add-to-invoice-btn');
const invoiceItemsContainer = document.getElementById('invoice-items');
const totalAmountElement = document.getElementById('total-amount');
const statusMessage = document.getElementById('status-message');
const customerNameInput = document.getElementById('customer-name');
const invoiceDateInput = document.getElementById('invoice-date');
const downloadPdfBtn = document.getElementById('download-pdf-btn');

// Utility Functions
function showStatus(message, type = 'success') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type} show`;

  setTimeout(() => {
    statusMessage.classList.remove('show');
  }, 3000);
}

function formatCurrency(amount) {
  return `₹${parseFloat(amount).toFixed(2)}`;
}

// API Functions
async function fetchItems() {
  try {
    const response = await fetch(`${API_BASE}/get-items`);
    const data = await response.json();

    if (data.success) {
      items = data.items;
      renderItems();
      populateItemSelect();
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
      // Remove from invoice if present
      invoiceItems = invoiceItems.filter(item => item.itemId != id);
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

// Populate item dropdown
function populateItemSelect() {
  if (items.length === 0) {
    itemSelect.innerHTML = '<option value="">No items available</option>';
    addToInvoiceBtn.disabled = true;
    return;
  }

  itemSelect.innerHTML = '<option value="">Select an item to add</option>' +
    items.map(item =>
      `<option value="${item.id}">${escapeHtml(item.name)} - ${formatCurrency(item.price)}</option>`
    ).join('');
  addToInvoiceBtn.disabled = false;
}

// Add item to invoice
function addItemToInvoice() {
  const selectedItemId = itemSelect.value;

  if (!selectedItemId) {
    showStatus('Please select an item', 'error');
    return;
  }

  // Check if item already in invoice
  const existingItem = invoiceItems.find(item => item.itemId == selectedItemId);

  if (existingItem) {
    showStatus('Item already in invoice', 'error');
    return;
  }

  // Add item with quantity 1
  invoiceItems.push({ itemId: selectedItemId, quantity: 1 });

  renderInvoiceItems();
  itemSelect.value = ''; // Reset selection
}

// Remove item from invoice
function removeItemFromInvoice(itemId) {
  invoiceItems = invoiceItems.filter(item => item.itemId != itemId);
  renderInvoiceItems();
}

// Render invoice items
function renderInvoiceItems() {
  if (invoiceItems.length === 0) {
    invoiceItemsContainer.innerHTML = '<div class="empty-state">Add items to the invoice using the dropdown above</div>';
    calculateTotal();
    return;
  }

  invoiceItemsContainer.innerHTML = invoiceItems.map(invoiceItem => {
    const item = items.find(i => i.id == invoiceItem.itemId);
    if (!item) return '';

    const itemTotal = invoiceItem.quantity * parseFloat(item.price);

    return `
      <div class="invoice-item" data-invoice-item-id="${item.id}">
        <div class="invoice-item-name">${escapeHtml(item.name)}</div>
        <div class="invoice-item-price">${formatCurrency(item.price)}</div>
        <input
          type="number"
          class="quantity-input"
          min="1"
          step="1"
          value="${invoiceItem.quantity}"
          data-item-id="${item.id}"
          placeholder="Qty"
        >
        <div class="invoice-item-total">${formatCurrency(itemTotal)}</div>
        <button class="btn btn-remove" onclick="removeItemFromInvoice(${item.id})">Remove</button>
      </div>
    `;
  }).join('');

  // Add event listeners to quantity inputs
  document.querySelectorAll('.quantity-input').forEach(input => {
    input.addEventListener('input', handleQuantityChange);
  });

  calculateTotal();
}

// Handle quantity change
function handleQuantityChange(event) {
  const itemId = event.target.dataset.itemId;
  const quantity = parseInt(event.target.value) || 1;

  if (quantity < 1) {
    event.target.value = 1;
    return;
  }

  // Update quantity in invoiceItems
  const invoiceItem = invoiceItems.find(item => item.itemId == itemId);
  if (invoiceItem) {
    invoiceItem.quantity = quantity;
    updateItemTotal(itemId, quantity);
    calculateTotal();
  }
}

// Update individual item total
function updateItemTotal(itemId, quantity) {
  const item = items.find(i => i.id == itemId);
  if (!item) return;

  const total = quantity * parseFloat(item.price);
  const itemElement = document.querySelector(`[data-invoice-item-id="${itemId}"]`);
  if (itemElement) {
    const totalElement = itemElement.querySelector('.invoice-item-total');
    totalElement.textContent = formatCurrency(total);
  }
}

// Calculate total
function calculateTotal() {
  const total = invoiceItems.reduce((sum, invoiceItem) => {
    const item = items.find(i => i.id == invoiceItem.itemId);
    if (item) {
      return sum + (invoiceItem.quantity * parseFloat(item.price));
    }
    return sum;
  }, 0);

  totalAmountElement.textContent = formatCurrency(total);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// PDF Download Function
async function downloadInvoicePDF() {
  const customerName = customerNameInput.value.trim();
  const invoiceDate = invoiceDateInput.value;

  if (!customerName) {
    showStatus('Please enter customer name', 'error');
    return;
  }

  if (invoiceItems.length === 0) {
    showStatus('Please add items to the invoice', 'error');
    return;
  }

  try {
    // Dynamically import jsPDF
    const { jsPDF } = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm');

    const doc = new jsPDF();

    // Title
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('INVOICE', 105, 20, { align: 'center' });

    // Business Name
    doc.setFontSize(16);
    doc.text('SK Calculator', 105, 30, { align: 'center' });

    // Invoice Details
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Customer: ${customerName}`, 20, 45);
    doc.text(`Date: ${invoiceDate || new Date().toISOString().split('T')[0]}`, 20, 52);

    // Table Header
    const startY = 65;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Item', 20, startY);
    doc.text('Price', 100, startY);
    doc.text('Qty', 135, startY);
    doc.text('Total', 165, startY);

    // Draw line under header
    doc.line(20, startY + 2, 190, startY + 2);

    // Table Rows
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    let yPosition = startY + 10;

    invoiceItems.forEach((invoiceItem) => {
      const item = items.find(i => i.id == invoiceItem.itemId);
      if (item) {
        const itemTotal = invoiceItem.quantity * parseFloat(item.price);

        doc.text(item.name, 20, yPosition);
        doc.text(`₹${parseFloat(item.price).toFixed(2)}`, 100, yPosition);
        doc.text(invoiceItem.quantity.toString(), 135, yPosition);
        doc.text(`₹${itemTotal.toFixed(2)}`, 165, yPosition);

        yPosition += 8;
      }
    });

    // Total line
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 10;

    // Total Amount
    const total = invoiceItems.reduce((sum, invoiceItem) => {
      const item = items.find(i => i.id == invoiceItem.itemId);
      return item ? sum + (invoiceItem.quantity * parseFloat(item.price)) : sum;
    }, 0);

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Total:', 135, yPosition);
    doc.text(`₹${total.toFixed(2)}`, 165, yPosition);

    // Footer
    doc.setFontSize(9);
    doc.setFont(undefined, 'italic');
    doc.text('Thank you for your business!', 105, yPosition + 20, { align: 'center' });

    // Save PDF
    const fileName = `Invoice_${customerName.replace(/\s+/g, '_')}_${invoiceDate || new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    showStatus('Invoice PDF downloaded successfully!', 'success');
  } catch (error) {
    console.error('Error generating PDF:', error);
    showStatus('Error generating PDF. Check console.', 'error');
  }
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

// Set default date to today
invoiceDateInput.valueAsDate = new Date();

// Add to invoice button
addToInvoiceBtn.addEventListener('click', addItemToInvoice);

// Download PDF button
downloadPdfBtn.addEventListener('click', downloadInvoicePDF);

// Make functions globally accessible for onclick handlers
window.deleteItem = deleteItem;
window.removeItemFromInvoice = removeItemFromInvoice;

// Initialize App
async function init() {
  console.log('Initializing SK Calculator...');
  await fetchItems();
  console.log('App ready!');
}

// Start the app when DOM is ready
init();
