/**
 * ============================================================================
 * UET Peshawar - Department of Computer Science
 * CS311 / CS224 Web Technologies - Assignment No. 02
 * Project: Lost & Found Portal
 * Backend Server: Express.js with Node.js File System (fs/promises)
 * ============================================================================
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'items.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Helper: Read items from JSON file using fs/promises
 * Demonstrates: File Operations (Read) & Async/Await Error Handling
 */
async function readItemsFromFile() {
    try {
        const fileContent = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(fileContent || '[]');
    } catch (error) {
        if (error.code === 'ENOENT') {
            // If file doesn't exist, create empty array file
            await writeItemsToFile([]);
            return [];
        }
        console.error('Error reading items.json:', error);
        throw error;
    }
}

/**
 * Helper: Write items to JSON file using fs/promises
 * Demonstrates: File Operations (Write) & Async/Await
 */
async function writeItemsToFile(items) {
    try {
        const dir = path.dirname(DATA_FILE);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error writing to items.json:', error);
        throw error;
    }
}

// ==========================================
// REST API ENDPOINTS
// ==========================================

/**
 * @route   GET /api/items
 * @desc    Read all items (with optional search, category, type, status filter)
 * @access  Public
 */
app.get('/api/items', async (req, res) => {
    try {
        const items = await readItemsFromFile();
        const { search, type, category, status, sort } = req.query;

        let filtered = [...items];

        // Type filter (Lost / Found / All)
        if (type && type !== 'All') {
            filtered = filtered.filter(item => item.type.toLowerCase() === type.toLowerCase());
        }

        // Category filter
        if (category && category !== 'All') {
            filtered = filtered.filter(item => item.category.toLowerCase() === category.toLowerCase());
        }

        // Status filter
        if (status && status !== 'All') {
            filtered = filtered.filter(item => item.status.toLowerCase() === status.toLowerCase());
        }

        // Search query across name and description
        if (search && search.trim() !== '') {
            const query = search.toLowerCase().trim();
            filtered = filtered.filter(item =>
                (item.name && item.name.toLowerCase().includes(query)) ||
                (item.description && item.description.toLowerCase().includes(query)) ||
                (item.location && item.location.toLowerCase().includes(query))
            );
        }

        // Sorting
        if (sort === 'name-asc') {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sort === 'name-desc') {
            filtered.sort((a, b) => b.name.localeCompare(a.name));
        } else if (sort === 'date-asc') {
            filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        } else if (sort === 'date-desc') {
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        } else {
            // Default newest / highest ID first
            filtered.sort((a, b) => b.id - a.id);
        }

        res.status(200).json({
            success: true,
            count: filtered.length,
            totalRecords: items.length,
            data: filtered
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while fetching items',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/stats
 * @desc    Get portal statistics (Total, Lost, Found, Resolved, Recent)
 * @access  Public
 */
app.get('/api/stats', async (req, res) => {
    try {
        const items = await readItemsFromFile();
        const total = items.length;
        const lost = items.filter(i => i.type.toLowerCase() === 'lost').length;
        const found = items.filter(i => i.type.toLowerCase() === 'found').length;
        const returned = items.filter(i => i.status.toLowerCase() === 'returned').length;
        const searching = items.filter(i => i.status.toLowerCase() === 'searching').length;
        const claimPending = items.filter(i => i.status.toLowerCase() === 'claim pending').length;

        // Categories count
        const categories = {};
        items.forEach(i => {
            categories[i.category] = (categories[i.category] || 0) + 1;
        });

        res.status(200).json({
            success: true,
            data: {
                total,
                lost,
                found,
                returned,
                searching,
                claimPending,
                categories
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to compute statistics',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/items/:id
 * @desc    Read one single item by ID
 * @access  Public
 */
app.get('/api/items/:id', async (req, res) => {
    try {
        const items = await readItemsFromFile();
        const itemId = parseInt(req.params.id, 10);

        if (isNaN(itemId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid item ID format'
            });
        }

        const item = items.find(i => i.id === itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: `Item with ID ${itemId} not found`
            });
        }

        res.status(200).json({
            success: true,
            data: item
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching item details',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/items
 * @desc    Create a new lost/found item
 * @access  Public
 */
app.post('/api/items', async (req, res) => {
    try {
        const { type, name, category, location, date, description, status, contactEmail, contactPhone } = req.body;

        // Validation
        if (!name || !type || !category || !location || !date) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields: name, type, category, location, date'
            });
        }

        const items = await readItemsFromFile();

        // Calculate auto-incrementing ID
        const maxId = items.length > 0 ? Math.max(...items.map(i => Number(i.id) || 0)) : 1000;
        const newId = maxId + 1;

        const newItem = {
            id: newId,
            type: type.trim(),
            name: name.trim(),
            category: category.trim(),
            location: location.trim(),
            date: date,
            description: (description || '').trim(),
            status: status ? status.trim() : (type.toLowerCase() === 'lost' ? 'Searching' : 'Found'),
            contactEmail: contactEmail ? contactEmail.trim() : '',
            contactPhone: contactPhone ? contactPhone.trim() : '',
            createdAt: new Date().toISOString()
        };

        items.unshift(newItem); // Place newly added item at top
        await writeItemsToFile(items);

        res.status(201).json({
            success: true,
            message: 'Item recorded successfully',
            data: newItem
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create item record',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/items/:id
 * @desc    Update an existing item
 * @access  Public
 */
app.put('/api/items/:id', async (req, res) => {
    try {
        const itemId = parseInt(req.params.id, 10);
        if (isNaN(itemId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid item ID format'
            });
        }

        const items = await readItemsFromFile();
        const index = items.findIndex(i => i.id === itemId);

        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: `Item with ID ${itemId} not found`
            });
        }

        const currentItem = items[index];
        const { type, name, category, location, date, description, status, contactEmail, contactPhone } = req.body;

        const updatedItem = {
            ...currentItem,
            type: type !== undefined ? type.trim() : currentItem.type,
            name: name !== undefined ? name.trim() : currentItem.name,
            category: category !== undefined ? category.trim() : currentItem.category,
            location: location !== undefined ? location.trim() : currentItem.location,
            date: date !== undefined ? date : currentItem.date,
            description: description !== undefined ? description.trim() : currentItem.description,
            status: status !== undefined ? status.trim() : currentItem.status,
            contactEmail: contactEmail !== undefined ? contactEmail.trim() : (currentItem.contactEmail || ''),
            contactPhone: contactPhone !== undefined ? contactPhone.trim() : (currentItem.contactPhone || ''),
            updatedAt: new Date().toISOString()
        };

        items[index] = updatedItem;
        await writeItemsToFile(items);

        res.status(200).json({
            success: true,
            message: `Item #${itemId} updated successfully`,
            data: updatedItem
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update item record',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/items/:id
 * @desc    Delete an item record
 * @access  Public
 */
app.delete('/api/items/:id', async (req, res) => {
    try {
        const itemId = parseInt(req.params.id, 10);
        if (isNaN(itemId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid item ID format'
            });
        }

        const items = await readItemsFromFile();
        const itemToDelete = items.find(i => i.id === itemId);

        if (!itemToDelete) {
            return res.status(404).json({
                success: false,
                message: `Item with ID ${itemId} not found`
            });
        }

        const remainingItems = items.filter(i => i.id !== itemId);
        await writeItemsToFile(remainingItems);

        res.status(200).json({
            success: true,
            message: `Item #${itemId} deleted successfully`,
            data: itemToDelete
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete item record',
            error: error.message
        });
    }
});

// HTML Page Route Helpers for clean URLs
app.get('/items', (req, res) => res.sendFile(path.join(__dirname, 'public', 'items.html')));
app.get('/add', (req, res) => res.sendFile(path.join(__dirname, 'public', 'add.html')));
app.get('/details', (req, res) => res.sendFile(path.join(__dirname, 'public', 'details.html')));
app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'public', 'about.html')));

// Start server only when executed directly (not when required as a module)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(`  UET Peshawar - Lost & Found Portal Server`);
        console.log(`  Server running at: http://localhost:${PORT}`);
        console.log(`  API Base URL:      http://localhost:${PORT}/api/items`);
        console.log(`====================================================`);
    });
}

module.exports = app;
