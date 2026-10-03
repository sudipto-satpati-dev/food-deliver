import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useMenuItemDetailQuery,
  useCategoriesQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
} from './hooks'
import { compressAndUploadImage } from '@/lib/image'
import { Skeletons } from '@/components/common/Skeletons'
import { ErrorState } from '@/components/common/ErrorState'
import { ArrowLeft, Upload, Plus, Trash2, Save, Sparkles, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

export const AdminItemFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const { data: categories } = useCategoriesQuery()
  const { data: itemDetail, isLoading, isError } = useMenuItemDetailQuery(id)

  const createMutation = useCreateMenuItemMutation()
  const updateMutation = useUpdateMenuItemMutation(id || '')
  const deleteMutation = useDeleteMenuItemMutation()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [price, setPrice] = useState<number | ''>('')
  const [imageUrl, setImageUrl] = useState('')
  const [isVeg, setIsVeg] = useState(true)
  const [isBestseller, setIsBestseller] = useState(false)
  const [isAvailable, setIsAvailable] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

  // Dynamic variants & addons state
  const [variants, setVariants] = useState<Array<{ name: string; price: number }>>([])
  const [addons, setAddons] = useState<Array<{ name: string; price: number }>>([])

  useEffect(() => {
    if (isEdit && itemDetail) {
      setName(itemDetail.name)
      setDescription(itemDetail.description || '')
      setCategoryId(itemDetail.category_id)
      setPrice(itemDetail.price)
      setImageUrl(itemDetail.image_url || '')
      setIsVeg(itemDetail.is_veg)
      setIsBestseller(itemDetail.is_bestseller)
      setIsAvailable(itemDetail.is_available)
      if (itemDetail.item_variants) {
        setVariants(itemDetail.item_variants.map((v) => ({ name: v.name, price: v.price })))
      }
      if (itemDetail.item_addons) {
        setAddons(itemDetail.item_addons.map((a) => ({ name: a.name, price: a.price })))
      }
    } else if (categories && categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id)
    }
  }, [isEdit, itemDetail, categories])

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      const uploadedUrl = await compressAndUploadImage(file)
      setImageUrl(uploadedUrl)
      toast.success('Image uploaded and compressed successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Image upload failed.')
    } finally {
      setIsUploading(false)
    }
  }

  // Variant handlers
  const handleAddVariant = () => {
    setVariants([...variants, { name: '', price: price ? Number(price) : 0 }])
  }
  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index))
  }
  const handleVariantChange = (index: number, field: 'name' | 'price', value: string | number) => {
    const updated = [...variants]
    updated[index] = { ...updated[index], [field]: value }
    setVariants(updated)
  }

  // Addon handlers
  const handleAddAddon = () => {
    setAddons([...addons, { name: '', price: 20 }])
  }
  const handleRemoveAddon = (index: number) => {
    setAddons(addons.filter((_, i) => i !== index))
  }
  const handleAddonChange = (index: number, field: 'name' | 'price', value: string | number) => {
    const updated = [...addons]
    updated[index] = { ...updated[index], [field]: value }
    setAddons(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Item name is required.')
    if (!categoryId) return toast.error('Please select a category.')
    if (price === '' || price < 0) return toast.error('Please enter a valid base price.')

    const payload = {
      item: {
        category_id: categoryId,
        name: name.trim(),
        description: description.trim() || null,
        price: Number(price),
        image_url: imageUrl || null,
        is_veg: isVeg,
        is_bestseller: isBestseller,
        is_available: isAvailable,
        is_active: true,
        sort_order: 0,
      },
      variants: variants.filter((v) => v.name.trim() !== ''),
      addons: addons.filter((a) => a.name.trim() !== ''),
    }

    try {
      if (isEdit && id) {
        await updateMutation.mutateAsync(payload)
      } else {
        await createMutation.mutateAsync(payload)
      }
      navigate('/admin/menu')
    } catch {
      // Error handled by hook toast
    }
  }

  const handleDeleteItem = async () => {
    if (id && window.confirm(`Delete item "${name}" permanently?`)) {
      try {
        await deleteMutation.mutateAsync(id)
        navigate('/admin/menu')
      } catch {
        // Error handled by hook toast
      }
    }
  }

  if (isEdit && isLoading) return <Skeletons count={3} />
  if (isEdit && isError) return <ErrorState message="Failed to load item details." />

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/menu')}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="font-heading text-2xl font-bold text-brand-text">
            {isEdit ? 'Edit Menu Item' : 'New Menu Item'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {isEdit && (
            <button
              type="button"
              onClick={handleDeleteItem}
              className="p-2.5 text-red-600 hover:bg-red-50 rounded-btn border border-red-200 transition-colors"
              title="Delete Item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending || isUploading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-btn bg-brand-primary text-white font-semibold text-sm hover:bg-brand-dark transition-colors shadow-subtle disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> Save Item
          </button>
        </div>
      </div>

      {/* 1. Image Upload Section */}
      <div className="bg-white rounded-card p-5 border border-gray-200 shadow-subtle space-y-3">
        <label className="text-xs font-semibold text-brand-text block">Item Photo (WebP Compressed)</label>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-32 h-32 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0 relative">
            {imageUrl ? (
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-400" />
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="space-y-2 flex-1 text-center sm:text-left">
            <input
              type="file"
              accept="image/*"
              id="image-upload"
              onChange={handleImageFileChange}
              className="hidden"
            />
            <label
              htmlFor="image-upload"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-btn border border-gray-300 bg-white text-brand-text font-medium text-xs hover:bg-gray-50 cursor-pointer shadow-subtle"
            >
              <Upload className="w-4 h-4 text-brand-primary" />
              <span>{imageUrl ? 'Change Photo' : 'Upload Photo'}</span>
            </label>
            <p className="text-xs text-brand-muted">
              Photos are automatically resized and compressed to WebP (&lt;150 KB) before uploading to Supabase Storage.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Basic Details */}
      <div className="bg-white rounded-card p-5 border border-gray-200 shadow-subtle space-y-4">
        <h3 className="font-heading text-base font-bold text-brand-text border-b border-gray-100 pb-2">
          Basic Details
        </h3>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-text block">Item Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Special Chicken Biryani"
              className="w-full p-2.5 rounded-btn border border-gray-300 text-sm bg-white font-body"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-text block">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2.5 rounded-btn border border-gray-300 text-sm bg-white font-body"
                required
              >
                <option value="">Select Category</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-text block">Base Price (₹)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="240"
                className="w-full p-2.5 rounded-btn border border-gray-300 text-sm bg-white font-body font-semibold text-brand-primary"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-text block">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rich basmati rice cooked with tender chicken pieces and aromatic spices."
              className="w-full p-2.5 rounded-btn border border-gray-300 text-sm bg-white font-body"
            />
          </div>

          {/* Segmented Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Veg / Non-Veg */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs font-semibold text-brand-text">Dietary Type</span>
              <div className="flex bg-white rounded-btn p-0.5 border border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsVeg(true)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                    isVeg ? 'bg-green-600 text-white' : 'text-gray-600'
                  }`}
                >
                  Veg
                </button>
                <button
                  type="button"
                  onClick={() => setIsVeg(false)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                    !isVeg ? 'bg-red-600 text-white' : 'text-gray-600'
                  }`}
                >
                  Non-Veg
                </button>
              </div>
            </div>

            {/* Bestseller Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs font-semibold text-brand-text flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Bestseller
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBestseller}
                  onChange={(e) => setIsBestseller(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* Quick Available Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-xs font-semibold text-brand-text">Available</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Variants Section */}
      <div className="bg-white rounded-card p-5 border border-gray-200 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div>
            <h3 className="font-heading text-base font-bold text-brand-text">Portion Variants</h3>
            <p className="text-xs text-brand-muted">E.g. Half Portion ₹180, Full Portion ₹320</p>
          </div>
          <button
            type="button"
            onClick={handleAddVariant}
            className="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
          >
            <Plus className="w-4 h-4" /> Add Variant
          </button>
        </div>

        {variants.length === 0 ? (
          <p className="text-xs text-brand-muted italic py-1">No variants added. Base price will be used.</p>
        ) : (
          <div className="space-y-2">
            {variants.map((v, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Variant name (e.g. Half / Full)"
                  value={v.name}
                  onChange={(e) => handleVariantChange(i, 'name', e.target.value)}
                  className="flex-1 p-2 rounded border border-gray-300 text-xs bg-white font-medium"
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-brand-muted">₹</span>
                  <input
                    type="number"
                    placeholder="Price"
                    value={v.price}
                    onChange={(e) => handleVariantChange(i, 'price', Number(e.target.value))}
                    className="w-24 p-2 rounded border border-gray-300 text-xs bg-white font-semibold text-brand-primary"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveVariant(i)}
                  className="p-2 text-gray-400 hover:text-red-500 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Addons Section */}
      <div className="bg-white rounded-card p-5 border border-gray-200 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <div>
            <h3 className="font-heading text-base font-bold text-brand-text">Add-ons</h3>
            <p className="text-xs text-brand-muted">E.g. Extra Cheese +₹30, Extra Raita +₹25</p>
          </div>
          <button
            type="button"
            onClick={handleAddAddon}
            className="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:underline"
          >
            <Plus className="w-4 h-4" /> Add Add-on
          </button>
        </div>

        {addons.length === 0 ? (
          <p className="text-xs text-brand-muted italic py-1">No add-ons configured for this item.</p>
        ) : (
          <div className="space-y-2">
            {addons.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add-on name (e.g. Extra Cheese)"
                  value={a.name}
                  onChange={(e) => handleAddonChange(i, 'name', e.target.value)}
                  className="flex-1 p-2 rounded border border-gray-300 text-xs bg-white font-medium"
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-brand-muted">+₹</span>
                  <input
                    type="number"
                    placeholder="Price"
                    value={a.price}
                    onChange={(e) => handleAddonChange(i, 'price', Number(e.target.value))}
                    className="w-24 p-2 rounded border border-gray-300 text-xs bg-white font-semibold text-brand-primary"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAddon(i)}
                  className="p-2 text-gray-400 hover:text-red-500 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky Save Button for Mobile */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/95 border-t border-gray-200 md:hidden z-30 shadow-card">
        <button
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending || isUploading}
          className="w-full py-3 rounded-btn bg-brand-primary text-white font-semibold text-sm hover:bg-brand-dark transition-colors shadow-subtle flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" /> Save Item
        </button>
      </div>
    </form>
  )
}
