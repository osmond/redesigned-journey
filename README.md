# Plant Care (Local Dev – zero cloud setup)

This build uses **SQLite** and saves photos under `public/uploads`, so you don't need Supabase or R2 while we build.

## Run it
```bash
cp .env.example .env
npm i
npx prisma generate
npm run db:push
npm run seed   # optional demo data
npm run dev
```

Open http://localhost:3000
- Add a room and a plant, then click **Add photo** to upload (stored in `public/uploads/<plantId>/...`).
- Swipe tasks on the **Today** page to log **Water**/**Fertilize** (captures an Open‑Meteo weather snapshot using DEFAULT_LAT/LON if the plant has none).
