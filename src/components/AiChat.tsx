"use client";
import React, { useState } from "react";

type Msg = { role: "user" | "assistant" | "system"; content: string };
const STREAMING = true;

export function AiChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const newUserMsg: Msg = { role: "user", content: text };
    const messagesWithSystem = messages.length === 0
      ? [{ role: "system", content: "You are a helpful AI assistant. Be concise and friendly." }, newUserMsg]
      : [...messages, newUserMsg];

    setMessages((m) => [...m, newUserMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: messagesWithSystem,
          temperature: 0.7,
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      // Add placeholder message
      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const json = JSON.parse(data);
            const delta = json?.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              assistantText += delta;
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
            // ignore non-JSON lines
          }
        }
      }
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `⚠️ Error: ${err.message}` },
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
