import { NextResponse } from "next/server";

export async function GET() {
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Send initial stream URL
  const initialData = {
    streamUrl: "http://localhost:8080/hls/stream.m3u8", // TODO: Replace with actual stream URL
  };

  writer.write(encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`));

  // Keep the connection open for SSE
  return new NextResponse(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
} 