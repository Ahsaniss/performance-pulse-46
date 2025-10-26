// @deno-types="https://esm.sh/@supabase/supabase-js@2.39.3/dist/module/index.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const respond = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });

const generateTempPassword = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint32Array(12));
  const core = Array.from(bytes, (value) => alphabet[value % alphabet.length]).join('');
  return `${core}A1!`;
};

type Payload = {
  email?: string;
  full_name?: string;
  department?: string;
  position?: string;
  role?: 'admin' | 'employee';
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !key) {
      console.error('Missing Supabase service credentials');
      return respond(500, { error: 'Supabase service is not configured' });
    }

    const supabaseAdmin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let payload: Payload;
    try {
      payload = await req.json();
    } catch {
      return respond(400, { error: 'Invalid JSON payload' });
    }

    const { email, full_name, department, position, role } = payload;

    const missing = ['email', 'full_name', 'department', 'position'].filter(
      (field) => !(payload as Record<string, unknown>)?.[field],
    );
    if (missing.length) {
      return respond(400, { error: `Missing required fields: ${missing.join(', ')}` });
    }

    if (typeof email !== 'string' || !email.includes('@')) {
      return respond(400, { error: 'A valid email address is required' });
    }

    const { data: existingUsers, error: lookupError } = await supabaseAdmin.auth.admin.listUsers();
    if (!lookupError && existingUsers?.users?.some((u) => u.email === email)) {
      return respond(409, { error: 'User already exists with this email' });
    }

    const temporaryPassword = generateTempPassword();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name,
        department,
        position,
      },
    });

    if (authError || !authData?.user) {
      console.error('Auth admin createUser error:', authError);
      return respond(400, { error: authError?.message ?? 'Failed to create user in auth' });
    }

    const userId = authData.user.id;

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: userId,
          email,
          full_name,
          department,
          position,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );
    if (profileError) {
      console.error('Profile upsert error:', profileError);
      return respond(500, { error: 'Failed to create employee profile', details: profileError.message });
    }

    const targetRole = role === 'admin' ? 'admin' : 'employee';
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert(
        { user_id: userId, role: targetRole },
        { onConflict: 'user_id' },
      );
    if (roleError) {
      console.error('Role upsert error:', roleError);
      return respond(500, { error: 'Failed to assign user role', details: roleError.message });
    }

    return respond(200, {
      success: true,
      user_id: userId,
      email,
      temporary_password: temporaryPassword,
      message: 'Employee account created successfully',
    });
  } catch (error) {
    console.error('Unexpected error creating employee:', error);
    return respond(500, {
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});
