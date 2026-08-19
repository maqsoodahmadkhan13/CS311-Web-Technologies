
document.addEventListener('DOMContentLoaded', async () => {
    const itemForm = document.getElementById('item-form');
    const formTitle = document.getElementById('form-page-title');
    const formSubtitle = document.getElementById('form-page-subtitle');
    const submitBtn = document.getElementById('submit-btn');
    const cancelBtn = document.getElementById('cancel-btn');

    const inputName = document.getElementById('item-name');
    const inputTypeLost = document.getElementById('type-lost');
    const inputTypeFound = document.getElementById('type-found');
    const inputCategory = document.getElementById('item-category');
    const inputLocation = document.getElementById('item-location');
    const inputDate = document.getElementById('item-date');
    const inputStatus = document.getElementById('item-status');
    const inputDescription = document.getElementById('item-description');
    const inputEmail = document.getElementById('item-email');
    const inputPhone = document.getElementById('item-phone');

    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('id');
    const defaultType = urlParams.get('type');

    const isEditMode = Boolean(editId);

    if (!isEditMode && inputDate) {
        inputDate.value = new Date().toISOString().split('T')[0];
    }

    if (!isEditMode && defaultType) {
        if (defaultType.toLowerCase() === 'found' && inputTypeFound) {
            inputTypeFound.checked = true;
            syncStatus('Found');
        } else if (inputTypeLost) {
            inputTypeLost.checked = true;
            syncStatus('Lost');
        }
    }

    document.querySelectorAll('input[name="type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (!isEditMode) syncStatus(e.target.value);
        });
    });

    function syncStatus(selectedType) {
        if (!inputStatus) return;
        inputStatus.value = selectedType.toLowerCase() === 'lost' ? 'Searching' : 'Found';
    }

    if (isEditMode) {
        if (formTitle) formTitle.textContent = `Edit listing #${editId}`;
        if (formSubtitle) formSubtitle.textContent = 'Change anything that is wrong or out of date.';
        if (submitBtn) {
            submitBtn.innerHTML = '<span class="material-icons">save</span> Save changes';
        }

        try {
            const item = await ApiService.getItemById(editId);
            if (item) {
                if (inputName) inputName.value = item.name || '';
                if (item.type && item.type.toLowerCase() === 'found') {
                    if (inputTypeFound) inputTypeFound.checked = true;
                } else {
                    if (inputTypeLost) inputTypeLost.checked = true;
                }

                if (inputCategory) inputCategory.value = item.category || '';
                if (inputLocation) inputLocation.value = item.location || '';
                if (inputDate) inputDate.value = item.date || '';
                if (inputStatus) inputStatus.value = item.status || 'Searching';
                if (inputDescription) inputDescription.value = item.description || '';
                if (inputEmail) inputEmail.value = item.contactEmail || '';
                if (inputPhone) inputPhone.value = item.contactPhone || '';
            }
        } catch (error) {
            showToast(`Could not load record #${editId}: ${error.message}`, 'error');
            setTimeout(() => { window.location.href = 'items.html'; }, 1500);
        }
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (isEditMode) {
                window.location.href = `details.html?id=${editId}`;
            } else {
                window.location.href = 'items.html';
            }
        });
    }

    if (itemForm) {
        itemForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = inputName ? inputName.value.trim() : '';
            const type = document.querySelector('input[name="type"]:checked')?.value || 'Lost';
            const category = inputCategory ? inputCategory.value.trim() : '';
            const location = inputLocation ? inputLocation.value.trim() : '';
            const date = inputDate ? inputDate.value : '';
            const status = inputStatus ? inputStatus.value : (type === 'Lost' ? 'Searching' : 'Found');
            const description = inputDescription ? inputDescription.value.trim() : '';
            const contactEmail = inputEmail ? inputEmail.value.trim() : '';
            const contactPhone = inputPhone ? inputPhone.value.trim() : '';

            if (!name || !category || !location || !date) {
                showToast('Please fill in the required fields first.', 'warning');
                return;
            }

            const payload = {
                name,
                type,
                category,
                location,
                date,
                status,
                description,
                contactEmail,
                contactPhone
            };

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-icons">hourglass_empty</span> Saving...';

            try {
                if (isEditMode) {
                    await ApiService.updateItem(editId, payload);
                    showToast(`Listing #${editId} was updated.`, 'success');
                    setTimeout(() => {
                        window.location.href = `details.html?id=${editId}`;
                    }, 800);
                } else {
                    const createdItem = await ApiService.createItem(payload);
                    showToast(`Listing #${createdItem.id} is now on the board.`, 'success');
                    setTimeout(() => {
                        window.location.href = `details.html?id=${createdItem.id}`;
                    }, 800);
                }
            } catch (error) {
                showToast(`Error: ${error.message}`, 'error');
                submitBtn.disabled = false;
                submitBtn.innerHTML = isEditMode
                    ? '<span class="material-icons">save</span> Save changes'
                    : '<span class="material-icons">send</span> Submit';
            }
        });
    }
});
