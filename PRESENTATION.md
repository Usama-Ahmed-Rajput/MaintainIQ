# MaintainIQ
## Intelligent Asset Maintenance & Issue Tracking System

**Project Presentation Document**

---

## 1. Introduction

MaintainIQ ek web-based **Facility Asset Maintenance Management System** hai jo kisi bhi building, factory, university, ya office ke equipment (assets) ko manage karne aur unki maintenance complaints ko track karne ke liye banaya gaya hai.

**Ek line mein:** Koi bhi user QR code scan karke machine ki complaint report kar sakta hai, AI us complaint ko analyze karta hai, aur admin technician ko assign karke problem fix karwata hai.

---

## 2. Problem Statement

Traditional maintenance systems mein ye masail hote hain:

| Problem | Effect |
|---|---|
| Complaints register/phone par hoti hain | Complaints kho jati hain, koi record nahi |
| Kis machine mein kya problem hai, pata nahi | Ek hi machine baar baar kharab hoti hai |
| Priority ka andaza nahi hota | Critical issues late fix hote hain |
| Technician ko manually dhoondna parta hai | Time waste hota hai |
| Koi history/record nahi | Analysis aur planning impossible |

---

## 3. Our Solution

MaintainIQ in sab problems ko solve karta hai:

1. **QR Code Based Reporting** — Har machine par QR sticker, scan karo aur complaint karo (no login required)
2. **AI-Powered Triage** — Google Gemini AI complaint ko parh kar automatically category, priority, aur possible causes batata hai
3. **Centralized Dashboard** — Admin ko sab kuch ek jagah dikhta hai
4. **Complete History** — Har asset ki puri maintenance history record hoti hai
5. **Role-Based Access** — Admin, Technician, aur Public user ke alag alag interfaces

---

## 4. System Users (Roles)

### 4.1 Public User / Employee (No Account Needed)
- Machine par laga QR code scan karta hai
- Apna naam aur problem likhta hai
- AI complaint analyze karta hai
- Submit — complaint admin tak pohanch jati hai

### 4.2 Technician (Self Signup)
- Apna account khud banata hai
- Assigned issues dekhta hai apne portal mein
- Kaam karke status update karta hai (In Progress → Resolved)

### 4.3 Admin (Single Admin — Only One Allowed)
- Special invite code se banta hai (database level par enforce hai ke sirf 1 admin ho sakta hai)
- Assets create karta hai aur QR codes print karta hai
- Complaints dekhta hai aur technicians ko assign karta hai
- Analytics, history, aur audit logs monitor karta hai

---

## 5. Complete Workflow

```
[Admin asset banata hai] 
        |
[QR code generate hota hai] --> [Print karke machine par lagaya jata hai]
        |
[User QR scan karta hai] --> [Public page khulta hai - no login]
        |
[User complaint likhta hai]
        |
[Gemini AI analyze karta hai]
   - Category: HVAC / Electrical / Plumbing / Mechanical...
   - Priority: Low / Medium / High / Critical
   - Possible Causes + Initial Checks
        |
[Complaint Admin Dashboard par aati hai]
        |
[Admin technician assign karta hai]
        |
[Technician issue fix karta hai --> Resolved mark karta hai]
        |
[History mein record save ho jata hai]
```

---

## 6. Key Features

### Admin Dashboard
- KPI Cards: Total Assets, Open Issues, Resolved, Health %
- Charts: Asset Condition, Asset Status, Issues Trend (7 days), Issues by Priority
- Recent Issues list

### Asset Management
- Asset create/edit with auto-generated unique code
- Har asset ka QR code (Download + Print)
- Public report URL
- Status tracking: Operational, Issue Reported, Under Inspection, Under Maintenance, Out of Service
- Condition tracking: Good, Fair, Poor, Critical

### Issue Management
- Complete issue lifecycle: Open → Assigned → In Progress → Resolved
- Priority levels: Low, Medium, High, Critical
- AI-suggested category and priority
- Technician assignment

### AI Triage (Google Gemini 2.5 Flash)
- Complaint text analyze karta hai
- Category detect karta hai
- Priority assign karta hai
- Possible causes list karta hai
- Initial checks suggest karta hai
- Estimated resolution time batata hai
- Professional maintenance summaries generate karta hai

### Alerts & History
- Maintenance reminders
- Complete audit logs (kis ne kya kiya, kab kiya)
- Full asset history

### Landing Page
- Professional SaaS-style landing page
- Features, How It Works, Pricing sections
- "Get Started" par login/signup modal

---

## 7. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 16 (React) | UI framework with App Router |
| Language | TypeScript | Type-safe code |
| Styling | Tailwind CSS | Modern responsive design |
| Backend | Next.js API Routes | Server-side logic |
| Database | Supabase (PostgreSQL) | Data storage |
| Authentication | Supabase Auth | Email/password login |
| AI | Google Gemini 2.5 Flash | Intelligent issue triage |
| QR Codes | qrcode library | Asset QR generation |
| Icons | Lucide React | UI icons |
| Hosting | Vercel | Deployment |

