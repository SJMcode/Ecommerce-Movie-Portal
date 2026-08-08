# 🎬 Ecommerce Movie Portal — Digital Movie Licensing & Streaming Platform


> A production-grade, high-availability e-commerce platform for browsing, licensing, and streaming digital movies, powered by Next.js 16, Prisma ORM, PostgreSQL, Stripe payments, and Nginx load balancing.

---

## 🚀 Live Demo

- **Live URL:** [https://ecommerce-movie-portal.vercel.app](https://ecommerce-movie-portal.vercel.app/movies) *(or access via `https://localhost` when running locally with Docker)*
- **Admin Dashboard:** `/admin` *(requires admin credentials)*

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Components, Server Actions) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict Mode) |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM](https://www.prisma.io/) |
| **Authentication** | [Better Auth](https://www.better-auth.com/) (Session cookies, email verification, password reset, RBAC) |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/), [Base UI](https://base-ui.com/), [Lucide React](https://lucide.dev/), [Sonner](https://sonner.emilkowal.ski/) |
| **Payments** | [Stripe API](https://stripe.com/) (Checkout sessions, webhooks, promo codes, idempotency) |
| **Media & Assets** | [TMDB API](https://www.themoviedb.org/) (Catalog metadata), [Cloudinary](https://cloudinary.com/) (Video streaming) |
| **Email Service** | [Nodemailer](https://nodemailer.com/) (SMTP transport, HTML templates, graceful mock fallback) |
| **Testing** | [Playwright](https://playwright.dev/) (End-to-End, UI flow testing, unit validation) |
| **DevOps & Monitoring** | [Docker Compose](https://docs.docker.com/compose/), [Nginx](https://nginx.org/) (Load Balancer & SSL), [Prometheus](https://prometheus.io/), [Grafana](https://grafana.com/), [cAdvisor](https://github.com/google/cadvisor) |

---

## ✨ Key Features

### 🔍 1. Smart Search & Autocomplete
- **Client-Side Trie (Prefix Tree):** Instant, zero-latency autocomplete dropdown recommendations powered by an in-memory Trie algorithm (`lib/trie.ts`).
- **Typo Tolerance:** Search ranking with Levenshtein edit distance scoring to handle user typos seamlessly.

### 🎛️ 2. Dynamic Filtering & Sorting
- Multi-dimensional filtering by **Genre**, **Cast Member**, and **Director**.
- Sorting by **Title (A-Z, Z-A)** and **Price (Low to High, High to Low)**.
- Full URL-state synchronization for bookmarkable and shareable search links.

### 🛒 3. Shopping Cart System
- **Guest-to-User Sync:** Cookie-backed cart for unauthenticated guests that seamlessly merges with PostgreSQL database cart upon login.
- **Single-License Enforcement:** Automatic detection to prevent purchasing duplicate movie licenses.
- **Cart Tamper Protection:** Cryptographic hash generation on checkout sessions to freeze item prices during payment.

### 💳 4. Checkout & Stripe Payments
- **Promotional Discount Engine:** Supports fixed-amount and percentage promo codes with expiration and minimum order constraints.
- **Transactional Fulfillment:** Atomic database transactions to finalize orders, generate digital movie licenses, and clear carts upon payment confirmation.
- **Double-Fulfillment Protection:** Stripe webhook verification with client-side idempotent fallback for offline/isolated networks.

### 💬 5. Verified Reviews & Ratings
- **Verified Purchaser Rule:** Only accounts that hold a valid, paid license for a title can submit a review.
- Dynamic average star ratings and rating distribution breakdown charts.

### 🛡️ 6. Admin Panel & Operations
- Full Movie Catalog CRUD with TMDB bulk syncing and archive toggles.
- Order management with customer search, status tracking, and revenue aggregation.
- **Abandoned Checkout Recovery:** Automated recovery email reminder queue with configurable discount codes.

### ⚡ 7. High Availability & Monitoring
- **Nginx Reverse Proxy:** Round-robin load balancing across 3 Next.js container replicas (`web1`, `web2`, `web3`) with SSL termination.
- **Real-Time Observability:** Container CPU, memory, and network throughput scraped by Prometheus via cAdvisor and visualized on persistent Grafana dashboards.

---

## 🏁 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20.x or higher)
- [PostgreSQL](https://www.postgresql.org/) (running locally on port `5432` or via Docker)
- [Docker & Docker Compose](https://www.docker.com/) (optional, for production stack)

---

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ecommerce-movie-portal.git
cd ecommerce-movie-portal
npm install

.env file
--
# Database
DATABASE_URL="postgres://postgres:password123@localhost:5432/db_movies_project_1"

# Better Auth
BETTER_AUTH_SECRET="your-super-secret-auth-key-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"

# TMDB API
TMDB_BEARER_TOKEN="your-tmdb-bearer-token"
TMDB_TOP_RATED_PAGES=25

# Stripe
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
PAYMENT_MODE="stripe_test"

# SMTP Email (Optional - falls back to console logging if omitted)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="Lonely Rider <noreply@ecommerce-movie-portal>"

# Cloudinary
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
CLOUDINARY_DEMO_VIDEO_ID="ecommerce-movie-portal/demo-movie"

### Database Setup
npx prisma db push

### Start Dev Server
npm run dev

Open http://localhost:3000 in your browser.


### Docker Deployment (Load-Balanced Production Stack)

# 1. Build and start all services in detached mode
docker compose up -d --build

# 2. Check container health
docker compose ps

Active Services:
Service	URL	Description
Nginx (App Gateway)	https://localhost	SSL Reverse Proxy & Load Balancer
Next.js Nodes	http://localhost:3000-3002	web1, web2, web3 internal nodes
Grafana	http://localhost:3001	Monitoring Dashboards (admin / admin)
Prometheus	http://localhost:9090	Metrics Scraper & Time-Series DB
cAdvisor	http://localhost:8088	Container Metrics Exporter

### Testing
# Run all E2E & Unit tests in headless mode
npm run test:e2e

lonely-rider-group/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Sign-in & Registration pages
│   ├── admin/                        # Admin workspace & catalog CRUD
│   ├── api/                          # Route handlers (Stripe webhook, Auth API)
│   ├── checkout/                     # Checkout & payment confirmation pages
│   ├── movies/                       # Public catalog, detail pages & search form
│   └── user-dashboard/               # User library & stream access
├── components/                       # Shared UI components (Base UI, Tailwind)
├── dev_documentation/                # Architecture & relation handbooks
├── e2e/                              # Playwright test suite (Unit & E2E specs)
├── lib/                              # Core backend utilities
│   ├── auth.ts                       # Better Auth configuration
│   ├── email.ts                      # Nodemailer SMTP helper & templates
│   ├── finalize-checkout.ts          # Transactional order processor
│   ├── prisma.ts                     # Prisma client singleton
│   └── trie.ts                       # Autocomplete Trie algorithm
├── nginx/                            # Nginx load balancer & SSL configs
├── prisma/                           # Database schema (`schema.prisma`)
├── docker-compose.yaml               # Multi-service production orchestration
├── Dockerfile                        # Multi-stage Next.js container build
└── playwright.config.ts              # Playwright configuration

