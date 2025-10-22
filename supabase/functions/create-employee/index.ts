import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { email, full_name, department, position, role } = await req.json()

    console.log('Creating employee:', { email, full_name, department, position, role })

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!'

    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name,
        department,
        position,
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      throw authError
    }

    console.log('User created in auth:', authData.user.id)

    // Wait for trigger to create profile, then update with additional info
    await new Promise(resolve => setTimeout(resolve, 1000))

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        department,
        position,
      })
      .eq('id', authData.user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      // Don't throw - profile will be created by trigger, just won't have dept/position yet
    }

    // Assign role (employee role already assigned by trigger, but we might want admin)
    if (role && role !== 'employee') {
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .update({ role })
        .eq('user_id', authData.user.id)

      if (roleError) {
        console.error('Role update error:', roleError)
      }
    }

    console.log('Role assigned successfully')

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authData.user.id,
        email,
        temporary_password: tempPassword,
        message: 'Employee account created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error creating employee:', error)
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return new Response(
      JSON.stringify({
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
