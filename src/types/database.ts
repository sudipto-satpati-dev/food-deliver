export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'customer' | 'admin' | 'rider';
export type OrderStatus =
  | 'pending_payment'
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'rejected';
export type PaymentMethod = 'cod' | 'online';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type DiscountType = 'percent' | 'flat';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          role: UserRole
          is_active: boolean
          is_online: boolean
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: UserRole
          is_active?: boolean
          is_online?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: UserRole
          is_active?: boolean
          is_online?: boolean
          created_at?: string
        }
      }
      settings: {
        Row: {
          id: number
          restaurant_name: string
          is_open: boolean
          accepting_orders: boolean
          opening_time: string
          closing_time: string
          lat: number
          lng: number
          address_text: string | null
          delivery_radius_km: number
          delivery_fee_tiers: Json
          free_delivery_above: number | null
          min_order_amount: number
          packaging_fee: number
          tax_percent: number
          cod_enabled: boolean
          online_enabled: boolean
          support_phone: string | null
          prep_time_minutes: number
          updated_at: string
        }
        Insert: {
          id?: number
          restaurant_name?: string
          is_open?: boolean
          accepting_orders?: boolean
          opening_time?: string
          closing_time?: string
          lat?: number
          lng?: number
          address_text?: string | null
          delivery_radius_km?: number
          delivery_fee_tiers?: Json
          free_delivery_above?: number | null
          min_order_amount?: number
          packaging_fee?: number
          tax_percent?: number
          cod_enabled?: boolean
          online_enabled?: boolean
          support_phone?: string | null
          prep_time_minutes?: number
          updated_at?: string
        }
        Update: {
          id?: number
          restaurant_name?: string
          is_open?: boolean
          accepting_orders?: boolean
          opening_time?: string
          closing_time?: string
          lat?: number
          lng?: number
          address_text?: string | null
          delivery_radius_km?: number
          delivery_fee_tiers?: Json
          free_delivery_above?: number | null
          min_order_amount?: number
          packaging_fee?: number
          tax_percent?: number
          cod_enabled?: boolean
          online_enabled?: boolean
          support_phone?: string | null
          prep_time_minutes?: number
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          image_url: string | null
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          category_id: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          is_veg: boolean
          is_bestseller: boolean
          is_available: boolean
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          category_id: string
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          is_veg?: boolean
          is_bestseller?: boolean
          is_available?: boolean
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          is_veg?: boolean
          is_bestseller?: boolean
          is_available?: boolean
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
      }
      item_variants: {
        Row: {
          id: string
          item_id: string
          name: string
          price: number
          is_available: boolean
          sort_order: number
        }
        Insert: {
          id?: string
          item_id: string
          name: string
          price: number
          is_available?: boolean
          sort_order?: number
        }
        Update: {
          id?: string
          item_id?: string
          name?: string
          price?: number
          is_available?: boolean
          sort_order?: number
        }
      }
      item_addons: {
        Row: {
          id: string
          item_id: string
          name: string
          price: number
          is_available: boolean
          sort_order: number
        }
        Insert: {
          id?: string
          item_id: string
          name: string
          price?: number
          is_available?: boolean
          sort_order?: number
        }
        Update: {
          id?: string
          item_id?: string
          name?: string
          price?: number
          is_available?: boolean
          sort_order?: number
        }
      }
      addresses: {
        Row: {
          id: string
          user_id: string
          label: string
          contact_name: string
          phone: string
          line1: string
          line2: string | null
          landmark: string | null
          lat: number
          lng: number
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          label?: string
          contact_name: string
          phone: string
          line1: string
          line2?: string | null
          landmark?: string | null
          lat: number
          lng: number
          is_default?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          label?: string
          contact_name?: string
          phone?: string
          line1?: string
          line2?: string | null
          landmark?: string | null
          lat?: number
          lng?: number
          is_default?: boolean
          created_at?: string
        }
      }
      coupons: {
        Row: {
          id: string
          code: string
          description: string | null
          type: DiscountType
          value: number
          max_discount: number | null
          min_order: number
          starts_at: string | null
          expires_at: string | null
          usage_limit: number | null
          per_user_limit: number | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          description?: string | null
          type: DiscountType
          value: number
          max_discount?: number | null
          min_order?: number
          starts_at?: string | null
          expires_at?: string | null
          usage_limit?: number | null
          per_user_limit?: number | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          description?: string | null
          type?: DiscountType
          value?: number
          max_discount?: number | null
          min_order?: number
          starts_at?: string | null
          expires_at?: string | null
          usage_limit?: number | null
          per_user_limit?: number | null
          is_active?: boolean
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_no: number
          user_id: string
          status: OrderStatus
          payment_method: PaymentMethod
          payment_status: PaymentStatus
          subtotal: number
          discount: number
          delivery_fee: number
          packaging_fee: number
          tax: number
          total: number
          coupon_id: string | null
          coupon_code: string | null
          customer_name: string
          customer_phone: string
          delivery_address: Json
          delivery_lat: number
          delivery_lng: number
          distance_km: number
          notes: string | null
          rider_id: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          cod_collected: boolean
          cancel_reason: string | null
          estimated_minutes: number | null
          placed_at: string
          accepted_at: string | null
          picked_up_at: string | null
          delivered_at: string | null
          cancelled_at: string | null
        }
        Insert: {
          id?: string
          order_no?: number
          user_id: string
          status?: OrderStatus
          payment_method: PaymentMethod
          payment_status?: PaymentStatus
          subtotal: number
          discount?: number
          delivery_fee?: number
          packaging_fee?: number
          tax?: number
          total: number
          coupon_id?: string | null
          coupon_code?: string | null
          customer_name: string
          customer_phone: string
          delivery_address: Json
          delivery_lat: number
          delivery_lng: number
          distance_km: number
          notes?: string | null
          rider_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          cod_collected?: boolean
          cancel_reason?: string | null
          estimated_minutes?: number | null
          placed_at?: string
          accepted_at?: string | null
          picked_up_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          status?: OrderStatus
          payment_method?: PaymentMethod
          payment_status?: PaymentStatus
          subtotal?: number
          discount?: number
          delivery_fee?: number
          packaging_fee?: number
          tax?: number
          total?: number
          coupon_id?: string | null
          coupon_code?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_address?: Json
          delivery_lat?: number
          delivery_lng?: number
          distance_km?: number
          notes?: string | null
          rider_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          cod_collected?: boolean
          cancel_reason?: string | null
          estimated_minutes?: number | null
          placed_at?: string
          accepted_at?: string | null
          picked_up_at?: string | null
          delivered_at?: string | null
          cancelled_at?: string | null
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          item_id: string | null
          name: string
          variant_name: string | null
          unit_price: number
          qty: number
          addons: Json
          line_total: number
          notes: string | null
        }
        Insert: {
          id?: string
          order_id: string
          item_id?: string | null
          name: string
          variant_name?: string | null
          unit_price: number
          qty: number
          addons?: Json
          line_total: number
          notes?: string | null
        }
        Update: {
          id?: string
          order_id?: string
          item_id?: string | null
          name?: string
          variant_name?: string | null
          unit_price?: number
          qty?: number
          addons?: Json
          line_total?: number
          notes?: string | null
        }
      }
      reviews: {
        Row: {
          id: string
          order_id: string
          user_id: string
          food_rating: number
          delivery_rating: number
          comment: string | null
          admin_reply: string | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          user_id: string
          food_rating: number
          delivery_rating: number
          comment?: string | null
          admin_reply?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          user_id?: string
          food_rating?: number
          delivery_rating?: number
          comment?: string | null
          admin_reply?: string | null
          created_at?: string
        }
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          user_agent?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      place_order: {
        Args: {
          p_items: Json
          p_address_id: string
          p_payment_method: PaymentMethod
          p_coupon_code?: string | null
          p_notes?: string | null
          p_razorpay_order_id?: string | null
          p_razorpay_payment_id?: string | null
        }
        Returns: Json
      }
      validate_coupon: {
        Args: {
          p_code: string
          p_subtotal: number
        }
        Returns: Json
      }
      update_order_status: {
        Args: {
          p_order_id: string
          p_status: OrderStatus
          p_reason?: string
        }
        Returns: void
      }
      assign_rider: {
        Args: {
          p_order_id: string
          p_rider_id: string
        }
        Returns: void
      }
      verify_delivery_otp: {
        Args: {
          p_order_id: string
          p_code: string
        }
        Returns: Json
      }
      admin_mark_delivered: {
        Args: {
          p_order_id: string
          p_reason: string
        }
        Returns: void
      }
      cancel_my_order: {
        Args: {
          p_order_id: string
          p_reason?: string
        }
        Returns: void
      }
      get_order_rider: {
        Args: {
          p_order_id: string
        }
        Returns: Json
      }
      admin_sales_summary: {
        Args: {
          from_date?: string
          to_date?: string
        }
        Returns: {
          sales_date: string
          order_count: number
          delivered_count: number
          cancelled_count: number
          total_revenue: number
          online_revenue: number
          cod_revenue: number
        }[]
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Settings = Database['public']['Tables']['settings']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type MenuItem = Database['public']['Tables']['menu_items']['Row']
export type ItemVariant = Database['public']['Tables']['item_variants']['Row']
export type ItemAddon = Database['public']['Tables']['item_addons']['Row']
export type Address = Database['public']['Tables']['addresses']['Row']
export type Coupon = Database['public']['Tables']['coupons']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
