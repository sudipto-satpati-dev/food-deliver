import { supabase } from '@/lib/supabase'
import { OrderWithItems } from '@/features/orders/api'

export async function fetchRiderOrders(riderId: string): Promise<OrderWithItems[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('rider_id', riderId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as OrderWithItems[]) || []
}

export async function verifyDeliveryOtp(orderId: string, code: string): Promise<{ success: boolean; message?: string }> {
  const { data, error } = await supabase.rpc('verify_delivery_otp', {
    p_order_id: orderId,
    p_code: code,
  })

  if (error) throw new Error(error.message || 'Invalid delivery OTP code')
  return data as { success: boolean; message?: string }
}

export async function toggleRiderOnlineStatus(riderId: string, isOnline: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_online: isOnline })
    .eq('id', riderId)

  if (error) throw error
}

export async function startRiderDelivery(orderId: string): Promise<void> {
  const { error } = await supabase.rpc('update_order_status', {
    p_order_id: orderId,
    p_status: 'out_for_delivery',
  })

  if (error) throw new Error(error.message)
}
