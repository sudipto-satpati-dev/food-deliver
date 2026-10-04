import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/routes/guards'
import { AppRoutes } from '@/routes/index'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { OfflineBanner } from '@/components/common/OfflineBanner'
import { PwaInstallBanner } from '@/components/common/PwaInstallBanner'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <OfflineBanner />
            <AppRoutes />
            <PwaInstallBanner />
            <Toaster position="top-center" richColors closeButton />
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
