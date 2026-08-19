

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const typeFilter = document.getElementById('type-filter');
    const categoryFilter = document.getElementById('category-filter');
    const statusFilter = document.getElementById('status-filter');
    const sortFilter = document.getElementById('sort-filter');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const itemsContainer = document.getElementById('items-grid-container');
    const resultsCountEl = document.getElementById('results-count');

    let allItems = [];

    // Initialize from URL search params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('search') && searchInput) searchInput.value = urlParams.get('search');
    if (urlParams.has('type') && typeFilter) typeFilter.value = urlParams.get('type');
    if (urlParams.has('category') && categoryFilter) categoryFilter.value = urlParams.get('category');
    if (urlParams.has('status') && statusFilter) statusFilter.value = urlParams.get('status');

    async function loadItems() {
        if (!itemsContainer) return;

        itemsContainer.innerHTML = `
            <div class="state-box">
                <div class="spinner"></div>
                <h3>Loading listings...</h3>
                <p>Fetching items from the server.</p>
            </div>
        `;

        try {
            allItems = await ApiService.getItems();
            populateCategoryDropdown(allItems);
            applyFiltersAndRender();
        } catch (error) {
            itemsContainer.innerHTML = `
                <div class="state-box">
                    <span class="material-icons">error</span>
                    <h3>Could not load listings</h3>
                    <p>${escapeHtml(error.message)}</p>
                    <button class="btn btn-primary btn-sm" onclick="window.location.reload()">Retry</button>
                </div>
            `;
        }
    }

    function populateCategoryDropdown(items) {
        if (!categoryFilter) return;

        const categories = Array.from(new Set(items.map(i => i.category).filter(Boolean))).sort();
        const selectedValue = categoryFilter.value || 'All';

        categoryFilter.innerHTML = `<option value="All">All Categories</option>`;
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            if (cat.toLowerCase() === selectedValue.toLowerCase()) {
                option.selected = true;
            }
            categoryFilter.appendChild(option);
        });
    }

    function applyFiltersAndRender() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const selectedType = typeFilter ? typeFilter.value : 'All';
        const selectedCategory = categoryFilter ? categoryFilter.value : 'All';
        const selectedStatus = statusFilter ? statusFilter.value : 'All';
        const selectedSort = sortFilter ? sortFilter.value : 'date-desc';

        let filtered = [...allItems];

        // Search
        if (query) {
            filtered = filtered.filter(item =>
                (item.name && item.name.toLowerCase().includes(query)) ||
                (item.description && item.description.toLowerCase().includes(query)) ||
                (item.location && item.location.toLowerCase().includes(query))
            );
        }

        // Type
        if (selectedType && selectedType !== 'All') {
            filtered = filtered.filter(item => item.type && item.type.toLowerCase() === selectedType.toLowerCase());
        }

        // Category
        if (selectedCategory && selectedCategory !== 'All') {
            filtered = filtered.filter(item => item.category && item.category.toLowerCase() === selectedCategory.toLowerCase());
        }

        // Status
        if (selectedStatus && selectedStatus !== 'All') {
            filtered = filtered.filter(item => item.status && item.status.toLowerCase() === selectedStatus.toLowerCase());
        }

        // Sorting
        filtered.sort((a, b) => {
            if (selectedSort === 'name-asc') {
                return (a.name || '').localeCompare(b.name || '');
            } else if (selectedSort === 'name-desc') {
                return (b.name || '').localeCompare(a.name || '');
            } else if (selectedSort === 'date-asc') {
                return new Date(a.date) - new Date(b.date);
            } else if (selectedSort === 'date-desc') {
                return new Date(b.date) - new Date(a.date);
            }
            return (b.id || 0) - (a.id || 0);
        });

        if (resultsCountEl) {
            resultsCountEl.textContent = `Showing ${filtered.length} of ${allItems.length} listings`;
        }

        renderCards(filtered);
    }

    function renderCards(items) {
        if (!itemsContainer) return;

        if (items.length === 0) {
            itemsContainer.innerHTML = `
                <div class="state-box">
                    <span class="material-icons">search</span>
                    <h3>Nothing matches that search</h3>
                    <p>Try a shorter keyword, or clear the filters and browse the full list.</p>
                    <button type="button" class="btn btn-secondary btn-sm" id="empty-reset-btn" style="margin-top: 0.5rem;">Reset Filters</button>
                </div>
            `;
            const emptyResetBtn = document.getElementById('empty-reset-btn');
            if (emptyResetBtn) {
                emptyResetBtn.addEventListener('click', resetAllFilters);
            }
            return;
        }

        itemsContainer.innerHTML = items.map(item => createItemCardHTML(item)).join('');
        bindDeleteHandlers();
    }

    function bindDeleteHandlers() {
        const deleteButtons = itemsContainer.querySelectorAll('.delete-record-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                const itemId = btn.getAttribute('data-id');
                const itemName = btn.getAttribute('data-name');

                const confirmed = await showConfirmModal(
                    'Delete this listing?',
                    `Remove "${itemName}" (#${itemId}) from the board? You cannot undo this.`,
                    'Delete'
                );

                if (confirmed) {
                    try {
                        await ApiService.deleteItem(itemId);
                        showToast(`Listing #${itemId} was removed.`, 'success', (msg, type) => {
                            console.log(`[Callback] Notification closed: ${msg}`);
                        });
                        allItems = allItems.filter(i => String(i.id) !== String(itemId));
                        applyFiltersAndRender();
                    } catch (err) {
                        showToast(`Deletion failed: ${err.message}`, 'error');
                    }
                }
            });
        });
    }

    function resetAllFilters() {
        if (searchInput) searchInput.value = '';
        if (typeFilter) typeFilter.value = 'All';
        if (categoryFilter) categoryFilter.value = 'All';
        if (statusFilter) statusFilter.value = 'All';
        if (sortFilter) sortFilter.value = 'date-desc';
        applyFiltersAndRender();
    }

    if (searchInput) searchInput.addEventListener('input', applyFiltersAndRender);
    if (typeFilter) typeFilter.addEventListener('change', applyFiltersAndRender);
    if (categoryFilter) categoryFilter.addEventListener('change', applyFiltersAndRender);
    if (statusFilter) statusFilter.addEventListener('change', applyFiltersAndRender);
    if (sortFilter) sortFilter.addEventListener('change', applyFiltersAndRender);
    if (resetFiltersBtn) resetFiltersBtn.addEventListener('click', resetAllFilters);

    loadItems();
});
