import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Message } from '@/types';
import { toast } from 'sonner';

export const useMessages = (userId?: string) => {
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['messages', userId],
    queryFn: async () => {
      const params = userId ? { userId } : {};
      const response = await api.get('/messages', { params });
      if (response.data.success) {
        return response.data.data.map((msg: any) => ({
          ...msg,
          id: msg._id,
          from: msg.from?._id || msg.from, // Handle populated or ID
          timestamp: msg.createdAt, // Map createdAt to timestamp
        }));
      }
      return [];
    },
    enabled: !!userId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: Partial<Message> | FormData) => {
      // Let axios handle the Content-Type for FormData to ensure the boundary is set correctly
      const response = await api.post('/messages', messageData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success('Message sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send message');
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.put(`/messages/${id}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to mark message as read');
    },
  });

  return {
    messages,
    loading,
    sendMessage: (messageData: Partial<Message> | FormData) => sendMessageMutation.mutateAsync(messageData),
    markAsRead: (id: string) => markAsReadMutation.mutateAsync(id),
    refetch,
  };
};
