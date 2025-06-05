// API Configuration
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000'
    : window.location.origin;
let authToken = localStorage.getItem('authToken');

// Constants for week calculation
const WEEK_START_DATE = new Date(2025, 5, 1); // June 1st, 2025 (month is 0-based)
const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiB2aWV3Qm94PSIwIDAgNTEyIDUxMiI+PHBhdGggZmlsbD0iI2U2ZTZlNiIgZD0iTTAgMGg1MTJ2NTEySDB6Ii8+PHBhdGggZmlsbD0iIzk5OSIgZD0iTTI1NiAzMDRjNjEuNiAwIDExMi04OS40IDExMi0yMDAgMC04OC40LTUwLjQtODAtMTEyLTgwcy0xMTItOC40LTExMiA4MGMwIDExMC42IDUwLjQgMjAwIDExMiAyMDB6bS0xNiA0MGMtNjYuOCAwLTEyOCA0OC44LTEyOCAxMDguNFY1MTJoMjg4di01OS42YzAtNTkuNi02MS4yLTEwOC40LTEyOC0xMDguNHoiLz48L3N2Zz4=';

// Utility functions
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ''; // Invalid date
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

const formatWeekDisplay = (weekNumber, startDate, endDate) => {
    return `Week ${weekNumber} (${formatDate(startDate)} - ${formatDate(endDate)})`;
};

const formatMemberId = (id) => {
    // Extract the numeric portion or use the index + 1
    let numericId;
    if (typeof id === 'string' && id.match(/\d+$/)) {
        numericId = parseInt(id.match(/\d+$/)[0]);
    } else {
        numericId = parseInt(id);
    }
    // Pad with zeros to make it 3 digits
    return numericId.toString().padStart(3, '0');
};

