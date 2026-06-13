# 🏥 MediTracker & Reminder Web App

A full-stack MERN (MongoDB, Express.js, React.js, Node.js) application for managing medicines, tracking adherence, and setting smart reminders — with separate Doctor and Patient portals.

---

## 🚀 Features

### 👨‍⚕️ Doctor Portal
- View & edit profile (specialization, hospital, license, bio)
- Manage patients (add by email, remove, view details)
- Full CRUD for medicine prescriptions
- Assign detailed prescription: dosage, frequency, duration, timing, notes, precautions, side effects
- Dashboard with analytics and charts

### 🤒 Patient Portal
- View & edit personal health profile (allergies, conditions, emergency contact)
- View prescribed medicines (read-only)
- Mark medicines as Taken / Missed / Pending
- Adherence tracking with charts and history
- Create, update, delete reminders for medicines
- Browser push notifications + alarm sound for reminders

### 🔐 Authentication
- JWT-based auth (Doctor & Patient roles)
- Password hashing with bcrypt
- Forgot password / Reset via email
- Protected routes per role

### 📊 Analytics
- Adherence rate (7-day, 30-day, custom)
- Per-medicine compliance charts
- Daily trend charts (Recharts)
- Dashboard stats cards

---

## 🗂 Project Structure

```
meditracker/
├── backend/
│   ├── config/         # DB connection
│   ├── controllers/    # Business logic
│   ├── middleware/      # Auth, validation
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routes
│   ├── utils/          # JWT, email, logger
│   ├── server.js
│   └── .env.example
└── frontend/
    ├── public/
    └── src/
        ├── components/  # Reusable UI
        ├── contexts/    # AuthContext
        ├── hooks/       # Custom hooks
        ├── pages/       # Route pages
        │   ├── auth/
        │   ├── doctor/
        │   └── patient/
        ├── services/    # API + reminder service
        └── utils/       # Helpers
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js >= 16
- MongoDB (local or Atlas)
- npm or yarn

---

### 1. Clone / Extract the project

```bash
cd meditracker
```

---

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` from the template:
```bash
cp .env.example .env
```

Edit `.env`:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/meditracker
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

> 📧 **Email**: For Gmail, enable 2FA and generate an [App Password](https://myaccount.google.com/apppasswords). Email is optional — the app works without it (reset emails just won't send).

Start the backend:
```bash
npm run dev      # development with nodemon
npm start        # production
```

Backend runs at: `http://localhost:5000`
Health check: `http://localhost:5000/api/health`

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env`:
```bash
cp .env.example .env
```

Edit `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=MediTracker
```

Start the frontend:
```bash
npm start
```

Frontend runs at: `http://localhost:3000`

---

## 🧪 Quick Test Flow

1. **Register as Doctor** → `/register` → select "Doctor"
2. **Register as Patient** → open another tab or incognito → `/register` → select "Patient"
3. **Login as Doctor** → go to "My Patients" → add patient by email
4. **Go to Medicines** → prescribe a medicine to the patient
5. **Login as Patient** → Dashboard shows today's medicines
6. **Mark medicines** as Taken/Missed/Pending
7. **Set reminders** → allow browser notifications → alarm fires at scheduled time
8. **Check Adherence** page for reports and charts

---

## 🔗 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/forgot-password` | Send reset email |
| PUT | `/api/auth/reset-password/:token` | Reset password |
| PUT | `/api/auth/update-password` | Change password |
| PUT | `/api/auth/preferences` | Update theme/notifications |

### Doctor
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors/profile` | Get doctor profile |
| PUT | `/api/doctors/profile` | Update profile |
| GET | `/api/doctors/dashboard` | Dashboard stats |
| GET | `/api/doctors/patients` | List patients |
| POST | `/api/doctors/patients/add` | Add patient by email |
| DELETE | `/api/doctors/patients/:id` | Remove patient |

### Medicines
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/medicines` | Prescribe medicine (Doctor) |
| GET | `/api/medicines` | List doctor's medicines |
| GET | `/api/medicines/:id` | Get single medicine |
| PUT | `/api/medicines/:id` | Update medicine (Doctor) |
| DELETE | `/api/medicines/:id` | Delete medicine (Doctor) |
| GET | `/api/medicines/patient/:patientId` | Get patient's medicines (Doctor) |

### Patient
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients/profile` | Get patient profile |
| PUT | `/api/patients/profile` | Update profile |
| GET | `/api/patients/dashboard` | Dashboard stats |
| GET | `/api/patients/medicines` | List prescribed medicines |
| GET | `/api/patients/adherence` | Adherence report |

### Reminders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reminders` | Create reminder |
| GET | `/api/reminders` | List reminders |
| PUT | `/api/reminders/:id` | Update reminder |
| DELETE | `/api/reminders/:id` | Delete reminder |
| PATCH | `/api/reminders/:id/status` | Update status |

### Medication Status
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/medication-status` | Mark status (taken/missed/pending) |
| GET | `/api/medication-status` | Get history |
| GET | `/api/medication-status/today` | Today's schedule |

### Activity
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/activity` | Get activity logs |

---

## 🗄 Database Models

| Model | Description |
|-------|-------------|
| `User` | Auth credentials, role, preferences |
| `Doctor` | Specialization, hospital, patients list |
| `Patient` | Health info, allergies, assigned doctor |
| `Medicine` | Prescriptions with full details |
| `Reminder` | Scheduled medicine alerts |
| `MedicationStatus` | Daily taken/missed/pending records |
| `ActivityLog` | Audit trail |

---

## 🎨 UI Features

- ✅ Dark / Light mode toggle
- ✅ Fully responsive (mobile, tablet, desktop)
- ✅ Animated transitions
- ✅ Toast notifications (react-hot-toast)
- ✅ Recharts for analytics
- ✅ Modal dialogs with backdrop blur
- ✅ Form validation (frontend + backend)
- ✅ Loading states throughout
- ✅ Empty states with helpful messages
- ✅ Pagination on all list views

---

## 🛡 Security

- JWT tokens with expiry
- bcrypt password hashing (salt rounds: 12)
- Rate limiting on auth routes (20 req / 15 min)
- Helmet.js security headers
- CORS configured for frontend origin
- Role-based access control on every route
- Input validation with express-validator

---

## 📦 Tech Stack

**Backend:** Node.js · Express.js · MongoDB · Mongoose · JWT · bcryptjs · Nodemailer · Helmet · express-rate-limit

**Frontend:** React 18 · React Router v6 · Axios · Recharts · react-hot-toast · date-fns

---

## 🐛 Troubleshooting

**MongoDB connection fails:** Make sure MongoDB is running locally (`mongod`) or check your Atlas URI.

**CORS errors:** Ensure `CLIENT_URL` in `.env` matches your frontend URL exactly.

**Email not sending:** Email is optional. Remove `EMAIL_USER` from `.env` to skip email silently.

**Notifications not working:** Browser notifications require HTTPS in production. In development, `localhost` works fine — just click "Allow" when prompted.

---

## 📄 License

MIT — free to use, modify, and distribute.
