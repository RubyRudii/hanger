# Hanger — Setup

Real Expo + Supabase + Claude vision build. Once these steps are done you'll be running the app on your phone with working AI judging.

## 1. Install Node.js
Download from https://nodejs.org (LTS). After install, restart your shell:
```powershell
node --version    # should print v20+
npm --version
```

## 2. Install project dependencies
```powershell
cd C:\Users\ruyba\Desktop\hanger\app
npm install
npm install -g eas-cli supabase
```

## 3. Create a Supabase project
1. Sign up at https://supabase.com → New project. Pick any region.
2. From the project dashboard, copy the **Project URL** and **anon public key** (Settings → API).
3. Copy `.env.example` to `.env` and fill them in:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

## 4. Apply the schema
Supabase dashboard → SQL Editor → paste `supabase/schema.sql` → Run. This creates tables, RLS policies, the `build-photos` storage bucket, and a trigger that auto-creates a profile row when a user signs up.

**Recommended:** Authentication → Providers → Email → uncheck **"Confirm email"** so sign-up logs you in immediately. (You can re-enable it later for production.)

## 5. Get an Anthropic API key
1. https://console.anthropic.com → API Keys → Create key.
2. The key stays on Supabase — the app never sees it.

## 6. Deploy the AI Judge Edge Function
```powershell
supabase login
supabase link --project-ref <your-project-ref>     # from your Supabase dashboard URL
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy judge
```

## 7. Run the app
```powershell
npm run start
```
- Install **Expo Go** on your phone (App Store / Play Store).
- Scan the QR code with Expo Go (Android) or the camera app (iOS).
- The app loads on your phone.

## Flow
1. Sign up → onboarding → feed.
2. Tap **JUDGE**, pick a photo of your kit, fill in name/grade/mods, submit.
3. The photo goes to Claude vision; you get a real critique + scored breakdown.
4. The build appears in your **Hangar** and on the community **Feed**.

## Optional: seed the feed
Edit `supabase/seed.sql` with your user id (from `auth.users` in Supabase) and run it in the SQL editor.

## Troubleshooting
- **Black screen on launch** — check the Metro terminal; usually a missing dep. Run `npm install` again.
- **"ANTHROPIC_API_KEY not configured"** — re-run `supabase secrets set ANTHROPIC_API_KEY=...`, then re-deploy the function.
- **Photo upload fails** — confirm the `build-photos` bucket exists (schema.sql creates it) and the user is signed in.
- **Judge call times out** — vision requests can take 10–20s on first run while the function cold-starts.
