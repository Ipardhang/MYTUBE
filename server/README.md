# MyTube API server

The Express API and MongoDB models for the original training project.

## Run locally

```bash
cd server
npm install
```

Create `.env`:

```env
PORT=5000
APP_ORIGINS=http://localhost:3000
VIDEO_STREAM_SECRET=<random-long-secret>
FIREBASE_PROJECT_ID=your-firebase-project-id
ADMIN_EMAILS=admin@example.com
DB_URL=mongodb+srv://<user>:<password>@<cluster>/<database>
PROFANITY_TERMS=term1,term2
TRANSLATION_API_URL=https://<your-libretranslate-host>/translate
```

Then run:

```bash
npm start
```

The API is available at http://localhost:5000. Keep `.env` out of Git.

## Comment endpoints

- `GET /comment/:videoId?sort=newest|oldest|most-liked|relevant`
- `POST /comment/postcomment`
- `POST /comment/editcomment/:id` (15-minute edit window)
- `DELETE /comment/deletecomment/:id` (soft delete; replies remain)
- `PATCH /comment/:id/vote`
- `POST /comment/:id/report`
- `POST /comment/:id/translate` (LibreTranslate-compatible endpoint required)
- `GET /comment/moderation/reports` and `PATCH /comment/:id/moderation` (Firebase email must be listed in `ADMIN_EMAILS`)
- `GET /video/stream-token/:id` and `GET /video/stream/:id?token=...` for short-lived membership-checked playback

Comment writes, votes and reports require a Firebase ID token, checked against the email on the MongoDB user record. Comment reports, edit history and administrator moderation actions are stored with the comment. After three recent comments, the server issues a short arithmetic challenge; rate limits and challenges are in-memory for this single-server demo. Reports are queued in the record and do not automatically delete a comment.

## Deployment notes

Deploy this folder as a separate Node service (for example, Render) and set `DB_URL`, `PORT`, `APP_ORIGINS`, `VIDEO_STREAM_SECRET`, `FIREBASE_PROJECT_ID`, Razorpay test keys, and optional translation/moderation settings. Set the frontend's `NEXT_PUBLIC_BACKEND_URL` to this service's HTTPS URL.

Firebase ID tokens protect comment mutations and the token email is matched to the MongoDB user. The rest of the inherited API routes still need the same authorization middleware. Add OTP/trusted-device enforcement before production; never treat a client-supplied user ID as authentication. Payment, email, and multi-user call signaling also need provider credentials and server integration.
