import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

export type OrderRow = Database['public']['Tables']['orders']['Row']
export type OrderItemRow = Database['public']['Tables']['order_items']['Row']

export interface OrderWithItems extends OrderRow {
  order_items: OrderItemRow[]
}

export interface RiderInfo {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
}

export async function fetchUserOrders(userId: string): Promise<OrderWithItems[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('placed_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data as OrderWithItems[]) || []
}

export async function fetchOrderById(id: string): Promise<OrderWithItems> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data as OrderWithItems
}

export async function fetchDeliveryOtp(orderId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('delivery_otps')
    .select('code')
    .eq('order_id', orderId)
    .maybeSingle()

  if (error) return null
  return data?.code || null
}

export async function fetchOrderRiderInfo(orderId: string): Promise<RiderInfo | null> {
  const { data, error } = await supabase.rpc('get_order_rider', {
    p_order_id: orderId,
  })

  if (error || !data) return null
  return data as unknown as RiderInfo
}

export async function cancelUserOrder(orderId: string, reason?: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_my_order', {
    p_order_id: orderId,
    p_reason: reason || 'Cancelled by customer',
  })

  if (error) throw new Error(error.message)
}
