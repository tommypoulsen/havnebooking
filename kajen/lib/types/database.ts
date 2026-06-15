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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      cancellation_policies: {
        Row: {
          days_before: number
          id: string
          refund_pct: number
          service_id: string | null
          tenant_id: string
        }
        Insert: {
          days_before: number
          id?: string
          refund_pct: number
          service_id?: string | null
          tenant_id: string
        }
        Update: {
          days_before?: number
          id?: string
          refund_pct?: number
          service_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cancellation_policies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellation_policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      capacity_inventory: {
        Row: {
          id: string
          service_id: string
          size_category_id: string
          total_units: number
        }
        Insert: {
          id?: string
          service_id: string
          size_category_id: string
          total_units: number
        }
        Update: {
          id?: string
          service_id?: string
          size_category_id?: string
          total_units?: number
        }
        Relationships: [
          {
            foreignKeyName: "capacity_inventory_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capacity_inventory_size_category_id_fkey"
            columns: ["size_category_id"]
            isOneToOne: false
            referencedRelation: "size_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      order_lines: {
        Row: {
          attributes: Json
          ends_at: string | null
          id: string
          line_total_oere: number
          order_id: string
          quantity: number
          service_id: string
          size_category_id: string | null
          starts_at: string | null
          time_slot_id: string | null
          unit_price_oere: number
        }
        Insert: {
          attributes?: Json
          ends_at?: string | null
          id?: string
          line_total_oere: number
          order_id: string
          quantity?: number
          service_id: string
          size_category_id?: string | null
          starts_at?: string | null
          time_slot_id?: string | null
          unit_price_oere: number
        }
        Update: {
          attributes?: Json
          ends_at?: string | null
          id?: string
          line_total_oere?: number
          order_id?: string
          quantity?: number
          service_id?: string
          size_category_id?: string | null
          starts_at?: string | null
          time_slot_id?: string | null
          unit_price_oere?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_lines_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_lines_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_lines_size_category_id_fkey"
            columns: ["size_category_id"]
            isOneToOne: false
            referencedRelation: "size_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_lines_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          id: string
          status: string
          tenant_id: string
          total_oere: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          status?: string
          tenant_id: string
          total_oere: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          status?: string
          tenant_id?: string
          total_oere?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_oere: number
          created_at: string | null
          id: string
          order_id: string
          provider: string
          provider_reference: string
          status: string
          updated_at: string | null
        }
        Insert: {
          amount_oere: number
          created_at?: string | null
          id?: string
          order_id: string
          provider?: string
          provider_reference: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount_oere?: number
          created_at?: string | null
          id?: string
          order_id?: string
          provider?: string
          provider_reference?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          created_at: string | null
          duration_type: string
          id: string
          price_oere: number
          service_id: string
          size_category_id: string | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          created_at?: string | null
          duration_type: string
          id?: string
          price_oere: number
          service_id: string
          size_category_id?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          created_at?: string | null
          duration_type?: string
          id?: string
          price_oere?: number
          service_id?: string
          size_category_id?: string | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_rules_size_category_id_fkey"
            columns: ["size_category_id"]
            isOneToOne: false
            referencedRelation: "size_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      refunds: {
        Row: {
          amount_oere: number
          created_at: string | null
          id: string
          payment_id: string
          reason: string | null
        }
        Insert: {
          amount_oere: number
          created_at?: string | null
          id?: string
          payment_id: string
          reason?: string | null
        }
        Update: {
          amount_oere?: number
          created_at?: string | null
          id?: string
          payment_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          config: Json
          created_at: string | null
          description: string | null
          id: string
          name: string
          sort_order: number
          tenant_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          config?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          sort_order?: number
          tenant_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          config?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          tenant_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      size_categories: {
        Row: {
          description: string | null
          id: string
          label: string
          service_id: string
          sort_order: number
        }
        Insert: {
          description?: string | null
          id?: string
          label: string
          service_id: string
          sort_order?: number
        }
        Update: {
          description?: string | null
          id?: string
          label?: string
          service_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "size_categories_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          active: boolean
          config: Json
          created_at: string | null
          id: string
          name: string
          subdomain: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean
          config?: Json
          created_at?: string | null
          id?: string
          name: string
          subdomain: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean
          config?: Json
          created_at?: string | null
          id?: string
          name?: string
          subdomain?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      time_slots: {
        Row: {
          booked_count: number
          capacity: number
          id: string
          service_id: string
          starts_at: string
        }
        Insert: {
          booked_count?: number
          capacity: number
          id?: string
          service_id: string
          starts_at: string
        }
        Update: {
          booked_count?: number
          capacity?: number
          id?: string
          service_id?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_slots_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_id: string
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          auth_id: string
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          auth_id?: string
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_tenant_id: { Args: never; Returns: string }
      current_user_role: { Args: never; Returns: string }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
