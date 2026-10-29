# MyTube

MyTube continues the YouTube training project supplied at https://github.com/BitHeadmr/you_tube2.0. The original repository is unchanged. This repository preserves the provided Next.js frontend and Express/MongoDB backend and adds internship work on top.

## Current additions

- Responsive MyTube Studio dashboard with membership, downloads, community, security, and live-room sections
- Custom HTML5 player controls, keyboard shortcuts, playback speed, PiP/fullscreen, resume position, and completion tracking
- Threaded comments with Firebase-authenticated writes, edit history, a 15-minute edit window, soft deletion, votes, reports, an administrator queue, sorting, spam checks, an arithmetic challenge, and a configurable translation endpoint
- Razorpay order and signature verification APIs, plan expiry, cancellation, and billing records; paid access is activated only after gateway verification
- Server-authorized video playback and daily download quotas with an audit trail
- Deployment notes and a Render blueprint for the API; deploy the Next.js app from `yourtube/` on Vercel

## Run locally

1. Follow [API setup](server/README.md), start MongoDB, and run the Express server.
2. Follow [frontend setup](yourtube/README.md) and run the Next.js app.

The frontend uses port 3000 and the API defaults to port 5000.

## Deployment and submission

Follow [DEPLOYMENT.md](DEPLOYMENT.md) to deploy the frontend and API separately and review the final submission. The code in this repo is not itself a live deployment; no public app URL or demo recording has been created.

Before deployment, configure MongoDB, Firebase, Razorpay test credentials, and host environment variables. Receipt emails and translation need compatible providers. The security panel currently provides theme/security settings but does not enforce OTP or trusted-device login. The live-room panel is a local camera/microphone preview and does not yet connect participants; multi-user WebRTC signaling and TURN still need implementation and configuration. Video uploads currently use local server disk, so use persistent object storage before relying on uploaded media in a hosted environment.

Configure provider secrets only in hosting environment settings. Do not commit API keys, database passwords, or service credentials.
