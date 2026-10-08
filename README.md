# MusicStream

A Spotify-style music streaming web app built with the **MERN** stack: browse and search music, build
playlists, like songs, and keep listening while you navigate. Installable on phones and desktops (PWA).

## Features

- **Accounts:** sign up, log in/out, persistent sessions (JWT in an httpOnly cookie), edit name and photo
- **Library:** songs, albums and artists with cover art and metadata, paginated browsing
- **Player:** persistent bottom bar and a full-screen mobile player; play/pause, next/previous, seek,
  volume, shuffle, repeat, reorderable queue, media keys and lock-screen controls
- **Playlists and Liked Songs:** create, rename, delete, add/remove songs, 2x2 cover mosaics
- **Search:** debounced search across songs, artists and albums, top result, recent searches, genre tiles
- **Downloads, two ways:** *Download in app* saves songs inside MusicStream (a Downloads page that plays with no internet), or *Save to device* saves audio files to the phone or computer. Works for single songs, albums, playlists and Liked Songs. Admins can switch downloads on or off per song, so only music you have the right to share is offered
- **Admin panel:** upload songs (audio + cover), create albums and artists, delete content (role-based)
- **Installable app:** manifest, service worker, offline page
- **Security:** bcrypt hashing, httpOnly cookies, CSRF origin/header checks, Zod validation, helmet,
  rate limiting, query sanitising, pinned JWT algorithm

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18 (Vite), React Router, Tailwind CSS, Zustand |
| Backend | Node.js, Express 4, Mongoose |
| Database | MongoDB Atlas |
| Storage | Cloudinary (audio and images) |
| Auth | JWT in an httpOnly cookie, bcryptjs |
| Validation / security | Zod, helmet, cors, express-rate-limit |
| Hosting | Render (API), Vercel (frontend) |

## Project structure

```
musicstream/
├── render.yaml                 Render blueprint (API)
├── server/
│   ├── railway.json            Railway config (alternative to Render)
│   ├── scripts/                makeAdmin.js, seed.js
│   ├── seed/                   tracks.example.json (seed data format)
│   └── src/
│       ├── config/             env (validated), db, cloudinary
│       ├── controllers/  routes/  models/  validators/
│       ├── middleware/         auth, csrf, sanitize, upload, rate limiters, error handler
│       └── utils/
└── client/
    ├── vercel.json             SPA routing, API forwarding, caching and security headers
    ├── public/                 manifest, service worker, offline page, icons
    └── src/
        ├── components/  pages/  hooks/  store/  lib/
```

## Run it locally