const api = {
    async request(endpoint, options = {}) {
        try {
            const baseOptions = {
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (localStorage.getItem('authToken')) {
                baseOptions.headers['Authorization'] = `Bearer ${localStorage.getItem('authToken')}`;
            }

            const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
            console.log('Making API request to:', url);

            const response = await fetch(url, { ...baseOptions, ...options });
            
            // First check if the response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned non-JSON response');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            if (error.message.includes('<!DOCTYPE')) {
                throw new Error('Server error: Application may need to be restarted');
            }
            throw error;
        }
    },

    // Auth endpoints
    async login(email, password) {
        try {
            console.log('Attempting login for:', email);
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error('Non-JSON response received:', await response.text());
                throw new Error('Server returned non-JSON response');
            }

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            if (!data.token) {
                throw new Error('No token received from server');
            }

            // Store the token
            localStorage.setItem('authToken', data.token);
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Members endpoints
    async getMembers() {
        return await this.request('/api/members');
    },

    async getMember(id) {
        return await this.request(`/api/members/${id}`);
    },

    async addMember(data) {
        return await this.request('/api/members', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updateMember(id, data) {
        return await this.request(`/api/members/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async deleteMember(id) {
        return await this.request(`/api/members/${id}`, {
            method: 'DELETE'
        });
    },

    // Payments endpoints
    async getPayments(weekNumber, year) {
        return await this.request(`/api/payments?weekNumber=${weekNumber}&year=${year}`);
    },

    async recordPayment(data) {
        return await this.request('/api/payments', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async getPaymentStats(weekNumber, year) {
        return await this.request(`/api/payments/stats?weekNumber=${weekNumber}&year=${year}`);
    },

    // Expenses endpoints
    async getExpenses() {
        return await this.request('/api/expenses');
    },

    async addExpense(data) {
        return await this.request('/api/expenses', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async deleteExpense(id) {
        return await this.request(`/api/expenses/${id}`, {
            method: 'DELETE'
        });
    },

    // Donations endpoints
    async getDonations() {
        return await this.request('/api/donations');
    },

    async addDonation(data) {
        return await this.request('/api/donations', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async getWeeklyAnalysis(year) {
        return await this.request(`/payments/weekly-analysis?year=${year}`);
    }
};

// DOM Elements
const adminPanel = document.getElementById('adminPanel');
const authContainer = document.getElementById('authContainer');
const authButton = document.getElementById('authButton');
const adminToggle = document.getElementById('adminToggle');
const paymentModal = document.getElementById('paymentModal');
const imageModal = document.getElementById('imageModal');
const editMemberModal = document.getElementById('editMemberModal');
const editMemberForm = document.getElementById('editMemberForm');
const modalImage = document.getElementById('modalImage');
const modalMemberName = document.getElementById('modalMemberName');
const closeModals = document.querySelectorAll('.close-modal');
const logoImage = document.querySelector('.logo img');

// Current week and year
const currentDate = new Date();
const currentWeek = getWeekNumber(currentDate);
const currentYear = currentDate.getFullYear();

// Payment status tracking
let paymentStatusCache = new Map();

// Function to get payment status
async function updatePaymentStatuses(weekNumber = currentWeek, year = currentYear) {
    try {
        const payments = await api.getPayments(weekNumber, year);
        paymentStatusCache.clear();
        payments.forEach(payment => {
            paymentStatusCache.set(payment.member, true);
        });
    } catch (error) {
        console.error('Error updating payment statuses:', error);
    }
}

// Function to get payment status for a member
function getPaymentStatus(memberId) {
    return paymentStatusCache.get(memberId) || false;
}

// Initialize the application
async function init() {
    try {
        setupEventListeners();
        
        // Check authentication and show/hide admin elements
        const isAdmin = !!localStorage.getItem('authToken');
        
        // Hide only admin control sections
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
        document.getElementById('adminPanel').style.display = 'none';

        if (isAdmin) {
            // Show admin controls
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = el.tagName.toLowerCase() === 'td' ? 'table-cell' : 'block';
            });
            document.getElementById('adminToggle').textContent = 'Logout';
            document.getElementById('adminPanel').style.display = 'block';
        }

        // Load all data
        await loadData();
        await loadExpenses();
        await loadDonations();
    } catch (error) {
        console.error('Initialization error:', error);
        alert('Error initializing application: ' + error.message);
    }
}

// Switch between tabs
function switchTab(tabId) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab content and activate button
    document.querySelector(`#${tabId}-tab`).classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    // Load data for the selected tab
    if (tabId === 'members') {
        loadData();
    } else if (tabId === 'expenses') {
        loadExpenses();
    } else if (tabId === 'donations') {
        loadDonations();
    }
}

// Start the application
document.addEventListener('DOMContentLoaded', init);

// Function to update UI based on admin status
function updateUIForAdminStatus() {
    const isAdmin = !!localStorage.getItem('authToken');
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(element => {
        element.style.display = isAdmin ? 'block' : 'none';
    });
}

// Modify the checkAuth function
function checkAuth() {
    if (authToken) {
        adminPanel.style.display = 'block';
        document.getElementById('adminToggle').textContent = 'Logout';
    }
    updateUIForAdminStatus();
}

// Modify the login handler
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;

    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }

    try {
        const data = await api.login(email, password);
        console.log('Login successful');
        
        // Update UI
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('adminToggle').textContent = 'Logout';
        document.getElementById('adminPanel').style.display = 'block';
        
        // Show admin elements
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = el.tagName.toLowerCase() === 'td' ? 'table-cell' : 'block';
        });

        // Reload data
        await loadData();
        await loadExpenses();
        await loadDonations();
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed: ' + error.message);
    }
}

// Modify the admin toggle handler
adminToggle.addEventListener('click', () => {
    const authContainer = document.getElementById('authContainer');
    const authToken = localStorage.getItem('authToken');

    if (authToken) {
        // Logout
        localStorage.removeItem('authToken');
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
        document.getElementById('adminPanel').style.display = 'none';
        adminToggle.textContent = 'Click to Login';
        location.reload();
    } else {
        // Show/hide login form
        authContainer.style.display = authContainer.style.display === 'none' ? 'block' : 'none';
        adminToggle.textContent = authContainer.style.display === 'none' ? 'Click to Login' : 'Hide Login';
    }
});

// Setup event listeners
function setupEventListeners() {
    // Close modals
    closeModals.forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            paymentModal.style.display = 'none';
            imageModal.style.display = 'none';
            editMemberModal.style.display = 'none';
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === paymentModal) {
            paymentModal.style.display = 'none';
        }
        if (e.target === imageModal) {
            imageModal.style.display = 'none';
        }
        if (e.target === editMemberModal) {
            editMemberModal.style.display = 'none';
        }
    });

    // Edit member form
    const editMemberForm = document.getElementById('editMemberForm');
    if (editMemberForm) {
        editMemberForm.addEventListener('submit', handleEditMember);
    }

    // Photo preview in edit form
    const editMemberPhoto = document.getElementById('editMemberPhoto');
    if (editMemberPhoto) {
        editMemberPhoto.addEventListener('input', function() {
            const previewImg = document.getElementById('editPhotoPreview');
            if (previewImg) {
                previewImg.src = this.value || DEFAULT_AVATAR;
            }
        });
    }

    // Form submissions
    document.getElementById('addMemberForm').addEventListener('submit', handleAddMember);
    document.getElementById('paymentForm').addEventListener('submit', handleRecordPayment);
    document.getElementById('addExpenseForm').addEventListener('submit', handleAddExpense);
    document.getElementById('addDonationForm').addEventListener('submit', handleAddDonation);

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Week selection
    document.getElementById('weeksContainer').addEventListener('click', (e) => {
        if (e.target.classList.contains('week-btn')) {
            document.querySelectorAll('.week-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            loadData();
        }
    });

    // Photo preview for new member
    document.getElementById('memberPhoto').addEventListener('change', function() {
        handleUrlPreview(this, 'photoPreview');
    });

    // Login form submission
    if (authButton) {
        authButton.addEventListener('click', handleLogin);
    }
}

