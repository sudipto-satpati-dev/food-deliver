import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabase'

export interface CompressAndUploadOptions {
  bucket?: string
  folder?: string
}

/**
 * Compresses an image client-side to WebP (max 1000px, <150 KB target)
 * and uploads it to Supabase Storage, returning its public URL.
 */
export async function compressAndUploadImage(
  file: File,
  options: CompressAndUploadOptions = {}
): Promise<string> {
  const { bucket = 'menu-images', folder = 'items' } = options

  // Image compression config
  const compressionOptions = {
    maxSizeMB: 0.15, // <150 KB
    maxWidthOrHeight: 1000,
    useWebWorker: true,
    fileType: 'image/webp',
  }

  // Compress file
  const compressedFile = await imageCompression(file, compressionOptions)

  // Generate unique file path
  const fileExt = 'webp'
  const fileName = `${folder}/${crypto.randomUUID()}.${fileExt}`

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, compressedFile, {
      contentType: 'image/webp',
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`)
  }

  // Get public URL
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
  return data.publicUrl
}
