// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
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

    // 2. Read payload
    const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()
    if (!order_id || !razorpay_payment_id) {
      return new Response(JSON.stringify({ error: 'Missing payment fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Fetch order (service role)
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

    if (order.user_id !== caller.id) {
      return new Response(JSON.stringify({ error: 'Forbidden: Not order owner' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Idempotency: if already paid, return ok
    if (order.payment_status === 'paid') {
      return new Response(JSON.stringify({ ok: true, message: 'Already paid' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 5. Verify HMAC Signature (if secret configured)
    const rzpOrderId = order.razorpay_order_id || razorpay_order_id
    if (keySecret && rzpOrderId) {
      const expectedSig = await hmacHex(keySecret, `${rzpOrderId}|${razorpay_payment_id}`)
      if (expectedSig !== razorpay_signature) {
        return new Response(JSON.stringify({ error: 'Invalid Razorpay signature' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // 6. Update order payment status and transition from pending_payment -> placed
    const updates: any = {
      payment_status: 'paid',
      razorpay_payment_id,
    }

    if (order.status === 'pending_payment') {
      updates.status = 'placed'
    }

    const { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update(updates)
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
