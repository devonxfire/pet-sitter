# Pet-Sitter

Pet care tracking app for families and pet sitters.

## Tech Stack

- **Backend:** Node.js, Express, Prisma, PostgreSQL
- **Frontend:** React, Vite, Tailwind CSS
- **Design:** Apple-style minimal UI, neon green accent (#39FF14)

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL
npx prisma migrate dev
node index.js
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
pet-sitter/
├── backend/
│   ├── index.js          # Main Express server
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js        # API helper
│   │   └── index.css
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Features (Planned)

- [ ] Household management
- [ ] Pet profiles
- [ ] Activity logging (feeding, walks, meds, water)
- [ ] Activity timeline
- [ ] Photo uploads
- [ ] Sitter mode with daily summaries
- [ ] Stock management
- [ ] Medication schedules
