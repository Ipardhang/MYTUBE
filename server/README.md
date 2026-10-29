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

Comment reports and edit history are stored with the comment. Reports are queued in the record and do not automatically delete a comment.

## Deployment notes

Deploy this folder as a separate Node service (for example, Render) and set `DB_URL`, `PORT`, and optional translation/moderation settings. Set the frontend's `NEXT_PUBLIC_BACKEND_URL` to this service's HTTPS URL.

The inherited training backend currently identifies users by the submitted MongoDB user ID. Before production, add Firebase ID-token verification and server-side OTP/trusted-device enforcement; never treat a client-supplied user ID as authentication. Payment, email, and multi-user call signaling also need provider credentials and server integration.
