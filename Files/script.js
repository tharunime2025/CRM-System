// script.js

// --- Global Data Storage (using localStorage) ---
// All application data will be stored in localStorage.
// We'll use a single key 'posData' to store a JSON object containing all entities.

const STORAGE_KEY = 'posData';

// Default initial data structure
const defaultPOSData = {
    shop: {
        name: 'Your Shop Name',
        address: '123 Main Street, Colombo, Sri Lanka',
        tp: '077-1234567',
        dashboardLogo: 'https://placehold.co/60x60/000000/FFFFFF?text=LOGO', // Placeholder
        receiptLogo: 'https://placehold.co/80x80/000000/FFFFFF?text=LOGO' // Placeholder
    },
    inventory: [], // { id, code, name, description, price, stock, threshold }
    customers: [], // { id, name, address, tp, creditLimit, outstandingCredit }
    distributionChannels: [ // Default main channel
        { id: 'main', name: 'Main Shop', regNo: '', address: '123 Main Street, Colombo, Sri Lanka', hotline: '077-1234567', receiptLogo: 'https://placehold.co/80x80/000000/FFFFFF?text=LOGO' }
    ],
    sales: [], // { id, date, time, customer: { type, id, name, address, tp }, channelId, items: [{itemId, name, qty, price}], subtotal, discountType, discountValue, discountAmount, grandTotal, paymentMethod, paymentRef, chequeDetails }
    grns: [], // { id, date, supplier, items: [{itemId, name, qty}] }
    quotations: [], // { id, date, customerName, items: [{itemId, name, qty, price}], total }
    payments: [], // { id, date, billId, amount, method, reference, chequeDetails }
    creditBills: [], // { id, billId, customerId, totalAmount, paidAmount, dueAmount, billDate, dueDate, paymentHistory: [{date, amount, method, reference, chequeDetails}] }
    cheques: [] // { id, billId, chequeNumber, bank, amount, dueDate, status (Pending, Claimed, Released, Bounced) }
};

let posData = {}; // This will hold the current state of our POS data

// --- Utility Functions ---

/**
 * Generates a unique ID using crypto.randomUUID().
 * @returns {string} A unique ID.
 */
function generateUniqueId() {
    return crypto.randomUUID();
}

/**
 * Loads data from localStorage. If no data exists, initializes with default data.
 * @returns {object} The loaded or default POS data.
 */
function loadPOSData() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            posData = JSON.parse(data);
            // Merge with default data to ensure new fields are added if schema changes
            posData = { ...defaultPOSData, ...posData };
            // Ensure sub-arrays exist if they were empty in old data
            posData.inventory = posData.inventory || [];
            posData.customers = posData.customers || [];
            posData.distributionChannels = posData.distributionChannels || defaultPOSData.distributionChannels;
            posData.sales = posData.sales || [];
            posData.grns = posData.grns || [];
            posData.quotations = posData.quotations || [];
            posData.payments = posData.payments || [];
            posData.creditBills = posData.creditBills || [];
            posData.cheques = posData.cheques || [];
            // Migrate inventory items to include threshold if missing
            posData.inventory = posData.inventory.map(item => ({ ...item, threshold: item.threshold || 0 }));
            return posData;
        }
    } catch (e) {
        console.error("Error loading POS data from localStorage:", e);
    }
    posData = defaultPOSData; // Fallback to default if loading fails
    savePOSData(); // Save default data immediately
    return posData;
}

/**
 * Saves the current POS data to localStorage.
 */
function savePOSData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(posData));
    } catch (e) {
        console.error("Error saving POS data to localStorage:", e);
        showModal('Error', 'Failed to save data. Browser storage might be full or blocked.', 'error');
    }
}

/**
 * Formats a number as currency (LKR).
 * @param {number} amount
 * @returns {string} Formatted currency string.
 */
function formatCurrency(amount) {
    return `LKR ${parseFloat(amount).toFixed(2)}`;
}

/**
 * Formats a date object into a readable string (YYYY-MM-DD).
 * @param {Date} date
 * @returns {string} Formatted date string.
 */
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Formats a date object into a time string (HH:MM:SS).
 * @param {Date} date
 * @returns {string} Formatted time string.
 */
function formatTime(date) {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

/**
 * Converts a File object to a Base64 string.
 * @param {File} file
 * @returns {Promise<string>} A promise that resolves with the Base64 string.
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

/**
 * Shows a global modal message.
 * @param {string} title - The title of the modal.
 * @param {string} message - The message content.
 * @param {string} type - 'info', 'success', 'error', 'confirm'.
 * @param {function} onConfirm - Callback for confirm type.
 * @param {function} onCancel - Callback for confirm type.
 */
function showModal(title, message, type = 'info', onConfirm = null, onCancel = null) {
    const modalContainer = document.getElementById('global-modal-container');
    const modalContent = document.getElementById('global-modal-content');
    const modalTitle = document.getElementById('global-modal-title');
    const modalMessage = document.getElementById('global-modal-message');
    const modalActions = document.getElementById('global-modal-actions');
    const closeModalBtn = document.getElementById('global-modal-close-btn');

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modalActions.innerHTML = ''; // Clear previous actions

    // Add specific buttons based on type
    if (type === 'confirm') {
        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'Confirm';
        confirmBtn.className = 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 shadow-md';
        confirmBtn.onclick = () => {
            if (onConfirm) onConfirm();
            hideModal();
        };
        modalActions.appendChild(confirmBtn);

        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition duration-200 shadow-md';
        cancelBtn.onclick = () => {
            if (onCancel) onCancel();
            hideModal();
        };
        modalActions.appendChild(cancelBtn);
    } else {
        const okBtn = document.createElement('button');
        okBtn.textContent = 'OK';
        okBtn.className = 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 shadow-md';
        okBtn.onclick = hideModal;
        modalActions.appendChild(okBtn);
    }

    // Show modal with animation
    modalContainer.classList.remove('hidden');
    setTimeout(() => {
        modalContainer.classList.add('show');
        modalContent.classList.add('show');
    }, 10); // Small delay to trigger transition

    closeModalBtn.onclick = hideModal;
}

/**
 * Hides the global modal.
 */
function hideModal() {
    const modalContainer = document.getElementById('global-modal-container');
    const modalContent = document.getElementById('global-modal-content');

    modalContainer.classList.remove('show');
    modalContent.classList.remove('show');
    setTimeout(() => {
        modalContainer.classList.add('hidden');
    }, 300); // Match CSS transition duration
}

// --- DOM Element References ---
const navButtons = document.querySelectorAll('.nav-btn');
const mainSections = document.querySelectorAll('.main-section');

// Shop Header Elements
const shopNameHeader = document.getElementById('shop-name-header');
const shopLogoDashboardHeader = document.getElementById('shop-logo-dashboard-header');

// Settings Section Elements
const shopDetailsForm = document.getElementById('shop-details-form');
const shopNameInput = document.getElementById('shop-name');
const shopAddressInput = document.getElementById('shop-address');
const shopTpInput = document.getElementById('shop-tp');

const dashboardLogoUpload = document.getElementById('dashboard-logo-upload');
const dashboardLogoLink = document.getElementById('dashboard-logo-link');
const saveDashboardLogoBtn = document.getElementById('save-dashboard-logo');
const dashboardLogoPreview = document.getElementById('dashboard-logo-preview');

const receiptLogoUpload = document.getElementById('receipt-logo-upload');
const receiptLogoLink = document.getElementById('receipt-logo-link');
const saveReceiptLogoBtn = document.getElementById('save-receipt-logo');
const receiptLogoPreview = document.getElementById('receipt-logo-preview');

const addDistributionChannelForm = document.getElementById('add-distribution-channel-form');
const distChannelNameInput = document.getElementById('dist-channel-name');
const distChannelRegNoInput = document.getElementById('dist-channel-reg-no');
const distChannelAddressInput = document.getElementById('dist-channel-address');
const distChannelHotlineInput = document.getElementById('dist-channel-hotline');
const distChannelReceiptLogoUpload = document.getElementById('dist-channel-receipt-logo-upload');
const distChannelReceiptLogoLink = document.getElementById('dist-channel-receipt-logo-link');
const distributionChannelsList = document.getElementById('distribution-channels-list');

// Inventory Section Elements
const addInventoryItemForm = document.getElementById('add-inventory-item-form');
const itemCodeInput = document.getElementById('item-code');
const itemNameInput = document.getElementById('item-name');
const itemDescriptionInput = document.getElementById('item-description');
const itemPriceInput = document.getElementById('item-price');
const itemStockInput = document.getElementById('item-stock');
const itemthresholdInput = document.getElementById('item-threshold');
const inventoryList = document.getElementById('inventory-list');

function openInventoryModal() {
  document.getElementById("inventoryModal").style.display = "block";
}

function closeInventoryModal() {
  document.getElementById("inventoryModal").style.display = "none";
}

// Customer Section Elements
const addCustomerForm = document.getElementById('add-customer-form');
const customerRegNameInput = document.getElementById('customer-reg-name');
const customerRegAddressInput = document.getElementById('customer-reg-address');
const customerRegTpInput = document.getElementById('customer-reg-tp');
const customerCreditLimitInput = document.getElementById('customer-credit-limit');
const customerList = document.getElementById('customer-list');

function openModal() {
  document.getElementById("customerModal").style.display = "block";
}

function closeModal() {
  document.getElementById("customerModal").style.display = "none";
}

// Billing Section Elements
const customerTypeSelect = document.getElementById('customer-type');
const walkingCustomerDetails = document.getElementById('walking-customer-details');
const walkingCustomerNameInput = document.getElementById('walking-customer-name');
const walkingCustomerAddressInput = document.getElementById('walking-customer-address');
const walkingCustomerTpInput = document.getElementById('walking-customer-tp');
const registeredCustomerSelectDiv = document.getElementById('registered-customer-select');
const registeredCustomerDropdown = document.getElementById('registered-customer-dropdown');
const distributionChannelDropdown = document.getElementById('distribution-channel-dropdown');

const barcodeInput = document.getElementById('barcode-input');
const addItemByBarcodeBtn = document.getElementById('add-item-by-barcode-btn');
const keywordSearchInput = document.getElementById('keyword-search-input');
const searchItemBtn = document.getElementById('search-item-btn');
const searchResultsDiv = document.getElementById('search-results');

const manualItemCodeInput = document.getElementById('manual-item-code');
const manualItemNameInput = document.getElementById('manual-item-name');
const manualItemPriceInput = document.getElementById('manual-item-price');
const manualItemQtyInput = document.getElementById('manual-item-qty');
const addManualItemBtn = document.getElementById('add-manual-item-btn');

const cartItemsDiv = document.getElementById('cart-items');
const cartSubtotalSpan = document.getElementById('cart-subtotal');
const discountTypeSelect = document.getElementById('discount-type');
const discountValueInput = document.getElementById('discount-value');
const cartGrandtotalSpan = document.getElementById('cart-grandtotal');

const paymentMethodSelect = document.getElementById('payment-method');
const paymentReferenceContainer = document.getElementById('payment-reference-container');
const paymentReferenceInput = document.getElementById('payment-reference');
const chequeDetailsContainer = document.getElementById('cheque-details-container');
const chequeNumberInput = document.getElementById('cheque-number');
const chequeBankInput = document.getElementById('cheque-bank');
const chequeDueDateInput = document.getElementById('cheque-due-date');
const processBillBtn = document.getElementById('process-bill-btn');

// Receipt Modal Elements
const receiptModal = document.getElementById('receipt-modal');
const receiptModalContent = document.getElementById('receipt-modal-content');
const receiptModalCloseBtn = document.getElementById('receipt-modal-close-btn');
const printReceiptBtn = document.getElementById('print-receipt-btn');
const closeReceiptModalBtn = document.getElementById('close-receipt-modal-btn');
const printableReceiptDiv = document.getElementById('printable-receipt');

const receiptShopLogo = document.getElementById('receipt-shop-logo');
const receiptShopName = document.getElementById('receipt-shop-name');
const receiptShopAddress = document.getElementById('receipt-shop-address');
const receiptShopTp = document.getElementById('receipt-shop-tp');
const receiptBillId = document.getElementById('receipt-bill-id');
const receiptDate = document.getElementById('receipt-date');
const receiptTime = document.getElementById('receipt-time');
const receiptCustomerName = document.getElementById('receipt-customer-name');
const receiptCustomerTpRow = document.getElementById('receipt-customer-tp-row');
const receiptCustomerTp = document.getElementById('receipt-customer-tp');
const receiptCustomerAddressRow = document.getElementById('receipt-customer-address-row');
const receiptCustomerAddress = document.getElementById('receipt-customer-address');
const receiptItemsTableBody = document.getElementById('receipt-items');
const receiptSubtotal = document.getElementById('receipt-subtotal');
const receiptDiscount = document.getElementById('receipt-discount');
const receiptGrandtotal = document.getElementById('receipt-grandtotal');
const receiptPaymentMethod = document.getElementById('receipt-payment-method');
const receiptPaymentRefRow = document.getElementById('receipt-payment-ref-row');
const receiptPaymentRef = document.getElementById('receipt-payment-ref');

// GRN Section Elements
const createGrnForm = document.getElementById('create-grn-form');
const grnSupplierInput = document.getElementById('grn-supplier');
const grnDateInput = document.getElementById('grn-date');
const grnItemCodeInput = document.getElementById('grn-item-code');
const grnItemQtyInput = document.getElementById('grn-item-qty');
const addGrnItemBtn = document.getElementById('add-grn-item-btn');
const grnItemsListDiv = document.getElementById('grn-items-list');
const grnHistoryList = document.getElementById('grn-history-list');

function openGRNModal() {
  document.getElementById("grnModal").style.display = "block";
}

function closeGRNModal() {
  document.getElementById("grnModal").style.display = "none";
}

// Quotations Section Elements
const createQuotationForm = document.getElementById('create-quotation-form');
const quotationCustomerNameInput = document.getElementById('quotation-customer-name');
const quotationDateInput = document.getElementById('quotation-date');
const quotationItemCodeInput = document.getElementById('quotation-item-code');
const quotationItemQtyInput = document.getElementById('quotation-item-qty');
const addQuotationItemBtn = document.getElementById('add-quotation-item-btn');
const quotationItemsListDiv = document.getElementById('quotation-items-list');
const quotationHistoryList = document.getElementById('quotation-history-list');

function openQuotationModal() {
  document.getElementById("quotationModal").style.display = "block";
}

function closeQuotationModal() {
  document.getElementById("quotationModal").style.display = "none";
}

// Payments Section Elements
const paymentSearchStartDate = document.getElementById('payment-search-start-date');
const paymentSearchEndDate = document.getElementById('payment-search-end-date');
const searchPaymentsBtn = document.getElementById('search-payments-btn');
const paymentRecordsList = document.getElementById('payment-records-list');

function openPaymentModal() {
  document.getElementById("paymentModal").style.display = "block";
}

function closePaymentModal() {
  document.getElementById("paymentModal").style.display = "none";
}

// Credit Bills Section Elements
const creditBillSearchStartDate = document.getElementById('credit-bill-search-start-date');
const creditBillSearchEndDate = document.getElementById('credit-bill-search-end-date');
const searchCreditBillsBtn = document.getElementById('search-credit-bills-btn');
const creditBillsList = document.getElementById('credit-bills-list');

const editCreditBillModal = document.getElementById('edit-credit-bill-modal');
const editCreditBillModalContent = document.getElementById('edit-credit-bill-modal-content');
const editCreditBillModalCloseBtn = document.getElementById('edit-credit-bill-modal-close-btn');
const editCreditBillForm = document.getElementById('edit-credit-bill-form');
const editCreditBillId = document.getElementById('edit-credit-bill-id');
const editCreditBillCustomer = document.getElementById('edit-credit-bill-customer');
const editCreditBillTotal = document.getElementById('edit-credit-bill-total');
const editCreditBillPaid = document.getElementById('edit-credit-bill-paid');
const editCreditBillDue = document.getElementById('edit-credit-bill-due');
const editCreditBillDueDate = document.getElementById('edit-credit-bill-due-date');
const installmentAmountInput = document.getElementById('installment-amount');
const installmentMethodSelect = document.getElementById('installment-method');
const installmentReferenceContainer = document.getElementById('installment-reference-container');
const installmentReferenceInput = document.getElementById('installment-reference');
const installmentChequeDetailsContainer = document.getElementById('installment-cheque-details-container');
const installmentChequeNumberInput = document.getElementById('installment-cheque-number');
const installmentChequeBankInput = document.getElementById('installment-cheque-bank');
const installmentChequeDueDateInput = document.getElementById('installment-cheque-due-date');
const addInstallmentBtn = document.getElementById('add-installment-btn');
const saveCreditBillChangesBtn = document.getElementById('save-credit-bill-changes-btn');

function openCreditBillsModal() {
  document.getElementById("creditBillsModal").style.display = "block";
}

// Function to close the Credit Bills modal
function closeCreditBillsModal() {
  document.getElementById("creditBillsModal").style.display = "none";
}

// Cheque Tracking Section Elements
const chequeSearchStartDate = document.getElementById('cheque-search-start-date');
const chequeSearchEndDate = document.getElementById('cheque-search-end-date');
const searchChequesBtn = document.getElementById('search-cheques-btn');
const chequeList = document.getElementById('cheque-list');

// Reports Section Elements
const reportStartDateInput = document.getElementById('report-start-date');
const reportEndDateInput = document.getElementById('report-end-date');
const generateReportsBtn = document.getElementById('generate-reports-btn');
const reportSummaryDiv = document.getElementById('report-summary');
const reportTotalSalesSpan = document.getElementById('report-total-sales');
const reportTotalCreditSalesSpan = document.getElementById('report-total-credit-sales');
const reportTotalPaymentsSpan = document.getElementById('report-total-payments');
const reportTotalGrnValueSpan = document.getElementById('report-total-grn-value');
const reportCurrentInventoryValueSpan = document.getElementById('report-current-inventory-value');
const downloadSalesReportBtn = document.getElementById('download-sales-report');
const downloadInventoryReportBtn = document.getElementById('download-inventory-report');
const downloadCreditReportBtn = document.getElementById('download-credit-report');
const downloadGrnReportBtn = document.getElementById('download-grn-report');
const downloadPaymentsReportBtn = document.getElementById('download-payments-report');

// Dashboard Elements
const dashboardTodaySales = document.getElementById('dashboard-today-sales');
const dashboardInventoryCount = document.getElementById('dashboard-inventory-count');
const dashboardOutstandingCredit = document.getElementById('dashboard-outstanding-credit');
const dashboardRecentTransactions = document.getElementById('dashboard-recent-transactions');


// --- Global State Variables for Billing ---
let currentCart = []; // Stores items in the current billing cart
let currentQuotationItems = []; // Stores items for the current quotation
let currentGrnItems = []; // Stores items for the current GRN
let editingCreditBillId = null; // Stores the ID of the credit bill being edited

// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    loadPOSData();
    renderShopDetails();
    renderDistributionChannelsDropdown(); // Populate dropdown on load
    showSection('dashboard-section'); // Default to dashboard
    updateDashboard();
});