// Function to load and display members
async function loadData() {
    try {
        console.log('Loading members data...');
        
        // Always update payment statuses
        await updatePaymentStatuses();
        
        const members = await api.getMembers();
        console.log('Received members:', members);

        if (!Array.isArray(members)) {
            console.error('Invalid members data received:', members);
            throw new Error('Invalid data received from server');
        }

        const membersTableBody = document.querySelector('#membersTable tbody');
        if (!membersTableBody) {
            console.error('Members table body not found');
            throw new Error('Members table not found in the document');
        }

        membersTableBody.innerHTML = '';
        const isAdmin = !!localStorage.getItem('authToken');

        members.forEach(member => {
            const row = document.createElement('tr');
            const isPaid = getPaymentStatus(member._id);
            
            row.innerHTML = `
                <td>
                    <img src="${member.photo || DEFAULT_AVATAR}" alt="${member.name}" class="member-photo" onclick="showImageModal('${member.photo || DEFAULT_AVATAR}', '${member.name}')">
                </td>
                <td>${formatMemberId(member._id)}</td>
                <td>${member.name}</td>
                <td>${member.phone}</td>
                <td>
                    <span class="badge ${isPaid ? 'badge-success' : 'badge-danger'}">
                        ${isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                </td>
                <td class="admin-only" style="display: none;">
                    ${isAdmin ? `
                        ${!isPaid ? `<button onclick="showPaymentModal('${member._id}')" class="btn btn-sm btn-success">Pay</button>` : ''}
                        <button onclick="editMember('${member._id}')" class="btn btn-sm btn-edit">Edit</button>
                        <button onclick="deleteMember('${member._id}')" class="btn btn-sm btn-delete">Delete</button>
                    ` : ''}
                </td>
            `;
            
            membersTableBody.appendChild(row);
        });

        // Update table headers
        const table = document.querySelector('#membersTable');
        const headerRow = table.querySelector('thead tr');
        headerRow.innerHTML = `
            <th>Photo</th>
            <th>ID</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Status</th>
            ${isAdmin ? '<th>Actions</th>' : ''}
        `;

        console.log('Members data loaded successfully');
        await updateSummaryCards();
    } catch (error) {
        console.error('Error loading members:', error);
        alert('Error loading members. Please try again. Details: ' + error.message);
    }
}

// Handle URL preview
function handleUrlPreview(input, previewId) {
    const preview = document.getElementById(previewId);
    const url = input.value.trim();

    if (url) {
        preview.src = url;
        preview.onerror = function() {
            preview.src = DEFAULT_AVATAR;
            alert('Invalid image URL. Please enter a valid image URL.');
        };
    } else {
        preview.src = DEFAULT_AVATAR;
    }
}

