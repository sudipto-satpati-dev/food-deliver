let scriptPromise: Promise<boolean> | null = null

export function loadRazorpayScript(): Promise<boolean> {
  if (window.Razorpay) {
    return Promise.resolve(true)
  }

  if (scriptPromise) {
    return scriptPromise
  }

  scriptPromise = new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => {
      console.warn('Failed to load Razorpay Checkout script. Falling back to dev mode payment.')
      resolve(false)
    }
    document.body.appendChild(script)
  })

  return scriptPromise
}
