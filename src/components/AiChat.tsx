import React, { useState } from "react";

type Msg = { role: "user" | "assistant" | "system"; content: string };

export default function AiChat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    // Add user message immediately
    const newUserMsg: Msg = { role: "user", content: text };
    setMessages((m) => [...m, newUserMsg]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      console.log("🚀 Sending message to AI...");
      
      // DIRECT OPENAI API CALL
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are a helpful AI assistant. Be concise and friendly." },
            { role: "user", content: text }
          ],
          temperature: 0.7,
        }),
      });

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error:", errorText);
        setError(`API Error: ${response.status}`);
        return;
      }

      const data = await response.json();
      console.log("✅ API Response:", data);

      const content = data?.choices?.[0]?.message?.content || "No response from AI";
      
      // Add AI response
      setMessages((m) => [...m, { role: "assistant", content }]);
    } catch (err: any) {
      console.error("💥 Fetch error:", err);
      setError(`Error: ${err?.message || "Network error"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 border-2 border-blue-200 rounded-xl max-w-2xl mx-auto bg-white shadow-lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">💬 AI Assistant</h3>
        <p className="text-sm text-gray-600">Ask me anything and I'll respond right away!</p>
      </div>
      
      {/* Chat Messages */}
      <div className="space-y-3 mb-4 h-80 overflow-y-auto bg-gray-50 p-4 rounded-lg border">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>👋 Start a conversation by typing a message below!</p>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={`flex ${
            m.role === "user" ? "justify-end" : "justify-start"
          }`}>
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              m.role === "user" 
                ? "bg-blue-500 text-white rounded-br-none" 
                : "bg-gray-200 text-gray-800 rounded-bl-none"
            }`}>
              <div className="text-xs opacity-75 mb-1">
                {m.role === "user" ? "You" : "AI"}
              </div>
              <div>{m.content}</div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg rounded-bl-none">
              <div className="text-xs opacity-75 mb-1">AI</div>
              <div className="flex items-center">
                <div className="animate-pulse">🤔 Thinking...</div>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg border border-red-200">
              <div className="text-sm">⚠️ {error}</div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          disabled={loading}
          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          placeholder="Type your message here..."
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
