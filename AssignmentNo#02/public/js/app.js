
const API_BASE = '/api';

/**
 * REST API Client Service (Async / Await + Fetch API)
 */
const ApiService = {
    async getItems(queryParams = {}) {
        try {
            const url = new URL(`${window.location.origin}${API_BASE}/items`);
            Object.keys(queryParams).forEach(key => {
                if (queryParams[key] !== undefined && queryParams[key] !== '') {
                    url.searchParams.append(key, queryParams[key]);
                }
            });

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('ApiService.getItems error:', error);
            showToast(`Could not load records: ${error.message}`, 'error');
            throw error;
        }
    },

    async getItemById(id) {
        try {
            const response = await fetch(`${API_BASE}/items/${id}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                if (response.status === 404) throw new Error('Record not found');
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error(`ApiService.getItemById(${id}) error:`, error);
            throw error;
        }
    },

    async createItem(itemData) {
        try {
            const response = await fetch(`${API_BASE}/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(itemData)
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to submit item report');
            }

            return result.data;
        } catch (error) {
            console.error('ApiService.createItem error:', error);
            throw error;
        }
    },

    async updateItem(id, itemData) {
        try {
            const response = await fetch(`${API_BASE}/items/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(itemData)
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || `Failed to update record #${id}`);
            }

            return result.data;
        } catch (error) {
            console.error(`ApiService.updateItem(${id}) error:`, error);
            throw error;
        }
    },

    async deleteItem(id) {
        try {
            const response = await fetch(`${API_BASE}/items/${id}`, {
                method: 'DELETE',
                headers: { 'Accept': 'application/json' }
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || `Failed to delete record #${id}`);
            }

            return result.data;
        } catch (error) {
            console.error(`ApiService.deleteItem(${id}) error:`, error);
            throw error;
        }
    },

    async getStats() {
        try {
            const response = await fetch(`${API_BASE}/stats`);
            if (!response.ok) throw new Error('Statistics unavailable');
            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('ApiService.getStats error:', error);
            return null;
        }
    }
};

/**
 * Notification Toast System (Demonstrates Callback functions)
 * @param {string} message - Toast message text
 * @param {string} type - 'success' | 'error' | 'warning' | 'info'
 * @param {Function} [onDismissCallback] - Optional callback function executed upon dismiss
 */
function showToast(message, type = 'info', onDismissCallback = null) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconName = 'info';
    if (type === 'success') iconName = 'check_circle';
    if (type === 'error') iconName = 'error';
    if (type === 'warning') iconName = 'warning';

    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="material-icons" style="font-size: 18px;">${iconName}</span>
            <span class="toast-msg">${escapeHtml(message)}</span>
        </div>
        <button class="toast-btn-close" aria-label="Close notification">
            <span class="material-icons" style="font-size: 16px;">close</span>
        </button>
    `;

    container.appendChild(toast);

    const dismiss = () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(8px)';
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
            if (typeof onDismissCallback === 'function') {
                onDismissCallback(message, type);
            }
        }, 200);
    };

    toast.querySelector('.toast-btn-close').addEventListener('click', dismiss);
    setTimeout(dismiss, 3500);
}

/**
 * Modal Confirmation Dialog (Demonstrates Explicit ES6 Promises)
 * @param {string} title - Heading of modal
 * @param {string} message - Confirmation prompt text
 * @param {string} confirmText - Label on primary action button
 * @returns {Promise<boolean>}
 */
function showConfirmModal(title, message, confirmText = 'Confirm') {
    return new Promise((resolve) => {
        const existing = document.getElementById('global-confirm-modal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'global-confirm-modal';
        overlay.className = 'modal-overlay';

        overlay.innerHTML = `
            <div class="modal-card">
                <h3>${escapeHtml(title)}</h3>
                <p>${escapeHtml(message)}</p>
                <div class="modal-btns">
                    <button type="button" class="btn btn-secondary modal-btn-cancel">Cancel</button>
                    <button type="button" class="btn btn-danger modal-btn-confirm">
                        <span class="material-icons">delete</span>
                        ${escapeHtml(confirmText)}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        setTimeout(() => overlay.classList.add('show'), 10);

        const close = (result) => {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.remove();
                resolve(result);
            }, 180);
        };

        overlay.querySelector('.modal-btn-cancel').addEventListener('click', () => close(false));
        overlay.querySelector('.modal-btn-confirm').addEventListener('click', () => close(true));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close(false);
        });
    });
}

