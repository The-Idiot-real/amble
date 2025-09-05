// src/components/AiChat.tsx
import React, { useState } from "react";

type Msg = { role: "user" | "assistant" | "system"; content: string };

const STREAMING = true; // set false if you want the simpler non-stream flow first

export function AiChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const newUserMsg: Msg = { role: "user", content: text };
    const messagesWithSystem = messages.length === 0 
      ? [{ role: "system" as const, content: "You are a helpful AI assistant. Be concise and friendly." }, newUserMsg]
      : [...messages, newUserMsg];
    setMessages((m) => [...m, newUserMsg]);
    setInput("");
    setLoading(true);

    try {
      console.log("Sending messages:", messagesWithSystem);
      
      // Call OpenAI directly with hardcoded API key
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer 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"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: messagesWithSystem,
          temperature: 0.7,
          stream: STREAMING
        })
      });

      console.log("Response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      if (!STREAMING) {
        // Non-streaming response
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content ?? "";
        setMessages((m) => [...m, { role: "assistant", content }]);
      } else {
        // Streaming response
        if (!response.body) throw new Error("No response body for streaming");
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantText = "";

        // Add a placeholder assistant message we update as chunks arrive
        setMessages((m) => [...m, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const json = JSON.parse(data);
                const delta = json?.choices?.[0]?.delta?.content ?? "";
                if (delta) {
                  assistantText += delta;
                  
                  // Update the last assistant message
                  setMessages((m) => {
                    const copy = m.slice();
                    const lastIdx = copy.length - 1;
                    if (lastIdx >= 0 && copy[lastIdx].role === "assistant") {
                      copy[lastIdx] = { role: "assistant", content: assistantText };
                    }
                    return copy;
                  });
                }
              } catch (e) {
                // Ignore JSON parse errors for non-data lines
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Full error object:", err);
      const errorMessage = err?.message || String(err);
      console.error("Error message:", errorMessage);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `⚠️ Error: ${errorMessage}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="border rounded p-3 h-96 overflow-auto bg-white/70">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-2 ${m.role === "user" ? "text-blue-700" : "text-slate-800"}`}
          >
            <b>{m.role}:</b>{" "}
            <span style={{ whiteSpace: "pre-wrap" }}>{m.content}</span>
          </div>
        ))}
        {loading && <div className="text-slate-500">Thinking…</div>}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="border rounded p-2 flex-1"
          placeholder="Type your message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
}
