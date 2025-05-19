import { NextResponse } from "next/server";

export async function GET() {
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Send initial data
  const initialData = {
    currentStreamer: {
      id: "1",
      username: "DemoStreamer",
      title: "Welcome to WorldStage!",
      timeRemaining: 15,
    },
    queue: [
      { id: "2", username: "NextStreamer", position: 1 },
      { id: "3", username: "ThirdStreamer", position: 2 },
    ],
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