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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          message: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          message: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          message?: string
        }
        Relationships: []
      }
      device_sessions: {
        Row: {
          browser: string | null
          created_at: string
          device_type: string | null
          email: string
          id: string
          last_seen: string
          os: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          email: string
          id?: string
          last_seen?: string
          os?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string
          device_type?: string | null
          email?: string
          id?: string
          last_seen?: string
          os?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      global_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          cookies_json: Json | null
          country: string | null
          created_at: string | null
          credits_total: number
          credits_used: number
          credits_used_today: number
          daily_credits_limit: number
          email: string
          expiry_date: string | null
          google_email: string | null
          google_password: string | null
          id: string
          is_admin: boolean | null
          last_reset_date: string
          mobile_number: string | null
          name: string | null
          pin_code: string | null
          plan: string | null
          referral_code: string | null
          referred_by: string | null
          state: string | null
          street_address: string | null
          subscription_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          cookies_json?: Json | null
          country?: string | null
          created_at?: string | null
          credits_total?: number
          credits_used?: number
          credits_used_today?: number
          daily_credits_limit?: number
          email: string
          expiry_date?: string | null
          google_email?: string | null
          google_password?: string | null
          id?: string
          is_admin?: boolean | null
          last_reset_date?: string
          mobile_number?: string | null
          name?: string | null
          pin_code?: string | null
          plan?: string | null
          referral_code?: string | null
          referred_by?: string | null
          state?: string | null
          street_address?: string | null
          subscription_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          cookies_json?: Json | null
          country?: string | null
          created_at?: string | null
          credits_total?: number
          credits_used?: number
          credits_used_today?: number
          daily_credits_limit?: number
          email?: string
          expiry_date?: string | null
          google_email?: string | null
          google_password?: string | null
          id?: string
          is_admin?: boolean | null
          last_reset_date?: string
          mobile_number?: string | null
          name?: string | null
          pin_code?: string | null
          plan?: string | null
          referral_code?: string | null
          referred_by?: string | null
          state?: string | null
          street_address?: string | null
          subscription_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          credits_awarded: number
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          credits_awarded?: number
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          credits_awarded?: number
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string | null
          device_brand: string | null
          device_info: string | null
          event: string | null
          id: string
          new_uuid: string | null
          old_uuid: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_brand?: string | null
          device_info?: string | null
          event?: string | null
          id?: string
          new_uuid?: string | null
          old_uuid?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_brand?: string | null
          device_info?: string | null
          event?: string | null
          id?: string
          new_uuid?: string | null
          old_uuid?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          device_brand: string | null
          device_id: string
          device_info: string
          device_name: string
          device_number: number | null
          device_type: string
          email: string
          id: string
          ip_address: string | null
          is_active: boolean
          last_active_time: string
          login_count: number
          login_source: string | null
          login_time: string
          stable_fingerprint: string | null
          triggered_lockout: boolean | null
          user_id: string
        }
        Insert: {
          device_brand?: string | null
          device_id: string
          device_info: string
          device_name?: string
          device_number?: number | null
          device_type?: string
          email: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_active_time?: string
          login_count?: number
          login_source?: string | null
          login_time?: string
          stable_fingerprint?: string | null
          triggered_lockout?: boolean | null
          user_id: string
        }
        Update: {
          device_brand?: string | null
          device_id?: string
          device_info?: string
          device_name?: string
          device_number?: number | null
          device_type?: string
          email?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_active_time?: string
          login_count?: number
          login_source?: string | null
          login_time?: string
          stable_fingerprint?: string | null
          triggered_lockout?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      process_referral: {
        Args: { new_user_id: string; referral_code_input: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
