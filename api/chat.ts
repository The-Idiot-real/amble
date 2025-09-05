import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages, stream } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        stream: !!stream,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return new NextResponse(text, { status: response.status });
    }

    if (!stream) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    // STREAMING
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          chunk.split("\n").forEach((line) => {
            if (line.trim().startsWith("data: ")) {
              const data = line.slice(6).trim();
              writer.write(`data: ${data}\n\n`);
            }
          });
        }
        writer.write("data: [DONE]\n\n");
      } catch (error) {
        console.error('Streaming error:', error);
      } finally {
        writer.close();
      }
    })();

    return new NextResponse(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
