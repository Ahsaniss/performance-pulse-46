import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Meeting } from '@/types';
import { toast } from 'sonner';

export const useMeetings = (userId?: string) => {
  const queryClient = useQueryClient();

  const { data: meetings = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['meetings', userId],
    queryFn: async () => {
      const params = userId ? { userId } : {};
      const response = await api.get('/meetings', { params });
      if (response.data.success) {
        return response.data.data.map((meet: any) => ({
          ...meet,
          id: meet._id,
          scheduledBy: meet.scheduledBy?._id || meet.scheduledBy,
          attendees: meet.attendees?.map((a: any) => a._id || a) || [],
        }));
      }
      return [];
    },
    enabled: true,
  });

  const createMeetingMutation = useMutation({
    mutationFn: async (meetingData: Partial<Meeting>) => {
      const response = await api.post('/meetings', meetingData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create meeting');
    },
  });

  return {
    meetings,
    loading,
    createMeeting: (meetingData: Partial<Meeting>) => createMeetingMutation.mutateAsync(meetingData),
    refetch,
  };
};
