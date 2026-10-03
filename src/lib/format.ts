/**
 * Formats a numeric value into INR currency string.
 * Example: 540 -> "₹540.00" or "₹540" depending on fraction digits.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export const formatDateTime = formatDate
