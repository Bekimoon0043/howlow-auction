export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          phone_number: string
          display_name: string | null
          avatar_url: string | null
          is_banned: boolean
          is_frozen: boolean
          locale: string
          referral_code: string | null
          referred_by: string | null
          wins_count: number
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; phone_number: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      wallets: {
        Row: { user_id: string; balance: number; currency: string; updated_at: string }
        Insert: { user_id: string; balance?: number; currency?: string }
        Update: Partial<Database['public']['Tables']['wallets']['Row']>
      }
      user_bid_credits: {
        Row: { user_id: string; credits: number; updated_at: string }
        Insert: { user_id: string; credits?: number }
        Update: Partial<Database['public']['Tables']['user_bid_credits']['Row']>
      }
      auctions: {
        Row: {
          id: string
          product_id: string
          status: string
          start_time: string | null
          end_time: string | null
          bid_cost: number
          min_bid: number
          max_bid: number | null
          participant_count: number
          total_bids: number
          created_at: string
          updated_at: string
        }
        Insert: any
        Update: any
      }
      products: {
        Row: {
          id: string
          category_id: string | null
          title_am: string
          title_en: string
          description_am: string | null
          description_en: string | null
          retail_price: number
          shipping_cost: number
          is_active: boolean
          created_at: string
        }
        Insert: any
        Update: any
      }
      bids: {
        Row: {
          id: string
          auction_id: string
          user_id: string
          amount: number
          created_at: string
        }
        Insert: any
        Update: any
      }
      winners: {
        Row: {
          id: string
          auction_id: string
          user_id: string
          winning_bid: number
          retail_price: number
          savings: number
          created_at: string
        }
        Insert: any
        Update: any
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title_am: string
          title_en: string
          body_am: string | null
          body_en: string | null
          type: string
          data: Json
          is_read: boolean
          created_at: string
        }
        Insert: any
        Update: any
      }
      settings: {
        Row: { key: string; value: Json; updated_at: string }
        Insert: any
        Update: any
      }
      deposit_requests: {
        Row: {
          id: string
          user_id: string
          amount: number
          note: string | null
          status: string
          created_at: string
        }
        Insert: any
        Update: any
      }
      bid_credit_packages: {
        Row: {
          id: string
          name_am: string
          name_en: string
          credits: number
          price_etb: number
          is_active: boolean
          sort_order: number
        }
        Insert: any
        Update: any
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: string
          amount: number
          balance_after: number | null
          note: string | null
          created_at: string
        }
        Insert: any
        Update: any
      }
      admins: {
        Row: { user_id: string; created_at: string }
        Insert: any
        Update: any
      }
      orders: {
        Row: {
          id: string
          user_id: string
          winner_id: string
          status: string
          created_at: string
        }
        Insert: any
        Update: any
      }
    }
    Functions: {
      place_bid: {
        Args: { p_auction_id: string; p_amount: number }
        Returns: Json
      }
      admin_adjust_wallet: {
        Args: {
          p_target_user: string
          p_amount: number
          p_type: string
          p_note?: string
          p_deposit_request_id?: string
        }
        Returns: Json
      }
      admin_adjust_credits: {
        Args: { p_target_user: string; p_credits: number; p_note?: string }
        Returns: Json
      }
      resolve_auction: {
        Args: { p_auction_id: string }
        Returns: Json
      }
    }
  }
}
