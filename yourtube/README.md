# MyTube frontend

This is the Next.js frontend of the YouTube training project, extended with the internship feature dashboard, custom player controls, and a threaded comment UI.

## Run the frontend

Start the API server in another terminal first (see [server setup](../server/README.md)), then run:

```bash
cd yourtube
npm install
```

Copy `.env.example` to `.env.local` and fill in your backend URL:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

Then start Next.js:

```bash
npm run dev
```

Open http://localhost:3000. The existing Firebase project configuration is in `src/lib/firebase.js`; use your own Firebase project before production.

## Deployment

For Vercel, import this repository and set the **Root Directory** to `yourtube`. Set `NEXT_PUBLIC_BACKEND_URL` to the public API URL. The Express/MongoDB server must be deployed separately and configured with its own environment variables; the Next.js frontend alone is not the complete application.

A public deployment also needs working MongoDB, Firebase, Razorpay test credentials, translation service, and WebRTC signaling/TURN configuration for their related features. Do not commit secrets.
