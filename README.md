# SK Calculator - Invoice Builder

A personal invoice calculator for fabric/tailoring business. Built with Vite + Vanilla JS and deployed to Netlify with serverless functions.

## Features

- 📱 **Mobile-First Design** - Optimized for phones, tablets, and desktop
- 🗄️ **Remote MySQL Database** - Items stored in cloud database
- ⚡ **Fast & Lightweight** - Vanilla JS, no heavy frameworks
- 🚀 **Netlify Deployment** - One-click deploy with serverless backend
- 💰 **Invoice Builder** - Quick item selection and automatic total calculation

## Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   - Navigate to `http://localhost:8888`

### Deployment to Netlify

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Connect to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository
   - Build settings should auto-detect from `netlify.toml`

3. **Set Environment Variables in Netlify:**
   - Go to Site settings → Environment variables
   - Add the following:
     - `DB_HOST`: 172.105.49.22
     - `DB_USER`: dsfsdfds_n8n
     - `DB_PASSWORD`: Mdlove@123
     - `DB_NAME`: dsfsdfds_n8n

4. **Deploy:**
   - Click "Deploy site"
   - Your app will be live at `https://your-site-name.netlify.app`

## Usage

### Managing Items
1. Enter item name (e.g., "Fabric", "Lace", "Brooch")
2. Enter price
3. Click "Add Item"
4. Items are saved to the database

### Building Invoices
1. In the "Build Invoice" section, enter quantities for each item
2. Total is calculated automatically
3. Update quantities as needed

### Deleting Items
- Click "Delete" button next to any item to remove it from the database

## Project Structure

```
skcalculator/
├── netlify/functions/    # Serverless API endpoints
├── src/                  # Frontend source
│   ├── index.html       # Main HTML
│   ├── style.css        # Styles
│   └── main.js          # JavaScript logic
├── netlify.toml         # Netlify config
├── vite.config.js       # Vite config
└── package.json         # Dependencies
```

## Tech Stack

- **Frontend:** Vite + Vanilla JavaScript
- **Backend:** Netlify Serverless Functions
- **Database:** MySQL
- **Deployment:** Netlify

## License

MIT
