import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MenuItemWithDetails } from './api'
import { usePublicMenuItemsQuery } from './hooks'
import { ItemBottomSheet } from './ItemBottomSheet'
import { Skeletons } from '@/components/common/Skeletons'
import { EmptyState } from '@/components/common/EmptyState'
import { VegDot } from '@/components/common/VegDot'
import { Price } from '@/components/common/Price'
import { Search, ArrowLeft, X } from 'lucide-react'

export const SearchPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: menuItems, isLoading } = usePublicMenuItemsQuery()

  const [query, setQuery] = useState('')
  const [selectedItemForSheet, setSelectedItemForSheet] = useState<MenuItemWithDetails | null>(null)

  const popularSearches = ['Biryani', 'Butter Naan', 'Paneer Tikka', 'Chicken Burger', 'Cold Coffee', 'Gulab Jamun']

  const searchResults = useMemo(() => {
    if (!query.trim() || !menuItems) return []
    const q = query.toLowerCase().trim()
    return menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
    )
  }, [query, menuItems])

  return (
    <div className="space-y-4 pb-8">
      {/* Search Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-brand-muted hover:text-brand-text rounded-full hover:bg-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search biryani, pizza, paneer..."
            className="w-full pl-10 pr-9 py-2.5 rounded-btn border border-brand-border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Popular Suggestions when query is empty */}
      {!query.trim() && (
        <div className="space-y-3 pt-2">
          <h3 className="font-heading text-xs font-bold uppercase tracking-wider text-brand-muted">
            Popular Searches
          </h3>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((term) => (
              <button
                key={term}
                onClick={() => setQuery(term)}
                className="px-3.5 py-1.5 rounded-full bg-white border border-brand-border text-xs font-medium text-brand-text hover:border-brand-primary hover:text-brand-primary transition-colors shadow-subtle"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results List */}
      {query.trim() && (
        <div className="space-y-3 pt-2">
          <p className="text-xs text-brand-muted font-medium">
            Found <span className="font-bold text-brand-text">{searchResults.length}</span> {searchResults.length === 1 ? 'result' : 'results'} for "{query}"
          </p>

          {isLoading ? (
            <Skeletons count={3} />
          ) : searchResults.length === 0 ? (
            <EmptyState
              title="No matching dishes"
              description={`We couldn't find any dish matching "${query}". Try searching for something else!`}
              actionLabel="Clear Search"
              onAction={() => setQuery('')}
            />
          ) : (
            <div className="bg-white rounded-card border border-brand-border divide-y divide-gray-100 shadow-subtle overflow-hidden">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemForSheet(item)}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-gray-50/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <VegDot isVeg={item.is_veg} size="sm" className="mt-1 shrink-0" />
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-heading text-sm font-bold text-brand-text">{item.name}</h4>
                      <p className="text-xs text-brand-muted line-clamp-1">{item.description}</p>
                      <Price amount={item.price} className="text-sm font-bold text-brand-primary block" />
                    </div>
                  </div>

                  <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                    <img
                      src={item.image_url || '/banners/default-food-placeholder.webp'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedItemForSheet(item)
                      }}
                      className="absolute bottom-1 right-1 px-2.5 py-1 rounded bg-white text-brand-primary text-xs font-bold shadow-subtle border border-brand-primary/20 hover:bg-brand-primary hover:text-white transition-colors"
                    >
                      ADD
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Item Customization Bottom Sheet */}
      <ItemBottomSheet
        item={selectedItemForSheet}
        onClose={() => setSelectedItemForSheet(null)}
      />
    </div>
  )
}
