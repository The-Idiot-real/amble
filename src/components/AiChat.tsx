import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function AiChat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");
    setLoading(true);

    const { data, error } = await supabase.functions.invoke("ai-chat", {
      body: { message: input },
    });

    setLoading(false);
    if (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${error.message}` },
      ]);
    } else if (data?.reply) {
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    }
  };

  return (
    <div className="p-4 bg-gray-900 text-white rounded">
      {/* Messages */}
      <div className="h-64 overflow-y-auto mb-4">
        {messages.map((m, idx) => (
          <div key={idx} className={m.role === "user" ? "text-right" : "text-left"}>
            <span className={`inline-block px-3 py-2 rounded ${m.role === "user" ? "bg-blue-600" : "bg-gray-700"}`}>
              {m.content}
            </span>
          </div>
        ))}
        {loading && <div className="italic text-gray-400">Thinking...</div>}
      </div>

      {/* Input area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 border rounded px-3 py-2 bg-gray-800 border-gray-600"
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} className="bg-blue-500 px-4 rounded hover:bg-blue-600">
          Send
        </button>
      </div>
    </div>
  );
}
