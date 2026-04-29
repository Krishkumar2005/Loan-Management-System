# Loan Management System (LMS)

A full-stack lending platform built with MERN + Next.js + TypeScript.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + bcrypt

---

## Project Structure

```
lms/
├── server/          # Express.js API
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── index.ts
│   ├── .env.example
│   └── package.json
└── client/          # Next.js App
    ├── app/
    │   ├── auth/
    │   ├── borrower/
    │   └── dashboard/
    ├── components/
    ├── lib/
    ├── types/
    ├── .env.example
    └── package.json
```

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Clone & Install

```bash
git clone <repo-url>
cd lms
```

**Server:**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

**Client:**
```bash
cd ../client
npm install
cp .env.example .env.local
# Edit .env.local with your API URL
```

### 2. Configure Environment

**`server/.env`**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lms
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
CLIENT_URL=http://localhost:3000
```

**`client/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Seed the Database

```bash
cd server
npm run seed
```

This creates one account per role with known credentials.

### 4. Run the App

**Terminal 1 – Server:**
```bash
cd server
npm run dev
```

**Terminal 2 – Client:**
```bash
cd client
npm run dev
```

Visit: [http://localhost:3000](http://localhost:3000)

---

## Login Credentials

| Role         | Email                  | Password      |
|--------------|------------------------|---------------|
| Admin        | admin@lms.com          | admin123      |
| Sales        | sales@lms.com          | sales123      |
| Sanction     | sanction@lms.com       | sanction123   |
| Disbursement | disburse@lms.com       | disburse123   |
| Collection   | collection@lms.com     | collection123 |
| Borrower     | borrower@lms.com       | borrower123   |

---

## API Endpoints

### Auth
| Method | Route               | Access     |
|--------|---------------------|------------|
| POST   | /api/auth/register  | Public     |
| POST   | /api/auth/login     | Public     |
| GET    | /api/auth/me        | Authenticated |

### Loans (Borrower)
| Method | Route                          | Access   |
|--------|--------------------------------|----------|
| POST   | /api/loans/bre-check           | Borrower |
| POST   | /api/loans/upload-salary-slip  | Borrower |
| POST   | /api/loans/apply               | Borrower |
| GET    | /api/loans/my-loans            | Borrower |

### Dashboard (Operations)
| Method | Route                                      | Access           |
|--------|--------------------------------------------|------------------|
| GET    | /api/dashboard/sales/leads                 | Sales, Admin     |
| GET    | /api/dashboard/sanction/loans              | Sanction, Admin  |
| PATCH  | /api/dashboard/sanction/loans/:id/approve  | Sanction, Admin  |
| PATCH  | /api/dashboard/sanction/loans/:id/reject   | Sanction, Admin  |
| GET    | /api/dashboard/disbursement/loans          | Disburse, Admin  |
| PATCH  | /api/dashboard/disbursement/loans/:id/disburse | Disburse, Admin |
| GET    | /api/dashboard/collection/loans            | Collection, Admin|
| POST   | /api/dashboard/collection/loans/:id/payment| Collection, Admin|
| GET    | /api/dashboard/admin/loans                 | Admin only       |
| GET    | /api/dashboard/admin/stats                 | Admin only       |

---

## Loan Status Transitions

```
APPLIED → SANCTIONED → DISBURSED → CLOSED
APPLIED → REJECTED
```

- **Applied**: Created when borrower submits application (after passing BRE)
- **Sanctioned**: Sanction executive approves
- **Rejected**: Sanction executive rejects (with reason)
- **Disbursed**: Disbursement executive releases funds
- **Closed**: Auto-closes when total payments >= total repayment

---

## Business Rule Engine (BRE)

Runs server-side on `/api/loans/bre-check` and re-validated on `/api/loans/apply`:

| Rule       | Condition                         |
|------------|-----------------------------------|
| Age        | Must be between 23 and 50         |
| Salary     | Minimum ₹25,000/month             |
| PAN        | Must match `/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/` |
| Employment | Cannot be Unemployed              |

---

## Loan Calculation

```
SI = (P × R × T) / (365 × 100)
Total Repayment = P + SI
```

Where:
- P = Principal (loan amount)
- R = 12 (fixed rate %)
- T = Tenure in days

---

## RBAC Matrix

| Role         | Sales | Sanction | Disbursement | Collection | Admin Panel |
|--------------|-------|----------|--------------|------------|-------------|
| Admin        | ✓     | ✓        | ✓            | ✓          | ✓           |
| Sales        | ✓     | ✗        | ✗            | ✗          | ✗           |
| Sanction     | ✗     | ✓        | ✗            | ✗          | ✗           |
| Disbursement | ✗     | ✗        | ✓            | ✗          | ✗           |
| Collection   | ✗     | ✗        | ✗            | ✓          | ✗           |
| Borrower     | Portal only — no dashboard access          |

Access is enforced on **both frontend (route guard) and backend (middleware)**.
