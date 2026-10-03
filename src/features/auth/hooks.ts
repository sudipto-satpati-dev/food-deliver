import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  loginWithEmail,
  signUpWithEmail,
  loginWithGoogle,
  sendPasswordResetEmail,
  updatePassword,
  fetchProfile,
  updateProfile,
  signOut,
  LoginData,
  SignUpData,
} from './api'
import { toast } from 'sonner'
export { useAuth } from '@/routes/guards'

export function useLoginMutation() {
  return useMutation({
    mutationFn: (data: LoginData) => loginWithEmail(data),
    onError: (error: Error) => {
      toast.error(error.message || 'Login failed. Please check your credentials.')
    },
  })
}

export function useSignUpMutation() {
  return useMutation({
    mutationFn: (data: SignUpData) => signUpWithEmail(data),
    onError: (error: Error) => {
      toast.error(error.message || 'Sign up failed. Please try again.')
    },
  })
}

export function useGoogleLoginMutation() {
  return useMutation({
    mutationFn: () => loginWithGoogle(),
    onError: (error: Error) => {
      toast.error(error.message || 'Google login failed.')
    },
  })
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (email: string) => sendPasswordResetEmail(email),
    onSuccess: () => {
      toast.success('Password reset link sent to your email.')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send reset link.')
    },
  })
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (newPassword: string) => updatePassword(newPassword),
    onSuccess: () => {
      toast.success('Password updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update password.')
    },
  })
}

export function useProfileQuery(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
  })
}

export function useUpdateProfileMutation(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (updates: { full_name?: string; phone?: string }) => updateProfile(userId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] })
      toast.success('Profile updated successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile.')
    },
  })
}

export function useSignOutMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => signOut(),
    onSuccess: () => {
      queryClient.clear()
      toast.success('Logged out successfully.')
    },
  })
}
