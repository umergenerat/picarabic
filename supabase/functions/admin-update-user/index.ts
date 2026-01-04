
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // 1. Authenticate the user calling the function
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('Unauthorized')
        }

        // 2. Check if the user is an admin
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || profile.role !== 'مدير') {
            throw new Error('Forbidden: Only admins can perform this action')
        }

        // 3. Get the parameters (target userId and new password)
        const { userId, newPassword } = await req.json()

        if (!userId || !newPassword) {
            throw new Error('Missing required fields: userId, newPassword')
        }

        if (newPassword.length < 6) {
            throw new Error('Password must be at least 6 characters')
        }

        // 4. Initialize Supabase Admin Client (Service Role)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 5. Update the user's password using Admin client
        const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        )

        if (updateError) {
            throw updateError
        }

        // 6. Also update the profile 'must_change_password' flag if needed
        // Typically when an admin resets a password, we might want to force a change, or unset it.
        // Let's assume we unset it (verify it's working) -> user can login.
        await supabaseAdmin.from('profiles').update({ must_change_password: true }).eq('id', userId)

        return new Response(
            JSON.stringify({ message: 'Password updated successfully', user: updateData.user }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