// Navigation
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        const sectionId = button.dataset.section;
        showSection(`${sectionId}-section`);
        // Update active class for navigation buttons
        navButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    });
});

// --- Section Management ---
function showSection(sectionId) {
    mainSections.forEach(section => {
        section.classList.remove('active');
        section.classList.add('hidden');
    });
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.remove('hidden');
        // Trigger reflow to ensure transition plays
        void activeSection.offsetWidth;
        activeSection.classList.add('active');

        // Call specific render functions when a section is shown
        if (sectionId === 'inventory-section') {
            renderInventory();
        } else if (sectionId === 'customers-section') {
            renderCustomers();
        } else if (sectionId === 'billing-section') {
            resetBillingForm();
            renderRegisteredCustomersDropdown();
            renderDistributionChannelsDropdown();
        } else if (sectionId === 'grn-section') {
            renderGrnHistory();
            currentGrnItems = []; // Clear GRN items when entering section
            renderGrnItemsList();
            createGrnForm.reset();
            grnDateInput.value = formatDate(new Date());
        } else if (sectionId === 'quotations-section') {
            renderQuotationHistory();
            currentQuotationItems = []; // Clear quotation items when entering section
            renderQuotationItemsList();
            createQuotationForm.reset();
            quotationDateInput.value = formatDate(new Date());
        } else if (sectionId === 'payments-section') {
            renderPaymentRecords();
            paymentSearchStartDate.value = '';
            paymentSearchEndDate.value = '';
        } else if (sectionId === 'credit-bills-section') {
            renderCreditBills();
            creditBillSearchStartDate.value = '';
            creditBillSearchEndDate.value = '';
        } else if (sectionId === 'cheque-tracking-section') {
            renderChequeTracking();
            chequeSearchStartDate.value = '';
            chequeSearchEndDate.value = '';
        } else if (sectionId === 'reports-section') {
            reportSummaryDiv.classList.add('hidden');
            reportStartDateInput.value = '';
            reportEndDateInput.value = '';
        } else if (sectionId === 'settings-section') {
            renderShopDetails();
            renderDistributionChannels();
        } else if (sectionId === 'dashboard-section') {
            updateDashboard();
        }
    }
}

// --- Shop Settings ---
function renderShopDetails() {
    shopNameInput.value = posData.shop.name;
    shopAddressInput.value = posData.shop.address;
    shopTpInput.value = posData.shop.tp;
    dashboardLogoPreview.src = posData.shop.dashboardLogo;
    receiptLogoPreview.src = posData.shop.receiptLogo;

    // Update header
    shopNameHeader.textContent = posData.shop.name;
    shopLogoDashboardHeader.src = posData.shop.dashboardLogo;
}

shopDetailsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    posData.shop.name = shopNameInput.value;
    posData.shop.address = shopAddressInput.value;
    posData.shop.tp = shopTpInput.value;
    savePOSData();
    renderShopDetails(); // Re-render to update header
    showModal('Success', 'Shop details saved successfully!');
});

saveDashboardLogoBtn.addEventListener('click', async () => {
    if (dashboardLogoUpload.files.length > 0) {
        try {
            const base64 = await fileToBase64(dashboardLogoUpload.files[0]);
            posData.shop.dashboardLogo = base64;
            savePOSData();
            renderShopDetails();
            showModal('Success', 'Dashboard logo uploaded and saved!');
        } catch (error) {
            showModal('Error', 'Failed to upload dashboard logo. Please try again.');
            console.error('Dashboard logo upload error:', error);
        }
    } else if (dashboardLogoLink.value) {
        posData.shop.dashboardLogo = dashboardLogoLink.value;
        savePOSData();
        renderShopDetails();
        showModal('Success', 'Dashboard logo link saved!');
    } else {
        showModal('Info', 'Please upload a file or paste a link for the dashboard logo.');
    }
});

saveReceiptLogoBtn.addEventListener('click', async () => {
    if (receiptLogoUpload.files.length > 0) {
        try {
            const base64 = await fileToBase64(receiptLogoUpload.files[0]);
            posData.shop.receiptLogo = base64;
            savePOSData();
            renderShopDetails();
            showModal('Success', 'Receipt logo uploaded and saved!');
        } catch (error) {
            showModal('Error', 'Failed to upload receipt logo. Please try again.');
            console.error('Receipt logo upload error:', error);
        }
    } else if (receiptLogoLink.value) {
        posData.shop.receiptLogo = receiptLogoLink.value;
        savePOSData();
        renderShopDetails();
        showModal('Success', 'Receipt logo link saved!');
    } else {
        showModal('Info', 'Please upload a file or paste a link for the receipt logo.');
    }
});

// --- Distribution Channels ---
function renderDistributionChannels() {
    distributionChannelsList.innerHTML = '';
    if (posData.distributionChannels.length === 0) {
        distributionChannelsList.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500">No distribution channels added.</td></tr>';
        return;
    }
    posData.distributionChannels.forEach(channel => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200 hover:bg-gray-50';
        row.innerHTML = `
            <td class="py-3 px-4">${channel.name}</td>
            <td class="py-3 px-4">${channel.address}</td>
            <td class="py-3 px-4">${channel.hotline}</td>
            <td class="py-3 px-4">
                <button class="text-red-600 hover:text-red-800 mr-2 delete-dist-channel-btn" data-id="${channel.id}"><i class="fas fa-trash"></i> Delete</button>
            </td>
        `;
        distributionChannelsList.appendChild(row);
    });

    document.querySelectorAll('.delete-dist-channel-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const idToDelete = e.currentTarget.dataset.id;
            showModal('Confirm Deletion', 'Are you sure you want to delete this distribution channel? This cannot be undone.', 'confirm', () => {
                deleteDistributionChannel(idToDelete);
            });
        });
    });
}

function deleteDistributionChannel(id) {
    // Prevent deleting the main shop channel
    if (id === 'main') {
        showModal('Error', 'Cannot delete the main shop channel.');
        return;
    }
    posData.distributionChannels = posData.distributionChannels.filter(channel => channel.id !== id);
    savePOSData();
    renderDistributionChannels();
    renderDistributionChannelsDropdown(); // Update dropdowns after deletion
    showModal('Success', 'Distribution channel deleted successfully!');
}

addDistributionChannelForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = distChannelNameInput.value.trim();
    const regNo = distChannelRegNoInput.value.trim();
    const address = distChannelAddressInput.value.trim();
    const hotline = distChannelHotlineInput.value.trim();
    let receiptLogo = '';

    if (distChannelReceiptLogoUpload.files.length > 0) {
        try {
            receiptLogo = await fileToBase64(distChannelReceiptLogoUpload.files[0]);
        } catch (error) {
            showModal('Error', 'Failed to upload receipt logo for channel. Please try again.');
            console.error('Channel logo upload error:', error);
            return;
        }
    } else if (distChannelReceiptLogoLink.value) {
        receiptLogo = distChannelReceiptLogoLink.value.trim();
    } else {
        receiptLogo = 'https://placehold.co/80x80/000000/FFFFFF?text=LOGO'; // Default placeholder
    }

    const newChannel = {
        id: generateUniqueId(),
        name,
        regNo,
        address,
        hotline,
        receiptLogo
    };

    posData.distributionChannels.push(newChannel);
    savePOSData();
    renderDistributionChannels();
    renderDistributionChannelsDropdown();
    addDistributionChannelForm.reset();
    showModal('Success', 'Distribution channel added successfully!');
});

function renderDistributionChannelsDropdown() {
    distributionChannelDropdown.innerHTML = '';
    posData.distributionChannels.forEach(channel => {
        const option = document.createElement('option');
        option.value = channel.id;
        option.textContent = channel.name;
        distributionChannelDropdown.appendChild(option);
    });
    // Set default to 'main' if it exists
    if (posData.distributionChannels.some(c => c.id === 'main')) {
        distributionChannelDropdown.value = 'main';
    }
}


// --- Inventory Management ---
function renderInventory() {
    inventoryList.innerHTML = '';
    if (posData.inventory.length === 0) {
        inventoryList.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">No items in inventory.</td></tr>';
        return;
    }
    posData.inventory.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200 hover:bg-gray-50';
        row.innerHTML = `
            <td class="py-3 px-4">${item.code}</td>
            <td class="py-3 px-4">${item.name}</td>
            <td class="py-3 px-4">${formatCurrency(item.price)}</td>
            <td class="py-3 px-4">${item.stock}</td>
            <td class="py-3 px-4">${item.threshold || 0}</td>
            <td class="py-3 px-4">
                <button class="text-blue-600 hover:text-blue-800 mr-2 edit-item-btn" data-id="${item.id}"><i class="fas fa-edit"></i> Edit</button>
                <button class="text-red-600 hover:text-red-800 delete-item-btn" data-id="${item.id}"><i class="fas fa-trash"></i> Delete</button>
            </td>
        `;
        inventoryList.appendChild(row);
    });

    document.querySelectorAll('.edit-item-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const itemId = e.currentTarget.dataset.id;
            editInventoryItem(itemId);
        });
    });

    document.querySelectorAll('.delete-item-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const itemId = e.currentTarget.dataset.id;
            showModal('Confirm Deletion', 'Are you sure you want to delete this item? This cannot be undone.', 'confirm', () => {
                deleteInventoryItem(itemId);
            });
        });
    });
}

addInventoryItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = itemCodeInput.value.trim();
    const name = itemNameInput.value.trim();
    const description = itemDescriptionInput.value.trim();
    const price = parseFloat(itemPriceInput.value);
    const stock = parseInt(itemStockInput.value);
    const threshold = parseInt(itemthresholdInput.value);

    if (isNaN(price) || price < 0 || isNaN(stock) || stock < 0 || isNaN(threshold) || threshold < 0) {
        showModal('Error', 'Please enter valid numbers for price, stock, and threshold.');
        return;
    }

    // Check for duplicate item code
    const existingItem = posData.inventory.find(item => item.code === code);
    if (existingItem) {
        showModal('Error', 'Item with this code already exists. Please use a unique code or edit the existing item.');
        return;
    }

    const newItem = {
        id: generateUniqueId(),
        code,
        name,
        description,
        price,
        stock,
        threshold
    };

    posData.inventory.push(newItem);
    savePOSData();
    renderInventory();
    addInventoryItemForm.reset();
    showModal('Success', 'Item added to inventory successfully!');
});

function editInventoryItem(id) {
    const item = posData.inventory.find(i => i.id === id);
    if (!item) {
        showModal('Error', 'Item not found.');
        return;
    }

    // Populate form for editing
    itemCodeInput.value = item.code;
    itemNameInput.value = item.name;
    itemDescriptionInput.value = item.description;
    itemPriceInput.value = item.price;
    itemStockInput.value = item.stock;
    itemthresholdInput.value = item.threshold || 0;

    // Change form submit to update instead of add
    addInventoryItemForm.onsubmit = (e) => {
        e.preventDefault();
        const updatedCode = itemCodeInput.value.trim();
        const updatedName = itemNameInput.value.trim();
        const updatedDescription = itemDescriptionInput.value.trim();
        const updatedPrice = parseFloat(itemPriceInput.value);
        const updatedStock = parseInt(itemStockInput.value);
        const updatedThreshold = parseInt(itemthresholdInput.value);

        if (isNaN(updatedPrice) || updatedPrice < 0 || isNaN(updatedStock) || updatedStock < 0 || isNaN(updatedThreshold) || updatedThreshold < 0) {
            showModal('Error', 'Please enter valid numbers for price, stock, and threshold.');
            return;
        }

        // Check for duplicate code if code was changed
        const codeChanged = updatedCode !== item.code;
        if (codeChanged && posData.inventory.some(i => i.code === updatedCode && i.id !== id)) {
            showModal('Error', 'Another item already uses this code. Please use a unique code.');
            return;
        }

        item.code = updatedCode;
        item.name = updatedName;
        item.description = updatedDescription;
        item.price = updatedPrice;
        item.stock = updatedStock;
        item.threshold = updatedThreshold;

        savePOSData();
        renderInventory();
        addInventoryItemForm.reset();
        addInventoryItemForm.onsubmit = (e) => addInventoryItemForm.dispatchEvent(new Event('submit')); // Reset submit handler
        showModal('Success', 'Item updated successfully!');
    };
    showModal('Info', 'Form is now in edit mode. Make changes and click "Save Item".');
}

function deleteInventoryItem(id) {
    posData.inventory = posData.inventory.filter(item => item.id !== id);
    savePOSData();
    renderInventory();
    showModal('Success', 'Item deleted successfully!');
}

// --- Customer Management ---
function renderCustomers() {
    customerList.innerHTML = '';
    if (posData.customers.length === 0) {
        customerList.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">No registered customers.</td></tr>';
        return;
    }
    posData.customers.forEach(customer => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200 hover:bg-gray-50';
        row.innerHTML = `
            <td class="py-3 px-4">${customer.id.substring(0, 8)}...</td>
            <td class="py-3 px-4">${customer.name}</td>
            <td class="py-3 px-4">${customer.address || 'N/A'}</td>
            <td class="py-3 px-4">${customer.tp || 'N/A'}</td>
            <td class="py-3 px-4">${formatCurrency(customer.creditLimit)}</td>
            <td class="py-3 px-4">
                <button class="text-blue-600 hover:text-blue-800 mr-2 edit-customer-btn" data-id="${customer.id}"><i class="fas fa-edit"></i> Edit</button>
                <button class="text-red-600 hover:text-red-800 delete-customer-btn" data-id="${customer.id}"><i class="fas fa-trash"></i> Delete</button>
            </td>
        `;
        customerList.appendChild(row);
    });

    document.querySelectorAll('.edit-customer-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const customerId = e.currentTarget.dataset.id;
            editCustomer(customerId);
        });
    });

    document.querySelectorAll('.delete-customer-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const customerId = e.currentTarget.dataset.id;
            showModal('Confirm Deletion', 'Are you sure you want to delete this customer? This cannot be undone.', 'confirm', () => {
                deleteCustomer(customerId);
            });
        });
    });
}

addCustomerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = customerRegNameInput.value.trim();
    const address = customerRegAddressInput.value.trim();
    const tp = customerRegTpInput.value.trim();
    const creditLimit = parseFloat(customerCreditLimitInput.value);

    if (isNaN(creditLimit) || creditLimit < 0) {
        showModal('Error', 'Please enter a valid credit limit.');
        return;
    }

    const newCustomer = {
        id: generateUniqueId(),
        name,
        address,
        tp,
        creditLimit,
        outstandingCredit: 0 // Initialize outstanding credit
    };

    posData.customers.push(newCustomer);
    savePOSData();
    renderCustomers();
    renderRegisteredCustomersDropdown();
    addCustomerForm.reset();
    showModal('Success', 'Customer added successfully!');
});

function editCustomer(id) {
    const customer = posData.customers.find(c => c.id === id);
    if (!customer) {
        showModal('Error', 'Customer not found.');
        return;
    }

    // Populate form for editing
    customerRegNameInput.value = customer.name;
    customerRegAddressInput.value = customer.address;
    customerRegTpInput.value = customer.tp;
    customerCreditLimitInput.value = customer.creditLimit;

    // Change form submit to update instead of add
    addCustomerForm.onsubmit = (e) => {
        e.preventDefault();
        const updatedName = customerRegNameInput.value.trim();
        const updatedAddress = customerRegAddressInput.value.trim();
        const updatedTp = customerRegTpInput.value.trim();
        const updatedCreditLimit = parseFloat(customerCreditLimitInput.value);

        if (isNaN(updatedCreditLimit) || updatedCreditLimit < 0) {
            showModal('Error', 'Please enter a valid credit limit.');
            return;
        }

        customer.name = updatedName;
        customer.address = updatedAddress;
        customer.tp = updatedTp;
        customer.creditLimit = updatedCreditLimit;

        savePOSData();
        renderCustomers();
        renderRegisteredCustomersDropdown();
        addCustomerForm.reset();
        addCustomerForm.onsubmit = (e) => addCustomerForm.dispatchEvent(new Event('submit')); // Reset submit handler
        showModal('Success', 'Customer updated successfully!');
    };
    showModal('Info', 'Form is now in edit mode. Make changes and click "Add Customer".');
}

function deleteCustomer(id) {
    // Check if customer has outstanding credit bills
    const hasOutstandingCredit = posData.creditBills.some(bill => bill.customerId === id && bill.dueAmount > 0);
    if (hasOutstandingCredit) {
        showModal('Error', 'Cannot delete customer with outstanding credit bills. Please settle all credit bills first.');
        return;
    }

    posData.customers = posData.customers.filter(customer => customer.id !== id);
    savePOSData();
    renderCustomers();
    renderRegisteredCustomersDropdown();
    showModal('Success', 'Customer deleted successfully!');
}

function renderRegisteredCustomersDropdown() {
    registeredCustomerDropdown.innerHTML = '<option value="">-- Select Customer --</option>';
    posData.customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = `${customer.name} (ID: ${customer.id.substring(0, 8)}...)`;
        registeredCustomerDropdown.appendChild(option);
    });
}

// --- Billing Section ---
customerTypeSelect.addEventListener('change', () => {
    if (customerTypeSelect.value === 'walking') {
        walkingCustomerDetails.classList.remove('hidden');
        registeredCustomerSelectDiv.classList.add('hidden');
    } else {
        walkingCustomerDetails.classList.add('hidden');
        registeredCustomerSelectDiv.classList.remove('hidden');
        renderRegisteredCustomersDropdown();
    }
});

function resetBillingForm() {
    customerTypeSelect.value = 'walking';
    walkingCustomerDetails.classList.remove('hidden');
    registeredCustomerSelectDiv.classList.add('hidden');
    walkingCustomerNameInput.value = '';
    walkingCustomerAddressInput.value = '';
    walkingCustomerTpInput.value = '';
    registeredCustomerDropdown.value = '';
    distributionChannelDropdown.value = 'main'; // Reset to main shop

    barcodeInput.value = '';
    keywordSearchInput.value = '';
    searchResultsDiv.innerHTML = '';
    searchResultsDiv.classList.add('hidden');
    manualItemCodeInput.value = '';
    manualItemNameInput.value = '';
    manualItemPriceInput.value = '';
    manualItemQtyInput.value = '1';

    currentCart = [];
    renderCart();

    discountTypeSelect.value = 'lkr';
    discountValueInput.value = '0';
    paymentMethodSelect.value = 'cash';
    paymentReferenceContainer.classList.add('hidden');
    paymentReferenceInput.value = '';
    chequeDetailsContainer.classList.add('hidden');
    chequeNumberInput.value = '';
    chequeBankInput.value = '';
    chequeDueDateInput.value = '';
}

