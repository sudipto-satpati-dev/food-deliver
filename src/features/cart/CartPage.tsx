import React from 'react'
import { useCartStore } from '@/stores/cart'
import { EmptyState } from '@/components/common/EmptyState'
import { useNavigate } from 'react-router-dom'

export const CartPage: React.FC = () => {
  const items = useCartStore((state) => state.items)
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Good food is always waiting for you. Add items from the menu!"
        actionLabel="Browse Menu"
        onAction={() => navigate('/menu')}
      />
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-bold">Your Cart</h2>
      <p className="text-sm text-brand-muted">{items.length} items selected</p>
    </div>
  )
}
