# Tailoring & Sewing Marketplace

A full-stack tailoring marketplace that connects customers with local tailors and, in future phases, independent fashion designers.

Customers will be able to discover tailors, view their portfolios, submit measurements, choose fabrics, place custom stitching orders, make payments, and track orders from stitching to delivery.

---

## 🚧 Project Status

**Current Status: Phase 0 — Foundation Complete**

The backend foundation has been initialized with:

- NestJS backend
- PostgreSQL database
- Docker-based local database setup
- Prisma ORM
- Environment configuration
- Feature-based module architecture
- Global exception handling
- Global response interceptor
- Git version control

Feature development will begin in the upcoming phases.

---

## 🏗️ Technology Stack

### Backend

- Node.js
- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- PostGIS
- Docker

### Frontend

- React.js
- TypeScript
- Tailwind CSS
- Vite
- React Router
- Axios

### Mobile

- React Native
- Expo

### Future Integrations

- JWT Authentication
- bcrypt
- Cloudinary / AWS S3
- Socket.io
- Razorpay / Cashfree
- Three.js / model-viewer / WebXR
- Delhivery API

---

## 👥 User Roles

The platform will initially support three main roles:

### Customer

Customers will be able to:

- Discover nearby tailors
- Filter tailors by category, rating, location, etc.
- View tailor profiles and portfolios
- Select fabrics
- Save body measurements
- Place custom stitching orders
- Make payments
- Track orders
- Submit reviews

### Tailor

Tailors will be able to:

- Create a tailor/business profile
- Upload portfolio images
- Manage fabrics
- Receive and manage orders
- Update order status
- Manage availability
- View earnings and payouts

### Admin

Admins will be able to:

- Approve/reject tailor registrations
- Manage tailors and orders
- Handle disputes
- Manage commissions and payouts
- Moderate content
- View platform analytics

---

# 📁 Project Structure

```text
tailoring/
│
├── prisma/
│   └── schema.prisma
│
├── src/
│   ├── common/
│   │   ├── http-exception/
│   │   │   ├── http-exception.filter.ts
│   │   │   └── http-exception.filter.spec.ts
│   │   │
│   │   └── response/
│   │       ├── response.interceptor.ts
│   │       └── response.interceptor.spec.ts
│   │
│   ├── users/
│   │   └── users.module.ts
│   │
│   ├── tailors/
│   │   └── tailors.module.ts
│   │
│   ├── orders/
│   │   └── orders.module.ts
│   │
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── app.module.ts
│   └── main.ts
│
├── .env
├── .gitignore
├── docker-compose.yml
├── prisma.config.ts
├── package.json
├── package-lock.json
└── tsconfig.json
```
