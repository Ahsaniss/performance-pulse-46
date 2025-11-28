import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { EmployeeAnalytics } from '../../types';
import api from '@/lib/api';

interface EmployeeAIChatProps {
  employeeName: string;
  analytics: EmployeeAnalytics;
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export const EmployeeAIChat: React.FC<EmployeeAIChatProps> = ({ employeeName, analytics }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await api.post('/analytics/chat', {
        message: userMessage,
        employeeName,
        metrics: analytics.metrics,
        taskHistory: analytics.taskHistory,
        chatHistory: messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', content: m.content }))
      });

      const data = response.data;
      
      if (data.success) {
        setMessages(prev => [...prev, { role: 'ai', content: data.data }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error processing your request." }]);
      }
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, { role: 'ai', content: "Network error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg z-50 bg-indigo-600 hover:bg-indigo-700"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="w-8 h-8 text-white" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[350px] md:w-[400px] h-[500px] shadow-2xl z-50 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300 border-indigo-200">
          <CardHeader className="bg-indigo-600 text-white rounded-t-lg py-3 px-4 flex flex-row items-center justify-between shrink-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Assistant ({employeeName})
            </CardTitle>
            <Button variant="ghost" size="icon" className="text-white hover:bg-indigo-700 h-8 w-8" onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden bg-gray-50">
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 mt-10 text-sm">
                  <Bot className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Ask me anything about {employeeName}'s performance!</p>
                  <p className="text-xs mt-2">Try: "Why is their efficiency low?" or "List their overdue tasks."</p>
                </div>
              )}
              
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 text-sm ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-lg p-3 rounded-bl-none shadow-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            <div className="p-3 bg-white border-t border-gray-200 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="bg-indigo-600 hover:bg-indigo-700">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
