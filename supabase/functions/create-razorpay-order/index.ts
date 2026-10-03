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

    // 1. Verify caller JWT with anon client
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

    // 2. Read request body
    const { order_id } = await req.json()
    if (!order_id) {
      return new Response(JSON.stringify({ error: 'Missing order_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Load order with caller's JWT (RLS enforcement)
    const { data: order, error: orderErr } = await supabaseAnon
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single()

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'Order not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (order.payment_method !== 'online') {
      return new Response(JSON.stringify({ error: 'Order payment method is not online' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const amountPaise = Math.round(Number(order.total) * 100)

    // 4. Reuse existing razorpay_order_id if present (Idempotent)
    if (order.razorpay_order_id) {
      return new Response(
        JSON.stringify({
          key_id: keyId,
          razorpay_order_id: order.razorpay_order_id,
          amount: amountPaise,
          currency: 'INR',
          order_no: order.order_no,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. If credentials missing (local dev fallback mode)
    if (!keyId || !keySecret) {
      const mockOrderNo = `order_dev_${Date.now()}`
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
      await supabaseAdmin.from('orders').update({ razorpay_order_id: mockOrderNo }).eq('id', order.id)

      return new Response(
        JSON.stringify({
          key_id: keyId || 'rzp_test_mock_key',
          razorpay_order_id: mockOrderNo,
          amount: amountPaise,
          currency: 'INR',
          order_no: order.order_no,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Call Razorpay API to create order
    const rzpAuth = 'Basic ' + btoa(`${keyId}:${keySecret}`)
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: rzpAuth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt: `order_${order.order_no}`,
        notes: { order_id: order.id },
      }),
    })

    const rzpData = await rzpRes.json()

    if (!rzpRes.ok) {
      return new Response(JSON.stringify({ error: rzpData.error?.description || 'Razorpay order creation failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 7. Save razorpay_order_id via Service Role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
    await supabaseAdmin
      .from('orders')
      .update({ razorpay_order_id: rzpData.id })
      .eq('id', order.id)

    return new Response(
      JSON.stringify({
        key_id: keyId,
        razorpay_order_id: rzpData.id,
        amount: amountPaise,
        currency: 'INR',
        order_no: order.order_no,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
