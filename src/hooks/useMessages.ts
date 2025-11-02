import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// Mock data store for frontend-only mode
// TODO: Replace with your backend API calls
const STORAGE_KEY = 'messages_data';

export interface Message {
  id: string;
  from_user: string;
  to_user: string | null;
  subject: string;
  content: string;
  read: boolean;
  is_broadcast: boolean;
  created_at: string;
}

export const useMessages = (userId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchMessages();
    }
  }, [userId]);

  const fetchMessages = async () => {
    if (!userId) return;

    try {
      // TODO: Replace with your backend API
      // const response = await fetch(`/api/messages?userId=${userId}`);
      // const data = await response.json();
      
      const storedData = localStorage.getItem(STORAGE_KEY);
      const allData = storedData ? JSON.parse(storedData) : [];
      
      const filtered = allData.filter((m: Message) => 
        m.to_user === userId || m.from_user === userId || (m.is_broadcast && m.to_user === null)
      ).sort((a: Message, b: Message) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setMessages(filtered);
    } catch (error: any) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageData: {
    from_user: string;
    to_user: string | null;
    subject: string;
    content: string;
    is_broadcast?: boolean;
  }) => {
    try {
      // TODO: Replace with your backend API
      // await fetch('/api/messages', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(messageData)
      // });
      
      const storedData = localStorage.getItem(STORAGE_KEY);
      const allData = storedData ? JSON.parse(storedData) : [];
      
      const newMessage: Message = {
        id: `msg_${Date.now()}`,
        ...messageData,
        is_broadcast: messageData.is_broadcast || false,
        read: false,
        created_at: new Date().toISOString(),
      };
      
      allData.push(newMessage);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
      
      toast.success('Message sent successfully');
      fetchMessages();
    } catch (error: any) {
      toast.error('Failed to send message');
      console.error(error);
      throw error;
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // TODO: Replace with your backend API
      // await fetch(`/api/messages/${id}/read`, { method: 'PATCH' });
      
      const storedData = localStorage.getItem(STORAGE_KEY);
      const allData = storedData ? JSON.parse(storedData) : [];
      const updatedData = allData.map((m: Message) => 
        m.id === id ? { ...m, read: true } : m
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      fetchMessages();
    } catch (error: any) {
      toast.error('Failed to mark message as read');
      console.error(error);
      throw error;
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    markAsRead,
    refetch: fetchMessages,
  };
};
