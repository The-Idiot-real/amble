// supabase/functions/ai-chat/index.ts
import { serve } from "https://deno.land/std/http/server.ts";

serve(async (req) => {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid request: missing messages", { status: 400 });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response("Missing OPENAI_API_KEY", { status: 500 });
    }

    // Call OpenAI with streaming enabled
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // or gpt-4o / gpt-3.5-turbo
        messages,
        stream: true,
      }),
    });

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      return new Response(`OpenAI API error: ${errorText}`, { status: 500 });
    }

    // Stream response back to frontend
    return new Response(openaiRes.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return new Response(`Server error: ${err.message}`, { status: 500 });
  }
});
