# Copa Azteca 2027 website

Static site plus one serverless function (`api/register.js`) that saves every
registration to the Airtable base **Copa Azteca 2027 → Registrations**.

## What's in here
- `index.html` — the whole site (EN/ES). Fees, payment links, contact email and
  Instagram are in the `CONFIG` block near the top of the `<script>` section.
- `assets/` — hero video, poster and photos.
- `api/register.js` — receives the form and writes to Airtable.
- `vercel.json`, `package.json` — Vercel settings.

## One required setting
In Vercel → Project → Settings → Environment Variables add:

| Name | Value |
| --- | --- |
| `AIRTABLE_TOKEN` | Airtable personal access token with `data.records:write` on the Copa Azteca 2027 base |

Create the token at https://airtable.com/create/tokens.
Redeploy after adding it.

## Deploy option A: GitHub + Vercel (no terminal)
1. Create a new GitHub repository (e.g. `copa-azteca-2027`).
2. "Upload files" → drag in everything from this folder → Commit.
3. In Vercel: Add New → Project → Import the repo → Framework preset "Other" → Deploy.
4. Add `AIRTABLE_TOKEN` (above) and redeploy.

## Deploy option B: Vercel CLI
```
npx vercel login
npx vercel            # first run links the project
npx vercel env add AIRTABLE_TOKEN production
npx vercel --prod
```
