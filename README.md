# 📰 newslettr

**Curated procrastination.** A minimal, personalized RSS reader that shows you a fixed number of articles per day — once you click an article, it disappears, and isn’t replaced.

## Features

- ✍️ User preferences (feeds, daily article limit)
- 🔐 Google login (via `next-auth`)
- 🗞 RSS parsing from default + custom feeds
- 💾 Stores daily articles to Supabase per user
- ✅ Click to mark articles as read (removed locally)
- 🧱 Supabase + RLS for user-scoped data
- 🚫 Optional paywall bypass via 12ft.io

## Stack

- [Next.js 14](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [NextAuth.js](https://next-auth.js.org/)
- [rss-parser](https://www.npmjs.com/package/rss-parser)
- Tailwind CSS