// Add item to cart by barcode/item code
addItemByBarcodeBtn.addEventListener('click', () => {
    const code = barcodeInput.value.trim();
    if (!code) {
        showModal('Info', 'Please enter an item code or scan a barcode.');
        return;
    }
    const item = posData.inventory.find(i => i.code === code);
    if (item) {
        addItemToCart(item, 1); // Add 1 quantity by default
        barcodeInput.value = ''; // Clear input after adding
    } else {
        showModal('Error', 'Item not found in inventory.');
    }
});

// Search item by keyword
searchItemBtn.addEventListener('click', () => {
    const keyword = keywordSearchInput.value.trim().toLowerCase();
    if (!keyword) {
        searchResultsDiv.classList.add('hidden');
        return;
    }
    const results = posData.inventory.filter(item =>
        item.name.toLowerCase().includes(keyword) || item.code.toLowerCase().includes(keyword)
    );

    searchResultsDiv.innerHTML = '';
    if (results.length > 0) {
        searchResultsDiv.classList.remove('hidden');
        results.forEach(item => {
            const resultDiv = document.createElement('div');
            resultDiv.className = 'p-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0';
            resultDiv.textContent = `${item.name} (${item.code}) - ${formatCurrency(item.price)}`;
            resultDiv.dataset.itemId = item.id;
            resultDiv.addEventListener('click', () => {
                addItemToCart(item, 1);
                searchResultsDiv.classList.add('hidden');
                keywordSearchInput.value = '';
            });
            searchResultsDiv.appendChild(resultDiv);
        });
    } else {
        searchResultsDiv.classList.remove('hidden');
        searchResultsDiv.innerHTML = '<p class="p-2 text-gray-500">No items found.</p>';
    }
});

// Add manual item to cart
addManualItemBtn.addEventListener('click', () => {
    const code = manualItemCodeInput.value.trim();
    const name = manualItemNameInput.value.trim();
    const price = parseFloat(manualItemPriceInput.value);
    const qty = parseInt(manualItemQtyInput.value);

    if (!code || !name || isNaN(price) || price <= 0 || isNaN(qty) || qty <= 0) {
        showModal('Error', 'Please fill in all manual item details correctly (Code, Name, Price, Quantity).');
        return;
    }

    // Check if item exists in inventory, if so, use its details
    const existingInventoryItem = posData.inventory.find(item => item.code === code);
    let itemToAdd;
    if (existingInventoryItem) {
        itemToAdd = { ...existingInventoryItem }; // Use inventory item details
        if (qty > existingInventoryItem.stock) {
            showModal('Error', `Not enough stock for ${existingInventoryItem.name}. Available: ${existingInventoryItem.stock}`);
            return;
        }
    } else {
        // If not in inventory, treat as a temporary custom item for this bill
        itemToAdd = {
            id: generateUniqueId(), // Assign a temporary ID
            code: code,
            name: name,
            description: 'Manual entry',
            price: price,
            stock: Infinity // Assume unlimited stock for manual non-inventory items
        };
    }

    addItemToCart(itemToAdd, qty);
    manualItemCodeInput.value = '';
    manualItemNameInput.value = '';
    manualItemPriceInput.value = '';
    manualItemQtyInput.value = '1';
});

function addItemToCart(item, quantity) {
    const existingCartItemIndex = currentCart.findIndex(cartItem => cartItem.id === item.id);

    if (existingCartItemIndex > -1) {
        // Item already in cart, update quantity
        const updatedQty = currentCart[existingCartItemIndex].qty + quantity;
        const inventoryItem = posData.inventory.find(i => i.id === item.id);

        // Check stock if it's an inventory item
        if (inventoryItem && updatedQty > inventoryItem.stock) {
            showModal('Error', `Not enough stock for ${item.name}. Available: ${inventoryItem.stock}`);
            return;
        }
        currentCart[existingCartItemIndex].qty = updatedQty;
    } else {
        // New item, add to cart
        const inventoryItem = posData.inventory.find(i => i.id === item.id);
        if (inventoryItem && quantity > inventoryItem.stock) {
            showModal('Error', `Not enough stock for ${item.name}. Available: ${inventoryItem.stock}`);
            return;
        }
        currentCart.push({ ...item, qty: quantity });
    }
    renderCart();
}

function updateCartItemQuantity(itemId, newQty) {
    const cartItemIndex = currentCart.findIndex(item => item.id === itemId);
    if (cartItemIndex > -1) {
        const item = currentCart[cartItemIndex];
        const inventoryItem = posData.inventory.find(i => i.id === itemId);

        if (inventoryItem && newQty > inventoryItem.stock) {
            showModal('Error', `Not enough stock for ${item.name}. Available: ${inventoryItem.stock}`);
            // Revert to max available stock
            currentCart[cartItemIndex].qty = inventoryItem.stock;
            renderCart();
            return;
        }

        if (newQty <= 0) {
            currentCart.splice(cartItemIndex, 1); // Remove if quantity is 0 or less
        } else {
            currentCart[cartItemIndex].qty = newQty;
        }
        renderCart();
    }
}

function removeCartItem(itemId) {
    currentCart = currentCart.filter(item => item.id !== itemId);
    renderCart();
}

function renderCart() {
    cartItemsDiv.innerHTML = '';
    let subtotal = 0;

    if (currentCart.length === 0) {
        cartItemsDiv.innerHTML = '<p class="text-gray-500 text-center py-4">Cart is empty.</p>';
    } else {
        currentCart.forEach(item => {
            const itemTotal = item.price * item.qty;
            subtotal += itemTotal;

            const itemRow = document.createElement('div');
            itemRow.className = 'flex items-center justify-between p-2 border-b border-gray-100 last:border-b-0';
            itemRow.innerHTML = `
                <div class="flex-grow">
                    <p class="font-medium text-gray-800">${item.name} (${item.code})</p>
                    <p class="text-sm text-gray-600">${formatCurrency(item.price)} x</p>
                </div>
                <input type="number" value="${item.qty}" min="1" class="w-20 p-1 border border-gray-300 rounded-md text-center quantity-input" data-id="${item.id}">
                <span class="ml-4 font-semibold text-gray-800 w-24 text-right">${formatCurrency(itemTotal)}</span>
                <button class="ml-4 text-red-500 hover:text-red-700 remove-item-btn" data-id="${item.id}"><i class="fas fa-times-circle"></i></button>
            `;
            cartItemsDiv.appendChild(itemRow);
        });
    }

    cartSubtotalSpan.textContent = formatCurrency(subtotal);
    calculateGrandTotal(subtotal);

    // Add event listeners for quantity changes and removal
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const itemId = e.target.dataset.id;
            const newQty = parseInt(e.target.value);
            updateCartItemQuantity(itemId, newQty);
        });
    });
    document.querySelectorAll('.remove-item-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const itemId = e.target.dataset.id;
            removeCartItem(itemId);
        });
    });
}

discountTypeSelect.addEventListener('change', () => calculateGrandTotal());
discountValueInput.addEventListener('input', () => calculateGrandTotal());

function calculateGrandTotal(currentSubtotal = null) {
    const subtotal = currentSubtotal !== null ? currentSubtotal : parseFloat(cartSubtotalSpan.textContent.replace('LKR ', ''));
    let discountAmount = 0;
    const discountValue = parseFloat(discountValueInput.value);

    if (isNaN(discountValue) || discountValue < 0) {
        discountValueInput.value = 0;
        calculateGrandTotal(subtotal); // Recalculate with 0 discount
        return;
    }

    if (discountTypeSelect.value === 'lkr') {
        discountAmount = discountValue;
    } else { // percentage
        discountAmount = (subtotal * discountValue) / 100;
    }

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    const grandTotal = subtotal - discountAmount;
    cartGrandtotalSpan.textContent = formatCurrency(grandTotal);
}

paymentMethodSelect.addEventListener('change', () => {
    const selectedMethod = paymentMethodSelect.value;
    paymentReferenceContainer.classList.add('hidden');
    chequeDetailsContainer.classList.add('hidden');

    if (selectedMethod !== 'cash' && selectedMethod !== 'credit') {
        paymentReferenceContainer.classList.remove('hidden');
    }
    if (selectedMethod === 'cheque') {
        chequeDetailsContainer.classList.remove('hidden');
    }
});

processBillBtn.addEventListener('click', () => {
    if (currentCart.length === 0) {
        showModal('Error', 'Cart is empty. Please add items to proceed.');
        return;
    }

    const grandTotal = parseFloat(cartGrandtotalSpan.textContent.replace('LKR ', ''));
    const paymentMethod = paymentMethodSelect.value;
    const paymentRef = paymentReferenceInput.value.trim();
    const customerType = customerTypeSelect.value;
    let customerDetails = {};
    let selectedCustomer = null;

    if (customerType === 'walking') {
        customerDetails = {
            type: 'walking',
            id: generateUniqueId(), // Temporary ID for walking customer
            name: walkingCustomerNameInput.value.trim() || 'Walking Customer',
            address: walkingCustomerAddressInput.value.trim(),
            tp: walkingCustomerTpInput.value.trim()
        };
    } else { // registered customer
        const customerId = registeredCustomerDropdown.value;
        if (!customerId) {
            showModal('Error', 'Please select a registered customer.');
            return;
        }
        selectedCustomer = posData.customers.find(c => c.id === customerId);
        if (!selectedCustomer) {
            showModal('Error', 'Selected registered customer not found.');
            return;
        }
        customerDetails = {
            type: 'registered',
            id: selectedCustomer.id,
            name: selectedCustomer.name,
            address: selectedCustomer.address,
            tp: selectedCustomer.tp
        };
    }

    // Handle credit billing
    if (paymentMethod === 'credit') {
        if (customerType === 'walking') {
            showModal('Error', 'Credit billing is only available for registered customers.');
            return;
        }
        if (selectedCustomer.outstandingCredit + grandTotal > selectedCustomer.creditLimit) {
            showModal('Error', `Credit limit exceeded for ${selectedCustomer.name}. Outstanding: ${formatCurrency(selectedCustomer.outstandingCredit)}, Limit: ${formatCurrency(selectedCustomer.creditLimit)}`);
            return;
        }
    }

    let chequeDetails = null;
    if (paymentMethod === 'cheque') {
        const chequeNumber = chequeNumberInput.value.trim();
        const chequeBank = chequeBankInput.value.trim();
        const chequeDueDate = chequeDueDateInput.value;
        if (!chequeNumber || !chequeBank || !chequeDueDate) {
            showModal('Error', 'Please provide all cheque details (Number, Bank, Due Date).');
            return;
        }
        chequeDetails = {
            number: chequeNumber,
            bank: chequeBank,
            dueDate: chequeDueDate
        };
    }

    const billId = `BILL-${Date.now()}`;
    const now = new Date();

    const newSale = {
        id: billId,
        date: formatDate(now),
        time: formatTime(now),
        customer: customerDetails,
        channelId: distributionChannelDropdown.value,
        items: JSON.parse(JSON.stringify(currentCart)), // Deep copy cart items
        subtotal: parseFloat(cartSubtotalSpan.textContent.replace('LKR ', '')),
        discountType: discountTypeSelect.value,
        discountValue: parseFloat(discountValueInput.value),
        discountAmount: parseFloat(cartSubtotalSpan.textContent.replace('LKR ', '')) - grandTotal, // Calculate actual discount amount
        grandTotal: grandTotal,
        paymentMethod: paymentMethod,
        paymentRef: paymentRef,
        chequeDetails: chequeDetails || null
    };

    posData.sales.push(newSale);

    // Update inventory for sold items
    currentCart.forEach(cartItem => {
        const inventoryItem = posData.inventory.find(i => i.id === cartItem.id);
        if (inventoryItem) {
            inventoryItem.stock -= cartItem.qty;
        }
    });

    // Record payment
    const newPayment = {
        id: generateUniqueId(),
        date: formatDate(now),
        billId: newSale.id,
        amount: grandTotal,
        method: paymentMethod,
        reference: paymentRef,
        chequeDetails: chequeDetails || null
    };
    posData.payments.push(newPayment);

    // Handle credit bill creation and customer outstanding credit update
    if (paymentMethod === 'credit') {
        const newCreditBill = {
            id: generateUniqueId(),
            billId: newSale.id,
            customerId: selectedCustomer.id,
            totalAmount: grandTotal,
            paidAmount: 0,
            dueAmount: grandTotal,
            billDate: formatDate(now),
            dueDate: '', // Will be set later or by customer
            paymentHistory: []
        };
        posData.creditBills.push(newCreditBill);
        selectedCustomer.outstandingCredit += grandTotal;
    }

    // Handle cheque tracking
    if (paymentMethod === 'cheque' && chequeDetails) {
        posData.cheques.push({
            id: generateUniqueId(),
            billId: newSale.id,
            chequeNumber: chequeDetails.number,
            bank: chequeDetails.bank,
            amount: grandTotal,
            dueDate: chequeDetails.dueDate,
            status: 'Pending' // Initial status
        });
    }

    savePOSData();
    showReceiptModal(newSale);
    resetBillingForm(); // Clear the form after successful billing
    updateDashboard(); // Update dashboard after sale
});

