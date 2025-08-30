import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Paperclip, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  files?: FileAttachment[];
}

interface FileAttachment {
  name: string;
  size: number;
  type: string;
}

export const AiChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi there, I'm Amble. How can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !conversationId) {
      createConversation();
    }
  }, [isOpen]);

  const getOrCreateSessionId = () => {
    let sessionId = localStorage.getItem('amble_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(7) + Date.now().toString(36);
      localStorage.setItem('amble_session_id', sessionId);
    }
    return sessionId;
  };

  const createConversation = async () => {
    try {
      const sessionId = getOrCreateSessionId();
      
      // First check if there's already a conversation for this session using secure function
      const { data: existing, error: existingError } = await supabase
        .rpc('get_conversation_by_session', { session_id_param: sessionId });
        
      if (existingError) throw existingError;
      
      if (existing && existing.length > 0) {
        const conversation = existing[0];
        setConversationId(conversation.id);
        await loadExistingMessages(conversation.id, sessionId);
        return;
      }
      
      // Create new conversation if none exists
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({ session_id: sessionId })
        .select()
        .single();

      if (error) throw error;
      setConversationId(data.id);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const loadExistingMessages = async (conversationId: string, sessionId: string) => {
    try {
      // Use secure function to get messages
      const { data: messages, error } = await supabase
        .rpc('get_messages_by_conversation_and_session', { 
          conversation_id_param: conversationId,
          session_id_param: sessionId 
        });

      if (error) throw error;
      
      if (messages && messages.length > 0) {
        const loadedMessages = messages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at),
          files: msg.file_attachments ? JSON.parse(JSON.stringify(msg.file_attachments)) : undefined
        }));
        
        // Keep the initial greeting and add loaded messages
        setMessages(prev => [
          prev[0], // Keep the initial greeting
          ...loadedMessages
        ]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const saveMessage = async (message: Message) => {
    if (!conversationId) return;

    try {
      await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          role: message.role,
          content: message.content,
          file_attachments: message.files ? JSON.parse(JSON.stringify(message.files)) : null
        });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Save user message
    await saveMessage(userMessage);

    try {
      console.log('Sending message to AI chat function...');
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          message: inputMessage,
          conversationHistory: messages.slice(1).map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }
      });

      console.log('AI chat response:', data, error);

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Function call failed');
      }

      if (!data.success) {
        throw new Error(data.message || 'AI response failed');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Save assistant message
      await saveMessage(assistantMessage);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive"
      });

      const errorMessage: Message = {
        role: 'assistant',
        content: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent shadow-lg z-40"
        size="icon"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-card border border-border rounded-xl shadow-xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Amble AI</h3>
            <p className="text-xs text-muted-foreground">Always here to help</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="w-8 h-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-primary to-accent text-white'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-white/70' : 'text-muted-foreground'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted p-3 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading}
              className="pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFileSelect}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8"
              disabled={isLoading}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </div>
          <Button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || isLoading}
            size="icon"
            className="bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Powered by text */}
        <p className="text-xs text-muted-foreground mt-2 text-center opacity-60">
          Powered by ChatGPT
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={(e) => {
          // Handle file attachments here
          console.log('Files selected:', e.target.files);
        }}
      />
    </div>
  );
};