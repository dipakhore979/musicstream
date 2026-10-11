# Architecture and design decisions

This document explains how MusicStream is put together and why. It is meant for anyone reading the code: reviewers, interviewers, and future me.

## Overview

```
Browser (React single-page app, installable PWA)
   │   every request goes to /api/... on the SAME site
   ▼
Vercel ── rewrites /api/* ──▶ Render (Express API) ──▶ MongoDB Atlas
                                  │
                                  ├──▶ Cloudinary   (audio files and images)
                                  └──▶ Brevo        (email: one-time codes)
```

**Why Vercel forwards `/api` to Render.** If the frontend and API were on different domains, the login cookie would be a *third-party* cookie, and Safari (and some privacy modes) block those, so login would fail on iPhones and in the installed app. With the rewrite, the browser only ever talks to one site and the cookie is first-party.

## Code layout

```
server/src  routes -> middleware (auth, csrf, validate, upload, rate limits) -> controllers -> models
            utils (ApiError, asyncHandler, otp, mailer, cloudinary), validators (Zod), config (env, db)
client/src  pages -> components -> hooks / store (Zustand) -> lib (api client, helpers)
```

## Request lifecycle (server)

`helmet` and `cors` → body parsing (100 KB cap) → key sanitising → logging → global rate limit → CSRF guard → route. A route then runs, in order: auth (`protect`, `restrictTo`) → rate limiter → `multer` (uploads) → Zod validation → controller. Controllers are wrapped in `asyncHandler`, so any thrown error reaches one central error handler. Every response has the same shape: `{ success, data, message?, meta? }` or `{ success: false, message, errors?, code? }`.

## Authentication and sessions

- Passwords are hashed with bcrypt (12 rounds, via `bcryptjs`) and never selected from the database by default (`select: false`).
- Login issues a JWT (HS256, algorithm pinned on verify) stored in an **httpOnly cookie**, so page scripts cannot read it, which limits the damage of an XSS bug.
- `protect` re-loads the user on every request, so deleted accounts and role changes take effect immediately. A reset password sets `passwordChangedAt`, and tokens issued before that moment are rejected.
- Roles (`user`, `admin`) are never read from request bodies. Admins are promoted with a script or directly in the database.

## Email verification and password reset (OTP)

- A 6-digit code is generated with `crypto.randomInt` and stored only as an **HMAC-SHA256** keyed with a server secret, so a leaked database cannot be brute-forced offline.
- Codes expire after 10 minutes and are single-use. Wrong guesses are counted with an **atomic** `findOneAndUpdate` *before* comparing, so parallel requests cannot exceed the 5-attempt limit.
- Resends are limited to one per minute and five per hour per account. The row outlives the code (a TTL index purges it after an hour), so waiting for expiry doesn't reset the counter.
- "Forgot password" answers identically whether or not the email exists, so it cannot be used to discover accounts.
- Email goes through a small provider layer (`console`, `brevo`, `resend`, `smtp`). `console` prints codes to the terminal for local development and is refused in production.

## Data model

Collections: `users`, `artists`, `albums`, `songs`, `playlists`, `likes`, `otps`.

- A song belongs to one artist and optionally one album. A playlist stores an ordered array of song ids and is private to its owner.
- Likes are their own collection with a unique `(user, song)` index instead of an array on the user: it stays ordered by time, scales, and makes liking idempotent.
- Artist names have a case-insensitive unique index. OTP rows have a TTL index.
- Deleting a song also removes it from every playlist and like. Deleting an artist with content is blocked; deleting an album keeps its songs as singles.

## Uploads

`multer` keeps files in memory and streams them to Cloudinary (audio is stored as resource type `video`), so nothing touches the server's disk. File type and size are validated, images are capped at 1000 px, and if the database write fails after an upload, the uploaded files are deleted again.

## Audio player

- One `Audio` element lives **outside React** (`lib/audio.js`), so it survives route changes. A Zustand store holds the queue, current index, shuffle/repeat and volume; an `AudioEngine` component bridges the two.
- Playback progress changes four times a second, so it lives in a **separate store**: only the seek bar re-renders, not every song row.
- Shuffle keeps the current song first and shuffles the rest, remembering the original order so turning it off restores it. A `playId` counter tells the engine when a *new track* must load (even if the same song appears twice in a row).
- The Media Session API provides lock-screen and media-key controls.

## Search

Search is a debounced (300 ms) regex match across songs, artists and albums, with user input escaped. Results are ranked (exact > prefix > word-start > contains), and the best match across all three types becomes the "top result". The URL (`?q=`) is the single source of truth, and each new request aborts the previous one so a slow old response can never overwrite a newer one.

## Downloads and offline

Two options per song, album or playlist: **Save to device** (a normal file download via Cloudinary's attachment flag) and **Download in app**, which stores the audio in **IndexedDB** (metadata and file in separate stores, keyed by user). The player prefers the stored copy through a temporary `blob:` URL, so downloaded songs play with no internet. If the app opens offline, a cached copy of the user's profile (never a token) lets it open straight to the Downloads page. Admins can turn downloads off per song.

## Installable app (PWA)

A web manifest plus a deliberately conservative service worker: it never touches `/api` or cross-origin requests, uses network-first for page loads, and caches hashed build files forever. It is registered only in production builds.

## Security summary

| Concern | Measure |
| --- | --- |
| Password storage | bcrypt, never returned by the API |
| Session theft | httpOnly cookie, Secure, SameSite=None only in production |
| CSRF | Origin allow-list + required `X-Requested-With` header on state-changing requests |
| Brute force | Per-IP limits on login, code requests and code guesses, plus per-account limits and a 5-attempt cap per code |
| Injection | Zod validation on every input, `$`/`.` keys stripped, regex input escaped |
| Account discovery | Generic login errors; reset flow answers identically |
| Abuse | Upload, search, play-count and download limiters; 100 KB JSON limit |
| Headers | `helmet` with a deny-everything CSP on the API |

## Trade-offs and limitations

- Search uses regex, which is fine for thousands of songs; at larger scale it would move to Atlas Search (also gives typo tolerance).
- Cloudinary links are public, so the "downloads allowed" switch controls the app's buttons, not a technical lock.
- Audio uploads go through Vercel and Render, so very large files may hit platform limits; direct-to-Cloudinary signed uploads would remove that.
- Offline downloads depend on browser storage, which a browser may clear; cover art is not stored offline.
- Render's free plan sleeps when idle (slow first request). There are no automated tests yet.

## Ideas for next steps

Automated tests (unit tests for ranking and OTP logic, API tests with an in-memory MongoDB), cleanup of abandoned unverified accounts, replacing a song's audio file, signed uploads, offline cover art, and a CAPTCHA on signup.