// --- Receipt Modal ---
function showReceiptModal(sale) {
    // Populate receipt details
    const selectedChannel = posData.distributionChannels.find(c => c.id === sale.channelId);
    receiptShopLogo.src = selectedChannel ? selectedChannel.receiptLogo : posData.shop.receiptLogo;
    receiptShopName.textContent = selectedChannel ? selectedChannel.name : posData.shop.name;
    receiptShopAddress.textContent = selectedChannel ? selectedChannel.address : posData.shop.address;
    receiptShopTp.textContent = selectedChannel ? selectedChannel.hotline : posData.shop.tp;

    receiptBillId.textContent = sale.id;
    receiptDate.textContent = sale.date;
    receiptTime.textContent = sale.time;
    receiptCustomerName.textContent = sale.customer.name;

    if (sale.customer.tp) {
        receiptCustomerTpRow.classList.remove('hidden');
        receiptCustomerTp.textContent = sale.customer.tp;
    } else {
        receiptCustomerTpRow.classList.add('hidden');
    }
    if (sale.customer.address) {
        receiptCustomerAddressRow.classList.remove('hidden');
        receiptCustomerAddress.textContent = sale.customer.address;
    } else {
        receiptCustomerAddressRow.classList.add('hidden');
    }

    receiptItemsTableBody.innerHTML = '';
    sale.items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td class="text-right">${item.qty}</td>
            <td class="text-right">${formatCurrency(item.price)}</td>
            <td class="text-right">${formatCurrency(item.qty * item.price)}</td>
        `;
        receiptItemsTableBody.appendChild(row);
    });

    receiptSubtotal.textContent = formatCurrency(sale.subtotal);
    receiptDiscount.textContent = formatCurrency(sale.discountAmount);
    receiptGrandtotal.textContent = formatCurrency(sale.grandTotal);
    receiptPaymentMethod.textContent = sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1);
    if (sale.paymentRef) {
        receiptPaymentRefRow.classList.remove('hidden');
        receiptPaymentRef.textContent = sale.paymentRef;
    } else {
        receiptPaymentRefRow.classList.add('hidden');
    }

    receiptModal.classList.remove('hidden');
    setTimeout(() => {
        receiptModal.classList.add('show');
        receiptModalContent.classList.add('show');
    }, 10);
}

receiptModalCloseBtn.addEventListener('click', hideReceiptModal);
closeReceiptModalBtn.addEventListener('click', hideReceiptModal);

function hideReceiptModal() {
    receiptModal.classList.remove('show');
    receiptModalContent.classList.remove('show');
    setTimeout(() => {
        receiptModal.classList.add('hidden');
    }, 300);
}

printReceiptBtn.addEventListener('click', () => {
    window.print();
});

// --- GRN Process ---
addGrnItemBtn.addEventListener('click', () => {
    const itemCode = grnItemCodeInput.value.trim();
    const itemQty = parseInt(grnItemQtyInput.value);

    if (!itemCode || isNaN(itemQty) || itemQty <= 0) {
        showModal('Error', 'Please enter a valid item code and quantity for GRN.');
        return;
    }

    const inventoryItem = posData.inventory.find(item => item.code === itemCode);
    if (!inventoryItem) {
        showModal('Error', 'Item not found in inventory. Please add it first.');
        return;
    }

    const existingGrnItemIndex = currentGrnItems.findIndex(item => item.id === inventoryItem.id);
    if (existingGrnItemIndex > -1) {
        currentGrnItems[existingGrnItemIndex].qty += itemQty;
    } else {
        currentGrnItems.push({
            id: inventoryItem.id,
            code: inventoryItem.code,
            name: inventoryItem.name,
            qty: itemQty
        });
    }
    renderGrnItemsList();
    grnItemCodeInput.value = '';
    grnItemQtyInput.value = '1';
});

function renderGrnItemsList() {
    grnItemsListDiv.innerHTML = '';
    if (currentGrnItems.length === 0) {
        grnItemsListDiv.innerHTML = '<p class="text-gray-500 text-center py-4">No items added to GRN.</p>';
        return;
    }
    currentGrnItems.forEach(item => {
        const itemRow = document.createElement('div');
        itemRow.className = 'flex items-center justify-between p-2 border-b border-gray-100 last:border-b-0';
        itemRow.innerHTML = `
            <p class="font-medium text-gray-800">${item.name} (${item.code})</p>
            <span class="font-semibold text-gray-800">Qty: ${item.qty}</span>
            <button class="ml-4 text-red-500 hover:text-red-700 remove-grn-item-btn" data-id="${item.id}"><i class="fas fa-times-circle"></i></button>
        `;
        grnItemsListDiv.appendChild(itemRow);
    });

    document.querySelectorAll('.remove-grn-item-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const itemId = e.target.dataset.id;
            currentGrnItems = currentGrnItems.filter(item => item.id !== itemId);
            renderGrnItemsList();
        });
    });
}

createGrnForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const supplier = grnSupplierInput.value.trim();
    const grnDate = grnDateInput.value;

    if (!supplier || !grnDate || currentGrnItems.length === 0) {
        showModal('Error', 'Please fill in supplier, date, and add at least one item to the GRN.');
        return;
    }

    const grnId = `GRN-${Date.now()}`;
    const newGrn = {
        id: grnId,
        date: grnDate,
        supplier: supplier,
        items: JSON.parse(JSON.stringify(currentGrnItems)) // Deep copy
    };

    posData.grns.push(newGrn);

    // Update inventory stock
    newGrn.items.forEach(grnItem => {
        const inventoryItem = posData.inventory.find(item => item.id === grnItem.id);
        if (inventoryItem) {
            inventoryItem.stock += grnItem.qty;
        }
    });

    savePOSData();
    renderGrnHistory();
    currentGrnItems = [];
    renderGrnItemsList();
    createGrnForm.reset();
    grnDateInput.value = formatDate(new Date());
    showModal('Success', `GRN ${grnId} processed and inventory updated!`);
});

function renderGrnHistory(filteredGrns = posData.grns) {
    grnHistoryList.innerHTML = '';
    if (filteredGrns.length === 0) {
        grnHistoryList.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No GRN records.</td></tr>';
        return;
    }
    filteredGrns.forEach(grn => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200 hover:bg-gray-50';
        const itemsSummary = grn.items.map(item => `${item.name} (x${item.qty})`).join(', ');
        row.innerHTML = `
            <td class="py-3 px-4">${grn.id}</td>
            <td class="py-3 px-4">${grn.date}</td>
            <td class="py-3 px-4">${grn.supplier}</td>
            <td class="py-3 px-4">${itemsSummary}</td>
            <td class="py-3 px-4">
                <button class="text-blue-600 hover:text-blue-800 mr-2 print-grn-btn" data-id="${grn.id}"><i class="fas fa-print"></i> Print</button>
                <button class="text-red-600 hover:text-red-800 delete-grn-btn" data-id="${grn.id}"><i class="fas fa-trash"></i> Delete</button>
            </td>
        `;
        grnHistoryList.appendChild(row);
    });

    document.querySelectorAll('.print-grn-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const grnId = e.currentTarget.dataset.id;
            printGrn(grnId);
        });
    });

    document.querySelectorAll('.delete-grn-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const grnId = e.currentTarget.dataset.id;
            showModal('Confirm Deletion', 'Are you sure you want to delete this GRN? This will NOT revert inventory changes.', 'confirm', () => {
                deleteGrn(grnId);
            });
        });
    });
}

function deleteGrn(id) {
    posData.grns = posData.grns.filter(grn => grn.id !== id);
    savePOSData();
    renderGrnHistory();
    showModal('Success', 'GRN deleted successfully (inventory not reverted).');
}

function printGrn(grnId) {
    const grn = posData.grns.find(g => g.id === grnId);
    if (!grn) {
        showModal('Error', 'GRN not found for printing.');
        return;
    }

    let printContent = `
        <div style="font-family: 'Inter', sans-serif; font-size: 10px; width: 80mm; padding: 5mm; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 10px;">
                <img src="${posData.shop.receiptLogo}" alt="Shop Logo" style="height: 60px; width: 60px; object-fit: contain; margin: 0 auto 5px; background-color: white; padding: 2px;">
                <h4 style="font-size: 14px; font-weight: bold; margin: 0;">${posData.shop.name}</h4>
                <p style="font-size: 10px; margin: 0;">${posData.shop.address}</p>
                <p style="font-size: 10px; margin: 0;">TP: ${posData.shop.tp}</p>
            </div>
            <div style="border-top: 1px dashed #aaa; margin: 10px 0;"></div>
            <div style="margin-bottom: 10px;">
                <p style="margin: 2px 0;"><strong>GRN ID:</strong> ${grn.id}</p>
                <p style="margin: 2px 0;"><strong>Date:</strong> ${grn.date}</p>
                <p style="margin: 2px 0;"><strong>Supplier:</strong> ${grn.supplier}</p>
            </div>
            <div style="border-top: 1px dashed #aaa; margin: 10px 0;"></div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                <thead>
                    <tr>
                        <th style="text-align: left; padding: 3px 0;">Item</th>
                        <th style="text-align: right; padding: 3px 0;">Qty</th>
                    </tr>
                </thead>
                <tbody>
    `;
    grn.items.forEach(item => {
        printContent += `
            <tr>
                <td style="text-align: left; padding: 3px 0;">${item.name} (${item.code})</td>
                <td style="text-align: right; padding: 3px 0;">${item.qty}</td>
            </tr>
        `;
    });
    printContent += `
                </tbody>
            </table>
            <div style="border-top: 1px dashed #aaa; margin: 10px 0;"></div>
            <div style="text-align: center; color: #666;">
                <p>Goods Received Note</p>
                <p>Thank you!</p>
            </div>
        </div>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Print GRN</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('@media print { body { margin: 0; } }');
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

// --- Quotations ---
addQuotationItemBtn.addEventListener('click', () => {
    const itemCode = quotationItemCodeInput.value.trim();
    const itemQty = parseInt(quotationItemQtyInput.value);

    if (!itemCode || isNaN(itemQty) || itemQty <= 0) {
        showModal('Error', 'Please enter a valid item code and quantity for quotation.');
        return;
    }

    const inventoryItem = posData.inventory.find(item => item.code === itemCode);
    if (!inventoryItem) {
        showModal('Error', 'Item not found in inventory. Please add it first.');
        return;
    }

    const existingQuotationItemIndex = currentQuotationItems.findIndex(item => item.id === inventoryItem.id);
    if (existingQuotationItemIndex > -1) {
        currentQuotationItems[existingQuotationItemIndex].qty += itemQty;
    } else {
        currentQuotationItems.push({
            id: inventoryItem.id,
            code: inventoryItem.code,
            name: inventoryItem.name,
            price: inventoryItem.price,
            qty: itemQty
        });
    }
    renderQuotationItemsList();
    quotationItemCodeInput.value = '';
    quotationItemQtyInput.value = '1';
});

function renderQuotationItemsList() {
    quotationItemsListDiv.innerHTML = '';
    if (currentQuotationItems.length === 0) {
        quotationItemsListDiv.innerHTML = '<p class="text-gray-500 text-center py-4">No items added to quotation.</p>';
        return;
    }
    let totalQuotationAmount = 0;
    currentQuotationItems.forEach(item => {
        const itemTotal = item.price * item.qty;
        totalQuotationAmount += itemTotal;
        const itemRow = document.createElement('div');
        itemRow.className = 'flex items-center justify-between p-2 border-b border-gray-100 last:border-b-0';
        itemRow.innerHTML = `
            <p class="font-medium text-gray-800">${item.name} (${item.code})</p>
            <span class="font-semibold text-gray-800">Qty: ${item.qty}</span>
            <span class="font-semibold text-gray-800">${formatCurrency(itemTotal)}</span>
            <button class="ml-4 text-red-500 hover:text-red-700 remove-quotation-item-btn" data-id="${item.id}"><i class="fas fa-times-circle"></i></button>
        `;
        quotationItemsListDiv.appendChild(itemRow);
    });

    // Display total (optional, but good for UX)
    const totalRow = document.createElement('div');
    totalRow.className = 'flex items-center justify-between p-2 font-bold text-lg border-t mt-2';
    totalRow.innerHTML = `<span>Total:</span><span>${formatCurrency(totalQuotationAmount)}</span>`;
    quotationItemsListDiv.appendChild(totalRow);

    document.querySelectorAll('.remove-quotation-item-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const itemId = e.target.dataset.id;
            currentQuotationItems = currentQuotationItems.filter(item => item.id !== itemId);
            renderQuotationItemsList();
        });
    });
}

createQuotationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const customerName = quotationCustomerNameInput.value.trim();
    const quotationDate = quotationDateInput.value;

    if (!customerName || !quotationDate || currentQuotationItems.length === 0) {
        showModal('Error', 'Please fill in customer name, date, and add at least one item to the quotation.');
        return;
    }

    const quotationId = `Q-${Date.now()}`;
    const totalAmount = currentQuotationItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const newQuotation = {
        id: quotationId,
        date: quotationDate,
        customerName: customerName,
        items: JSON.parse(JSON.stringify(currentQuotationItems)), // Deep copy
        total: totalAmount
    };

    posData.quotations.push(newQuotation);
    savePOSData();
    renderQuotationHistory();
    currentQuotationItems = [];
    renderQuotationItemsList();
    createQuotationForm.reset();
    quotationDateInput.value = formatDate(new Date());
    showModal('Success', `Quotation ${quotationId} generated!`);
});

function renderQuotationHistory(filteredQuotations = posData.quotations) {
    quotationHistoryList.innerHTML = '';
    if (filteredQuotations.length === 0) {
        quotationHistoryList.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">No quotation records.</td></tr>';
        return;
    }
    filteredQuotations.forEach(quotation => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200 hover:bg-gray-50';
        const itemsSummary = quotation.items.map(item => `${item.name} (x${item.qty})`).join(', ');
        row.innerHTML = `
            <td class="py-3 px-4">${quotation.id}</td>
            <td class="py-3 px-4">${quotation.date}</td>
            <td class="py-3 px-4">${quotation.customerName}</td>
            <td class="py-3 px-4">${itemsSummary}</td>
            <td class="py-3 px-4">${formatCurrency(quotation.total)}</td>
            <td class="py-3 px-4">
                <button class="text-blue-600 hover:text-blue-800 mr-2 print-quotation-btn" data-id="${quotation.id}"><i class="fas fa-print"></i> Print</button>
                <button class="text-red-600 hover:text-red-800 delete-quotation-btn" data-id="${quotation.id}"><i class="fas fa-trash"></i> Delete</button>
            </td>
        `;
        quotationHistoryList.appendChild(row);
    });

    document.querySelectorAll('.print-quotation-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const quotationId = e.currentTarget.dataset.id;
            printQuotation(quotationId);
        });
    });

    document.querySelectorAll('.delete-quotation-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const quotationId = e.currentTarget.dataset.id;
            showModal('Confirm Deletion', 'Are you sure you want to delete this quotation?', 'confirm', () => {
                deleteQuotation(quotationId);
            });
        });
    });
}

function deleteQuotation(id) {
    posData.quotations = posData.quotations.filter(q => q.id !== id);
    savePOSData();
    renderQuotationHistory();
    showModal('Success', 'Quotation deleted successfully!');
}

function printQuotation(quotationId) {
    const quotation = posData.quotations.find(q => q.id === quotationId);
    if (!quotation) {
        showModal('Error', 'Quotation not found for printing.');
        return;
    }

    let printContent = `
        <div style="font-family: 'Inter', sans-serif; font-size: 10px; width: 80mm; padding: 5mm; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 10px;">
                <img src="${posData.shop.receiptLogo}" alt="Shop Logo" style="height: 60px; width: 60px; object-fit: contain; margin: 0 auto 5px; background-color: white; padding: 2px;">
                <h4 style="font-size: 14px; font-weight: bold; margin: 0;">${posData.shop.name}</h4>
                <p style="font-size: 10px; margin: 0;">${posData.shop.address}</p>
                <p style="font-size: 10px; margin: 0;">TP: ${posData.shop.tp}</p>
            </div>
            <div style="border-top: 1px dashed #aaa; margin: 10px 0;"></div>
            <div style="margin-bottom: 10px;">
                <p style="margin: 2px 0;"><strong>Quotation ID:</strong> ${quotation.id}</p>
                <p style="margin: 2px 0;"><strong>Date:</strong> ${quotation.date}</p>
                <p style="margin: 2px 0;"><strong>Customer:</strong> ${quotation.customerName}</p>
            </div>
            <div style="border-top: 1px dashed #aaa; margin: 10px 0;"></div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                <thead>
                    <tr>
                        <th style="text-align: left; padding: 3px 0;">Item</th>
                        <th style="text-align: right; padding: 3px 0;">Qty</th>
                        <th style="text-align: right; padding: 3px 0;">Price</th>
                        <th style="text-align: right; padding: 3px 0;">Total</th>
                    </tr>
                </thead>
                <tbody>
    `;
    quotation.items.forEach(item => {
        printContent += `
            <tr>
                <td style="text-align: left; padding: 3px 0;">${item.name} (${item.code})</td>
                <td style="text-align: right; padding: 3px 0;">${item.qty}</td>
                <td style="text-align: right; padding: 3px 0;">${formatCurrency(item.price)}</td>
                <td style="text-align: right; padding: 3px 0;">${formatCurrency(item.qty * item.price)}</td>
            </tr>
        `;
    });
    printContent += `
                </tbody>
            </table>
            <div style="border-top: 1px dashed #aaa; margin: 10px 0;"></div>
            <div style="text-align: right; margin-bottom: 10px;">
                <p style="font-weight: bold;">Grand Total: ${formatCurrency(quotation.total)}</p>
            </div>
            <div style="border-top: 1px dashed #aaa; margin: 10px 0;"></div>
            <div style="text-align: center; color: #666;">
                <p>Quotation</p>
                <p>Valid for 30 days. Prices are subject to change.</p>
            </div>
        </div>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Print Quotation</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('@media print { body { margin: 0; } }');
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

// --- Payment Records ---
searchPaymentsBtn.addEventListener('click', () => {
    const startDate = paymentSearchStartDate.value;
    const endDate = paymentSearchEndDate.value;
    let filteredPayments = posData.payments;

    if (startDate && endDate) {
        filteredPayments = posData.payments.filter(payment => {
            const paymentDate = new Date(payment.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1); // Include end date
            return paymentDate >= start && paymentDate < end;
        });
    }
    renderPaymentRecords(filteredPayments);
});

function renderPaymentRecords(filteredPayments = posData.payments) {
    paymentRecordsList.innerHTML = '';
    if (filteredPayments.length === 0) {
        paymentRecordsList.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">No payment records.</td></tr>';
        return;
    }
    filteredPayments.forEach(payment => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200 hover:bg-gray-50';
        row.innerHTML = `
            <td class="py-3 px-4">${payment.id.substring(0, 8)}...</td>
            <td class="py-3 px-4">${payment.date}</td>
            <td class="py-3 px-4">${payment.billId}</td>
            <td class="py-3 px-4">${formatCurrency(payment.amount)}</td>
            <td class="py-3 px-4">${payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}</td>
            <td class="py-3 px-4">${payment.reference || (payment.chequeDetails ? payment.chequeDetails.number : 'N/A')}</td>
            <td class="py-3 px-4">
                <button class="text-blue-600 hover:text-blue-800 mr-2 print-payment-btn" data-id="${payment.id}"><i class="fas fa-print"></i> Print</button>
                <button class="text-red-600 hover:text-red-800 delete-payment-btn" data-id="${payment.id}"><i class="fas fa-trash"></i> Delete</button>
            </td>
        `;
        paymentRecordsList.appendChild(row);
    });

    document.querySelectorAll('.print-payment-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const paymentId = e.currentTarget.dataset.id;
            printPaymentReceipt(paymentId);
        });
    });

    document.querySelectorAll('.delete-payment-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const paymentId = e.currentTarget.dataset.id;
            showModal('Confirm Deletion', 'Are you sure you want to delete this payment record? This will NOT revert credit bill payments.', 'confirm', () => {
                deletePaymentRecord(paymentId);
            });
        });
    });
}

function deletePaymentRecord(id) {
    posData.payments = posData.payments.filter(p => p.id !== id);
    savePOSData();
    renderPaymentRecords();
    showModal('Success', 'Payment record deleted successfully (credit bills not reverted).');
}

function printPaymentReceipt(paymentId) {
    const payment = posData.payments.find(p => p.id === paymentId);
    if (!payment) {
        showModal('Error', 'Payment record not found for printing.');
        return;
    }
    const sale = posData.sales.find(s => s.id === payment.billId);
    let customerName = 'N/A';
    if (sale) {
        customerName = sale.customer.name;
    }

    let printContent = `
        <div style="font-family: 'Inter', sans-serif; font-size: 10px; width: 80mm; padding: 5mm; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 10px;">
                <img src="${posData.shop.receiptLogo}" alt="Shop Logo" style="height: 60px; width: 60px; object-fit: contain; margin: 0 auto 5px; background-color: white; padding: 2px;">
                <h4 style="font-size: 14px; font-weight: bold; margin: 0;">${posData.shop.name}</h4>
                <p style="font-size: 10px; margin: 0;">${posData.shop.address}</p>
                <p style="font-size: 10px; margin: 0;">TP: ${posData.shop.tp}</p>
            </div>
            <div style="border-top: 1px dashed #aaa; margin: 10px 0;"></div>
            <div style="margin-bottom: 10px;">
                <p style="margin: 2px 0;"><strong>Payment ID:</strong> ${payment.id.substring(0, 8)}...</p>
                <p style="margin: 2px 0;"><strong>Date:</strong> ${payment.date}</p>
                <p style="margin: 2px 0;"><strong>Bill ID:</strong> ${payment.billId}</p>
                <p style="margin: 2px 0;"><strong>Customer:</strong> ${customerName}</p>
            </div>
            <div style="border-top: 1px dashed #aaa; margin: 10px 0;"></div>
            <div style="text-align: right; margin-bottom: 10px;">
                <p style="font-weight: bold; font-size: 14px;">Amount Paid: ${formatCurrency(payment.amount)}</p>
            </div>
            <div style="margin-bottom: 10px;">
                <p style="margin: 2px 0;"><strong>Method:</strong> ${payment.method.charAt(0).toUpperCase() + payment.method.slice(1)}</p>
                ${payment.reference ? `<p style="margin: 2px 0;"><strong>Reference:</strong> ${payment.reference}</p>` : ''}
                ${payment.chequeDetails ? `<p style="margin: 2px 0;"><strong>Cheque No:</strong> ${payment.chequeDetails.number}</p><p style="margin: 2px 0;"><strong>Bank:</strong> ${payment.chequeDetails.bank}</p><p style="margin: 2px 0;"><strong>Due Date:</strong> ${payment.chequeDetails.dueDate}</p>` : ''}
            </div>
            <div style="border-top: 1px dashed #aaa; margin: 10px 0;"></div>
            <div style="text-align: center; color: #666;">
                <p>Payment Receipt</p>
                <p>Thank you!</p>
            </div>
        </div>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>Print Payment Receipt</title>');
    printWindow.document.write('<style>');
    printWindow.document.write('@media print { body { margin: 0; } }');
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}


// --- Credit Bills Management ---
searchCreditBillsBtn.addEventListener('click', () => {
    const startDate = creditBillSearchStartDate.value;
    const endDate = creditBillSearchEndDate.value;
    let filteredCreditBills = posData.creditBills;

    if (startDate && endDate) {
        filteredCreditBills = posData.creditBills.filter(bill => {
            const billDate = new Date(bill.billDate);
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1); // Include end date
            return billDate >= start && billDate < end;
        });
    }
    renderCreditBills(filteredCreditBills);
});

function renderCreditBills(filteredCreditBills = posData.creditBills) {
    creditBillsList.innerHTML = '';
    if (filteredCreditBills.length === 0) {
        creditBillsList.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-gray-500">No credit bills.</td></tr>';
        return;
    }
    filteredCreditBills.forEach(bill => {
        const customer = posData.customers.find(c => c.id === bill.customerId);
        const customerName = customer ? customer.name : 'Unknown Customer';
        const statusClass = bill.dueAmount > 0 && new Date(bill.dueDate) < new Date() ? 'text-red-600 font-bold' : 'text-green-600';
        const statusText = bill.dueAmount <= 0 ? 'Paid' : (new Date(bill.dueDate) < new Date() ? 'Overdue' : 'Outstanding');

        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200 hover:bg-gray-50';
        row.innerHTML = `
            <td class="py-3 px-4">${bill.billId}</td>
            <td class="py-3 px-4">${customerName}</td>
            <td class="py-3 px-4">${bill.billDate}</td>
            <td class="py-3 px-4">${formatCurrency(bill.totalAmount)}</td>
            <td class="py-3 px-4">${formatCurrency(bill.paidAmount)}</td>
            <td class="py-3 px-4">${formatCurrency(bill.dueAmount)}</td>
            <td class="py-3 px-4">${bill.dueDate || 'N/A'}</td>
            <td class="py-3 px-4 ${statusClass}">${statusText}</td>
            <td class="py-3 px-4">
                <button class="text-blue-600 hover:text-blue-800 mr-2 edit-credit-bill-btn" data-id="${bill.id}"><i class="fas fa-edit"></i> Edit/Pay</button>
                <button class="text-red-600 hover:text-red-800 delete-credit-bill-btn" data-id="${bill.id}"><i class="fas fa-trash"></i> Delete</button>
            </td>
        `;
        creditBillsList.appendChild(row);
    });

    document.querySelectorAll('.edit-credit-bill-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const billId = e.currentTarget.dataset.id;
            openEditCreditBillModal(billId);
        });
    });

    document.querySelectorAll('.delete-credit-bill-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const billId = e.currentTarget.dataset.id;
            showModal('Confirm Deletion', 'Are you sure you want to delete this credit bill? This will NOT revert customer outstanding credit.', 'confirm', () => {
                deleteCreditBill(billId);
            });
        });
    });
}

