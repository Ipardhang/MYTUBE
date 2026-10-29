# MyTube API server

The Express API and MongoDB models for the original training project.

## Run locally

```bash
cd server
npm install
```

Copy `.env.example` to `.env` and fill in your values:

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

Comment writes, votes, and reports require a Firebase ID token, checked against the email on the MongoDB user record. Comment reports, edit history, and administrator moderation actions are stored with the comment. After three recent comments, the server issues a short arithmetic challenge; rate limits and challenges are in-memory for this single-server demo. Reports are queued in the record and do not automatically delete a comment.

## Membership and downloads

- `GET /membership/plans`
- `GET /membership/:userId` for status and billing history
- `POST /membership/orders` to create or reuse a Razorpay order
- `POST /membership/verify` to verify the payment signature and captured payment
- `POST /membership/payments/status` to record failed or cancelled attempts
- `POST /membership/:userId/cancel` to stop renewal
- `GET /membership/downloads/:userId` for download history and remaining quota
- `POST /membership/downloads/:userId/:videoId` to authorize and stream a video

Membership and download mutations require a Firebase ID token matching the MongoDB account email. Video streams use a short-lived signed URL; premium access is checked again when the stream is requested. Razorpay activates a plan only after server-side signature and gateway status verification.

## Deployment notes

Use [render.yaml](render.yaml) as the starting blueprint for a separate Render Node service (or configure the same settings manually). Set `DB_URL`, `APP_ORIGINS`, `VIDEO_STREAM_SECRET`, and optional Razorpay, translation, and receipt-email settings in the host. Configure the frontend's `NEXT_PUBLIC_BACKEND_URL` to this service's HTTPS URL.

Firebase ID tokens protect comment mutations and the token email is matched to the MongoDB user. Some inherited API routes still need authorization hardening before production. The dashboard's security panel does not enforce OTP/trusted devices. The live-room panel is only a local device preview: no room signaling or peer connection is implemented. Video uploads use local disk and require persistent object storage for hosted use.

See [the deployment guide](../DEPLOYMENT.md) for frontend deployment, host configuration, public-link review, and the demo video outline.