/**
 * Utility: HTML Sanitizer
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
}

/**
 * Utility: Format date to human-readable format (e.g., Aug 10, 2026)
 */
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch (e) {
        return dateStr;
    }
}

/**
 * Badge styling helpers
 */
function getStatusTagHTML(status) {
    const s = (status || '').toLowerCase().trim();
    let cls = 'tag-status-reported';
    let icon = 'info';

    if (s === 'searching') { cls = 'tag-status-searching'; icon = 'search'; }
    else if (s === 'found') { cls = 'tag-status-found'; icon = 'check_circle'; }
    else if (s === 'returned') { cls = 'tag-status-returned'; icon = 'done_all'; }
    else if (s === 'claim pending') { cls = 'tag-status-claim-pending'; icon = 'hourglass_empty'; }

    return `<span class="tag ${cls}"><span class="material-icons">${icon}</span>${escapeHtml(status)}</span>`;
}

function getTypeTagHTML(type) {
    const isLost = (type || '').toLowerCase() === 'lost';
    const cls = isLost ? 'tag-lost' : 'tag-found';
    const icon = isLost ? 'search' : 'inventory_2';
    return `<span class="tag ${cls}"><span class="material-icons">${icon}</span>${escapeHtml(type)}</span>`;
}

/**
 * Render dynamic item card HTML
 */
function createItemCardHTML(item) {
    const typeBadge = getTypeTagHTML(item.type);
    const statusBadge = getStatusTagHTML(item.status);
    const formattedDate = formatDate(item.date);

    return `
        <div class="card" data-id="${item.id}">
            <div class="card-header">
                <div class="badge-cluster">
                    ${typeBadge}
                    ${statusBadge}
                </div>
                <span class="card-ref">Ref #${item.id}</span>
            </div>
            
            <div class="card-body">
                <h3 class="card-title">${escapeHtml(item.name)}</h3>
                <p class="card-desc">${escapeHtml(item.description || 'No extra details were added.')}</p>
                
                <ul class="card-meta-table">
                    <li class="card-meta-row">
                        <span class="card-meta-label">
                            <span class="material-icons">category</span> Category
                        </span>
                        <span class="card-meta-val">${escapeHtml(item.category)}</span>
                    </li>
                    <li class="card-meta-row">
                        <span class="card-meta-label">
                            <span class="material-icons">place</span> Location
                        </span>
                        <span class="card-meta-val">${escapeHtml(item.location)}</span>
                    </li>
                    <li class="card-meta-row">
                        <span class="card-meta-label">
                            <span class="material-icons">event</span> Date
                        </span>
                        <span class="card-meta-val">${formattedDate}</span>
                    </li>
                </ul>
            </div>
            
            <div class="card-footer">
                <a href="details.html?id=${item.id}" class="btn btn-secondary btn-sm">
                    <span class="material-icons">visibility</span> View
                </a>
                <div style="display: flex; gap: 0.35rem;">
                    <a href="add.html?id=${item.id}" class="btn btn-secondary btn-sm" title="Edit">
                        <span class="material-icons">edit</span> Edit
                    </a>
                    <button type="button" class="btn btn-danger btn-sm delete-record-btn" data-id="${item.id}" data-name="${escapeHtml(item.name)}" title="Delete">
                        <span class="material-icons">delete</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Initialize navbar & dashboard stats
 */
document.addEventListener('DOMContentLoaded', () => {
    const mobileBtn = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }

    if (document.getElementById('stat-total-count')) {
        loadDashboardStats();
    }
});

async function loadDashboardStats() {
    try {
        const stats = await ApiService.getStats();
        if (!stats) return;

        const totalEl = document.getElementById('stat-total-count');
        const lostEl = document.getElementById('stat-lost-count');
        const foundEl = document.getElementById('stat-found-count');
        const resolvedEl = document.getElementById('stat-resolved-count');

        if (totalEl) totalEl.textContent = stats.total;
        if (lostEl) lostEl.textContent = stats.lost;
        if (foundEl) foundEl.textContent = stats.found;
        if (resolvedEl) resolvedEl.textContent = stats.returned;
    } catch (err) {
        console.error('Failed to load dashboard stats:', err);
    }
}
