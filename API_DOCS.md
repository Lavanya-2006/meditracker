# MediTracker API Documentation

Base URL: `http://localhost:5000/api`

All protected routes require: `Authorization: Bearer <token>`

---

## Authentication

### POST /auth/register
Register a new user (doctor or patient).

**Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "doctor",
  "phone": "+1234567890"
}
```

**Response 201:**
```json
{
  "success": true,
  "token": "eyJ...",
  "user": { "_id": "...", "role": "doctor", "firstName": "John", ... }
}
```

---

### POST /auth/login
**Body:**
```json
{ "email": "john@example.com", "password": "secret123" }
```

**Response 200:**
```json
{ "success": true, "token": "eyJ...", "user": { ... } }
```

---

### GET /auth/me
Get current logged-in user. Requires auth token.

---

### POST /auth/logout
Logs out (server-side activity log). Client should delete token.

---

### POST /auth/forgot-password
**Body:** `{ "email": "john@example.com" }`
Sends a password reset email (valid 10 minutes).

---

### PUT /auth/reset-password/:token
**Body:** `{ "password": "newpassword123" }`

---

### PUT /auth/update-password (🔒 Auth)
**Body:** `{ "currentPassword": "old", "newPassword": "new123" }`

---

### PUT /auth/preferences (🔒 Auth)
**Body:** `{ "theme": "dark", "notifications": true }`

---

## Doctor Endpoints (🔒 Doctor only)

### GET /doctors/profile
Returns doctor profile with populated user and patients.

### PUT /doctors/profile
Update doctor + user info.
**Body (any subset):**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "specialization": "Cardiologist",
  "licenseNumber": "MD-12345",
  "hospital": "City Hospital",
  "experience": 10,
  "bio": "About the doctor...",
  "phone": "+1234567890",
  "profileImage": "https://..."
}
```

### GET /doctors/dashboard
Returns: `{ totalPatients, totalMedicines, recentPatients, recentMedicines, medicinesByPatient }`

### GET /doctors/patients
**Query:** `?page=1&limit=10&search=john`

### POST /doctors/patients/add
**Body:** `{ "patientEmail": "patient@example.com" }`
Patient must be registered and unassigned.

### DELETE /doctors/patients/:patientId
Removes patient from doctor's list and unassigns doctor from patient.

---

## Medicine Endpoints

### POST /medicines (🔒 Doctor)
**Body:**
```json
{
  "patientId": "...",
  "name": "Metformin",
  "genericName": "Metformin HCl",
  "dosage": { "amount": "500", "unit": "mg" },
  "frequency": "twice_daily",
  "timing": ["morning", "evening"],
  "duration": { "value": 30, "unit": "days" },
  "startDate": "2024-01-01",
  "beforeFood": false,
  "notes": "Take with meals",
  "precautions": "Monitor blood sugar",
  "sideEffects": "Nausea possible initially",
  "refillsRemaining": 2,
  "color": "#10b981"
}
```

Frequency options: `once_daily | twice_daily | three_times_daily | four_times_daily | every_6_hours | every_8_hours | every_12_hours | weekly | biweekly | monthly | as_needed`

Dosage units: `mg | ml | g | mcg | IU | tablet | capsule | drops | puff | patch`

Duration units: `days | weeks | months | ongoing`

### GET /medicines (🔒 Doctor)
**Query:** `?page=1&limit=10&search=met&patientId=...&isActive=true`

### GET /medicines/:id (🔒 Auth)
Both doctor and patient can access if authorized.

### PUT /medicines/:id (🔒 Doctor)
Same body as POST (patientId not needed).

### DELETE /medicines/:id (🔒 Doctor)
Removes medicine and cleans up patient's medicine list.

### GET /medicines/patient/:patientId (🔒 Doctor)
Get all medicines prescribed to a specific patient by this doctor.

---

## Patient Endpoints (🔒 Patient only)

### GET /patients/profile
Returns patient with doctor info populated.

### PUT /patients/profile
**Body (any subset):**
```json
{
  "firstName": "Alice",
  "dateOfBirth": "1990-05-15",
  "gender": "female",
  "bloodGroup": "A+",
  "weight": 65,
  "height": 165,
  "allergies": ["Penicillin"],
  "chronicConditions": ["Diabetes"],
  "emergencyContact": { "name": "Bob", "relationship": "Spouse", "phone": "+1234567890" }
}
```

### GET /patients/dashboard
Returns: `{ totalMedicines, todayStats, adherenceRate, weeklyAdherence }`

### GET /patients/medicines
**Query:** `?page=1&limit=10&search=met&isActive=true`

### GET /patients/adherence
**Query:** `?days=30`
Returns: `{ overall, byDate, byMedicine }`

---

## Reminder Endpoints (🔒 Patient only)

### POST /reminders
**Body:**
```json
{
  "medicineId": "...",
  "title": "Take morning Metformin",
  "scheduledTime": "2024-01-15T08:00:00.000Z",
  "repeatType": "daily",
  "repeatDays": [],
  "soundEnabled": true,
  "snoozeMinutes": 10,
  "notes": "Optional note"
}
```
repeatType: `none | daily | weekly | custom`

### GET /reminders
**Query:** `?page=1&limit=10&status=pending&upcoming=true`

### PUT /reminders/:id
Same body as POST.

### DELETE /reminders/:id

### PATCH /reminders/:id/status
**Body:** `{ "status": "completed" }`
Status: `pending | completed | missed | snoozed`

---

## Medication Status (🔒 Patient only)

### POST /medication-status
**Body:**
```json
{
  "medicineId": "...",
  "date": "2024-01-15",
  "scheduledTime": "08:00",
  "status": "taken",
  "notes": "Took with breakfast",
  "dose": "500mg"
}
```
Status: `taken | missed | pending | skipped`
Upserts by (patient, medicine, date, scheduledTime).

### GET /medication-status
**Query:** `?startDate=2024-01-01&endDate=2024-01-31&medicineId=...`

### GET /medication-status/today
Returns today's schedule merged with status for each active medicine.

---

## Activity Logs (🔒 Auth)

### GET /activity
**Query:** `?page=1&limit=20&entityType=medicine`
entityType: `medicine | patient | reminder | profile | auth | medication_status`

---

## Error Responses

All errors follow:
```json
{
  "success": false,
  "message": "Human readable error message",
  "errors": [{ "field": "email", "message": "Valid email required" }]
}
```

HTTP Status codes:
- `400` — Validation error / bad request
- `401` — Unauthorized (no/invalid/expired token)
- `403` — Forbidden (wrong role)
- `404` — Not found
- `429` — Rate limit exceeded
- `500` — Internal server error
