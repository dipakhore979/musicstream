# Deployment guide

MusicStream runs with the **frontend on Vercel**, the **API on Render**, data in **MongoDB Atlas**, files in **Cloudinary** and email through **Brevo**.

Vercel serves the React app and forwards every `/api/*` request to the Render backend. The browser therefore only ever talks to one site, so the login cookie is first-party. That keeps login working in Safari, on iPhones, in the installed app, and wherever third-party cookies are blocked.

## 1. Database and storage

- **Atlas → Network Access:** add `0.0.0.0/0`. Render's free plan has no fixed outbound IP, so the allow-list can't be narrower. Use a strong database password and a dedicated database user.
- Keep your Cloudinary keys handy (cloud name, API key, API secret).

## 2. Push to GitHub

```bash
git init && git add . && git commit -m "MusicStream"
git remote add origin https://github.com/YOUR-USERNAME/musicstream.git
git push -u origin main
```

`.env` files are git-ignored, so secrets are not uploaded. Run `git status` before pushing and make sure no `.env` file is listed.

## 3. Backend on Render

1. Render dashboard → **New → Blueprint** → select the repo (it reads `render.yaml`).
2. Fill the prompted values: `MONGODB_URI`, the three `CLOUDINARY_*` keys, `EMAIL_FROM`, `BREVO_API_KEY`, and `CLIENT_URL` (use a placeholder such as `https://example.com` for now; fix it in step 5).
3. Deploy. When it is live, open `https://YOUR-API-NAME.onrender.com/api/health`. You should see `"database":"connected"`.

Railway alternative: new project from the repo, set **Root Directory** to `server`, and add the same variables. `server/railway.json` already sets the start command and health check.

## 4. Frontend on Vercel

1. Edit `client/vercel.json`: replace `YOUR-API-NAME.onrender.com` with your Render hostname, then commit and push.
2. Vercel → **Add New → Project** → import the repo. Set **Root Directory** to `client`. Use the Vite defaults (build `npm run build`, output `dist`). Add no environment variables.
3. Deploy and note the URL, for example `https://musicstream.vercel.app`.

## 5. Connect them

In Render → your service → **Environment**, set `CLIENT_URL` to your Vercel URL (no trailing slash; add a custom domain too, comma-separated, if you have one). Render redeploys automatically.

## 6. First run

1. Open the Vercel URL, sign up (you'll get a verification code by email), and make yourself admin: open the `users` collection in MongoDB Compass and change your `role` from `user` to `admin`, or run `npm run make-admin -- you@example.com` locally with `server/.env` pointing at the production database.
2. Upload content from the admin panel, or run `npm run seed` locally with `server/.env` pointing at the production database and Cloudinary.

### Checklist

- [ ] `/api/health` shows `"database":"connected"`
- [ ] Sign up, enter the emailed code, refresh the page: still logged in
- [ ] Log in from Safari or a private window (proves the cookie setup)
- [ ] Play a song and navigate around; playback continues
- [ ] Admin upload works
- [ ] The browser menu offers **Install app**

## Email setup (verification and password-reset codes)

Locally, leave `EMAIL_PROVIDER=console`: emails print in the server terminal. In production, a real provider is required and the server refuses to start with `console`.

| Provider | Setup |
| --- | --- |
| **Brevo** (free: 300 emails/day) | Sign up at brevo.com, add and verify a *sender* (your own email address works; no domain needed), create an API key. Set `EMAIL_PROVIDER=brevo`, `BREVO_API_KEY`, and `EMAIL_FROM` to the verified sender, e.g. `MusicStream <you@gmail.com>` |
| **Resend** | Verify a domain at resend.com, create an API key. Set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM` |
| **SMTP** (e.g. Gmail) | `npm install nodemailer --prefix server`, then set `EMAIL_PROVIDER=smtp`, `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASS` (a Gmail *App Password*, which needs 2-step verification) |

Render's free plan blocks outbound SMTP, so use Brevo or Resend there. Emails sent from a `@gmail.com` address often land in spam; a custom domain avoids that.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | yes | Atlas connection string, including the database name |
| `JWT_SECRET` | yes | 32+ random characters: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | no | Session length, e.g. `7d` (default) |
| `CLIENT_URL` | production | Frontend origin(s), comma-separated, no trailing slash. Used for CORS and the CSRF origin check |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | for uploads | From the Cloudinary dashboard |
| `EMAIL_PROVIDER` | production | `console` (development only), `brevo`, `resend` or `smtp` |
| `EMAIL_FROM` | real email | Sender, which must be verified with your provider |
| `BREVO_API_KEY` / `RESEND_API_KEY` / `SMTP_*` | per provider | Credentials for the chosen provider |
| `TRUST_PROXY_HOPS` | production | Proxies in front of the API: `1` (Render only) or `2` (Vercel forwarding to Render) |
| `PORT`, `NODE_ENV` | no | Default `5000` and `development` |

The client needs no environment variables.

## Production notes

- **Cold starts:** Render's free plan sleeps after about 15 minutes idle and takes up to a minute to wake. A free monitor (UptimeRobot, cron-job.org) pinging `/api/health` every 10 minutes keeps it warm.
- **Trust proxy:** the API sits behind Vercel and Render, so `TRUST_PROXY_HOPS=2` makes rate limits count each visitor separately. Without the Vercel forwarding, use `1`.
- **Large uploads:** admin uploads go browser → Vercel → Render → Cloudinary. If a big audio file fails with a 413 or a timeout, upload it from your own machine: run the app locally with `server/.env` pointing at the production database and Cloudinary, or use `npm run seed`.
- **Preview deployments:** Vercel preview URLs are not in `CLIENT_URL`, so logging in on them is rejected by the CSRF origin check. Add a preview URL to `CLIENT_URL` if you need it.
- **Secrets:** rotate `JWT_SECRET` to sign everyone out. Never commit `.env`.
- **Cloudinary links are public:** anyone with a song's URL can play it. Protecting audio would need signed URLs.

## Installing the app

- **Chrome / Edge (computer):** click the install icon in the address bar, or use **Install App** in the sidebar.
- **Android (Chrome):** menu → **Install app**.
- **iPhone / iPad (Safari):** Share → **Add to Home Screen**. Safari has no install prompt.

Installing needs HTTPS (Vercel provides it) and a production build. To try it locally:

```bash
cd client && npm run build && npm run preview     # open http://localhost:4173 (keep the API running)
```

## Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| `Invalid environment configuration` at startup | A required variable is missing in `server/.env` (the message names it) |
| `MongoDB connection failed` | Wrong password, database name missing from the URI, or your IP isn't allowed in Atlas Network Access |
| Verification email never arrives | Check spam; check the server log for `Failed to send…`; confirm `EMAIL_FROM` is a verified sender with your provider |
| Codes print in the terminal instead of being emailed | `EMAIL_PROVIDER` is still `console`: edit `server/.env` (not `.env.example`) and restart the server |
| `403 Missing required request header` | A request didn't come from the app. Add `-H "X-Requested-With: XMLHttpRequest"` to curl tests |
| `403 Request origin is not allowed` | `CLIENT_URL` doesn't include the exact site you're using (check `https`, no trailing slash) |
| Login works locally but not when deployed | `vercel.json` still has the placeholder API hostname, or `CLIENT_URL` is wrong |
| First request after a while takes about a minute | Render free plan waking up (see Cold starts) |
| `Couldn't play "…"` | The browser can't decode that file; MP3 is the safest format |
| No install option | Use a production build over HTTPS (or `localhost`); iPhone needs the manual Share steps |
