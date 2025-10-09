# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**skcalculator** - A personal invoice calculator for fabric/tailoring business. Simplified stack for managing items (Fabric, Lace, Brooch, Fur, Labour, Extra), storing them in a remote MySQL database, and building invoices with automatic total calculation.

**Stack**: Vite + Vanilla JS/React frontend + Netlify Serverless Functions + MySQL database (no authentication - personal use only)

**Deployment**: Single repository deployable to Netlify with automatic builds

## Remote Database Configuration

- **Host**: 172.105.49.22
- **Database**: dsfsdfds_sk
- **Username**: dsfsdfds_sk
- **Password**: Mdlove@123

## Database Schema

### `items` table
- `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `name` (VARCHAR) - Item name (Fabric, Lace, Brooch, Fur, Labour, Extra)
- `price` (DECIMAL) - Item price
- `created_at` (TIMESTAMP)

### `invoices` table (optional, for history)
- `id` (INT, AUTO_INCREMENT, PRIMARY KEY)
- `total` (DECIMAL)
- `items_json` (JSON/TEXT) - Store invoice items and quantities
- `created_at` (TIMESTAMP)

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (Vite + Netlify Dev for serverless functions)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Deploy to Netlify (if using Netlify CLI)
netlify deploy --prod
```

## Project Structure

```
skcalculator/
├── netlify/
│   └── functions/         # Netlify serverless functions
│       ├── get-items.js   # GET /api/items
│       ├── add-item.js    # POST /api/add-item
│       ├── delete-item.js # DELETE /api/delete-item
│       └── db.js          # Shared MySQL connection
├── src/
│   ├── index.html         # Main UI (mobile-first design)
│   ├── style.css          # Mobile-responsive styles
│   └── main.js            # Frontend logic
├── public/                # Static assets
├── netlify.toml           # Netlify configuration
├── vite.config.js         # Vite configuration
├── package.json
└── CLAUDE.md
```

## Architecture

**Backend (Netlify Serverless Functions)**:
- Serverless functions handle API requests (GET, POST, DELETE)
- MySQL connection using `mysql2` package
- Database credentials stored in Netlify environment variables
- Each function is a standalone endpoint (no Express needed)
- No authentication (personal use)

**Frontend (Vite + Vanilla JS)**:
- Built with Vite for fast development and optimized production builds
- Mobile-first responsive design (works on phones, tablets, desktop)
- Touch-friendly UI elements
- Item management section: Add/save/delete items to database
- Invoice builder section: Select items from database, input quantities
- Real-time total calculation
- Clean, minimal UI optimized for mobile

**Deployment**:
- Single repo deployment to Netlify
- Automatic builds on git push
- Environment variables set in Netlify dashboard for DB credentials
- CDN-hosted static assets
- Serverless functions auto-scale

**Flow**:
1. User adds items (name + price) → API call to serverless function → Saved to MySQL `items` table
2. User builds invoice → Fetch items via API → Select items + quantities
3. Calculate total → Frontend computes sum (item.price × quantity)
4. Optionally save invoice to `invoices` table for history

## Key Features

- **Item Management**: Add items with names and prices, persist to remote MySQL
- **Invoice Building**: Quick selection of items with quantity input
- **Auto Calculation**: Real-time total calculation
- **Mobile-First UI**: Responsive design, touch-friendly, works on all devices
- **Netlify Deployment**: Single-click deploy, automatic builds, serverless backend
- **No Auth**: Direct access for personal use only

## Netlify Environment Variables

Set these in Netlify Dashboard (Site settings → Environment variables):

- `DB_HOST`: 172.105.49.22
- `DB_USER`: dsfsdfds_sk
- `DB_PASSWORD`: Mdlove@123
- `DB_NAME`: dsfsdfds_sk
