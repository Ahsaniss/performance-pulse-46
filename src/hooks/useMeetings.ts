import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  scheduled_by: string;
  date: string;
  time: string;
  link: string | null;
  status: string;
  created_at: string;
  attendees?: string[];
}

export const useMeetings = (userId?: string) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchMeetings();

      // Subscribe to realtime changes
      const channel = supabase
        .channel('meetings-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'meetings'
          },
          () => {
            fetchMeetings();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId]);

  const fetchMeetings = async () => {
    if (!userId) return;

    try {
      // Fetch meetings and their attendees
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('meetings')
        .select('*')
        .order('date', { ascending: true });

      if (meetingsError) throw meetingsError;

      // Fetch attendees for each meeting
      const meetingsWithAttendees = await Promise.all(
        (meetingsData || []).map(async (meeting) => {
          const { data: attendeesData } = await supabase
            .from('meeting_attendees')
            .select('attendee_id')
            .eq('meeting_id', meeting.id);

          return {
            ...meeting,
            attendees: attendeesData?.map(a => a.attendee_id) || []
          };
        })
      );

      // Filter meetings where user is scheduled_by or an attendee
      const userMeetings = meetingsWithAttendees.filter(
        m => m.scheduled_by === userId || m.attendees.includes(userId)
      );

      setMeetings(userMeetings);
    } catch (error: any) {
      toast.error('Failed to load meetings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createMeeting = async (meetingData: {
    title: string;
    description: string;
    scheduled_by: string;
    date: string;
    time: string;
    link?: string;
    attendee_ids: string[];
  }) => {
    try {
      const { data: meeting, error: meetingError } = await supabase
        .from('meetings')
        .insert({
          title: meetingData.title,
          description: meetingData.description,
          scheduled_by: meetingData.scheduled_by,
          date: meetingData.date,
          time: meetingData.time,
          link: meetingData.link,
          status: 'scheduled'
        })
        .select()
        .single();

      if (meetingError) throw meetingError;

      // Add attendees
      if (meetingData.attendee_ids.length > 0) {
        const attendees = meetingData.attendee_ids.map(id => ({
          meeting_id: meeting.id,
          attendee_id: id
        }));

        const { error: attendeesError } = await supabase
          .from('meeting_attendees')
          .insert(attendees);

        if (attendeesError) throw attendeesError;
      }

      toast.success('Meeting scheduled successfully');
      fetchMeetings();
    } catch (error: any) {
      toast.error('Failed to create meeting');
      console.error(error);
      throw error;
    }
  };

  return {
    meetings,
    loading,
    createMeeting,
    refetch: fetchMeetings,
  };
};