function openEditCreditBillModal(billId) {
    editingCreditBillId = billId;
    const creditBill = posData.creditBills.find(b => b.id === billId);
    if (!creditBill) {
        showModal('Error', 'Credit bill not found.');
        return;
    }
    const customer = posData.customers.find(c => c.id === creditBill.customerId);
    const customerName = customer ? customer.name : 'Unknown Customer';

    editCreditBillId.value = creditBill.billId;
    editCreditBillCustomer.value = customerName;
    editCreditBillTotal.value = formatCurrency(creditBill.totalAmount);
    editCreditBillPaid.value = formatCurrency(creditBill.paidAmount);
    editCreditBillDue.value = formatCurrency(creditBill.dueAmount);
    editCreditBillDueDate.value = creditBill.dueDate;

    installmentAmountInput.value = '';
    installmentMethodSelect.value = 'cash';
    installmentReferenceContainer.classList.add('hidden');
    installmentReferenceInput.value = '';
    installmentChequeDetailsContainer.classList.add('hidden');
    installmentChequeNumberInput.value = '';
    installmentChequeBankInput.value = '';
    installmentChequeDueDateInput.value = '';

    editCreditBillModal.classList.remove('hidden');
    setTimeout(() => {
        editCreditBillModal.classList.add('show');
        editCreditBillModalContent.classList.add('show');
    }, 10);
}

editCreditBillModalCloseBtn.addEventListener('click', hideEditCreditBillModal);

function hideEditCreditBillModal() {
    editCreditBillModal.classList.remove('show');
    editCreditBillModalContent.classList.remove('show');
    setTimeout(() => {
        editCreditBillModal.classList.add('hidden');
        editingCreditBillId = null; // Clear editing state
    }, 300);
}

installmentMethodSelect.addEventListener('change', () => {
    const selectedMethod = installmentMethodSelect.value;
    installmentReferenceContainer.classList.add('hidden');
    installmentChequeDetailsContainer.classList.add('hidden');

    if (selectedMethod !== 'cash') {
        installmentReferenceContainer.classList.remove('hidden');
    }
    if (selectedMethod === 'cheque') {
        installmentChequeDetailsContainer.classList.remove('hidden');
    }
});

addInstallmentBtn.addEventListener('click', () => {
    const creditBill = posData.creditBills.find(b => b.id === editingCreditBillId);
    if (!creditBill) {
        showModal('Error', 'Credit bill not found.');
        return;
    }

    const paymentAmount = parseFloat(installmentAmountInput.value);
    const paymentMethod = installmentMethodSelect.value;
    const paymentRef = installmentReferenceInput.value.trim();

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
        showModal('Error', 'Please enter a valid payment amount.');
        return;
    }
    if (paymentAmount > creditBill.dueAmount) {
        showModal('Error', `Payment amount exceeds due amount. Due: ${formatCurrency(creditBill.dueAmount)}`);
        return;
    }

    let chequeDetails = null;
    if (paymentMethod === 'cheque') {
        const chequeNumber = installmentChequeNumberInput.value.trim();
        const chequeBank = installmentChequeBankInput.value.trim();
        const chequeDueDate = installmentChequeDueDateInput.value;
        if (!chequeNumber || !chequeBank || !chequeDueDate) {
            showModal('Error', 'Please provide all cheque details (Number, Bank, Due Date) for installment.');
            return;
        }
        chequeDetails = {
            number: chequeNumber,
            bank: chequeBank,
            dueDate: chequeDueDate
        };
    }

    const now = new Date();
    const newPaymentRecord = {
        id: generateUniqueId(),
        date: formatDate(now),
        billId: creditBill.billId, // Link to original bill
        amount: paymentAmount,
        method: paymentMethod,
        reference: paymentRef,
        chequeDetails: chequeDetails || null
    };

    // Update credit bill
    creditBill.paidAmount += paymentAmount;
    creditBill.dueAmount -= paymentAmount;
    creditBill.paymentHistory.push(newPaymentRecord);

    // Add to global payments list
    posData.payments.push(newPaymentRecord);

    // Update customer outstanding credit
    const customer = posData.customers.find(c => c.id === creditBill.customerId);
    if (customer) {
        customer.outstandingCredit -= paymentAmount;
    }

    // Add to cheque tracking if applicable
    if (paymentMethod === 'cheque' && chequeDetails) {
        posData.cheques.push({
            id: generateUniqueId(),
            billId: creditBill.billId,
            chequeNumber: chequeDetails.number,
            bank: chequeDetails.bank,
            amount: paymentAmount, // Amount of this specific installment
            dueDate: chequeDetails.dueDate,
            status: 'Pending'
        });
    }

    savePOSData();
    showModal('Success', `LKR ${paymentAmount.toFixed(2)} installment added to credit bill.`);
    openEditCreditBillModal(editingCreditBillId); // Re-render modal with updated values
    renderCreditBills(); // Update main credit bills list
    updateDashboard(); // Update dashboard outstanding credit
});

saveCreditBillChangesBtn.addEventListener('click', () => {
    const creditBill = posData.creditBills.find(b => b.id === editingCreditBillId);
    if (!creditBill) {
        showModal('Error', 'Credit bill not found.');
        return;
    }

    creditBill.dueDate = editCreditBillDueDate.value;
    savePOSData();
    showModal('Success', 'Credit bill due date updated!');
    renderCreditBills();
    hideEditCreditBillModal();
});


function deleteCreditBill(id) {
    const creditBill = posData.creditBills.find(b => b.id === id);
    if (!creditBill) return;

    // Revert outstanding credit from customer if bill was not fully paid
    const customer = posData.customers.find(c => c.id === creditBill.customerId);
    if (customer) {
        customer.outstandingCredit -= creditBill.dueAmount;
        // Ensure outstandingCredit doesn't go below zero
        if (customer.outstandingCredit < 0) {
            customer.outstandingCredit = 0;
        }
    }

    posData.creditBills = posData.creditBills.filter(b => b.id !== id);
    savePOSData();
    renderCreditBills();
    updateDashboard();
    showModal('Success', 'Credit bill deleted successfully!');
}

// --- Cheque Tracking System ---
searchChequesBtn.addEventListener('click', () => {
    const startDate = chequeSearchStartDate.value;
    const endDate = chequeSearchEndDate.value;
    let filteredCheques = posData.cheques;

    if (startDate && endDate) {
        filteredCheques = posData.cheques.filter(cheque => {
            const chequeDate = new Date(cheque.dueDate);
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1); // Include end date
            return chequeDate >= start && chequeDate < end;
        });
    }
    renderChequeTracking(filteredCheques);
});

function renderChequeTracking(filteredCheques = posData.cheques) {
    chequeList.innerHTML = '';
    if (filteredCheques.length === 0) {
        chequeList.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-gray-500">No cheque records.</td></tr>';
        return;
    }
    filteredCheques.forEach(cheque => {
        const statusClass = {
            'Pending': 'text-yellow-600 font-semibold',
            'Claimed': 'text-green-600 font-semibold',
            'Released': 'text-blue-600',
            'Bounced': 'text-red-600 font-bold'
        };
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200 hover:bg-gray-50';
        row.innerHTML = `
            <td class="py-3 px-4">${cheque.id.substring(0, 8)}...</td>
            <td class="py-3 px-4">${cheque.billId || 'N/A'}</td>
            <td class="py-3 px-4">${cheque.chequeNumber}</td>
            <td class="py-3 px-4">${cheque.bank}</td>
            <td class="py-3 px-4">${formatCurrency(cheque.amount)}</td>
            <td class="py-3 px-4">${cheque.dueDate}</td>
            <td class="py-3 px-4 ${statusClass[cheque.status]}">${cheque.status}</td>
            <td class="py-3 px-4">
                <select class="p-2 border rounded-lg change-cheque-status" data-id="${cheque.id}">
                    <option value="Pending" ${cheque.status === 'Pending' ? 'selected' : ''}>Pending</option>
                    <option value="Claimed" ${cheque.status === 'Claimed' ? 'selected' : ''}>Claimed</option>
                    <option value="Released" ${cheque.status === 'Released' ? 'selected' : ''}>Released</option>
                    <option value="Bounced" ${cheque.status === 'Bounced' ? 'selected' : ''}>Bounced</option>
                </select>
                <button class="text-red-600 hover:text-red-800 ml-2 delete-cheque-btn" data-id="${cheque.id}"><i class="fas fa-trash"></i> Delete</button>
            </td>
        `;
        chequeList.appendChild(row);
    });

    document.querySelectorAll('.change-cheque-status').forEach(select => {
        select.addEventListener('change', (e) => {
            const chequeId = e.target.dataset.id;
            const newStatus = e.target.value;
            updateChequeStatus(chequeId, newStatus);
        });
    });

    document.querySelectorAll('.delete-cheque-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const chequeId = e.currentTarget.dataset.id;
            showModal('Confirm Deletion', 'Are you sure you want to delete this cheque record?', 'confirm', () => {
                deleteCheque(chequeId);
            });
        });
    });
}

function updateChequeStatus(id, newStatus) {
    const chequeIndex = posData.cheques.findIndex(c => c.id === id);
    if (chequeIndex > -1) {
        posData.cheques[chequeIndex].status = newStatus;
        savePOSData();
        renderChequeTracking();
        showModal('Success', `Cheque ${posData.cheques[chequeIndex].chequeNumber} status updated to ${newStatus}.`);
    } else {
        showModal('Error', 'Cheque not found.');
    }
}

function deleteCheque(id) {
    posData.cheques = posData.cheques.filter(c => c.id !== id);
    savePOSData();
    renderChequeTracking();
    showModal('Success', 'Cheque record deleted successfully!');
}

// --- Reports ---
generateReportsBtn.addEventListener('click', () => {
    const startDate = reportStartDateInput.value;
    const endDate = reportEndDateInput.value;

    if (!startDate || !endDate) {
        showModal('Error', 'Please select both start and end dates for the report.');
        return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1); // Include end date in filter

    let totalSales = 0;
    let totalCreditSales = 0;
    let totalPaymentsCollected = 0;
    let totalGrnValue = 0;

    // Calculate Sales
    posData.sales.forEach(sale => {
        const saleDate = new Date(sale.date);
        if (saleDate >= start && saleDate < end) {
            totalSales += sale.grandTotal;
            if (sale.paymentMethod === 'credit') {
                totalCreditSales += sale.grandTotal;
            }
        }
    });

    // Calculate Payments Collected
    posData.payments.forEach(payment => {
        const paymentDate = new Date(payment.date);
        if (paymentDate >= start && paymentDate < end) {
            totalPaymentsCollected += payment.amount;
        }
    });

    // Calculate GRN Value
    posData.grns.forEach(grn => {
        const grnDate = new Date(grn.date);
        if (grnDate >= start && grnDate < end) {
            grn.items.forEach(item => {
                const inventoryItem = posData.inventory.find(inv => inv.id === item.id);
                if (inventoryItem) {
                    totalGrnValue += (inventoryItem.price * item.qty); // Assuming GRN value is based on current selling price
                }
            });
        }
    });

    // Calculate Current Inventory Value
    let currentInventoryValue = 0;
    posData.inventory.forEach(item => {
        currentInventoryValue += (item.stock * item.price);
    });

    reportTotalSalesSpan.textContent = formatCurrency(totalSales);
    reportTotalCreditSalesSpan.textContent = formatCurrency(totalCreditSales);
    reportTotalPaymentsSpan.textContent = formatCurrency(totalPaymentsCollected);
    reportTotalGrnValueSpan.textContent = formatCurrency(totalGrnValue);
    reportCurrentInventoryValueSpan.textContent = formatCurrency(currentInventoryValue);

    reportSummaryDiv.classList.remove('hidden');
});

