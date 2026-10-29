# MyTube

MyTube continues the YouTube training project supplied at https://github.com/BitHeadmr/you_tube2.0. The original repository is unchanged. This repository preserves the provided Next.js frontend and Express/MongoDB backend and adds internship work on top.

## Current additions

- Responsive MyTube Studio dashboard with membership, downloads, community, security, and live-room sections
- Custom HTML5 player controls, keyboard shortcuts, playback speed, PiP/fullscreen, resume position, and completion tracking
- Threaded comments with Firebase-authenticated writes, edit history, a 15-minute edit window, soft deletion, votes, reports, an administrator queue, sorting, spam checks, a quick CAPTCHA and a configurable translation endpoint
- Razorpay order and signature verification APIs, plan expiry, cancellation and billing records; paid access is activated only after gateway verification
- Server-authorized video playback and daily download quotas with an audit trail
- Setup and deployment notes for the frontend and API

## Run locally

1. Follow [API setup](server/README.md), start MongoDB, and run the Express server.
2. Follow [frontend setup](yourtube/README.md) and run the Next.js app.

The frontend uses port 3000 and the API defaults to port 5000.

## Before internship submission

This work is not deployed yet. Razorpay and server-side download APIs are implemented but remain inactive until test credentials, MongoDB, and Firebase settings are configured. Receipt emails need a compatible email API. OTP/trusted-device enforcement, a translation service, and multi-user WebRTC signaling/TURN setup still need provider configuration and implementation before those features are production-ready. The dashboard labels these provider-dependent features instead of activating them without verification. Video uploads currently use local server disk, so a production host needs persistent object storage such as S3-compatible storage. Do not submit until you have configured providers, deployed both frontend and API, and reviewed the live app and demo recording.

Configure provider secrets only in hosting environment settings. Do not commit API keys, database passwords, or service credentials.
