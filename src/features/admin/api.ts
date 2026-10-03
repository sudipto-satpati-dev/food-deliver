import { supabase } from '@/lib/supabase'
import { Settings, Category, MenuItem, ItemVariant, ItemAddon } from '@/types/database'

export interface MenuItemWithRelations extends MenuItem {
  categories?: Category
  item_variants?: ItemVariant[]
  item_addons?: ItemAddon[]
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
  // Insert Menu Item
  const { data: newItem, error: itemError } = await supabase
    .from('menu_items')
    .insert([item])
    .select()
    .single()

  if (itemError) throw itemError

  const itemId = newItem.id

  // Insert Variants if any
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

  // Insert Addons if any
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
  // Update Item
  if (item) {
    const { error: itemError } = await supabase
      .from('menu_items')
      .update(item)
      .eq('id', id)
    if (itemError) throw itemError
  }

  // Replace Variants if provided
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

  // Replace Addons if provided
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
