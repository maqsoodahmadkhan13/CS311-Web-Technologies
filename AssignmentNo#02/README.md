# UET Peshawar - Lost & Found Portal
**Course:** CS311 / CS224 Web Technologies — Assignment No. 02  
**Instructor:** Mr. Mohammad  
**Department:** Department of Computer Science, University of Engineering & Technology, Peshawar  

---

## 📌 Project Overview
The **Lost & Found Portal** is a web application designed for university students, faculty, and administrative staff to report, track, search, filter, update, and manage lost and found items across the UET Peshawar campus.

The project demonstrates the core web technology stack:
$$\text{JSON} \longrightarrow \text{JavaScript} \longrightarrow \text{DOM} \longrightarrow \text{CRUD} \longrightarrow \text{Fetch/API} \longrightarrow \text{Node.js} \longrightarrow \text{File System}$$

---

## 🚀 Key Features

1. **Dynamic Homepage (`index.html`)**:
   - Live portal metrics counters (Total Items, Lost, Found, Resolved Cases) loaded asynchronously via `/api/stats`.
   - Hero search bar with instant keyword lookup.
   - Dynamic grid showcasing the latest campus listings.
   - Multi-step visual guide explaining reporting and claiming procedures.

2. **Interactive Items Directory (`items.html`)**:
   - Real-time client-side search by item name, description, or location.
   - Dynamic filtering by **Type** (Lost / Found / All), **Category** (Wallet, Laptop, ID Card, Bottle, etc.), and **Status** (Searching, Found, Returned, Reported, Claim Pending).
   - Multi-criteria sorting (Newest Date, Oldest Date, Name A-Z, Name Z-A, Latest ID).
   - Dynamic item cards with visual badges and action buttons (`View`, `Edit`, `Delete`).

3. **Item Submission & Editing (`add.html`)**:
   - Unified responsive form for creating new records (`POST /api/items`) or editing existing records (`PUT /api/items/:id`).
   - Auto-detection of edit mode from URL parameter `?id=<item_id>`.
   - Client-side validation and automated timestamping.

4. **Detailed Item View (`details.html`)**:
   - Comprehensive metadata card displaying all recorded information.
   - One-click "Mark as Returned / Resolved" action.
   - Reporter contact information with clickable `mailto:` and `tel:` links.
   - Quick Edit and Delete controls.

5. **Guidelines & Information (`about.html`)**:
   - University rules for claiming lost items and proof of ownership verification.
   - Retention policy and guidelines for turning in found property.
   - Frequently Asked Questions (FAQ) and campus CS Department contact desk info.

---

## 🛠️ Technology Stack & Core Concepts

| Technology / Concept | Implementation & File Location |
| :--- | :--- |
| **HTML5 & CSS3** | Semantic markup, CSS Custom Properties (`:root`), Responsive Grid & Flexbox (`public/css/style.css`). |
| **Node.js & Express** | RESTful API server (`server.js`) and Vercel serverless integration (`api/index.js`). |
| **File System Operations** | Asynchronous JSON read & write operations using Node.js `fs.promises` on `data/items.json`. |
| **DOM Manipulation** | Dynamic card rendering, live counter updates, and filter mutations (`public/js/items.js`, `public/js/app.js`). |
| **Event Handling** | Real-time input listeners, filter dropdown changes, form submission interceptors, and modal triggers. |
| **Callback Functions** | Custom notification toast system with dismissal callbacks (`showToast(message, type, callback)` in `public/js/app.js`). |
| **ES6 Promises** | Custom Promise-based modal confirmation dialog (`showConfirmModal()` in `public/js/app.js`). |
| **Async / Await & Fetch API** | Asynchronous REST operations across `ApiService` (`getItems`, `getItemById`, `createItem`, `updateItem`, `deleteItem`). |
| **Error Handling** | Robust `try...catch` blocks, HTTP response status verification, and feedback alerts. |

---

## 📂 Project Directory Structure

```
lost-found-portal/
├── public/
│   ├── index.html          # Portal home page with stats and recent items
│   ├── items.html          # Browse items directory with search & filters
│   ├── add.html            # Form to add or edit lost/found items
│   ├── form.html           # Alias redirect for add.html
│   ├── details.html        # Comprehensive item details page
│   ├── about.html          # University rules, FAQs & contact info
│   ├── css/
│   │   └── style.css       # Responsive modern styles & component library
│   └── js/
│       ├── app.js          # Core ApiService, Callbacks & Promise modals
│       ├── items.js        # Dynamic filtering, sorting & DOM rendering
│       ├── form.js         # Form validation, create & update handling
│       └── details.js      # Details view controller & quick status updates
├── data/
│   └── items.json          # Persistent JSON data store (50 initial records)
├── api/
│   └── index.js            # Vercel serverless function entrypoint
├── server.js               # Node.js Express server & REST API routes
├── package.json            # Node dependencies & project scripts
├── vercel.json             # Vercel routing and deployment config
└── README.md               # Documentation & setup guide
```

---

## 📡 REST API Documentation

| Method | Endpoint | Description | Request Body (JSON) / Query |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/items` | Retrieve all items (supports filtering) | `?search=...&type=...&category=...&status=...&sort=...` |
| `GET` | `/api/items/:id` | Retrieve single item by ID | None |
| `POST` | `/api/items` | Create new lost or found record | `{ name, type, category, location, date, status, description, contactEmail, contactPhone }` |
| `PUT` | `/api/items/:id` | Update existing item record | `{ name, type, category, location, date, status, description, ... }` |
| `DELETE` | `/api/items/:id` | Delete item record | None |
| `GET` | `/api/stats` | Retrieve aggregate counts & stats | None |

---

## 💻 Local Installation & Setup

1. **Clone or navigate to the project directory:**
   ```bash
   cd "AssignmentNo#02"
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the local server:**
   ```bash
   npm start
   ```

4. **Access the application:**
   Open your browser and navigate to:
   [http://localhost:3000](http://localhost:3000)

---

## ☁️ Deployment on Vercel

1. Push the project repository to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "Complete Lost & Found Portal for CS311 Assignment 2"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```

2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Click **Deploy**. Vercel will automatically detect `vercel.json` and deploy both the static frontend and the serverless Node.js API endpoints.

---

## 📄 Submission Checklist

- [x] HTML5, CSS3, JavaScript, and Node.js implementation complete
- [x] Initial dataset of 50 items stored in `data/items.json`
- [x] CRUD operations (Create, Read, Update, Delete) fully operational
- [x] Dynamic search, category, type, and status filtering without page refresh
- [x] Meaningful examples of Callback, Promise, Async/Await, and Fetch API included
- [x] Vercel configuration (`vercel.json` & `api/index.js`) ready
- [x] Clean, well-indented code with proper folder organization
