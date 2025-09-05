import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
            { role: "system", content: "You are a helpful AI assistant for file management and conversion. Be concise and friendly." },
            newUserMsg,
          ]
        : [...messages, newUserMsg];

    setMessages((m) => [...m, newUserMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: messagesWithSystem,
          stream: STREAMING,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!STREAMING) {
        const content = data?.content ?? "";
        setMessages((m) => [...m, { role: "assistant", content }]);
      } else {
        // Handle streaming response from Supabase edge function
        if (data.body) {
          const reader = data.body.getReader();
          const decoder = new TextDecoder();
          let assistantText = "";

          setMessages((m) => [...m, { role: "assistant", content: "" }]);

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            assistantText += chunk;
            
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
    <div className="p-6 border rounded-xl max-w-4xl mx-auto bg-card">
      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>👋 Hi! I'm your AI assistant. Ask me anything about file management, conversions, or general questions!</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`p-4 rounded-lg ${
              m.role === "user" 
                ? "bg-primary text-primary-foreground ml-auto max-w-[80%]" 
                : "bg-muted max-w-[80%]"
            }`}>
              <div className="text-sm font-medium mb-1 opacity-70">
                {m.role === "user" ? "You" : "AI Assistant"}
              </div>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          ))
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span>AI is thinking...</span>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={loading}
          placeholder="Ask me anything about files, conversions, or general questions..."
          className="flex-1"
        />
        <Button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          Send
        </Button>
      </div>
    </div>
  );
}
