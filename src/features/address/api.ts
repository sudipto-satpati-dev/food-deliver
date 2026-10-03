import { supabase } from '@/lib/supabase'
import { Database } from '@/types/database'

export type Address = Database['public']['Tables']['addresses']['Row']
export type AddressInsert = Database['public']['Tables']['addresses']['Insert']
export type AddressUpdate = Database['public']['Tables']['addresses']['Update']

export async function fetchUserAddresses(userId: string): Promise<Address[]> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function fetchAddressById(id: string): Promise<Address> {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createAddress(address: AddressInsert): Promise<Address> {
  // If set as default, unset other defaults first
  if (address.is_default && address.user_id) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', address.user_id)
  }

  const { data, error } = await supabase
    .from('addresses')
    .insert(address)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateAddress(
  id: string,
  address: AddressUpdate,
  userId: string
): Promise<Address> {
  // If updated to default, unset other defaults first
  if (address.is_default && userId) {
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId)
  }

  const { data, error } = await supabase
    .from('addresses')
    .update(address)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteAddress(id: string): Promise<void> {
  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function setDefaultAddress(
  userId: string,
  addressId: string
): Promise<void> {
  // Unset default for all user addresses
  const { error: error1 } = await supabase
    .from('addresses')
    .update({ is_default: false })
    .eq('user_id', userId)

  if (error1) throw new Error(error1.message)

  // Set default for target address
  const { error: error2 } = await supabase
    .from('addresses')
    .update({ is_default: true })
    .eq('id', addressId)

  if (error2) throw new Error(error2.message)
}
