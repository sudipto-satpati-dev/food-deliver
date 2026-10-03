import { supabase } from '@/lib/supabase'
import { Category, MenuItem, ItemVariant, ItemAddon, Coupon } from '@/types/database'

export interface MenuItemWithDetails extends MenuItem {
  categories?: Category
  item_variants?: ItemVariant[]
  item_addons?: ItemAddon[]
}

export async function fetchPublicCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data as Category[]
}

export async function fetchPublicMenuItems(): Promise<MenuItemWithDetails[]> {
  const { data, error } = await supabase
    .from('menu_items')
    .select(`
      *,
      categories(*),
      item_variants(*),
      item_addons(*)
    `)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data as MenuItemWithDetails[]).map((item) => ({
    ...item,
    item_variants: (item.item_variants || []).filter((v) => v.is_available),
    item_addons: (item.item_addons || []).filter((a) => a.is_available),
  }))
}

export async function fetchActiveCoupons(): Promise<Coupon[]> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Coupon[]
}

export interface CouponValidationResult {
  coupon_id: string
  code: string
  discount: number
}

export async function validateCoupon(code: string, subtotal: number): Promise<CouponValidationResult> {
  const { data, error } = await supabase.rpc('validate_coupon', {
    p_code: code,
    p_subtotal: subtotal,
  })

  if (error) throw new Error(error.message || 'Invalid coupon code')
  return data as CouponValidationResult
}
