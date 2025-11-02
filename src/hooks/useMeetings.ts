import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// Mock data store for frontend-only mode
// TODO: Replace with your backend API calls
const STORAGE_KEY = 'meetings_data';
const ATTENDEES_KEY = 'meeting_attendees_data';

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
  updated_at: string;
  attendees?: Array<{ attendee_id: string }>;
}

export const useMeetings = (userId?: string) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchMeetings();
    }
  }, [userId]);

  const fetchMeetings = async () => {
    if (!userId) return;

    try {
      // TODO: Replace with your backend API
      // const response = await fetch(`/api/meetings?userId=${userId}`);
      // const data = await response.json();
      
      const storedMeetings = localStorage.getItem(STORAGE_KEY);
      const storedAttendees = localStorage.getItem(ATTENDEES_KEY);
      
      const allMeetings = storedMeetings ? JSON.parse(storedMeetings) : [];
      const allAttendees = storedAttendees ? JSON.parse(storedAttendees) : [];

      const userMeetings = allMeetings.filter((m: Meeting) => {
        const isScheduler = m.scheduled_by === userId;
        const isAttendee = allAttendees.some(
          (a: any) => a.meeting_id === m.id && a.attendee_id === userId
        );
        return isScheduler || isAttendee;
      });

      const meetingsWithAttendees = userMeetings.map((m: Meeting) => ({
        ...m,
        attendees: allAttendees
          .filter((a: any) => a.meeting_id === m.id)
          .map((a: any) => ({ attendee_id: a.attendee_id })),
      }));

      setMeetings(meetingsWithAttendees);
    } catch (error: any) {
      console.error('Failed to load meetings:', error);
      toast.error('Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const createMeeting = async (meetingData: {
    title: string;
    description?: string;
    scheduled_by: string;
    date: string;
    time: string;
    link?: string;
    status?: string;
    attendee_ids: string[];
  }) => {
    try {
      // TODO: Replace with your backend API
      // await fetch('/api/meetings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(meetingData)
      // });
      
      const { attendee_ids, ...meetingInfo } = meetingData;

      const storedMeetings = localStorage.getItem(STORAGE_KEY);
      const allMeetings = storedMeetings ? JSON.parse(storedMeetings) : [];
      
      const newMeeting: Meeting = {
        id: `meeting_${Date.now()}`,
        ...meetingInfo,
        description: meetingInfo.description || null,
        link: meetingInfo.link || null,
        status: meetingInfo.status || 'scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      allMeetings.push(newMeeting);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allMeetings));

      if (attendee_ids && attendee_ids.length > 0) {
        const storedAttendees = localStorage.getItem(ATTENDEES_KEY);
        const allAttendees = storedAttendees ? JSON.parse(storedAttendees) : [];
        
        const newAttendees = attendee_ids.map(attendee_id => ({
          id: `attendee_${Date.now()}_${attendee_id}`,
          meeting_id: newMeeting.id,
          attendee_id,
          created_at: new Date().toISOString(),
        }));
        
        allAttendees.push(...newAttendees);
        localStorage.setItem(ATTENDEES_KEY, JSON.stringify(allAttendees));
      }

      toast.success('Meeting created successfully');
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