// Handle add member
async function handleAddMember(e) {
    e.preventDefault();
    const name = document.getElementById('memberName').value;
    const phone = document.getElementById('memberPhone').value;
    const photoUrl = document.getElementById('memberPhoto').value.trim();

    try {
        await api.addMember({ 
            name, 
            phone, 
            photo: photoUrl || null
        });

        alert('Member added successfully!');
        document.getElementById('addMemberForm').reset();
        document.getElementById('photoPreview').src = DEFAULT_AVATAR;
        loadData();
        updateSummaryCards();
    } catch (error) {
        alert('Error adding member: ' + error.message);
    }
}

// Handle delete member
async function handleDeleteMember(id) {
    try {
        await api.deleteMember(id);
        alert('Member deleted successfully!');
        loadData();
        updateSummaryCards();
    } catch (error) {
        alert('Error deleting member: ' + error.message);
    }
}

// Show payment modal
function showPaymentModal(memberId) {
    const defaultAmount = document.getElementById('paymentAmount').value || 20;
    document.getElementById('paymentMemberId').value = memberId;
    document.getElementById('paymentAmountModal').value = defaultAmount;
    document.getElementById('paymentWeek').value = currentWeek;
    document.getElementById('paymentYear').value = currentYear;
    paymentModal.style.display = 'block';
}

// Handle record payment
async function handleRecordPayment(e) {
    e.preventDefault();
    const memberId = document.getElementById('paymentMemberId').value;
    const amount = parseFloat(document.getElementById('paymentAmountModal').value);
    const weekNumber = parseInt(document.getElementById('paymentWeek').value);
    const year = parseInt(document.getElementById('paymentYear').value);

    if (!memberId || isNaN(amount) || isNaN(weekNumber) || isNaN(year)) {
        alert('Please fill in all payment details correctly');
        return;
    }

    try {
        console.log('Recording payment:', { memberId, amount, weekNumber, year });
        await api.recordPayment({ member: memberId, amount, weekNumber, year });
        alert('Payment recorded successfully!');
        paymentModal.style.display = 'none';
        await updatePaymentStatuses(weekNumber, year);
        await loadData();
    } catch (error) {
        console.error('Payment error:', error);
        alert('Error recording payment: ' + error.message);
    }
}

// Load expenses
async function loadExpenses() {
    try {
        const expenses = await api.getExpenses();
        const tbody = document.querySelector('#expensesTable tbody');
        if (!tbody) {
            console.error('Expenses table body not found');
            return;
        }

        tbody.innerHTML = '';
        const isAdmin = !!localStorage.getItem('authToken');

        expenses.forEach(expense => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(expense.createdAt)}</td>
                <td>${expense.description}</td>
                <td>${formatCurrency(expense.amount)}</td>
                ${isAdmin ? `
                    <td class="admin-only" style="display: none;">
                        <button onclick="deleteExpense('${expense._id}')" class="btn btn-sm btn-danger">Delete</button>
                    </td>
                ` : ''}
            `;
            tbody.appendChild(row);
        });

        // Show add expense form only for admin
        const addExpenseForm = document.querySelector('#addExpenseForm');
        if (addExpenseForm) {
            addExpenseForm.style.display = isAdmin ? 'block' : 'none';
        }
    } catch (error) {
        console.error('Error loading expenses:', error);
        alert('Error loading expenses: ' + error.message);
    }
}

// Handle add expense
async function handleAddExpense(e) {
    e.preventDefault();
    const description = document.getElementById('expenseDescription').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);

    if (!description || isNaN(amount)) {
        alert('Please fill in all expense details correctly');
        return;
    }

    try {
        await api.addExpense({ description, amount });
        alert('Expense added successfully!');
        document.getElementById('addExpenseForm').reset();
        await loadExpenses();
    } catch (error) {
        console.error('Error adding expense:', error);
        alert('Error adding expense: ' + error.message);
    }
}

// Delete expense function
async function deleteExpense(expenseId) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }

    try {
        await api.deleteExpense(expenseId);
        alert('Expense deleted successfully!');
        await loadExpenses();
    } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Error deleting expense: ' + error.message);
    }
}

// Load donations
async function loadDonations() {
    try {
        const donations = await api.getDonations();
        const tbody = document.querySelector('#donationsTable tbody');
        if (!tbody) {
            console.error('Donations table body not found');
            return;
        }

        tbody.innerHTML = '';

        donations.forEach(donation => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(donation.createdAt)}</td>
                <td>${donation.donorName}</td>
                <td>${formatCurrency(donation.amount)}</td>
            `;
            tbody.appendChild(row);
        });

        // Show add donation form only for admin
        const addDonationForm = document.querySelector('#addDonationForm');
        if (addDonationForm) {
            addDonationForm.style.display = isAdmin ? 'block' : 'none';
        }
    } catch (error) {
        console.error('Error loading donations:', error);
        alert('Error loading donations: ' + error.message);
    }
}

