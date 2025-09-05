import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Make the request to OpenAI with streaming enabled
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ ...body, stream: true }), // force streaming
    });

    if (!response.body) throw new Error("No response body");

    // Stream back the response directly
    return new NextResponse(response.body, {
      headers: { "Content-Type": "text/event-stream" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

