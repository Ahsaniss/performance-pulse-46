// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.3/dist/module/index.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false, autoRefreshToken: false } },
    )

    const { user_id } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const { data: meetings, error: meetingsError } = await supabaseAdmin
      .from('meetings')
      .select('id, title, description, scheduled_by, date, time, link, status, created_at')
      .order('date', { ascending: true })

    if (meetingsError) throw meetingsError

    const meetingIds = (meetings ?? []).map((meeting) => meeting.id)

    const { data: attendeeLinks, error: attendeeError } = meetingIds.length
      ? await supabaseAdmin
          .from('meeting_attendees')
          .select('meeting_id, attendee_id')
          .in('meeting_id', meetingIds)
      : { data: [], error: null }

    if (attendeeError) throw attendeeError

    const attendeesByMeeting = new Map<string, string[]>();

    (attendeeLinks ?? []).forEach(({ meeting_id, attendee_id }: { meeting_id: string; attendee_id: string }) => {
      const list = attendeesByMeeting.get(meeting_id) ?? []
      list.push(attendee_id)
      attendeesByMeeting.set(meeting_id, list)
    })

    const filteredMeetings = (meetings ?? [])
      .filter((meeting) => {
        if (meeting.scheduled_by === user_id) return true
        const attendees = attendeesByMeeting.get(meeting.id) ?? []
        return attendees.includes(user_id)
      })
      .map((meeting) => ({
        ...meeting,
        attendees: attendeesByMeeting.get(meeting.id) ?? [],
      }))

    return new Response(
      JSON.stringify({ success: true, data: filteredMeetings }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    )
  } catch (error: unknown) {
    console.error('Error listing meetings:', error)
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unexpected error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
    )
  }
})