// Handle add donation
async function handleAddDonation(e) {
    e.preventDefault();
    const donorName = document.getElementById('donorName').value;
    const amount = parseFloat(document.getElementById('donationAmount').value);

    if (!donorName || isNaN(amount)) {
        alert('Please fill in all donation details correctly');
        return;
    }

    try {
        await api.addDonation({ donorName, amount });
        alert('Donation recorded successfully!');
        document.getElementById('addDonationForm').reset();
        await loadDonations();
    } catch (error) {
        console.error('Error recording donation:', error);
        alert('Error recording donation: ' + error.message);
    }
}

// Update summary cards
async function updateSummaryCards() {
    try {
        const selectedWeek = document.querySelector('.week-btn.active')?.dataset.weekNumber || currentWeek;
        const stats = await api.getPaymentStats(selectedWeek, 2025); // Fixed year as 2025
        
        // Get all members first
        const members = await api.getMembers();
        const totalMembers = members.length; // Get actual count of members

        // Update total members
        document.getElementById('totalMembers').textContent = totalMembers;
        
        // Update paid members this week
        const paidThisWeek = stats.weeklyPaidCount || 0;
        document.getElementById('paidThisWeek').textContent = paidThisWeek;
        
        // Calculate unpaid members (total members minus paid members)
        const unpaidThisWeek = totalMembers - paidThisWeek;
        document.getElementById('unpaidThisWeek').textContent = unpaidThisWeek;
        
        // Update total collected
        document.getElementById('totalCollected').textContent = formatCurrency(stats.totalCollected || 0);
    } catch (error) {
        console.error('Error updating summary:', error);
    }
}

// Helper function to get week number
function getWeekNumber(date) {
    const diffTime = Math.abs(date - WEEK_START_DATE);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
}

