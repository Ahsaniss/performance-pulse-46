-- Create meetings table
CREATE TABLE IF NOT EXISTS public.meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  scheduled_by uuid NOT NULL,
  date timestamp with time zone NOT NULL,
  time text NOT NULL,
  link text,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create meeting_attendees junction table
CREATE TABLE IF NOT EXISTS public.meeting_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  attendee_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, attendee_id)
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  date date NOT NULL,
  check_in time,
  check_out time,
  status text NOT NULL DEFAULT 'present',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Add position and status columns to profiles if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'position') THEN
    ALTER TABLE public.profiles ADD COLUMN position text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
    ALTER TABLE public.profiles ADD COLUMN status text DEFAULT 'active';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'join_date') THEN
    ALTER TABLE public.profiles ADD COLUMN join_date timestamp with time zone DEFAULT now();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'performance_score') THEN
    ALTER TABLE public.profiles ADD COLUMN performance_score integer DEFAULT 0;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meetings
CREATE POLICY "Users can view their own meetings"
ON public.meetings
FOR SELECT
TO authenticated
USING (
  scheduled_by = auth.uid() 
  OR auth.uid() IN (
    SELECT attendee_id FROM public.meeting_attendees WHERE meeting_id = id
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can create meetings"
ON public.meetings
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update meetings"
ON public.meetings
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete meetings"
ON public.meetings
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for meeting_attendees
CREATE POLICY "Users can view meeting attendees"
ON public.meeting_attendees
FOR SELECT
TO authenticated
USING (
  attendee_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.meetings 
    WHERE id = meeting_id AND scheduled_by = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can manage meeting attendees"
ON public.meeting_attendees
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for attendance
CREATE POLICY "Users can view their own attendance"
ON public.attendance
FOR SELECT
TO authenticated
USING (employee_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own attendance"
ON public.attendance
FOR INSERT
TO authenticated
WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Admins can manage all attendance"
ON public.attendance
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_meetings_updated_at
BEFORE UPDATE ON public.meetings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_by ON public.meetings(scheduled_by);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON public.meetings(date);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_meeting_id ON public.meeting_attendees(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_attendees_attendee_id ON public.meeting_attendees(attendee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON public.attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);