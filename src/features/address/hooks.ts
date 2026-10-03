import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchUserAddresses,
  fetchAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  AddressInsert,
  AddressUpdate,
} from './api'
import { toast } from 'sonner'

export function useUserAddresses(userId?: string) {
  return useQuery({
    queryKey: ['addresses', userId],
    queryFn: () => fetchUserAddresses(userId!),
    enabled: !!userId,
  })
}

export function useAddressDetail(id?: string) {
  return useQuery({
    queryKey: ['address', id],
    queryFn: () => fetchAddressById(id!),
    enabled: !!id,
  })
}

export function useCreateAddressMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: AddressInsert) => createAddress(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.user_id] })
      toast.success('Address saved successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save address.')
    },
  })
}

export function useUpdateAddressMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      address,
      userId,
    }: {
      id: string
      address: AddressUpdate
      userId: string
    }) => updateAddress(id, address, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['address', variables.id] })
      toast.success('Address updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update address.')
    },
  })
}

export function useDeleteAddressMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      deleteAddress(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.userId] })
      toast.success('Address deleted!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete address.')
    },
  })
}

export function useSetDefaultAddressMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, addressId }: { userId: string; addressId: string }) =>
      setDefaultAddress(userId, addressId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses', variables.userId] })
      toast.success('Default address updated!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to set default address.')
    },
  })
}
