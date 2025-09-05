import React, { useState } from "react";

type Msg = { role: "user" | "assistant" | "system"; content: string };

const STREAMING = true;

export default function AiChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const newUserMsg: Msg = { role: "user", content: text };
    const messagesWithSystem =
      messages.length === 0
        ? [
            { role: "system", content: "You are a helpful AI assistant. Be concise and friendly." },
            newUserMsg,
          ]
        : [...messages, newUserMsg];

    setMessages((m) => [...m, newUserMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messagesWithSystem, stream: STREAMING }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "API error");
      }

      if (!STREAMING) {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content ?? "";
        setMessages((m) => [...m, { role: "assistant", content }]);
      } else {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let assistantText = "";

        setMessages((m) => [...m, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          chunk.split("\n").forEach((line) => {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") return;
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
              } catch {}
            }
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
          disabled={loading}
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
