# WorldStage Live Streaming Platform

This is the frontend web application for WorldStage, a modern live streaming platform that allows viewers to watch streams, interact via chat, and participate in encore events.

## Features

- **Live Streaming**: HLS-based video streaming with custom player controls
- **Real-time Chat**: Interactive chat with support for different message types (audience, streamer, admin, system)
- **Encore System**: Viewers can contribute to request an encore from streamers
- **Dynamic UI**: Responsive design that works across different device sizes
- **Real-time Updates**: Server-sent events (SSE) for live updates to stream information

## Technology Stack

- [Next.js](https://nextjs.org) - React framework for the frontend
- [TailwindCSS](https://tailwindcss.com) - Utility-first CSS framework for styling
- [Stomp.js](https://github.com/stomp-js/stompjs) - WebSocket client for real-time chat
- [HLS.js](https://github.com/video-dev/hls.js/) - HTTP Live Streaming client
- [React Player](https://github.com/cookpete/react-player) - React component for video playback

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a custom font family.

## Backend Requirements

This frontend application requires a running backend server. You can do so buy running docker compose in local-docker-platform. This will spin up the nginx-rtmp server and Spring Boot API.


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
