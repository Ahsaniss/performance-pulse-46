import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Message {
  id: string;
  from_user: string;
  to_user: string | null;
  subject: string;
  content: string;
  is_broadcast: boolean;
  read: boolean;
  created_at: string;
}

export const useMessages = (userId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchMessages();

      // Subscribe to realtime changes
      const channel = supabase
        .channel('messages-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `to_user=eq.${userId}`
          },
          () => {
            fetchMessages();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId]);

  const fetchMessages = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`to_user.eq.${userId},and(is_broadcast.eq.true,to_user.is.null)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast.error('Failed to load messages');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageData: {
    to_user: string | null;
    subject: string;
    content: string;
    is_broadcast: boolean;
    from_user: string;
  }) => {
    try {
      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) throw error;
      toast.success('Message sent successfully');
    } catch (error: any) {
      toast.error('Failed to send message');
      console.error(error);
      throw error;
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);

      if (error) throw error;
      fetchMessages();
    } catch (error: any) {
      console.error('Failed to mark message as read:', error);
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