// Generate and download PDF report
async function generatePDF(analysisData, summaryData) {
    if (!authToken) {
        alert('Please login as admin to download reports');
        return;
    }
    try {
        // Initialize jsPDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(20);
        doc.text('LEDO Sports Academy', 105, 15, { align: 'center' });
        doc.setFontSize(16);
        doc.text('Weekly Analysis Report', 105, 25, { align: 'center' });

        // Add period
        const month = document.getElementById('analysisMonth').value;
        const year = document.getElementById('analysisYear').value;
        const period = month === 'all' ? `Year ${year}` : 
                      `${new Date(2025, parseInt(month), 1).toLocaleString('default', { month: 'long' })} ${year}`;
        doc.setFontSize(12);
        doc.text(`Period: ${period}`, 105, 35, { align: 'center' });

        // Add summary section
        doc.setFontSize(14);
        doc.text('Summary', 14, 45);

        // Create summary table data
        const summaryTableData = [
            ['Total Collections', formatCurrency(summaryData.totalCollected)],
            ['Total Expenses', formatCurrency(summaryData.totalExpenses)],
            ['Net Amount', formatCurrency(summaryData.netAmount)],
            ['Average Weekly Collection', formatCurrency(summaryData.averageWeeklyCollection)]
        ];

        // Add summary table
        doc.autoTable({
            startY: 50,
            head: [['Metric', 'Amount']],
            body: summaryTableData,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
            styles: { fontSize: 10, cellPadding: 5 }
        });

        // Add weekly breakdown title
        doc.setFontSize(14);
        doc.text('Weekly Breakdown', 14, doc.lastAutoTable.finalY + 15);

        // Prepare weekly data
        const weeklyTableData = analysisData.map(week => {
            const weekStartDate = new Date(WEEK_START_DATE);
            weekStartDate.setDate(weekStartDate.getDate() + (week.weekNumber - 1) * 7);
            const weekEndDate = new Date(weekStartDate);
            weekEndDate.setDate(weekEndDate.getDate() + 6);

            return [
                `Week ${week.weekNumber}\n${formatDate(weekStartDate)}\n${formatDate(weekEndDate)}`,
                formatCurrency(week.totalCollected),
                week.membersPaid.toString(),
                formatCurrency(week.expenses),
                formatCurrency(week.netAmount)
            ];
        });

        // Add weekly breakdown table with improved formatting
        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 20,
            head: [['Week', 'Collections', 'Members Paid', 'Expenses', 'Net Amount']],
            body: weeklyTableData,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
            styles: { 
                fontSize: 10, 
                cellPadding: 5,
                lineColor: [200, 200, 200],
                lineWidth: 0.1
            },
            columnStyles: {
                0: { cellWidth: 55, fontStyle: 'bold' },
                1: { cellWidth: 35, halign: 'right' },
                2: { cellWidth: 25, halign: 'center' },
                3: { cellWidth: 35, halign: 'right' },
                4: { cellWidth: 35, halign: 'right' }
            },
            didParseCell: function(data) {
                if (data.column.index === 0) {
                    data.cell.styles.cellPadding = { top: 4, right: 4, bottom: 4, left: 4 };
                }
            }
        });

        // Add footer with generation timestamp
        const today = new Date();
        doc.setFontSize(10);
        doc.text(
            `Generated on: ${today.toLocaleDateString()} ${today.toLocaleTimeString()}`,
            14,
            doc.internal.pageSize.height - 10
        );

        // Save the PDF
        const fileName = `LEDO-Sports-Academy-Analysis-${period.replace(/\s+/g, '-')}.pdf`;
        doc.save(fileName);

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
    }
}

// Initialize year selector and analysis filters
function initYearSelector() {
    const select = document.getElementById('analysisYear');
    const monthSelect = document.getElementById('analysisMonth');
    const downloadBtn = document.getElementById('downloadAnalysisBtn');
    
    // Set initial year
    select.innerHTML = '<option value="2025">2025</option>';
    
    // Load initial analysis
    loadWeeklyAnalysis(2025, 'all');

    // Add change event listeners
    select.addEventListener('change', (e) => {
        loadWeeklyAnalysis(parseInt(e.target.value), monthSelect.value);
    });

    monthSelect.addEventListener('change', (e) => {
        loadWeeklyAnalysis(parseInt(select.value), e.target.value);
    });

    // Add download button event listener with error handling
    downloadBtn.addEventListener('click', () => {
        try {
            if (!window.currentAnalysisData || !window.currentSummaryData) {
                throw new Error('Analysis data not available');
            }
            generatePDF(window.currentAnalysisData, window.currentSummaryData);
        } catch (error) {
            console.error('Error handling PDF download:', error);
            alert('Unable to generate PDF. Please make sure data is loaded and try again.');
        }
    });
}

