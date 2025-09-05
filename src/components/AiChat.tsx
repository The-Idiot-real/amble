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
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: messagesWithSystem,
          temperature: 0.7,
          stream: STREAMING,
        }),
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
              } catch { }
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
    <div className="p-4 border rounded-lg max-w-2xl mx-auto">
      <div className="space-y-4 mb-4">
        {messages.map((m, i) => (
          <div key={i} className="p-2 bg-gray-50 rounded">
            <strong>{m.role}:</strong> {m.content}
          </div>
        ))}
      </div>

      {loading && <div className="text-gray-500">Thinking…</div>}

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={loading}
          className="flex-1 p-2 border rounded"
          placeholder="Ask me anything..."
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
