# Dragon Boba POS & Kiosk 🐉

A modern, browser-based Point of Sale system for Dragon Boba tea shop. Built with React and Node.js, connecting to a PostgreSQL database hosted on AWS RDS. 

*(Phase 2 Expansion: Now featuring Google Cloud translations, EmailJS SMS text integrations, physical TV digital signage routing, and comprehensive accessibility tooling).*

## Live Demo

**[https://team22-project3-dragon-boba-client.onrender.com/](https://team22-project3-dragon-boba-client.onrender.com/)**

| View | URL | Access |
|------|-----|--------|
| Portal | [/](https://team22-project3-dragon-boba-client.onrender.com/) | Public |
| Customer Kiosk | [/customer](https://team22-project3-dragon-boba-client.onrender.com/customer) | Public |
| Digital Menu Board | [/menuboard](https://team22-project3-dragon-boba-client.onrender.com/menuboard) | TV Mount Access |
| Cashier POS | [/cashier](https://team22-project3-dragon-boba-client.onrender.com/cashier) | Employee ID |
| Manager Panel | [/manager](https://team22-project3-dragon-boba-client.onrender.com/manager) | Manager ID |

> **Note:** The free-tier backend may take ~30 seconds to wake up on first load.

## Core Features 
- **Customer Kiosk:** Self-serve checkout with deep multi-topping customizations.
- **Accessibility Layers:** Immediate A/A+/A++ font scaling and live localization via Google Cloud Translate API.
- **EmailJS SMS Gateway:** Customers can securely input 10-digit phone numbers and Carriers directly into the touchscreen to receive text-message "Order Ready" notifications securely natively on the client.
- **Menu Board Signage:** Infinite looping masonry 4K display component designed exclusively to hang on overhead TV monitors.
- **Scalable POS & Inventory Tracking:** Complex multi-array inventory math deduction securely deployed on AWS Postgres bounds.

## Tech Stack

- **Frontend:** React (Vite), React Router, Vanilla CSS, EmailJS SDK
- **Backend:** Node.js, Express.js, Google Cloud APIs
- **Database:** PostgreSQL on AWS RDS
- **Deployment:** Render (Static Site + Web Service)


## Local Development

### Prerequisites
- Node.js (v18+)
- Access to the team PostgreSQL database

### Setup

```bash
# Backend
cd server
npm install
# Create server/.env with: DATABASE_URL=postgresql://...
npm start

# Frontend (separate terminal)
cd client
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and the backend at `http://localhost:3001`.

---
## Team 22
CSCE 331 — Spring 2026