// Load weekly analysis data
async function loadWeeklyAnalysis(year = 2025, month = 'all') {
    try {
        const data = await api.getWeeklyAnalysis(year);
        
        // Filter data by month if needed
        let filteredAnalysis = data.weeklyAnalysis;
        if (month !== 'all') {
            filteredAnalysis = data.weeklyAnalysis.filter(week => {
                const weekStartDate = new Date(WEEK_START_DATE);
                weekStartDate.setDate(weekStartDate.getDate() + (week.weekNumber - 1) * 7);
                return weekStartDate.getMonth() === parseInt(month);
            });
        }

        // Calculate summary for filtered data
        const summary = {
            totalCollected: filteredAnalysis.reduce((sum, week) => sum + week.totalCollected, 0),
            totalExpenses: filteredAnalysis.reduce((sum, week) => sum + week.expenses, 0),
            netAmount: filteredAnalysis.reduce((sum, week) => sum + week.netAmount, 0),
            averageWeeklyCollection: filteredAnalysis.reduce((sum, week) => sum + week.totalCollected, 0) / 
                                   (filteredAnalysis.length || 1)
        };

        // Store current data for PDF generation
        window.currentAnalysisData = filteredAnalysis;
        window.currentSummaryData = summary;

        // Update summary
        document.getElementById('analysisTotalCollections').textContent = formatCurrency(summary.totalCollected);
        document.getElementById('analysisTotalExpenses').textContent = formatCurrency(summary.totalExpenses);
        document.getElementById('analysisNetAmount').textContent = formatCurrency(summary.netAmount);
        document.getElementById('analysisAvgCollection').textContent = formatCurrency(summary.averageWeeklyCollection);

        // Update table
        const tbody = document.querySelector('#analysisTable tbody');
        tbody.innerHTML = '';

        filteredAnalysis.forEach(week => {
            const weekStartDate = new Date(WEEK_START_DATE);
            weekStartDate.setDate(weekStartDate.getDate() + (week.weekNumber - 1) * 7);
            const weekEndDate = new Date(weekStartDate);
            weekEndDate.setDate(weekEndDate.getDate() + 6);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    Week ${week.weekNumber}
                    <br>
                    <small>${formatDate(weekStartDate)} - ${formatDate(weekEndDate)}</small>
                </td>
                <td>${formatCurrency(week.totalCollected)}</td>
                <td>${week.membersPaid}</td>
                <td>${formatCurrency(week.expenses)}</td>
                <td class="${week.netAmount >= 0 ? 'positive-amount' : 'negative-amount'}">
                    ${formatCurrency(week.netAmount)}
                </td>
            `;
            tbody.appendChild(row);
        });

        // Show no data message if needed
        if (filteredAnalysis.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px;">
                        No data available for the selected month
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading weekly analysis:', error);
    }
}

// Edit member function
async function editMember(memberId) {
    try {
        console.log('Loading member details for:', memberId);
        const response = await fetch(`${API_URL}/api/members/${memberId}`);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response');
        }

        const member = await response.json();
        console.log('Loaded member details:', member);

        if (!member) {
            throw new Error('Member not found');
        }

        // Populate the edit form
        document.getElementById('editMemberId').value = member._id;
        document.getElementById('editMemberName').value = member.name || '';
        document.getElementById('editMemberPhone').value = member.phone || '';
        document.getElementById('editMemberPhoto').value = member.photo || '';
        document.getElementById('editPhotoPreview').src = member.photo || DEFAULT_AVATAR;

        // Show the modal
        editMemberModal.style.display = 'block';
    } catch (error) {
        console.error('Error loading member details:', error);
        alert('Error loading member details: ' + error.message);
    }
}

// Handle edit member form submission
async function handleEditMember(e) {
    e.preventDefault();
    const memberId = document.getElementById('editMemberId').value;
    const name = document.getElementById('editMemberName').value.trim();
    const phone = document.getElementById('editMemberPhone').value.trim();
    const photo = document.getElementById('editMemberPhoto').value.trim();

    if (!name || !phone) {
        alert('Name and phone number are required');
        return;
    }

    try {
        console.log('Updating member:', { memberId, name, phone, photo });
        const response = await fetch(`${API_URL}/api/members/${memberId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, phone, photo })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to update member');
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response');
        }

        await response.json(); // Make sure we can parse the response
        alert('Member updated successfully!');
        editMemberModal.style.display = 'none';
        await loadData();
    } catch (error) {
        console.error('Error updating member:', error);
        alert('Error updating member: ' + error.message);
    }
}

// Delete member function
async function deleteMember(memberId) {
    if (!confirm('Are you sure you want to delete this member?')) {
        return;
    }

    try {
        await api.deleteMember(memberId);
        alert('Member deleted successfully!');
        await loadData();
    } catch (error) {
        console.error('Error deleting member:', error);
        alert('Error deleting member: ' + error.message);
    }
} 
