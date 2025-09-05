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
      if (!STREAMING) {
        // ---- Non-streaming (easiest baseline) ----
        const url = "https://dapxjgvvvxkbmshwnsvc.supabase.co/functions/v1/ai-chat";
        console.log("Calling URL:", url);
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: messagesWithSystem, stream: false }),
        });

        console.log("Response status:", res.status);
        if (!res.ok) {
          const errorText = await res.text();
          console.error("API Error:", errorText);
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }
        const data = await res.json();
        const content = data?.content ?? "";
        setMessages((m) => [...m, { role: "assistant", content }]);
      } else {
        // ---- Streaming (consume plain text stream) ----
        const url = "https://dapxjgvvvxkbmshwnsvc.supabase.co/functions/v1/ai-chat";
        console.log("Calling streaming URL:", url);
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: messagesWithSystem, stream: true }),
        });
        console.log("Streaming response status:", res.status);
        if (!res.ok || !res.body) {
          const errorText = await res.text();
          console.error("Streaming API Error:", errorText);
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let assistantText = "";

        // Add a placeholder assistant message we update as chunks arrive
        setMessages((m) => [...m, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantText += decoder.decode(value, { stream: true });

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