// Helper for CSV download
function downloadCSV(filename, csv) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // feature detection
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

downloadSalesReportBtn.addEventListener('click', () => {
    const startDate = reportStartDateInput.value;
    const endDate = reportEndDateInput.value;
    if (!startDate || !endDate) {
        showModal('Error', 'Please select a date range first.');
        return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);

    let csvContent = "Bill ID,Date,Time,Customer Type,Customer Name,Customer TP,Customer Address,Distribution Channel,Items,Subtotal,Discount Type,Discount Value,Discount Amount,Grand Total,Payment Method,Payment Reference,Cheque Number,Cheque Bank,Cheque Due Date\n";
    posData.sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= start && saleDate < end;
    }).forEach(sale => {
        const itemsString = sale.items.map(item => `${item.name}(${item.qty} @ ${item.price})`).join('; ');
        const channelName = posData.distributionChannels.find(c => c.id === sale.channelId)?.name || 'N/A';
        const chequeNum = sale.chequeDetails?.number || '';
        const chequeBank = sale.chequeDetails?.bank || '';
        const chequeDueDate = sale.chequeDetails?.dueDate || '';

        csvContent += `${sale.id},${sale.date},${sale.time},${sale.customer.type},"${sale.customer.name}","${sale.customer.tp}","${sale.customer.address}","${channelName}","${itemsString}",${sale.subtotal},${sale.discountType},${sale.discountValue},${sale.discountAmount},${sale.grandTotal},${sale.paymentMethod},"${sale.paymentRef || ''}","${chequeNum}","${chequeBank}","${chequeDueDate}"\n`;
    });
    downloadCSV('sales_report.csv', csvContent);
});

downloadInventoryReportBtn.addEventListener('click', () => {
    let csvContent = "Item Code,Item Name,Description,Unit Price,Current Stock\n";
    posData.inventory.forEach(item => {
        csvContent += `${item.code},"${item.name}","${item.description || ''}",${item.price},${item.stock}\n`;
    });
    downloadCSV('inventory_report.csv', csvContent);
});

downloadCreditReportBtn.addEventListener('click', () => {
    const startDate = reportStartDateInput.value;
    const endDate = reportEndDateInput.value;
    if (!startDate || !endDate) {
        showModal('Error', 'Please select a date range first.');
        return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);

    let csvContent = "Credit Bill ID,Original Bill ID,Customer Name,Bill Date,Due Date,Total Amount,Paid Amount,Due Amount\n";
    posData.creditBills.filter(bill => {
        const billDate = new Date(bill.billDate);
        return billDate >= start && billDate < end;
    }).forEach(bill => {
        const customer = posData.customers.find(c => c.id === bill.customerId);
        const customerName = customer ? customer.name : 'Unknown Customer';
        csvContent += `${bill.id},${bill.billId},"${customerName}",${bill.billDate},${bill.dueDate || ''},${bill.totalAmount},${bill.paidAmount},${bill.dueAmount}\n`;
    });
    downloadCSV('credit_bills_report.csv', csvContent);
});

downloadGrnReportBtn.addEventListener('click', () => {
    const startDate = reportStartDateInput.value;
    const endDate = reportEndDateInput.value;
    if (!startDate || !endDate) {
        showModal('Error', 'Please select a date range first.');
        return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);

    let csvContent = "GRN ID,Date,Supplier,Item Code,Item Name,Quantity,Item Price (at GRN time)\n";
    posData.grns.filter(grn => {
        const grnDate = new Date(grn.date);
        return grnDate >= start && grnDate < end;
    }).forEach(grn => {
        grn.items.forEach(item => {
            const inventoryItem = posData.inventory.find(inv => inv.id === item.id);
            const itemPrice = inventoryItem ? inventoryItem.price : 'N/A'; // Use current price as GRN price is not stored
            csvContent += `${grn.id},${grn.date},"${grn.supplier}",${item.code},"${item.name}",${item.qty},${itemPrice}\n`;
        });
    });
    downloadCSV('grn_report.csv', csvContent);
});

downloadPaymentsReportBtn.addEventListener('click', () => {
    const startDate = reportStartDateInput.value;
    const endDate = reportEndDateInput.value;
    if (!startDate || !endDate) {
        showModal('Error', 'Please select a date range first.');
        return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);

    let csvContent = "Payment ID,Date,Bill ID,Amount,Method,Reference,Cheque Number,Cheque Bank,Cheque Due Date\n";
    posData.payments.filter(payment => {
        const paymentDate = new Date(payment.date);
        return paymentDate >= start && paymentDate < end;
    }).forEach(payment => {
        const chequeNum = payment.chequeDetails?.number || '';
        const chequeBank = payment.chequeDetails?.bank || '';
        const chequeDueDate = payment.chequeDetails?.dueDate || '';
        csvContent += `${payment.id},${payment.date},${payment.billId},${payment.amount},${payment.method},"${payment.reference || ''}","${chequeNum}","${chequeBank}","${chequeDueDate}"\n`;
    });
    downloadCSV('payments_report.csv', csvContent);
});


// --- Dashboard Updates ---
function updateDashboard() {
    const today = formatDate(new Date());
    let todaySales = 0;
    posData.sales.forEach(sale => {
        if (sale.date === today) {
            todaySales += sale.grandTotal;
        }
    });
    dashboardTodaySales.textContent = formatCurrency(todaySales);

    dashboardInventoryCount.textContent = posData.inventory.length;

    let totalOutstandingCredit = 0;
    posData.customers.forEach(customer => {
        totalOutstandingCredit += customer.outstandingCredit;
    });
    dashboardOutstandingCredit.textContent = formatCurrency(totalOutstandingCredit);

    // Recent Transactions (last 5 sales)
    dashboardRecentTransactions.innerHTML = '';
    if (posData.sales.length === 0) {
        dashboardRecentTransactions.innerHTML = '<p class="text-gray-500">No recent transactions.</p>';
    } else {
        const recentSales = posData.sales.slice(-5).reverse(); // Get last 5, most recent first
        const ul = document.createElement('ul');
        ul.className = 'divide-y divide-gray-200';
        recentSales.forEach(sale => {
            const li = document.createElement('li');
            li.className = 'py-2 flex justify-between items-center';
            li.innerHTML = `
                <div>
                    <p class="font-medium text-gray-800">${sale.customer.name}</p>
                    <p class="text-sm text-gray-600">${sale.id} - ${sale.date} ${sale.time}</p>
                </div>
                <span class="font-bold text-lg text-blue-600">${formatCurrency(sale.grandTotal)}</span>
            `;
            ul.appendChild(li);
        });
        dashboardRecentTransactions.appendChild(ul);
    }
}

/*view  existing chennels*/
function openChannelModal() {
  document.getElementById("ChannelModal").style.display = "block";
}

function closeChannelModal() {
  document.getElementById("ChannelModal").style.display = "none";
}

/*view All Cheques*/
function openChequeModal() {
  document.getElementById("ChequeModal").style.display = "block";
}

function closeChequeModal() {
  document.getElementById("ChequeModal").style.display = "none";
}

let currentStep = 0;
const steps = document.querySelectorAll(".step");

function showStep(index) {
  steps.forEach((step, i) => {
    step.style.display = i === index ? "block" : "none";
  });
}

function nextStep() {
    if (currentStep < steps.length - 1) {
    currentStep++;
    showStep(currentStep);
  }
}

function prevStep() {
  if (currentStep > 0) {
    currentStep--;
    showStep(currentStep);
  }
}

// Optional: Initialize first step
showStep(currentStep);

/*buttons for settings page*/
function openShopDetailModal() {
  document.getElementById("ShopDetailModal").style.display = "block";
}

// Function to close the Credit Bills modal
function closeShopDetailModal() {
  document.getElementById("ShopDetailModal").style.display = "none";
}



function openDLogoModal() {
  document.getElementById("DLogoModal").style.display = "block";
}

// Function to close the Credit Bills modal
function closeDLogoModal() {
  document.getElementById("DLogoModal").style.display = "none";
}



function openRLogoModal() {
  document.getElementById("RLogoModal").style.display = "block";
}

// Function to close the Credit Bills modal
function closeRLogoModal() {
  document.getElementById("RLogoModal").style.display = "none";
}


function openDChannelsModal() {
  document.getElementById("DChannelsModal").style.display = "block";
}

// Function to close the Credit Bills modal
function closeDChannelsModal() {
  document.getElementById("DChannelsModal").style.display = "none";
}

/*logout*/
function logout() {
    // Optional: clear session/local storage
    localStorage.clear(); // if using localStorage for login info
    sessionStorage.clear(); // if using sessionStorage

    // Redirect to login page
    window.location.href = 'login.html';
}

/* REPORT MODAL FUNCTIONS */
function openReportModal(title, content) {
    document.getElementById("reportTitle").innerText = title;
    document.getElementById("reportContent").innerHTML = content;
    document.getElementById("reportModal").classList.remove("hidden");
}

function closeReportModal() {
    document.getElementById("reportModal").classList.add("hidden");
}

/* VIEW BUTTON FUNCTIONS */
document.getElementById("view-sales-report").addEventListener("click", () => {
    openReportModal("Sales Report", "<p>This is the Sales Report preview.</p>");
});

document.getElementById("view-inventory-report").addEventListener("click", () => {
    openReportModal("Inventory Report", "<p>This is the Inventory Report preview.</p>");
});

document.getElementById("view-credit-report").addEventListener("click", () => {
    openReportModal("Credit Report", "<p>This is the Credit Report preview.</p>");
});

document.getElementById("view-grn-report").addEventListener("click", () => {
    openReportModal("GRN Report", "<p>This is the GRN Report preview.</p>");
});

document.getElementById("view-payments-report").addEventListener("click", () => {
    openReportModal("Payments Report", "<p>This is the Payments Report preview.</p>");
});

// Robust script.js for "View" report buttons
document.addEventListener("DOMContentLoaded", () => {
  // ---------- Ensure modal exists (create if missing) ----------
  let modal = document.getElementById("reportModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "reportModal";
    modal.className = "hidden fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50";
    modal.innerHTML = `
      <div id="reportModalBox" class="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-2xl max-h-[80%] overflow-y-auto">
        <h2 id="reportTitle" class="text-2xl font-semibold text-gray-800 mb-4"></h2>
        <div id="reportContent" class="text-gray-700 mb-6"></div>
        <button id="reportCloseBtn" class="px-6 py-2 bg-red-600 text-white rounded-lg w-full">Close</button>
      </div>
    `;
    document.body.appendChild(modal);
    console.info("reportModal was missing — created one automatically.");
  }

  // Cache modal elements
  const modalBox = document.getElementById("reportModalBox") || modal.firstElementChild;
  const titleEl = document.getElementById("reportTitle");
  const contentEl = document.getElementById("reportContent");
  const closeBtn = document.getElementById("reportCloseBtn");

  // ---------- Modal open / close helpers ----------
  function openReportModal(title, htmlContent) {
    if (titleEl) titleEl.innerText = title || "";
    if (contentEl) contentEl.innerHTML = htmlContent || "<p>No preview available.</p>";
    modal.classList.remove("hidden");
    // trap focus (simple)
    closeBtn?.focus();
  }

  function closeReportModal() {
    modal.classList.add("hidden");
  }

  // Close handlers
  closeBtn?.addEventListener("click", closeReportModal);
  // click outside
  modal.addEventListener("click", (ev) => {
    if (ev.target === modal) closeReportModal();
  });
  // Esc key
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && !modal.classList.contains("hidden")) closeReportModal();
  });

  // ---------- Map of button IDs -> content ----------
  const reports = {
    "view-sales-report": {
      title: "Sales Report",
      content: "<p>This is a preview of the Sales Report.</p>"
    },
    "view-inventory-report": {
      title: "Inventory Report",
      content: "<p>This is a preview of the Inventory Report.</p>"
    },
    "view-credit-report": {
      title: "Credit Report",
      content: "<p>This is a preview of the Credit Report.</p>"
    },
    "view-grn-report": {
      title: "GRN Report",
      content: "<p>This is a preview of the GRN Report.</p>"
    },
    "view-payments-report": {
      title: "Payments Report",
      content: "<p>This is a preview of the Payments Report.</p>"
    }
  };

  // ---------- Attach listeners (safe) ----------
  Object.keys(reports).forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) {
      console.warn(`View button not found: #${id}`);
      return;
    }
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      const r = reports[id];
      openReportModal(r.title, r.content);
    });
  });

  // If no view buttons found at all, print helpful message
  const anyFound = Object.keys(reports).some(id => document.getElementById(id));
  if (!anyFound) {
    console.warn("No view-* report buttons were found. Check that your buttons have the correct IDs.");
  } else {
    console.info("View report listeners attached.");
  }
});


