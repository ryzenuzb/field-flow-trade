export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_request_queue: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          image_url: string | null
          message: string | null
          processed_at: string | null
          result: Json | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          image_url?: string | null
          message?: string | null
          processed_at?: string | null
          result?: Json | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          image_url?: string | null
          message?: string | null
          processed_at?: string | null
          result?: Json | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_agent: string | null
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      chat_participants: {
        Row: {
          id: string
          is_muted: boolean | null
          joined_at: string | null
          last_read_at: string | null
          role: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_muted?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          collected_at: string | null
          commission_amount: number
          commission_rate: number
          created_at: string | null
          id: string
          order_amount: number
          order_id: string | null
          seller_id: string
          status: string | null
        }
        Insert: {
          collected_at?: string | null
          commission_amount: number
          commission_rate: number
          created_at?: string | null
          id?: string
          order_amount: number
          order_id?: string | null
          seller_id: string
          status?: string | null
        }
        Update: {
          collected_at?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string | null
          id?: string
          order_amount?: number
          order_id?: string | null
          seller_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      crop_events: {
        Row: {
          created_at: string
          crop_name: string
          event_date: string
          event_type: string
          id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          crop_name: string
          event_date: string
          event_type: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          crop_name?: string
          event_date?: string
          event_type?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_metrics: {
        Row: {
          active_users: number | null
          created_at: string | null
          date: string
          id: string
          new_farmers: number | null
          new_orders: number | null
          new_products: number | null
          new_users: number | null
          total_commission: number | null
          total_gmv: number | null
        }
        Insert: {
          active_users?: number | null
          created_at?: string | null
          date: string
          id?: string
          new_farmers?: number | null
          new_orders?: number | null
          new_products?: number | null
          new_users?: number | null
          total_commission?: number | null
          total_gmv?: number | null
        }
        Update: {
          active_users?: number | null
          created_at?: string | null
          date?: string
          id?: string
          new_farmers?: number | null
          new_orders?: number | null
          new_products?: number | null
          new_users?: number | null
          total_commission?: number | null
          total_gmv?: number | null
        }
        Relationships: []
      }
      disease_history: {
        Row: {
          diagnosed_at: string | null
          diagnosis: Json | null
          disease_name: string | null
          id: string
          image_url: string | null
          plant_name: string
          resolved_at: string | null
          treated_at: string | null
          treatment_applied: string | null
          treatment_result: string | null
          user_id: string
        }
        Insert: {
          diagnosed_at?: string | null
          diagnosis?: Json | null
          disease_name?: string | null
          id?: string
          image_url?: string | null
          plant_name: string
          resolved_at?: string | null
          treated_at?: string | null
          treatment_applied?: string | null
          treatment_result?: string | null
          user_id: string
        }
        Update: {
          diagnosed_at?: string | null
          diagnosis?: Json | null
          disease_name?: string | null
          id?: string
          image_url?: string | null
          plant_name?: string
          resolved_at?: string | null
          treated_at?: string | null
          treatment_applied?: string | null
          treatment_result?: string | null
          user_id?: string
        }
        Relationships: []
      }
      escrow_transactions: {
        Row: {
          amount: number
          created_at: string | null
          held_at: string | null
          id: string
          order_id: string
          refunded_at: string | null
          released_at: string | null
          status: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          held_at?: string | null
          id?: string
          order_id: string
          refunded_at?: string | null
          released_at?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          held_at?: string | null
          id?: string
          order_id?: string
          refunded_at?: string | null
          released_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_profiles: {
        Row: {
          created_at: string | null
          district: string | null
          farm_name: string | null
          farm_size: number | null
          farm_type: string[] | null
          id: string
          irrigation_type: string | null
          region: string | null
          soil_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          district?: string | null
          farm_name?: string | null
          farm_size?: number | null
          farm_type?: string[] | null
          id?: string
          irrigation_type?: string | null
          region?: string | null
          soil_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          district?: string | null
          farm_name?: string | null
          farm_size?: number | null
          farm_type?: string[] | null
          id?: string
          irrigation_type?: string | null
          region?: string | null
          soil_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          accepted_at: string | null
          buyer_id: string
          cancel_reason: string | null
          cancelled_at: string | null
          created_at: string
          delivered_at: string | null
          dispute_reason: string | null
          escrow_released: boolean | null
          id: string
          product_id: string
          quantity: number
          seller_id: string | null
          shipped_at: string | null
          status: string | null
          total_price: number
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          buyer_id: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          delivered_at?: string | null
          dispute_reason?: string | null
          escrow_released?: boolean | null
          id?: string
          product_id: string
          quantity: number
          seller_id?: string | null
          shipped_at?: string | null
          status?: string | null
          total_price: number
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          buyer_id?: string
          cancel_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          delivered_at?: string | null
          dispute_reason?: string | null
          escrow_released?: boolean | null
          id?: string
          product_id?: string
          quantity?: number
          seller_id?: string | null
          shipped_at?: string | null
          status?: string | null
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      private_messages: {
        Row: {
          attachment_url: string | null
          content: string
          content_type: string | null
          created_at: string | null
          edited_at: string | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          room_id: string
          sender_id: string
        }
        Insert: {
          attachment_url?: string | null
          content: string
          content_type?: string | null
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          room_id: string
          sender_id: string
        }
        Update: {
          attachment_url?: string | null
          content?: string
          content_type?: string | null
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      product_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          data: Json
          id: string
          product_id: string | null
          version: number
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          data: Json
          id?: string
          product_id?: string | null
          version: number
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          data?: Json
          id?: string
          product_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          location: string | null
          price: number
          seller_id: string
          stock_quantity: number | null
          title: string
          unit: string
          updated_at: string
          version: number | null
        }
        Insert: {
          category: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          price: number
          seller_id: string
          stock_quantity?: number | null
          title: string
          unit: string
          updated_at?: string
          version?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          location?: string | null
          price?: number
          seller_id?: string
          stock_quantity?: number | null
          title?: string
          unit?: string
          updated_at?: string
          version?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          block_reason: string | null
          blocked_at: string | null
          blocked_by: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_blocked: boolean | null
          location: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          block_reason?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_blocked?: boolean | null
          location?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          block_reason?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_blocked?: boolean | null
          location?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          count: number | null
          created_at: string | null
          id: string
          ip_address: string | null
          user_id: string | null
          window_start: string | null
        }
        Insert: {
          action: string
          count?: number | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
          window_start?: string | null
        }
        Update: {
          action?: string
          count?: number | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      regional_metrics: {
        Row: {
          active_farmers: number | null
          date: string
          gmv: number | null
          id: string
          orders_count: number | null
          region: string
        }
        Insert: {
          active_farmers?: number | null
          date: string
          gmv?: number | null
          id?: string
          orders_count?: number | null
          region: string
        }
        Update: {
          active_farmers?: number | null
          date?: string
          gmv?: number | null
          id?: string
          orders_count?: number | null
          region?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          is_verified_purchase: boolean | null
          is_visible: boolean | null
          order_id: string | null
          product_id: string | null
          rating: number
          reviewer_id: string
          seller_id: string
          updated_at: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          is_verified_purchase?: boolean | null
          is_visible?: boolean | null
          order_id?: string | null
          product_id?: string | null
          rating: number
          reviewer_id: string
          seller_id: string
          updated_at?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          is_verified_purchase?: boolean | null
          is_visible?: boolean | null
          order_id?: string | null
          product_id?: string | null
          rating?: number
          reviewer_id?: string
          seller_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_balances: {
        Row: {
          available_balance: number | null
          id: string
          pending_balance: number | null
          total_earned: number | null
          total_withdrawn: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          available_balance?: number | null
          id?: string
          pending_balance?: number | null
          total_earned?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          available_balance?: number | null
          id?: string
          pending_balance?: number | null
          total_earned?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      seller_verifications: {
        Row: {
          created_at: string | null
          document_url: string | null
          id: string
          notes: string | null
          status: string | null
          user_id: string
          verification_type: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_url?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          user_id: string
          verification_type: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_url?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          user_id?: string
          verification_type?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      soil_analysis_results: {
        Row: {
          additional_notes: string | null
          analyzed_by: string | null
          created_at: string
          crop_recommendations: string[] | null
          fertility_score: number | null
          fertilizer_suggestions: string[] | null
          id: string
          moisture_level: number | null
          nitrogen_level: string | null
          ph_level: number | null
          phosphorus_level: string | null
          potassium_level: string | null
          request_id: string
          soil_type: string | null
          updated_at: string
        }
        Insert: {
          additional_notes?: string | null
          analyzed_by?: string | null
          created_at?: string
          crop_recommendations?: string[] | null
          fertility_score?: number | null
          fertilizer_suggestions?: string[] | null
          id?: string
          moisture_level?: number | null
          nitrogen_level?: string | null
          ph_level?: number | null
          phosphorus_level?: string | null
          potassium_level?: string | null
          request_id: string
          soil_type?: string | null
          updated_at?: string
        }
        Update: {
          additional_notes?: string | null
          analyzed_by?: string | null
          created_at?: string
          crop_recommendations?: string[] | null
          fertility_score?: number | null
          fertilizer_suggestions?: string[] | null
          id?: string
          moisture_level?: number | null
          nitrogen_level?: string | null
          ph_level?: number | null
          phosphorus_level?: string | null
          potassium_level?: string | null
          request_id?: string
          soil_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "soil_analysis_results_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "soil_inspection_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      soil_inspection_requests: {
        Row: {
          analysis_price: number | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          farmer_id: string
          id: string
          land_size: number
          land_size_unit: string
          latitude: number | null
          location_name: string | null
          longitude: number | null
          needs_analysis: boolean | null
          notes: string | null
          payment_status: string | null
          previous_crops: string[] | null
          status: string
          updated_at: string
          visit_notes: string | null
          visited_at: string | null
          visited_by: string | null
        }
        Insert: {
          analysis_price?: number | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          farmer_id: string
          id?: string
          land_size: number
          land_size_unit?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          needs_analysis?: boolean | null
          notes?: string | null
          payment_status?: string | null
          previous_crops?: string[] | null
          status?: string
          updated_at?: string
          visit_notes?: string | null
          visited_at?: string | null
          visited_by?: string | null
        }
        Update: {
          analysis_price?: number | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          farmer_id?: string
          id?: string
          land_size?: number
          land_size_unit?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          needs_analysis?: boolean | null
          notes?: string | null
          payment_status?: string | null
          previous_crops?: string[] | null
          status?: string
          updated_at?: string
          visit_notes?: string | null
          visited_at?: string | null
          visited_by?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          ai_queries_limit: number | null
          commission_rate: number | null
          created_at: string | null
          features: Json
          id: string
          is_active: boolean | null
          max_products: number | null
          name: string
          price_monthly: number
          price_yearly: number | null
        }
        Insert: {
          ai_queries_limit?: number | null
          commission_rate?: number | null
          created_at?: string | null
          features: Json
          id?: string
          is_active?: boolean | null
          max_products?: number | null
          name: string
          price_monthly: number
          price_yearly?: number | null
        }
        Update: {
          ai_queries_limit?: number | null
          commission_rate?: number | null
          created_at?: string | null
          features?: Json
          id?: string
          is_active?: boolean | null
          max_products?: number | null
          name?: string
          price_monthly?: number
          price_yearly?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: string | null
          trial_end: string | null
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id: string
          status?: string | null
          trial_end?: string | null
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: string | null
          trial_end?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_farmer_role: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      assign_sub_admin_role: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      check_rate_limit: {
        Args: {
          p_action: string
          p_max_requests: number
          p_user_id: string
          p_window_seconds: number
        }
        Returns: boolean
      }
      create_or_get_direct_chat: {
        Args: { other_user_id: string }
        Returns: string
      }
      create_order_chat: { Args: { p_order_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_main_admin: { Args: { _user_id: string }; Returns: boolean }
      remove_sub_admin_role: {
        Args: { target_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "farmer" | "buyer" | "sub_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "farmer", "buyer", "sub_admin"],
    },
  },
} as const
