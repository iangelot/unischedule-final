# UniSchedule Africa
## Complete project — backend + frontend

---

## Quick start (backend)

```bash
cd backend
cp .env.example .env.local
# Fill in DATABASE_URL (see below)

npm install
npm run db:migrate     # creates all tables
npm run db:seed        # seeds ISIMA Yaoundé demo data
npm run dev            # starts on http://localhost:3000
```

## Database options (free)
- Supabase: supabase.com → New project → Settings → Database → Connection string
- Railway: railway.app → New → Database → PostgreSQL → Variables tab
- Local: postgresql://localhost:5432/unischedule

## Login credentials (after seed)
- Admin:      admin@isima.cm      / admin123
- Timetabler: timetabler@isima.cm / schedule123

## API endpoints
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh
GET    /api/courses
POST   /api/courses
GET    /api/sessions
POST   /api/sessions
GET    /api/groups
POST   /api/groups
GET    /api/lecturers
POST   /api/lecturers
GET    /api/rooms
POST   /api/rooms
GET    /api/timetables
POST   /api/timetables
GET    /api/timetables/[id]
GET    /api/exams
POST   /api/exams
POST   /api/notifications/send
GET    /api/public/[slug]/timetable   (no auth, cached)

## Frontend
frontend.jsx runs directly in Claude artifact viewer.
To integrate with backend: replace useState with fetch() calls to the API above.

## Open in VSCode
File → Open Folder → select the backend/ folder
Install recommended extensions: ESLint, Prettier, TypeScript
