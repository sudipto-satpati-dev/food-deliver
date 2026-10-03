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

    // 2. Read request body
    const body = await req.json()
    const { order_id, amount } = body

    let amountPaise = 0
    let receiptStr = `rcpt_${Date.now()}`

    if (order_id) {
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

      amountPaise = Math.round(Number(order.total) * 100)
      receiptStr = `order_${order.order_no}`

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
    } else if (amount) {
      amountPaise = Math.round(Number(amount) * 100)
    } else {
      return new Response(JSON.stringify({ error: 'Missing order_id or amount' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Fallback for local development mode
    if (!keyId || !keySecret) {
      const mockOrderNo = `order_dev_${Date.now()}`
      return new Response(
        JSON.stringify({
          key_id: keyId || 'rzp_test_TjWfZ8cWlcw9zc',
          razorpay_order_id: mockOrderNo,
          amount: amountPaise,
          currency: 'INR',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Call Razorpay API to create order
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
        receipt: receiptStr,
      }),
    })

    const rzpData = await rzpRes.json()

    if (!rzpRes.ok) {
      return new Response(
        JSON.stringify({ error: rzpData.error?.description || 'Razorpay order creation failed' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (order_id) {
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
      await supabaseAdmin
        .from('orders')
        .update({ razorpay_order_id: rzpData.id })
        .eq('id', order_id)
    }

    return new Response(
      JSON.stringify({
        key_id: keyId,
        razorpay_order_id: rzpData.id,
        amount: amountPaise,
        currency: 'INR',
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
