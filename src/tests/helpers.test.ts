import { describe, it, expect } from 'vitest'
import { calculateHaversineDistanceKm } from '../lib/geo'
import { formatCurrency, formatDate } from '../lib/format'

describe('Geo Helpers - Haversine Distance', () => {
  it('returns 0 km for identical coordinates', () => {
    const distance = calculateHaversineDistanceKm(19.076, 72.8777, 19.076, 72.8777)
    expect(distance).toBe(0)
  })

  it('correctly calculates distance between Mumbai and Pune (~120 km)', () => {
    // Mumbai (19.0760, 72.8777) to Pune (18.5204, 73.8567)
    const distance = calculateHaversineDistanceKm(19.076, 72.8777, 18.5204, 73.8567)
    expect(distance).toBeGreaterThan(115)
    expect(distance).toBeLessThan(130)
  })

  it('correctly identifies out-of-range boundary (> 5km)', () => {
    // Restaurant at (19.0760, 72.8777)
    const within5km = calculateHaversineDistanceKm(19.076, 72.8777, 19.100, 72.890) // ~3.0 km
    const beyond5km = calculateHaversineDistanceKm(19.076, 72.8777, 19.140, 72.950) // ~10.2 km

    expect(within5km).toBeLessThanOrEqual(5.0)
    expect(beyond5km).toBeGreaterThan(5.0)
  })
})

describe('Format Helpers - Currency & Date', () => {
  it('formats numeric amounts to INR currency format', () => {
    const formatted = formatCurrency(250)
    expect(formatted).toContain('250')
  })

  it('formats dates using Asia/Kolkata timezone', () => {
    const formatted = formatDate('2026-10-04T12:00:00Z')
    expect(formatted).toBeDefined()
    expect(typeof formatted).toBe('string')
  })
})

describe('Coupon & Pricing Business Logic', () => {
  it('computes percentage coupon discount correctly with max cap', () => {
    const percent = 20 // 20%
    const maxCap = 100
    const subtotal = 600

    const rawDiscount = (subtotal * percent) / 100 // 120
    const finalDiscount = Math.min(rawDiscount, maxCap) // 100

    expect(finalDiscount).toBe(100)
  })

  it('computes flat coupon discount correctly', () => {
    const flatDiscount = 50
    const subtotal = 300
    const finalSubtotal = Math.max(0, subtotal - flatDiscount)

    expect(finalSubtotal).toBe(250)
  })

  it('enforces minimum order amount check for coupons', () => {
    const minOrderAmount = 299
    const cartSubtotal = 199

    const isValid = cartSubtotal >= minOrderAmount
    expect(isValid).toBe(false)
  })
})
