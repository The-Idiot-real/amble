import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { messages, stream } = req.body;

  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({ error: "Invalid messages" });
    return;
  }

  try {
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
      res.status(response.status).send(text);
      return;
    }

    if (!stream) {
      const data = await response.json();
      res.status(200).json(data);
      return;
    }

    // STREAMING
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      chunk.split("\n").forEach((line) => {
        if (line.trim().startsWith("data: ")) {
          const data = line.slice(6).trim();
          res.write(`data: ${data}\n\n`);
        }
      });
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err?.message || String(err) });
  }
}