**Requirements:** Node.js 18 or newer, a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster and a
free [Cloudinary](https://cloudinary.com) account.

```bash
npm install                  # from the project root (installs the dev runner)
npm run install:all          # installs server and client dependencies
cp server/.env.example server/.env   # Windows: copy server\.env.example server\.env
# edit server/.env (see the table below), then:
npm run dev                  # API on :5000, app on http://localhost:5173
```

### Environment variables (`server/.env`)

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | yes | Atlas connection string, including the database name (e.g. `/musicstream`) |
| `JWT_SECRET` | yes | 32+ random characters. Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | no | Session length, e.g. `7d` (default) |
| `CLIENT_URL` | yes in production | Your frontend origin(s), comma-separated, no trailing slash. Used for CORS and CSRF checks |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | for uploads | From the Cloudinary dashboard |
| `EMAIL_PROVIDER` | yes in production | `console` (dev: codes print in the server terminal), `brevo`, `resend` or `smtp` |
| `EMAIL_FROM` | for real email | Sender, e.g. `MusicStream <you@gmail.com>`. Must be a sender/domain verified with your provider |
| `BREVO_API_KEY` / `RESEND_API_KEY` / `SMTP_*` | per provider | Credentials for the provider you chose |
| `TRUST_PROXY_HOPS` | production | Proxies in front of the API: `1` (Render only) or `2` (Vercel forwarding to Render) |
| `PORT`, `NODE_ENV` | no | Default `5000` and `development` |

The client needs **no** variables (leave `client/.env` empty or absent).

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs API and client together |
| `npm run make-admin -- you@example.com` (in `server/`) | Promotes an existing user to admin |
| `npm run seed` (in `server/`) | Loads demo content from `server/seed/tracks.json` |
| `npm run build` / `npm run preview` (in `client/`) | Production build, served on :4173 (use this to test installing the app) |

### Making yourself admin

Sign up in the app first, then either run `npm run make-admin -- you@example.com` inside `server/`, or open
the `users` collection in MongoDB Compass and change your user's `role` from `user` to `admin`.

## Demo content (seeding)

Copy `server/seed/tracks.example.json` to `server/seed/tracks.json` and edit it. Each `audio`, `cover` and
`image` value is either an `https://` URL or a file path relative to `server/seed/` (put your own files in
`server/seed/audio/` and `server/seed/images/`). Then:

```bash
cd server
npm run seed
```

It uploads everything to Cloudinary and creates the artists, albums and songs. Running it again skips items
that already exist.

**Music licensing:** only use music you are allowed to host. Good sources are
[Pixabay Music](https://pixabay.com/music/) and the [Free Music Archive](https://freemusicarchive.org/), but
**always check the licence of each track** and give credit where required. The example file points at
SoundHelix's demo MP3s purely as test data; check their terms before using them in a public site.


## Email verification and password reset (OTP)

New accounts must confirm their email with a 6-digit code before they can log in, and anyone who forgets
their password can reset it with a code sent to their inbox.

- Codes expire after **10 minutes**, can be used **once**, and are burned after **5 wrong guesses**.
- A new code can be requested once a minute and 5 times an hour per account.
- Codes are stored as a keyed hash (HMAC), never in plain text.
- "Forgot password" answers identically whether or not the email is registered, so it can't be used to find
  out who has an account.
- Resetting a password signs out every existing session and emails a "password changed" notice.
- Accounts created before this feature are treated as verified, so nobody is locked out.

**Development:** leave `EMAIL_PROVIDER=console`. Emails are printed in the terminal running `npm run dev`;
copy the code from there. No email account needed.

**Real email** (pick one):

| Provider | Setup |
| --- | --- |
| **Brevo** (free: 300 emails/day) | Sign up at brevo.com, add and verify a *sender* (your own email address works, no domain needed), create an API key. Set `EMAIL_PROVIDER=brevo`, `BREVO_API_KEY`, and `EMAIL_FROM` to the verified sender |
| **Resend** | Verify a domain at resend.com, create an API key. Set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `EMAIL_FROM` |
| **SMTP** (e.g. Gmail) | `npm install nodemailer --prefix server`, then set `EMAIL_PROVIDER=smtp`, `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER`, and `SMTP_PASS` (a Gmail *App Password*, which needs 2-step verification) |

**Render's free plan blocks outbound SMTP**, so use Brevo or Resend (HTTP APIs) when deployed there.
Production refuses to start with `EMAIL_PROVIDER=console`, so codes can never leak into logs by accident.

## Deploy

Architecture: **Vercel** serves the React app and forwards every `/api/*` request to the **Render** backend.
The browser therefore only ever talks to one site, so the login cookie is first-party. That is what keeps
login working in Safari, on iPhones, in the installed app, and wherever third-party cookies are blocked.

### 1. Database and storage

- **Atlas → Network Access:** add `0.0.0.0/0`. Render's free plan has no fixed outbound IP, so the allow-list
  can't be narrower. Use a strong database password and a dedicated database user.
- Keep your Cloudinary keys handy.

### 2. Push to GitHub

```bash
git init && git add . && git commit -m "MusicStream"
# create an empty repo on GitHub, then:
git remote add origin https://github.com/YOUR-USER/musicstream.git
git push -u origin main
```

`.env` files are git-ignored, so your secrets are not uploaded.

### 3. Backend on Render

1. Render dashboard → **New → Blueprint** → select your repo (it reads `render.yaml`).
2. Fill the prompted values: `MONGODB_URI`, the three `CLOUDINARY_*` keys, and `CLIENT_URL` (use any valid
   placeholder such as `https://example.com` for now; you'll fix it in step 5).
3. Deploy. When it's live, open `https://YOUR-API-NAME.onrender.com/api/health`. You should see
   `"database":"connected"`.

(Railway alternative: new project from the repo, set **Root Directory** to `server`, add the same variables.
`server/railway.json` already sets the start command and health check.)

### 4. Frontend on Vercel

1. Edit `client/vercel.json`: replace `YOUR-API-NAME.onrender.com` with your Render hostname, then commit
   and push.
2. Vercel → **Add New → Project** → import the repo. Set **Root Directory** to `client`. Framework preset
   **Vite**, build command `npm run build`, output `dist` (the defaults). Add no environment variables.
3. Deploy and note your URL, e.g. `https://musicstream.vercel.app`.

### 5. Connect them

In Render → your service → **Environment**, set `CLIENT_URL` to your Vercel URL (no trailing slash; add a
custom domain too, comma-separated, if you have one). Render redeploys automatically.

### 6. First run

1. Open your Vercel URL, sign up, and make yourself admin (see above).
2. Upload content from the admin panel, or run `npm run seed` locally with `server/.env` pointing at the
   production database and Cloudinary.

### Deployment checklist

- [ ] `/api/health` shows `"database":"connected"`
- [ ] Sign up, refresh the page, still logged in
- [ ] Log in from Safari or a private window (proves the cookie setup)
- [ ] Play a song and navigate around; playback continues
- [ ] Admin upload works
- [ ] Browser menu offers **Install app**

### Production notes

- **Cold starts:** Render's free plan sleeps after ~15 minutes idle and takes up to a minute to wake. A free
  monitor (UptimeRobot, cron-job.org) pinging `/api/health` every 10 minutes keeps it warm.
- **Trust proxy:** the API sits behind Vercel and Render, so `TRUST_PROXY_HOPS=2` makes rate limits count each
  visitor separately. If you skip the Vercel forwarding, use `1`.
- **Large uploads:** admin uploads go browser → Vercel → Render → Cloudinary. If a big audio file ever fails
  with a 413 or a timeout, upload it from your own machine instead: run the app locally with `server/.env`
  pointing at the production database and Cloudinary, or use `npm run seed`.
- **Preview deployments:** Vercel preview URLs aren't in `CLIENT_URL`, so logging in on them is rejected by
  the CSRF origin check. Add a preview URL to `CLIENT_URL` if you need it.
- **Secrets:** rotate `JWT_SECRET` to sign everyone out. Never commit `.env`.
- **Cloudinary links are public:** anyone with a song's URL can play it. Protecting audio would need signed
  URLs.

## Installing the app

MusicStream is a Progressive Web App.

- **Chrome / Edge (computer):** click the install icon in the address bar, or use the **Install App** button
  in the sidebar.
- **Android (Chrome):** menu → **Install app** (or the Install app item in the account menu).
- **iPhone / iPad (Safari):** Share → **Add to Home Screen**. Safari has no install prompt.

Installing needs HTTPS (Vercel provides it) and a **production build**. To try it locally:

```bash
cd client && npm run build && npm run preview     # open http://localhost:4173 (keep the API running)
```

## Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| `Invalid environment configuration` at startup | A required variable is missing in `server/.env` (the message names it) |
| `MongoDB connection failed` | Wrong password, database name missing from the URI, or your IP isn't allowed in Atlas Network Access |
| Verification email never arrives | Check spam; check the server log for `Failed to send…`; confirm `EMAIL_FROM` is a verified sender with your provider |
| `403 Missing required request header` | A request didn't come from the app. Add `-H "X-Requested-With: XMLHttpRequest"` to curl tests |
| `403 Request origin is not allowed` | `CLIENT_URL` doesn't include the exact site you're using (check `https`, no trailing slash) |
| Login works locally but not when deployed | `vercel.json` still has the placeholder API hostname, or `CLIENT_URL` is wrong |
| First request after a while takes ~1 minute | Render free plan waking up (see Cold starts) |
| `Couldn't play "…"` | The browser can't decode that file; MP3 is the safest format |
| No install option | Use a production build over HTTPS (or `localhost`); iPhone needs the manual Share steps |

## Credits

Built as a learning project. Spotify is a trademark of Spotify AB; this project is not affiliated with it.
