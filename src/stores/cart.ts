import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartAddon {
  id: string
  name: string
  price: number
}

export interface CartItem {
  lineKey: string // item_id + variant_id + addon_ids_sorted + notes
  itemId: string
  name: string
  imageUrl: string | null
  isVeg: boolean
  variantId: string | null
  variantName: string | null
  unitPrice: number
  addons: CartAddon[]
  qty: number
  notes: string | null
}

interface CartStore {
  items: CartItem[]
  couponCode: string | null
  addItem: (item: Omit<CartItem, 'lineKey'>) => void
  removeItem: (lineKey: string) => void
  updateQty: (lineKey: string, delta: number) => void
  clearCart: () => void
  setCouponCode: (code: string | null) => void
  getSubtotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      couponCode: null,
      addItem: (newItem) => {
        const addonIds = (newItem.addons || []).map((a) => a.id).sort().join(',')
        const lineKey = `${newItem.itemId}:${newItem.variantId || 'base'}:${addonIds}:${newItem.notes || ''}`

        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.lineKey === lineKey)
          if (existingIndex > -1) {
            const updatedItems = [...state.items]
            updatedItems[existingIndex].qty += newItem.qty
            return { items: updatedItems }
          } else {
            return { items: [...state.items, { ...newItem, lineKey }] }
          }
        })
      },
      removeItem: (lineKey) => {
        set((state) => ({
          items: state.items.filter((i) => i.lineKey !== lineKey),
        }))
      },
      updateQty: (lineKey, delta) => {
        set((state) => {
          const updatedItems = state.items
            .map((item) => {
              if (item.lineKey === lineKey) {
                const newQty = item.qty + delta
                return newQty > 0 ? { ...item, qty: newQty } : null
              }
              return item
            })
            .filter(Boolean) as CartItem[]
          return { items: updatedItems }
        })
      },
      clearCart: () => set({ items: [], couponCode: null }),
      setCouponCode: (code) => set({ couponCode: code }),
      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0)
      },
      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.qty, 0)
      },
    }),
    {
      name: 'dinning-zone-cart-storage',
    }
  )
)
