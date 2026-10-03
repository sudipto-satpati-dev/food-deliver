// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') ?? ''

    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature')

    // Verify webhook signature if secret configured
    if (webhookSecret && signature) {
      const expectedSig = await hmacHex(webhookSecret, rawBody)
      if (expectedSig !== signature) {
        return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    const payload = JSON.parse(rawBody)
    const event = payload.event
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentObj = payload.payload?.payment?.entity
      const orderObj = payload.payload?.order?.entity

      const rzpOrderId = paymentObj?.order_id || orderObj?.id
      const orderIdFromNotes = paymentObj?.notes?.order_id || orderObj?.notes?.order_id
      const paymentId = paymentObj?.id

      if (rzpOrderId || orderIdFromNotes) {
        let query = supabaseAdmin.from('orders').select('id, status, payment_status')
        if (orderIdFromNotes) {
          query = query.eq('id', orderIdFromNotes)
        } else {
          query = query.eq('razorpay_order_id', rzpOrderId)
        }

        const { data: order } = await query.single()

        if (order && order.payment_status !== 'paid') {
          const updates: any = {
            payment_status: 'paid',
          }
          if (paymentId) updates.razorpay_payment_id = paymentId
          if (order.status === 'pending_payment') updates.status = 'placed'

          await supabaseAdmin.from('orders').update(updates).eq('id', order.id)
        }
      }
    } else if (event === 'payment.failed') {
      const paymentObj = payload.payload?.payment?.entity
      const rzpOrderId = paymentObj?.order_id
      const orderIdFromNotes = paymentObj?.notes?.order_id

      let query = supabaseAdmin.from('orders').select('id')
      if (orderIdFromNotes) {
        query = query.eq('id', orderIdFromNotes)
      } else if (rzpOrderId) {
        query = query.eq('razorpay_order_id', rzpOrderId)
      }

      const { data: order } = await query.single()
      if (order) {
        await supabaseAdmin.from('orders').update({ payment_status: 'failed' }).eq('id', order.id)
      }
    } else if (event === 'refund.processed') {
      const refundObj = payload.payload?.refund?.entity
      const paymentId = refundObj?.payment_id

      if (paymentId) {
        await supabaseAdmin
          .from('orders')
          .update({ payment_status: 'refunded' })
          .eq('razorpay_payment_id', paymentId)
      }
    }

    // Always respond 200 OK to Razorpay
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
