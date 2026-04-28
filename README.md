# Evently

Event discovery app with poster-style marketing slides, a floating navigation pill (search, city, theme, scroll progress), organizer dashboard (create and edit events), free ticket RSVPs, saved events, and accounts.

## Setup

1. Copy environment file and set a secret:

   ```bash
   cp .env.example .env
   ```

   Set `AUTH_SECRET` to a long random string (for example `openssl rand -base64 32`).

2. Install dependencies and prepare the database:

   ```bash
   npm install
   npx prisma migrate dev
   npx prisma db seed
   ```

3. Start the dev server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Demo account

After seeding:

- Email: `demo@evently.dev`
- Password: `password`

That user owns the seeded public events. Sign in to open the organizer dashboard at `/dashboard`, create new events at `/dashboard/create`, and see saved items under Likes (`/account/saved`) and free tickets under Tickets (`/account/tickets`).

## Stack

Next.js (App Router), TypeScript, Tailwind CSS v4, Prisma with SQLite, Auth.js (credentials), next-themes, Framer Motion.

## Scripts

| Command              | Description                |
| -------------------- | -------------------------- |
| `npm run dev`        | Development server         |
| `npm run build`      | Production build           |
| `npm run db:migrate` | Run Prisma migrations      |
| `npm run db:seed`    | Seed sample events and user |
