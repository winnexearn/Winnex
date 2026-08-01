# Winnex Earn

Earn money by watching ads and liking TikTok videos. A complete earning platform built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Three-tier earning system** - Free, Professional (₦1,000), and Legend (₦2,000)
- **Daily tasks** - Watch TikTok videos and view ads to earn rewards
- **Referral program** - Earn ₦500 for each successful referral
- **Withdrawal system** - Cash out earnings to your Nigerian bank account
- **Admin dashboard** - Manage users, content, and withdrawals

## Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS
- **Backend**: Supabase (Authentication, Database, Storage)
- **Deployment**: Vercel

## Getting Started

### 1. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to SQL Editor and run the schema in `supabase/schema.sql`
3. Get your project URL and anon key from Settings > API

### 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## Project Structure

```
src/
├── app/
│   ├── admin/          # Admin dashboard
│   ├── api/            # API routes
│   ├── dashboard/      # User dashboard
│   ├── login/          # Login page
│   ├── register/       # Registration page
│   └── page.tsx        # Landing page
├── lib/
│   ├── supabase/       # Supabase client configuration
│   ├── types.ts        # TypeScript types
│   └── utils.ts        # Utility functions
└── middleware.ts        # Auth middleware
```

## Tier System

| Tier | Price | Video Reward | Ad Reward | Daily Tasks |
|------|-------|--------------|-----------|-------------|
| 1 (Starter) | Free | ₦100 | ₦50 | 5 |
| 2 (Professional) | ₦1,000 | ₦200 | ₦100 | 8 |
| 3 (Legend) | ₦2,000 | ₦300 | ₦150 | 10 |

## Admin Access

- URL: `/admin`
- Password: `winnex_admin_2024`

## License

All rights reserved.
