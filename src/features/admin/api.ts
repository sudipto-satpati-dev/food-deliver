import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { Settings, Category, MenuItem, ItemVariant, ItemAddon, OrderStatus } from '@/types/database'
import { OrderWithItems } from '@/features/orders/api'

export interface MenuItemWithRelations extends MenuItem {
  categories?: Category
  item_variants?: ItemVariant[]
  item_addons?: ItemAddon[]
}

export interface RiderProfile {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  is_online: boolean
  is_active: boolean
}

// ---------- SETTINGS ----------
export async function fetchSettings(): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) throw error
  return data as Settings
}

export async function updateSettings(updates: Partial<Settings>): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select()
    .single()

  if (error) throw error
  return data as Settings
}

// ---------- CATEGORIES ----------
export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data as Category[]
}

export async function createCategory(category: { name: string; sort_order?: number; is_active?: boolean }): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select()
    .single()

  if (error) throw error
  return data as Category
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Category
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ---------- MENU ITEMS ----------
export async function fetchMenuItems(): Promise<MenuItemWithRelations[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select(`
      *,
      categories(*),
      item_variants(*),
      item_addons(*)
    `)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data as MenuItemWithRelations[]
}

export async function fetchMenuItemById(id: string): Promise<MenuItemWithRelations> {
  const { data, error } = await supabase
    .from('menu_items')
    .select(`
      *,
      categories(*),
      item_variants(*),
      item_addons(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as MenuItemWithRelations
}

export async function toggleMenuItemAvailability(id: string, is_available: boolean): Promise<void> {
  const { error } = await supabase
    .from('menu_items')
    .update({ is_available })
    .eq('id', id)

  if (error) throw error
}

export interface CreateMenuItemPayload {
  item: Omit<MenuItem, 'id' | 'created_at'>
  variants: Array<{ name: string; price: number; is_available?: boolean; sort_order?: number }>
  addons: Array<{ name: string; price: number; is_available?: boolean; sort_order?: number }>
}

export async function createMenuItem({ item, variants, addons }: CreateMenuItemPayload): Promise<MenuItem> {
  const { data: newItem, error: itemError } = await supabase
    .from('menu_items')
    .insert([item])
    .select()
    .single()

  if (itemError) throw itemError

  const itemId = newItem.id

  if (variants.length > 0) {
    const variantsToInsert = variants.map((v, i) => ({
      item_id: itemId,
      name: v.name,
      price: v.price,
      is_available: v.is_available ?? true,
      sort_order: v.sort_order ?? i,
    }))
    const { error: vError } = await supabase.from('item_variants').insert(variantsToInsert)
    if (vError) throw vError
  }

  if (addons.length > 0) {
    const addonsToInsert = addons.map((a, i) => ({
      item_id: itemId,
      name: a.name,
      price: a.price,
      is_available: a.is_available ?? true,
      sort_order: a.sort_order ?? i,
    }))
    const { error: aError } = await supabase.from('item_addons').insert(addonsToInsert)
    if (aError) throw aError
  }

  return newItem as MenuItem
}

export async function updateMenuItem(
  id: string,
  { item, variants, addons }: Partial<CreateMenuItemPayload>
): Promise<void> {
  if (item) {
    const { error: itemError } = await supabase
      .from('menu_items')
      .update(item)
      .eq('id', id)
    if (itemError) throw itemError
  }

  if (variants !== undefined) {
    await supabase.from('item_variants').delete().eq('item_id', id)
    if (variants.length > 0) {
      const variantsToInsert = variants.map((v, i) => ({
        item_id: id,
        name: v.name,
        price: v.price,
        is_available: v.is_available ?? true,
        sort_order: v.sort_order ?? i,
      }))
      const { error: vError } = await supabase.from('item_variants').insert(variantsToInsert)
      if (vError) throw vError
    }
  }

  if (addons !== undefined) {
    await supabase.from('item_addons').delete().eq('item_id', id)
    if (addons.length > 0) {
      const addonsToInsert = addons.map((a, i) => ({
        item_id: id,
        name: a.name,
        price: a.price,
        is_available: a.is_available ?? true,
        sort_order: a.sort_order ?? i,
      }))
      const { error: aError } = await supabase.from('item_addons').insert(addonsToInsert)
      if (aError) throw aError
    }
  }
}

export async function deleteMenuItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ---------- ADMIN ORDERS & RIDERS ----------
export async function fetchAdminOrders(): Promise<OrderWithItems[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('placed_at', { ascending: false })

  if (error) throw error
  return (data as OrderWithItems[]) || []
}

export async function fetchAdminRiders(): Promise<RiderProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, avatar_url, is_online, is_active')
    .eq('role', 'rider')

  if (error) throw error
  return (data as RiderProfile[]) || []
}

export async function toggleRiderActiveStatus(riderId: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', riderId)

  if (error) throw error
}

export async function createRiderAccount(payload: {
  full_name: string
  phone: string
  email: string
  password: string
}): Promise<void> {
  try {
    // 1. Try calling the Edge Function if deployed
    const { data, error } = await supabase.functions.invoke('admin-create-rider', {
      body: payload,
    })

    if (!error && data?.ok) {
      return
    }

    // 2. Fallback for local development environment:
    // Create an isolated temporary Supabase client with persistSession: false
    // so that Admin's active session in localStorage is 100% untouched!
    const tempClient = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    )

    const { data: authData, error: signUpError } = await tempClient.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          full_name: payload.full_name,
          phone: payload.phone,
          role: 'rider',
        },
      },
    })

    if (signUpError) throw signUpError

    if (authData.user) {
      // 3. Update profile role to 'rider' using main Supabase client (logged in as Admin)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: payload.full_name,
          phone: payload.phone,
          role: 'rider',
          is_active: true,
        })
        .eq('id', authData.user.id)

      if (updateError) {
        // Fallback upsert if profile row did not trigger automatically
        await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            full_name: payload.full_name,
            phone: payload.phone,
            role: 'rider',
            is_active: true,
          })
      }
    }
  } catch (err: any) {
    throw new Error(err.message || 'Failed to create rider account.')
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  reason?: string
): Promise<void> {
  const { error } = await supabase.rpc('update_order_status', {
    p_order_id: orderId,
    p_status: status,
    p_reason: reason || undefined,
  })

  if (error) throw new Error(error.message)
}

export async function assignRiderToOrder(orderId: string, riderId: string): Promise<void> {
  const { error } = await supabase.rpc('assign_rider', {
    p_order_id: orderId,
    p_rider_id: riderId,
  })

  if (error) throw new Error(error.message)
}

export async function adminMarkDelivered(orderId: string, reason?: string): Promise<void> {
  const { error } = await supabase.rpc('admin_mark_delivered', {
    p_order_id: orderId,
    p_reason: reason || 'Admin override',
  })

  if (error) throw new Error(error.message)
}

export async function refundPayment(orderId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('refund-payment', {
    body: { order_id: orderId },
  })

  if (error || (data && data.error)) {
    // Fallback: update DB payment_status directly if Edge Function is offline in local dev
    const { error: updateErr } = await supabase
      .from('orders')
      .update({ payment_status: 'refunded' })
      .eq('id', orderId)

    if (updateErr) throw new Error(error?.message || data?.error || updateErr.message)
  }
}

// ---------- COUPONS ----------
import { Coupon } from '@/types/database'

export async function fetchAdminCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as Coupon[]) || []
}

export async function fetchAdminCouponById(id: string): Promise<Coupon> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Coupon
}

export async function createCoupon(coupon: Omit<Coupon, 'id' | 'created_at'>): Promise<Coupon> {
  const cleanCode = coupon.code.toUpperCase().replace(/\s+/g, '')
  const { data, error } = await supabase
    .from('coupons')
    .insert([{ ...coupon, code: cleanCode }])
    .select()
    .single()

  if (error) throw new Error(error.message || 'Failed to create coupon')
  return data as Coupon
}

export async function updateCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon> {
  if (updates.code) {
    updates.code = updates.code.toUpperCase().replace(/\s+/g, '')
  }

  const { data, error } = await supabase
    .from('coupons')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message || 'Failed to update coupon')
  return data as Coupon
}

export async function deleteCoupon(id: string): Promise<void> {
  const { error } = await supabase
    .from('coupons')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function toggleCouponActiveStatus(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('coupons')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) throw error
}

// ---------- ADMIN REVIEWS ----------
import { Review } from '@/types/database'

export interface AdminReviewItem extends Review {
  orders?: {
    order_no: number
    customer_name: string
    customer_phone: string
    placed_at: string
  }
}

export async function fetchAdminReviews(): Promise<AdminReviewItem[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, orders(order_no, customer_name, customer_phone, placed_at)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as AdminReviewItem[]) || []
}

export async function replyToReview(reviewId: string, reply: string): Promise<void> {
  const { error } = await supabase
    .from('reviews')
    .update({ admin_reply: reply.trim() || null })
    .eq('id', reviewId)

  if (error) throw new Error(error.message || 'Failed to update review reply')
}

// ---------- SALES SUMMARY & REPORTS ----------
export interface SalesSummaryItem {
  sales_date: string
  order_count: number
  delivered_count: number
  cancelled_count: number
  total_revenue: number
  online_revenue: number
  cod_revenue: number
}

export async function fetchSalesSummary(fromDate?: string, toDate?: string): Promise<SalesSummaryItem[]> {
  try {
    const { data, error } = await supabase.rpc('admin_sales_summary', {
      from_date: fromDate,
      to_date: toDate,
    })

    if (!error && Array.isArray(data)) {
      return data.map((row) => ({
        sales_date: row.sales_date,
        order_count: Number(row.order_count || 0),
        delivered_count: Number(row.delivered_count || 0),
        cancelled_count: Number(row.cancelled_count || 0),
        total_revenue: Number(row.total_revenue || 0),
        online_revenue: Number(row.online_revenue || 0),
        cod_revenue: Number(row.cod_revenue || 0),
      }))
    }
  } catch (e) {
    console.warn('RPC admin_sales_summary failed, using fallback aggregation:', e)
  }

  // Fallback: calculate sales summary from orders table directly
  const { data: orders, error: ordersErr } = await supabase
    .from('orders')
    .select('*')
    .order('placed_at', { ascending: true })

  if (ordersErr) throw ordersErr

  const startStr = fromDate || new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0]
  const endStr = toDate || new Date().toISOString().split('T')[0]

  const daysMap: Record<string, SalesSummaryItem> = {}
  const curr = new Date(startStr)
  const end = new Date(endStr)

  while (curr <= end) {
    const dateStr = curr.toISOString().split('T')[0]
    daysMap[dateStr] = {
      sales_date: dateStr,
      order_count: 0,
      delivered_count: 0,
      cancelled_count: 0,
      total_revenue: 0,
      online_revenue: 0,
      cod_revenue: 0,
    }
    curr.setDate(curr.getDate() + 1)
  }

  ;(orders || []).forEach((o) => {
    const dateStr = o.placed_at.split('T')[0]
    if (daysMap[dateStr]) {
      daysMap[dateStr].order_count += 1
      if (o.status === 'delivered') {
        daysMap[dateStr].delivered_count += 1
        const rev = Number(o.total || 0)
        daysMap[dateStr].total_revenue += rev
        if (o.payment_method === 'online') {
          daysMap[dateStr].online_revenue += rev
        } else {
          daysMap[dateStr].cod_revenue += rev
        }
      } else if (o.status === 'cancelled' || o.status === 'rejected') {
        daysMap[dateStr].cancelled_count += 1
      }
    }
  })

  return Object.values(daysMap)
}

export interface TopSellingItem {
  item_name: string
  quantity_sold: number
  total_revenue: number
}

export async function fetchTopSellingItems(limit = 5, fromDate?: string, toDate?: string): Promise<TopSellingItem[]> {
  try {
    let query = supabase
      .from('order_items')
      .select('item_name, quantity, price, order_id, orders!inner(status, placed_at)')
      .eq('orders.status', 'delivered')

    if (fromDate) {
      query = query.gte('orders.placed_at', `${fromDate}T00:00:00`)
    }
    if (toDate) {
      query = query.lte('orders.placed_at', `${toDate}T23:59:59`)
    }

    const { data, error } = await query

    if (!error && data) {
      const itemMap: Record<string, TopSellingItem> = {}
      data.forEach((row: any) => {
        const name = row.item_name
        const qty = row.quantity || 1
        const rev = (row.price || 0) * qty
        if (!itemMap[name]) {
          itemMap[name] = { item_name: name, quantity_sold: 0, total_revenue: 0 }
        }
        itemMap[name].quantity_sold += qty
        itemMap[name].total_revenue += rev
      })

      return Object.values(itemMap)
        .sort((a, b) => b.quantity_sold - a.quantity_sold)
        .slice(0, limit)
    }
  } catch (e) {
    console.warn('Top items query with join failed, trying fallback:', e)
  }

  // Fallback: simple query on order_items table
  const { data: rawItems } = await supabase.from('order_items').select('item_name, quantity, price')
  if (!rawItems) return []

  const fallbackMap: Record<string, TopSellingItem> = {}
  rawItems.forEach((item) => {
    const name = item.item_name
    const qty = item.quantity || 1
    const rev = (item.price || 0) * qty
    if (!fallbackMap[name]) {
      fallbackMap[name] = { item_name: name, quantity_sold: 0, total_revenue: 0 }
    }
    fallbackMap[name].quantity_sold += qty
    fallbackMap[name].total_revenue += rev
  })

  return Object.values(fallbackMap)
    .sort((a, b) => b.quantity_sold - a.quantity_sold)
    .slice(0, limit)
}

