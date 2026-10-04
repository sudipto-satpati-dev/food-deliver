import React, { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MenuItemWithDetails } from './api'
import { usePublicCategoriesQuery, usePublicMenuItemsQuery } from './hooks'
import { ItemBottomSheet } from './ItemBottomSheet'
import { Skeletons } from '@/components/common/Skeletons'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { VegDot } from '@/components/common/VegDot'
import { Price } from '@/components/common/Price'
import { Search, Sparkles } from 'lucide-react'

export const MenuPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const categoryParam = searchParams.get('category')

  const { data: categories, isLoading: isCatLoading } = usePublicCategoriesQuery()
  const { data: menuItems, isLoading: isItemsLoading, isError, refetch } = usePublicMenuItemsQuery()

  const [selectedCatId, setSelectedCatId] = useState<string | 'all'>('all')
  const [vegOnly, setVegOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItemForSheet, setSelectedItemForSheet] = useState<MenuItemWithDetails | null>(null)

  useEffect(() => {
    if (categoryParam) {
      setSelectedCatId(categoryParam)
    }
  }, [categoryParam])

  const filteredItems = useMemo(() => {
    if (!menuItems) return []
    return menuItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = selectedCatId === 'all' || item.category_id === selectedCatId
      const matchesVeg = !vegOnly || item.is_veg
      return matchesSearch && matchesCategory && matchesVeg
    })
  }, [menuItems, searchQuery, selectedCatId, vegOnly])

  // Group items by category for display
  const itemsByCategory = useMemo(() => {
    if (!categories) return []
    return categories
      .map((cat) => ({
        category: cat,
        items: filteredItems.filter((item) => item.category_id === cat.id),
      }))
      .filter((group) => group.items.length > 0)
  }, [categories, filteredItems])

  if (isCatLoading || isItemsLoading) return <Skeletons count={4} />
  if (isError) return <ErrorState message="Failed to load menu." onRetry={() => refetch()} />

  return (
    <div className="space-y-4 pb-8">
      {/* Search & Veg Only Filter Header */}
      <div className="space-y-3 sticky top-14 z-20 bg-brand-bg/95 backdrop-blur pt-2 pb-2">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items in menu..."
            className="w-full pl-10 pr-4 py-2.5 rounded-btn border border-brand-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
          />
        </div>

        {/* Veg-Only Toggle Switch */}
        <div className="flex items-center justify-between bg-white px-3 py-2 rounded-btn border border-brand-border shadow-subtle">
          <div className="flex items-center gap-2">
            <VegDot isVeg={true} size="sm" />
            <span className="text-xs font-semibold text-brand-text">Veg Only</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={vegOnly}
              onChange={(e) => setVegOnly(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>

        {/* Sticky Horizontal Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCatId('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCatId === 'all'
                ? 'bg-brand-primary text-white shadow-subtle'
                : 'bg-white border border-brand-border text-brand-text hover:bg-gray-50'
            }`}
          >
            All Categories
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCatId === cat.id
                  ? 'bg-brand-primary text-white shadow-subtle'
                  : 'bg-white border border-brand-border text-brand-text hover:bg-gray-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items List Grouped by Category */}
      {itemsByCategory.length === 0 ? (
        <EmptyState
          title="No dishes found"
          description="Try changing your search or veg-only filter to see more dishes."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearchQuery('')
            setSelectedCatId('all')
            setVegOnly(false)
          }}
        />
      ) : (
        itemsByCategory.map((group) => (
          <div key={group.category.id} className="space-y-3">
            <h3 className="font-heading text-base font-bold text-brand-text flex items-center gap-2 border-b border-gray-200 pb-1.5">
              <span>{group.category.name}</span>
              <span className="text-xs text-brand-muted font-normal">({group.items.length})</span>
            </h3>

            <div className="bg-white rounded-card border border-brand-border divide-y divide-gray-100 shadow-subtle overflow-hidden">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemForSheet(item)}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-gray-50/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <VegDot isVeg={item.is_veg} size="sm" className="mt-1 shrink-0" />
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-heading text-sm font-bold text-brand-text">{item.name}</h4>
                        {item.is_bestseller && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-full">
                            <Sparkles className="w-2.5 h-2.5 text-amber-500 fill-amber-500" /> Bestseller
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-brand-muted line-clamp-2 leading-relaxed">{item.description}</p>
                      <Price amount={item.price} className="text-sm font-bold text-brand-primary block pt-0.5" />
                    </div>
                  </div>

                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                    <img
                      src={item.image_url || '/banners/default-food-placeholder.webp'}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                    {!item.is_available ? (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-red-600 px-1.5 py-0.5 rounded">
                          Sold Out
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedItemForSheet(item)
                        }}
                        className="absolute bottom-1 right-1 px-3 py-1 rounded-btn bg-white text-brand-primary text-xs font-bold shadow-subtle border border-brand-primary/20 hover:bg-brand-primary hover:text-white transition-all transform active:scale-95"
                      >
                        ADD
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Item Customization Bottom Sheet */}
      <ItemBottomSheet
        item={selectedItemForSheet}
        onClose={() => setSelectedItemForSheet(null)}
      />
    </div>
  )
}
