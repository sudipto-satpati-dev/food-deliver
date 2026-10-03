import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMenuItemsQuery, useCategoriesQuery, useToggleItemAvailabilityMutation, useDeleteMenuItemMutation } from './hooks'
import { Skeletons } from '@/components/common/Skeletons'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { VegDot } from '@/components/common/VegDot'
import { Price } from '@/components/common/Price'
import { Plus, Search, Edit2, Trash2, Sparkles } from 'lucide-react'

export const AdminMenuPage: React.FC = () => {
  const { data: menuItems, isLoading, isError, refetch } = useMenuItemsQuery()
  const { data: categories } = useCategoriesQuery()
  const toggleMutation = useToggleItemAvailabilityMutation()
  const deleteMutation = useDeleteMenuItemMutation()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'all'>('all')

  const filteredItems = useMemo(() => {
    if (!menuItems) return []
    return menuItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = selectedCategoryId === 'all' || item.category_id === selectedCategoryId
      return matchesSearch && matchesCategory
    })
  }, [menuItems, searchQuery, selectedCategoryId])

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete item "${name}"?`)) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch {
        // Error handled by hook toast
      }
    }
  }

  if (isLoading) {
    return <Skeletons count={4} />
  }

  if (isError) {
    return <ErrorState message="Failed to load menu items." onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold text-brand-text">Menu Items</h2>
          <p className="text-sm text-brand-muted">Manage dishes, prices, and instant sold-out availability switches.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/categories"
            className="px-3.5 py-2.5 rounded-btn border border-gray-300 text-brand-text font-medium text-xs hover:bg-gray-50 transition-colors"
          >
            Manage Categories
          </Link>
          <Link
            to="/admin/menu/items/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-btn bg-brand-primary text-white font-semibold text-xs hover:bg-brand-dark transition-colors shadow-subtle"
          >
            <Plus className="w-4 h-4" /> Add Item
          </Link>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dish by name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-btn border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryId('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategoryId === 'all'
                ? 'bg-brand-primary text-white shadow-subtle'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Items ({menuItems?.length || 0})
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategoryId === cat.id
                  ? 'bg-brand-primary text-white shadow-subtle'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <EmptyState
          title="No menu items found"
          description="Try adjusting your search or category filter, or add a new menu item."
          actionLabel="Add Item"
          onAction={() => {}}
        />
      ) : (
        <div className="bg-white rounded-card border border-gray-200 divide-y divide-gray-100 shadow-subtle overflow-hidden">
          {filteredItems.map((item) => (
            <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/60 transition-colors">
              <div className="flex items-start gap-3">
                {/* Thumbnail Image */}
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                  <img
                    src={item.image_url || '/banners/default-food-placeholder.webp'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {!item.is_available && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-red-600 px-1.5 py-0.5 rounded">
                        Sold Out
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <VegDot isVeg={item.is_veg} size="sm" />
                    <h3 className="font-heading text-sm font-bold text-brand-text">{item.name}</h3>
                    {item.is_bestseller && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" /> Bestseller
                      </span>
                    )}
                    {item.categories?.name && (
                      <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {item.categories.name}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-brand-muted line-clamp-1 max-w-md">
                    {item.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center gap-3 pt-1">
                    <Price amount={item.price} className="text-sm font-bold text-brand-primary" />
                    {item.item_variants && item.item_variants.length > 0 && (
                      <span className="text-xs text-brand-muted">({item.item_variants.length} options)</span>
                    )}
                    {item.item_addons && item.item_addons.length > 0 && (
                      <span className="text-xs text-brand-muted">({item.item_addons.length} add-ons)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions & Quick Sold-Out Switch */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                {/* Availability Toggle */}
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                  <span className="text-xs font-semibold text-brand-text">
                    {item.is_available ? 'Available' : 'Sold Out'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.is_available}
                      onChange={(e) =>
                        toggleMutation.mutate({
                          id: item.id,
                          is_available: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div className="flex items-center gap-1">
                  <Link
                    to={`/admin/menu/items/${item.id}`}
                    className="p-2 text-gray-500 hover:text-brand-primary rounded hover:bg-gray-100 transition-colors"
                    title="Edit Item"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(item.id, item.name)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100 transition-colors"
                    title="Delete Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
