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
