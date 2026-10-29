# MyTube deployment and final review

The repository is a monorepo. The Next.js frontend deploys to Vercel from `yourtube/`; the Express API deploys as a separate Node web service. The API is required for sign-in records, comments, memberships, downloads, and protected video streams.

## 1. Prepare the providers

1. Create a MongoDB Atlas database and allow connections from the API host. Keep the username and password in the host's secret settings.
2. Configure the Firebase project used by this app. Confirm the authorized sign-in domain includes the final Vercel domain.
3. Keep the Razorpay integration in test mode until the checkout and server verification flow has been reviewed. Use test keys only in the host secret settings.
4. Choose a persistent object store for uploaded videos before accepting real uploads. The current backend stores uploads on local disk, which is not durable on typical container hosts.

## 2. Deploy the API

1. In Render, create a Blueprint from this GitHub repository and select `server/render.yaml`, or create a Node web service with root directory `server`, build command `npm install`, and start command `npm start`.
2. Set `DB_URL` to the Atlas connection string. Set `APP_ORIGINS` to the exact production frontend origin (for example `https://your-app.vercel.app`, without a trailing slash). Add any additional preview origins only if needed.
3. Set the Firebase project ID and Razorpay test keys. Configure optional receipt email, translation, and moderation environment variables only if those services are available.
4. Wait until the service is healthy. Open its root URL; it should return the backend status message.

The API host URL is needed for the frontend deploy.

## 3. Deploy the frontend to Vercel

1. Import `Ipardhang/MYTUBE` in Vercel.
2. Set **Root Directory** to `yourtube`. Keep the detected Next.js framework and default build command.
3. Set `NEXT_PUBLIC_BACKEND_URL` to the deployed API's HTTPS origin. Add the Firebase client configuration variables if you replace the training Firebase project with your own.
4. Deploy and add the final Vercel production domain to Firebase authorized domains and the API's `APP_ORIGINS`. Redeploy the API after changing its environment.
5. Open the public Vercel URL in a private browser window and check that it loads without a Vercel login.

## 4. Review before sharing

- Test sign-in, video playback, search, comments, channel actions, membership checkout in test mode, billing status, downloads, and mobile/tablet layout.
- Verify the API rejects unauthorized comment, payment, and download requests.
- Confirm video uploads persist after an API restart before enabling uploads for evaluation.
- Record a 2–5 minute screen capture showing the public app running, the main features, and key implementation decisions. Watch it once and confirm the audio and screen are readable.
- Do not submit until every public link is reachable, the live app has been reviewed, and the final video is ready. The internship instructions state the submission cannot be edited afterward.

## Demo video outline (about 3 minutes)

1. **0:00–0:20** — Introduce MyTube as an extension of the supplied training project and show the home page on the public deployment.
2. **0:20–1:10** — Search for a video, open it, and demonstrate player controls and responsive layout.
3. **1:10–1:50** — Show threaded comments and explain authentication, moderation/reporting, and the edit window.
4. **1:50–2:30** — Walk through membership plans, billing history, and download quota UI. Use test mode only; do not expose credentials or payment details.
5. **2:30–3:00** — Show the responsive internship dashboard and describe which external services power the API and which integrations are configured.

This file is a deployment guide, not a claim that the app has been deployed. Deployment requires access to your Vercel/Render accounts and private provider values; never commit those values to Git.
