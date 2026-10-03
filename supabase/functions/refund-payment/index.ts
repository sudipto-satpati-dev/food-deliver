// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const keyId = Deno.env.get('RAZORPAY_KEY_ID') ?? ''
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? ''

    // 1. Verify caller JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAnon = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user: caller },
      error: userErr,
    } = await supabaseAnon.auth.getUser()

    if (userErr || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized caller' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check caller is admin
    const { data: profile } = await supabaseAnon
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Read request body
    const { order_id } = await req.json()
    if (!order_id) {
      return new Response(JSON.stringify({ error: 'Missing order_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Load order via service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single()

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!['cancelled', 'rejected'].includes(order.status)) {
      return new Response(JSON.stringify({ error: 'Order must be cancelled or rejected to process refund' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (order.payment_status !== 'paid') {
      return new Response(JSON.stringify({ error: 'Order is not marked as paid' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const amountPaise = Math.round(Number(order.total) * 100)

    // 4. If credentials present, execute Razorpay refund API
    if (keyId && keySecret && order.razorpay_payment_id && !order.razorpay_payment_id.startsWith('pay_mock')) {
      const rzpAuth = 'Basic ' + btoa(`${keyId}:${keySecret}`)
      const refundRes = await fetch(`https://api.razorpay.com/v1/payments/${order.razorpay_payment_id}/refund`, {
        method: 'POST',
        headers: {
          Authorization: rzpAuth,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountPaise,
          speed: 'normal',
        }),
      })

      const refundData = await refundRes.json()
      if (!refundRes.ok) {
        return new Response(JSON.stringify({ error: refundData.error?.description || 'Refund API failed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // 5. Update order payment_status to 'refunded'
    const { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({ payment_status: 'refunded' })
      .eq('id', order.id)

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
