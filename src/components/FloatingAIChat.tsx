import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, X, Paperclip, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  files?: File[];
  isStreaming?: boolean;
}

const FloatingAIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedMessages = localStorage.getItem('ai-chat-history');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ai-chat-history', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const typeText = (text: string, messageId: string) => {
    let index = 0;
    setStreamingText('');
    
    const interval = setInterval(() => {
      if (index < text.length) {
        const char = text[index];
        setStreamingText(prev => prev + char);
        index++;
      } else {
        clearInterval(interval);
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: text, isStreaming: false }
              : msg
          )
        );
        setStreamingText('');
      }
    }, 20);
  };

  const sendMessage = async () => {
    if ((!input.trim() && attachedFiles.length === 0) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      files: attachedFiles.length > 0 ? attachedFiles : undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedFiles([]);
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      conversationHistory.push({
        role: 'user',
        content: userMessage.content
      });

      let requestBody: any = {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'You are Amble AI, a helpful assistant for a file management platform called Amble. You can help users with file operations, conversions, organization, and general questions. Be friendly, concise, and helpful. If users share files, analyze them and provide insights.'
          },
          ...conversationHistory
        ],
        max_tokens: 1000,
        temperature: 0.7,
      };

      if (attachedFiles.length > 0) {
        const fileAnalysis = await Promise.all(
          attachedFiles.map(async (file) => {
            if (file.type.startsWith('image/')) {
              return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(`[Image: ${file.name}] - Base64 data available for analysis`);
                reader.readAsDataURL(file);
              });
            } else {
              return `[File: ${file.name} (${file.type})] - ${(file.size / 1024).toFixed(2)} KB`;
            }
          })
        );

        const filesInfo = await Promise.all(fileAnalysis);
        requestBody.messages[requestBody.messages.length - 1].content += '\n\nAttached files:\n' + filesInfo.join('\n');
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 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',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || 'No response available';

      const aiMessageId = (Date.now() + 1).toString();
      const aiMessage: Message = {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages(prev => [...prev, aiMessage]);
      typeText(aiResponse, aiMessageId);

    } catch (error) {
      console.error('AI chat error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachedFiles(prev => [...prev, ...files]);
      toast({
        title: 'Files attached',
        description: `${files.length} file(s) ready for analysis`,
      });
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem('ai-chat-history');
    toast({
      title: 'Chat cleared',
      description: 'Chat history has been cleared',
    });
  };

  if (!isOpen) {
    return (
      <div 
        className="ai-bubble"
        onClick={() => setIsOpen(true)}
      >
        <Bot className="h-6 w-6 text-white" />
      </div>
    );
  }

  return (
    <div 
      className="ai-chat-modal" 
      onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div 
        className={`ai-chat-container ${isMobile ? 'h-full w-full' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold gradient-text">Amble AI</h3>
              <p className="text-xs text-muted-foreground">Your file assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="text-xs"
            >
              Clear
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4" ref={scrollAreaRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center text-muted-foreground">
              <Bot className="h-12 w-12 mb-4 opacity-50" />
              <h4 className="font-medium mb-2">Welcome to Amble AI!</h4>
              <p className="text-sm">I can help you with file management, conversions, and analysis.</p>
              <p className="text-xs mt-2">Try uploading files or asking questions!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className={`chat-bubble ${message.role}`}>
                    <p className="text-sm whitespace-pre-wrap">
                      {message.isStreaming ? streamingText : message.content}
                      {message.isStreaming && <span className="animate-pulse">▋</span>}
                    </p>
                    {message.files && (
                      <div className="mt-2 text-xs opacity-75">
                        Attached: {message.files.map(f => f.name).join(', ')}
                      </div>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-medium">You</span>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="chat-bubble assistant">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* File attachments */}
        {attachedFiles.length > 0 && (
          <div className="border-t border-border p-3">
            <div className="flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1 text-sm">
                  <ImageIcon className="h-3 w-3" />
                  <span className="truncate max-w-32">{file.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your files..."
                disabled={isLoading}
                className="pr-12"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
            <Button
              onClick={sendMessage}
              disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="*/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
};

export default FloatingAIChat;
