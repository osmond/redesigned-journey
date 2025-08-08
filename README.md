Plant Care (Local / Supabase + Cloudflare R2)
A tiny full-stack app to track plant care tasks, auto-suggest care details, and store photos in Cloudflare R2.
Stack: Next.js 14 (app router) · Prisma · Supabase Postgres · AWS SDK v3 (S3-compatible) · Tailwind.

Features
Today + Upcoming (next 7 days) task views

Rooms & plants (water/fertilize intervals, notes, etc.)

Smart form: species suggestions & default care values

Photo uploads to Cloudflare R2 (presigned PUT)

Weather snapshot defaults (optional lat/lon)

Full backup/restore via JSON and CSV care event import

Quick start
1) Prereqs
Node 18+ (or 20+)

Supabase project (Postgres) – use the pooler connection

Cloudflare account with an R2 bucket and API Token (Account-scoped)

2) Clone & install
bash
Copy
Edit
git clone https://github.com/osmond/redesigned-journey.git
cd redesigned-journey
npm i
3) Environment
Create .env (do not commit this). Fill with your values:

env
Copy
Edit
# Supabase Postgres (use Connect ➜ Pooler ➜ "session" or "transaction")
DATABASE_URL="postgresql://postgres.<your-project-ref>:<YOUR_PASSWORD>@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
DIRECT_URL="postgresql://postgres.<your-project-ref>:<YOUR_PASSWORD>@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"

# Cloudflare R2 (S3 API)
R2_ACCOUNT_ID="<your_account_id>"
R2_ACCESS_KEY_ID="<your_access_key_id>"
R2_SECRET_ACCESS_KEY="<your_secret_key>"
R2_BUCKET="plant-care"

# Public image host (pick one)
NEXT_PUBLIC_R2_PUBLIC_HOSTNAME="pub-xxxxxxxxxxxxxxxx.r2.dev"
# or, if you mapped a custom domain to the bucket:
NEXT_PUBLIC_R2_CUSTOM_HOSTNAME="media.example.com"

# Optional: species enrichment token (leave blank to skip)
TREFLE_TOKEN=""

# Optional: default lat/lon for weather snapshots
DEFAULT_LAT="44.9778"
DEFAULT_LON="-93.2650"
Tip: keep .env.example updated for collaborators.

4) Database
bash
Copy
Edit
npx prisma generate
npm run db:push       # creates tables
npm run seed         # (optional) seed sample data
Open Prisma Studio (optional):

bash
Copy
Edit
npx prisma studio
5) Run dev
bash
Copy
Edit
npm run dev
# http://localhost:3000
Cloudflare R2 setup
Create bucket (e.g., plant-care).

Public Development URL: optional. If you enable it, copy the *.r2.dev hostname into NEXT_PUBLIC_R2_PUBLIC_HOSTNAME.

API Token: R2 Object Read/Write (account-level), scoped to your bucket (or all). Copy Access Key ID + Secret into .env.

CORS (bucket ➜ Settings ➜ CORS Policy). Minimal JSON that works for local dev uploads:

json
Copy
Edit
[
  {
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "HEAD", "OPTIONS"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
If you later serve images from a custom domain, add that origin to AllowedOrigins and to next.config.mjs (see below).

Next.js image domains
next.config.mjs is already set up to allow images from either the R2 public dev hostname or your custom domain. Update env values and restart dev after changing it.

Scripts
bash
Copy
Edit
npm run dev        # Next dev server
npm run build      # Next production build
npm run start      # Next start

npm run db:push    # Push Prisma schema to DB
npm run seed       # Seed sample rooms/plants (optional)
Project structure (high level)
bash
Copy
Edit
src/
  app/
    api/
      plants/route.ts          # create plant
      rooms/route.ts           # list rooms
      species/hints|search     # smart form suggestions
      uploads/presign/route.ts # presign R2 PUT
      photos/route.ts          # create photo record
    page.tsx                   # Today + Upcoming
    plants/page.tsx            # My Plants + Smart Form
    rooms/page.tsx             # Rooms
  components/
    UploadWidget.tsx
    SwipeTaskRow.tsx
    PlantCard.tsx
  lib/
    db.ts                      # Prisma client
    r2.ts                      # S3 client (R2)
prisma/
  schema.prisma
Deploying (Vercel)
Push to GitHub (this repo).

Import the repo in Vercel.

Add the same Environment Variables from .env in Vercel (do not include NEXT_PUBLIC_R2_PUBLIC_HOSTNAME if you’re using a custom domain; include NEXT_PUBLIC_R2_CUSTOM_HOSTNAME instead).

If you change Prisma schema, run npm run db:push locally (or via a CI step) against your production DB.

Troubleshooting
FATAL: Tenant or user not found
Your DATABASE_URL username must be the exact value from Supabase ➜ Connect ➜ Pooler, e.g. postgres.<project-ref>. Using just postgres will fail. Ensure sslmode=require is present.

/api/uploads/presign returns 404
You’re hitting the route before Next compiled it, or the path is wrong. The file should be at src/app/api/uploads/presign/route.ts. Restart dev.

CORS error when uploading to R2
Your bucket’s CORS JSON must be a JSON array with a single rule object, and the AllowedOrigins must include your app origin (http://localhost:3000 in dev). Add PUT, HEAD, OPTIONS to AllowedMethods.

Images not rendering
Make sure the public hostname you’re using is present in next.config.mjs and matches NEXT_PUBLIC_R2_PUBLIC_HOSTNAME or NEXT_PUBLIC_R2_CUSTOM_HOSTNAME. Restart dev after edits.

Accidentally committed .env
Rotate your Supabase password & R2 keys. Then:

bash
Copy
Edit
git rm --cached .env
echo ".env" >> .gitignore
git commit -m "Remove .env and rotate secrets"
git push
Tech notes
R2 is S3-compatible; uploads use presigned PUT from the server (no credentials in the browser).

Prisma uses the Pooler connection string for reliability in dev and serverless.

License
MIT © 2025 osmond

Helpful links (docs)
Next.js: https://nextjs.org/docs

Prisma ORM: https://www.prisma.io/docs

Supabase Pooler (connections): https://supabase.com/docs/guides/database/connecting/connection-pooler

Cloudflare R2 CORS: https://developers.cloudflare.com/r2/buckets/cors/

Cloudflare R2 S3 API: https://developers.cloudflare.com/r2/api/s3/api/

AWS SDK v3 (S3) JS: https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/

