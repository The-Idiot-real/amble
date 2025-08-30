import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages: Message[] = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const { data, error } = await supabase.functions.invoke("ai-chat", {
      body: { message: input },
    });

    setLoading(false);

    if (error) {
      setMessages([...newMessages, { role: "assistant", content: `Error: ${error.message}` }]);
      return;
    }

    if (data?.reply) {
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">AI Chat</h1>

      <div className="border rounded p-4 h-96 overflow-y-auto bg-[#0d1224] text-white">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`mb-3 ${msg.role === "user" ? "text-right" : "text-left"}`}
          >
            <span
              className={`inline-block px-3 py-2 rounded-lg ${
                msg.role === "user" ? "bg-green-600" : "bg-gray-700"
              }`}
            >
              {msg.content}
            </span>
          </div>
        ))}
        {loading && <div className="text-gray-400">Thinking...</div>}
      </div>

      <div className="flex mt-4 gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 border rounded px-3 py-2 bg-[#0d1224] text-white"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
