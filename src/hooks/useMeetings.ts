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

const isUuid = (value?: string) => Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));

export const useMeetings = (userId?: string) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !isUuid(userId)) {
      setMeetings([]);
      setLoading(false);
      return;
    }

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
  }, [userId]);

  const fetchMeetings = async () => {
    if (!userId || !isUuid(userId)) {
      setMeetings([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const fields = `
        id,
        title,
        description,
        scheduled_by,
        date,
        time,
        link,
        status,
        created_at
      `;

      const normalize = (meeting: any, attendees: string[] = []): Meeting => ({
        id: meeting.id,
        title: meeting.title,
        description: meeting.description,
        scheduled_by: meeting.scheduled_by,
        date: meeting.date,
        time: meeting.time,
        link: meeting.link,
        status: meeting.status,
        created_at: meeting.created_at,
        attendees,
      });

      const { data: scheduled, error: scheduledError } = await supabase
        .from('meetings')
        .select(fields)
        .eq('scheduled_by', userId)
        .order('date', { ascending: true });

      if (scheduledError) throw scheduledError;

      const { data: attendeeRows, error: attendeeError } = await supabase
        .from('meeting_attendees')
        .select('meeting_id')
        .eq('attendee_id', userId);

      if (attendeeError) throw attendeeError;

      let attendeeMeetings: any[] = [];
      const meetingIds = (attendeeRows ?? [])
        .map((row) => row.meeting_id)
        .filter(Boolean) as string[];

      if (meetingIds.length) {
        const { data, error } = await supabase
          .from('meetings')
          .select(fields)
          .in('id', meetingIds)
          .order('date', { ascending: true });

        if (error) throw error;
        attendeeMeetings = data ?? [];
      }

      const merged = new Map<string, any>();
      [...(scheduled ?? []), ...attendeeMeetings].forEach((meeting) => {
        merged.set(meeting.id, meeting);
      });

      const allMeetingIds = Array.from(merged.keys());
      const attendeesByMeeting = new Map<string, string[]>();

      if (allMeetingIds.length) {
        const { data: attendeeDetails, error: attendeeDetailsError } = await supabase
          .from('meeting_attendees')
          .select('meeting_id, attendee_id')
          .in('meeting_id', allMeetingIds);

        if (attendeeDetailsError) throw attendeeDetailsError;

        (attendeeDetails ?? []).forEach((row) => {
          const list = attendeesByMeeting.get(row.meeting_id) ?? [];
          list.push(row.attendee_id);
          attendeesByMeeting.set(row.meeting_id, list);
        });
      }

      setMeetings(
        allMeetingIds.map((meetingId) =>
          normalize(merged.get(meetingId), attendeesByMeeting.get(meetingId) ?? [])
        )
      );
    } catch (error: any) {
      const message = error?.message || 'Failed to load meetings';
      toast.error(message);
      console.error('Failed to load meetings:', error);
      setMeetings([]);
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
    if (!isUuid(meetingData.scheduled_by)) {
      toast.error('Meetings cannot be created while using the dev admin account.');
      return;
    }

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