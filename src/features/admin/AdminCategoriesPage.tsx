import React, { useState } from 'react'
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from './hooks'
import { Skeletons } from '@/components/common/Skeletons'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { Plus, Edit2, Trash2, X } from 'lucide-react'

export const AdminCategoriesPage: React.FC = () => {
  const { data: categories, isLoading, isError, refetch } = useCategoriesQuery()
  const createMutation = useCreateCategoryMutation()
  const updateMutation = useUpdateCategoryMutation()
  const deleteMutation = useDeleteCategoryMutation()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)

  const handleOpenCreate = () => {
    setEditingId(null)
    setCategoryName('')
    setSortOrder((categories?.length || 0) + 1)
    setIsActive(true)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (cat: { id: string; name: string; sort_order: number; is_active: boolean }) => {
    setEditingId(cat.id)
    setCategoryName(cat.name)
    setSortOrder(cat.sort_order)
    setIsActive(cat.is_active)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryName.trim()) return

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          updates: { name: categoryName.trim(), sort_order: sortOrder, is_active: isActive },
        })
      } else {
        await createMutation.mutateAsync({
          name: categoryName.trim(),
          sort_order: sortOrder,
          is_active: isActive,
        })
      }
      setIsModalOpen(false)
    } catch {
      // Error handled by hook toast
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete category "${name}"?`)) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch {
        // Error handled by hook toast
      }
    }
  }

  if (isLoading) {
    return <Skeletons count={3} />
  }

  if (isError) {
    return <ErrorState message="Failed to load categories." onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-brand-text">Categories</h2>
          <p className="text-sm text-brand-muted">Organize menu items into categories (e.g. Starters, Biryani, Pizza).</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-btn bg-brand-primary text-white font-semibold text-sm hover:bg-brand-dark transition-colors shadow-subtle"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      {categories?.length === 0 ? (
        <EmptyState
          title="No categories created"
          description="Create your first category to start organizing your menu items."
          actionLabel="Add Category"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="bg-white rounded-card border border-gray-200 divide-y divide-gray-100 shadow-subtle overflow-hidden">
          {categories?.map((cat) => (
            <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-gray-50/60 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-primary/10 text-brand-primary font-bold text-xs flex items-center justify-center">
                  #{cat.sort_order}
                </div>
                <div>
                  <h3 className="font-heading text-sm font-bold text-brand-text">{cat.name}</h3>
                  <span
                    className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      cat.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {cat.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateMutation.mutate({
                      id: cat.id,
                      updates: { is_active: !cat.is_active },
                    })
                  }
                  className={`text-xs px-2.5 py-1 rounded font-semibold transition-colors ${
                    cat.is_active ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.is_active ? 'Visible' : 'Hidden'}
                </button>
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="p-2 text-gray-500 hover:text-brand-primary rounded hover:bg-gray-100 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="p-2 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-card max-w-md w-full p-6 space-y-4 shadow-float animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-heading text-lg font-bold text-brand-text">
                {editingId ? 'Edit Category' : 'New Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-text block">Category Name</label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Starters, Biryani"
                  className="w-full p-2.5 rounded-btn border border-gray-300 text-sm bg-white"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-text block">Sort Order</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-full p-2.5 rounded-btn border border-gray-300 text-sm bg-white"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <span className="font-semibold text-sm text-brand-text block">Active Status</span>
                  <span className="text-xs text-brand-muted">Visible on customer menu</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-2.5 rounded-btn bg-brand-primary text-white font-semibold text-sm hover:bg-brand-dark transition-colors shadow-subtle"
                >
                  {editingId ? 'Save Changes' : 'Create Category'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-btn border border-gray-300 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
