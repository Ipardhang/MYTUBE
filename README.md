# MyTube

MyTube continues the YouTube training project supplied at https://github.com/BitHeadmr/you_tube2.0. The original repository is unchanged. This repository preserves the provided Next.js frontend and Express/MongoDB backend and adds internship work on top.

## Current additions

- Responsive MyTube Studio dashboard with membership, downloads, community, security, and live-room sections
- Custom HTML5 player controls, keyboard shortcuts, playback speed, PiP/fullscreen, resume position, and completion tracking
- Threaded comments with edit history, a 15-minute edit window, soft deletion, votes, reports, sorting, moderation checks, and a configurable translation endpoint
- Setup and deployment notes for the frontend and API

## Run locally

1. Follow [API setup](server/README.md), start MongoDB, and run the Express server.
2. Follow [frontend setup](yourtube/README.md) and run the Next.js app.

The frontend uses port 3000 and the API defaults to port 5000.

## Before internship submission

This work is not deployed yet. The membership screen is a comparison/dashboard view; Razorpay order creation, verification and billing emails still need to be connected. Server-side download authorization and quota records, Firebase token verification, OTP/trusted-device flows, and multi-user WebRTC signaling/TURN setup also remain before those features can be treated as production-ready. The dashboard labels these provider-dependent features instead of activating them without verification.

Configure provider secrets only in hosting environment settings. Do not commit API keys, database passwords, or service credentials.