---

## 8. Database Design

### Tables

**profiles** — User information
- id (linked to auth.users), name, role (admin/technician), created_at

**assets** — Machines/equipment
- id, name, code (unique), category, location, model, serial_number, status, condition, notes, created_at

**issues** — Complaints/problems
- id, asset_id, title, description, category, priority, status, reporter_name, assigned_to, created_at, resolved_at

**history_entries** — Audit trail
- id, entity type, action, actor, details, timestamp

### Security (Row Level Security - RLS)
- Har table par RLS policies lagi hain
- Public users sirf issue report kar sakte hain
- Technicians sirf apne assigned issues update kar sakte hain
- Admin ko full access hai

### Single Admin Enforcement (3 Levels)
1. **Database level** — Unique index + trigger (sirf 1 admin row ho sakti hai)
2. **API level** — Signup mein invite code check hota hai
3. **UI level** — Admin signup ke liye special code chahiye

---

## 9. AI Integration Details

**Model:** Google Gemini 2.5 Flash

**Kaise kaam karta hai:**
1. User complaint submit karta hai (e.g. "AC thandi hawa nahi de raha, awaz kar raha hai")
2. System asset ki info + complaint Gemini ko bhejta hai
3. Gemini structured JSON return karta hai:

```json
{
  "category": "HVAC",
  "priority": "High",
  "possibleCauses": ["Refrigerant leak", "Compressor failure", "Dirty condenser coils"],
  "initialChecks": ["Check refrigerant pressure", "Inspect compressor", "Clean coils"],
  "estimatedResolutionTime": "2-4 hours",
  "requiresSpecialist": true
}
```

4. Ye suggestions user aur admin dono ko dikhti hain
5. Agar AI fail ho to system fallback defaults use karta hai (system kabhi rukta nahi)

---

## 10. Security Features

- **Authentication:** Supabase Auth with email/password
- **Row Level Security (RLS):** Database level par data protection
- **Single Admin Constraint:** Database trigger se enforce
- **Role-Based Access Control:** Admin/Technician/Public ke alag permissions
- **Parameterized Queries:** SQL injection se protection
- **Server-side Validation:** API routes par input validation
- **Environment Variables:** API keys code mein nahi, env mein secure hain

---

## 11. Screens / Pages Summary

| Page | URL | Access |
|---|---|---|
| Landing Page | `/` | Public |
| Login/Signup Modal | `/` (Get Started) | Public |
| Admin Dashboard | `/dashboard` | Admin only |
| Assets List | `/dashboard/assets` | Admin only |
| New Asset | `/dashboard/assets/new` | Admin only |
| Asset Detail + QR | `/dashboard/assets/[id]` | Admin only |
| Issues List | `/dashboard/issues` | Admin only |
| Issue Detail | `/dashboard/issues/[id]` | Admin only |
| Alerts | `/dashboard/alerts` | Admin only |
| History | `/dashboard/history` | Admin only |
| Audit Logs | `/dashboard/audit` | Admin only |
| Technician Portal | `/technician` | Technician only |
| Public Asset Page | `/asset/[code]` | Public (QR scan) |

---

## 12. Demo Flow (Presentation ke liye)

**Step 1:** Landing page dikhayen — professional design, features, pricing

**Step 2:** "Get Started" par click karke admin login karen
- Email: umerusama871@gmail.com

**Step 3:** Admin Dashboard dikhayen — KPIs, charts, analytics

**Step 4:** Assets page kholen — "Main HVAC System" asset dikhayen

**Step 5:** Asset detail page par QR code dikhayen — Download/Print options

**Step 6:** Naye tab mein public URL kholen (`/asset/HVAC-JXJLD`) — ye wahi page hai jo QR scan karne par khulta hai

**Step 7:** Complaint submit karen — "AC not cooling, making loud noise"

**Step 8:** AI triage dikhayen — Gemini automatically category, priority, causes suggest karega

**Step 9:** Wapis admin dashboard mein complaint dikhayen

**Step 10:** Technician assign karen aur issue lifecycle dikhayen

---

## 13. Future Enhancements

- Email/SMS notifications on new complaints
- Predictive maintenance using AI (machine kab kharab hogi, pehle batana)
- Mobile app (React Native)
- Multi-building/multi-tenant support
- Spare parts inventory management
- Maintenance cost tracking and budgeting
- WhatsApp integration for complaint updates

---

## 14. Conclusion

MaintainIQ ek complete, production-ready system hai jo:

- **Real problem solve karta hai** — manual complaint systems ki jagah digital QR-based system
- **Modern technology use karta hai** — Next.js, Supabase, Google Gemini AI
- **Secure hai** — RLS, role-based access, single admin enforcement
- **Scalable hai** — kisi bhi size ki organization ke liye kaam kar sakta hai
- **AI-powered hai** — complaints ki intelligent analysis aur triage

**Developed by:** Usama Ahmed
**Technology:** Next.js 16 + Supabase + Google Gemini AI
**Deployment:** Vercel

---

*End of Presentation Document*
