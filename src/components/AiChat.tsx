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
      if (!STREAMING) {
        // ---- Non-streaming (easiest baseline) ----
        const res = await fetch("https://dapxjgvvvxkbmshwnsvc.supabase.co/functions/v1/ai-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: messagesWithSystem, stream: false }),
        });

        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const content = data?.content ?? "";
        setMessages((m) => [...m, { role: "assistant", content }]);
      } else {
        // ---- Streaming (consume plain text stream) ----
        const res = await fetch("https://dapxjgvvvxkbmshwnsvc.supabase.co/functions/v1/ai-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: messagesWithSystem, stream: true }),
        });
        if (!res.ok || !res.body) throw new Error(await res.text());

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
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `⚠️ Error: ${err?.message || String(err)}` },
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
