import React, { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { calculateHaversineDistanceKm } from '@/lib/geo'
import { Navigation, MapPin } from 'lucide-react'
import { toast } from 'sonner'

// Fix default Leaflet icon paths in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface MapPickerProps {
  restaurantLat: number
  restaurantLng: number
  deliveryRadiusKm: number
  initialLat?: number
  initialLng?: number
  onLocationChange: (lat: number, lng: number, distanceKm: number, geocodedAddress?: string) => void
  height?: string
}

export const MapPicker: React.FC<MapPickerProps> = ({
  restaurantLat,
  restaurantLng,
  deliveryRadiusKm,
  initialLat,
  initialLng,
  onLocationChange,
  height = '280px',
}) => {
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const circleRef = useRef<L.Circle | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const defaultLat = initialLat || restaurantLat
  const defaultLng = initialLng || restaurantLng

  const [currentLat, setCurrentLat] = useState(defaultLat)
  const [currentLng, setCurrentLng] = useState(defaultLng)
  const [isLocating, setIsLocating] = useState(false)

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current) return

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 14,
        zoomControl: false,
      })

      // Add OpenStreetMap tiles with required attribution
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      // Add Restaurant Pin (fixed)
      const restIcon = L.divIcon({
        className: 'custom-rest-pin',
        html: `<div style="background-color: #1F1F1F; color: white; padding: 6px; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 2px solid white; display:flex; align-items:center; justify-content:center; width:28px; height:28px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      })
      L.marker([restaurantLat, restaurantLng], { icon: restIcon, title: 'Dinning Zone Restaurant' }).addTo(map)

      // Add 5 km delivery radius circle
      const circle = L.circle([restaurantLat, restaurantLng], {
        color: '#D94F30',
        fillColor: '#D94F30',
        fillOpacity: 0.1,
        weight: 1.5,
        radius: deliveryRadiusKm * 1000,
      }).addTo(map)
      circleRef.current = circle

      // Add Customer Pin (draggable)
      const pinIcon = L.divIcon({
        className: 'custom-user-pin',
        html: `<div style="background-color: #D94F30; color: white; padding: 8px; border-radius: 50%; box-shadow: 0 4px 10px rgba(217,79,48,0.4); border: 3px solid white; display:flex; align-items:center; justify-content:center; width:36px; height:36px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      })

      const marker = L.marker([defaultLat, defaultLng], {
        draggable: true,
        icon: pinIcon,
      }).addTo(map)

      markerRef.current = marker

      // Handle Drag Events
      marker.on('dragend', async () => {
        const position = marker.getLatLng()
        handlePositionUpdate(position.lat, position.lng)
      })

      mapRef.current = map
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  const handlePositionUpdate = async (newLat: number, newLng: number) => {
    setCurrentLat(newLat)
    setCurrentLng(newLng)

    const dist = calculateHaversineDistanceKm(restaurantLat, restaurantLng, newLat, newLng)

    // Optional reverse geocoding via Nominatim (called only on drag-end)
    let geocodedAddress: string | undefined
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${newLat}&lon=${newLng}`,
        {
          headers: {
            'User-Agent': 'DinningZonePWA/1.0',
          },
        }
      )
      if (response.ok) {
        const data = await response.json()
        if (data.display_name) {
          geocodedAddress = data.display_name
        }
      }
    } catch {
      // Nominatim fail fallback
    }

    onLocationChange(newLat, newLng, dist, geocodedAddress)
  }

  // Geolocation trigger
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false)
        const newLat = pos.coords.latitude
        const newLng = pos.coords.longitude

        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([newLat, newLng], 16)
          markerRef.current.setLatLng([newLat, newLng])
        }

        handlePositionUpdate(newLat, newLng)
        toast.success('Location updated to your current position!')
      },
      (err) => {
        setIsLocating(false)
        toast.error('Could not fetch location: ' + err.message)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="relative rounded-card overflow-hidden border border-brand-border shadow-subtle">
      {/* Map Container */}
      <div ref={containerRef} style={{ height }} className="w-full z-10" />

      {/* Floating "Use Current Location" Button */}
      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={isLocating}
        className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 px-3 py-2 bg-white text-brand-primary rounded-btn shadow-float text-xs font-bold border border-brand-border hover:bg-gray-50 transition-all active:scale-95"
      >
        <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
        <span>{isLocating ? 'Locating...' : 'Use current location'}</span>
      </button>
    </div>
  )
}
