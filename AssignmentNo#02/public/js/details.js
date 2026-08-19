
document.addEventListener('DOMContentLoaded', async () => {
    const detailsContainer = document.getElementById('details-content');
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');

    if (!itemId) {
        renderError('No item was selected. Open a listing from the Browse Items page.');
        return;
    }

    try {
        const item = await ApiService.getItemById(itemId);
        renderItemDetails(item);
    } catch (error) {
        renderError(`Listing #${itemId} is not available. It may have been deleted.`);
    }

    function renderError(message) {
        if (!detailsContainer) return;
        detailsContainer.innerHTML = `
            <div class="state-box">
                <span class="material-icons">error</span>
                <h3>Item not found</h3>
                <p>${escapeHtml(message)}</p>
                <a href="items.html" class="btn btn-navy btn-sm" style="margin-top: 0.5rem;">
                    <span class="material-icons">arrow_back</span> Back to listings
                </a>
            </div>
        `;
    }

    function renderItemDetails(item) {
        if (!detailsContainer) return;

        const typeTag = getTypeTagHTML(item.type);
        const statusTag = getStatusTagHTML(item.status);
        const formattedDate = formatDate(item.date);

        document.title = `${item.name} - UET Lost & Found`;

        detailsContainer.innerHTML = `
            <div class="details-box">
                <div class="details-top">
                    <div>
                        <div class="badge-cluster" style="margin-bottom: 0.35rem;">
                            ${typeTag}
                            ${statusTag}
                        </div>
                        <h1>${escapeHtml(item.name)}</h1>
                        <p style="opacity: 0.85; font-size: 0.82rem; font-family: monospace;">Listing #${item.id}</p>
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        <a href="add.html?id=${item.id}" class="btn btn-secondary btn-sm">
                            <span class="material-icons">edit</span> Edit
                        </a>
                        <button type="button" class="btn btn-danger btn-sm" id="details-delete-btn">
                            <span class="material-icons">delete</span> Delete
                        </button>
                    </div>
                </div>

                <div class="details-content">
                    <div class="details-grid-spec">
                        <div class="spec-item">
                            <div class="spec-label">Category</div>
                            <div class="spec-val">${escapeHtml(item.category)}</div>
                        </div>
                        <div class="spec-item">
                            <div class="spec-label">Campus Location</div>
                            <div class="spec-val">${escapeHtml(item.location)}</div>
                        </div>
                        <div class="spec-item">
                            <div class="spec-label">Date Recorded</div>
                            <div class="spec-val">${formattedDate}</div>
                        </div>
                        <div class="spec-item">
                            <div class="spec-label">Current Status</div>
                            <div class="spec-val">${escapeHtml(item.status)}</div>
                        </div>
                    </div>

                    <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--text-heading);">Details</h4>
                    <div class="desc-container">
                        <p style="font-size: 0.9rem; color: var(--text-body);">${escapeHtml(item.description || 'No extra details were added.')}</p>
                    </div>

                    ${(item.contactEmail || item.contactPhone) ? `
                        <h4 style="font-size: 0.95rem; margin-bottom: 0.5rem; color: var(--text-heading);">Contact</h4>
                        <div class="details-grid-spec" style="margin-bottom: 1.5rem;">
                            ${item.contactEmail ? `
                                <div class="spec-item">
                                    <div class="spec-label">Email Address</div>
                                    <div class="spec-val">
                                        <a href="mailto:${escapeHtml(item.contactEmail)}">${escapeHtml(item.contactEmail)}</a>
                                    </div>
                                </div>
                            ` : ''}
                            ${item.contactPhone ? `
                                <div class="spec-item">
                                    <div class="spec-label">Phone Number</div>
                                    <div class="spec-val">
                                        <a href="tel:${escapeHtml(item.contactPhone)}">${escapeHtml(item.contactPhone)}</a>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}

                    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 1.25rem; border-top: 1px solid var(--border-color); flex-wrap: wrap; gap: 0.75rem;">
                        <a href="items.html" class="btn btn-secondary btn-sm">
                            <span class="material-icons">arrow_back</span> Back to listings
                        </a>

                        ${item.status !== 'Returned' ? `
                            <button type="button" class="btn btn-primary btn-sm" id="mark-returned-btn">
                                <span class="material-icons">done_all</span> Mark as returned
                            </button>
                        ` : `
                            <span class="tag tag-status-returned" style="font-size: 0.85rem; padding: 0.4rem 0.75rem;">
                                <span class="material-icons">done_all</span> Returned
                            </span>
                        `}
                    </div>
                </div>
            </div>
        `;

        const markReturnedBtn = document.getElementById('mark-returned-btn');
        if (markReturnedBtn) {
            markReturnedBtn.addEventListener('click', async () => {
                try {
                    await ApiService.updateItem(item.id, { status: 'Returned' });
                    showToast(`Listing #${item.id} is now marked as returned.`, 'success');
                    setTimeout(() => window.location.reload(), 800);
                } catch (err) {
                    showToast(`Update failed: ${err.message}`, 'error');
                }
            });
        }

        const deleteBtn = document.getElementById('details-delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                const confirmed = await showConfirmModal(
                    'Delete this listing?',
                    `Remove "${item.name}" (#${item.id}) from the board?`,
                    'Delete'
                );

                if (confirmed) {
                    try {
                        await ApiService.deleteItem(item.id);
                        showToast(`Listing #${item.id} was deleted.`, 'success');
                        setTimeout(() => { window.location.href = 'items.html'; }, 1000);
                    } catch (err) {
                        showToast(`Delete failed: ${err.message}`, 'error');
                    }
                }
            });
        }
    }
});
