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
  public: {
    Tables: {
      architect_brand_favorites: {
        Row: {
          brand_id: string
          created_at: string
          store_id: string
          user_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          store_id: string
          user_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "architect_brand_favorites_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "architect_brand_favorites_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_role: string | null
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json
          store_id: string | null
        }
        Insert: {
          action: string
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
          store_id?: string | null
        }
        Update: {
          action?: string
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_categories: {
        Row: {
          brand_id: string
          category_id: string
          created_at: string
          id: string
        }
        Insert: {
          brand_id: string
          category_id: string
          created_at?: string
          id?: string
        }
        Update: {
          brand_id?: string
          category_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_categories_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          id: string
          is_hidden: boolean
          logo_url: string | null
          name: string
          segment: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_hidden?: boolean
          logo_url?: string | null
          name: string
          segment: string
        }
        Update: {
          created_at?: string
          id?: string
          is_hidden?: boolean
          logo_url?: string | null
          name?: string
          segment?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      crm_agenda_events: {
        Row: {
          architect_profile_id: string | null
          completed_at: string | null
          created_at: string
          customer_id: string | null
          event_type: string
          id: string
          location: string | null
          notes: string | null
          notify_at: string | null
          project_id: string | null
          scheduled_at: string
          seller_user_id: string
          status: string
          store_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          architect_profile_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          event_type?: string
          id?: string
          location?: string | null
          notes?: string | null
          notify_at?: string | null
          project_id?: string | null
          scheduled_at: string
          seller_user_id: string
          status?: string
          store_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          architect_profile_id?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string | null
          event_type?: string
          id?: string
          location?: string | null
          notes?: string | null
          notify_at?: string | null
          project_id?: string | null
          scheduled_at?: string
          seller_user_id?: string
          status?: string
          store_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_agenda_events_architect_profile_id_fkey"
            columns: ["architect_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "crm_agenda_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_agenda_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_agenda_events_seller_user_id_fkey"
            columns: ["seller_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "crm_agenda_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_brand_delivery_terms: {
        Row: {
          brand_id: string
          created_at: string
          delivery_days: number
          followup_days_before: number
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          delivery_days?: number
          followup_days_before?: number
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          delivery_days?: number
          followup_days_before?: number
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_brand_delivery_terms_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_customers: {
        Row: {
          address: string | null
          architect_name: string | null
          architect_profile_id: string | null
          archived_at: string | null
          archived_by: string | null
          birth_date: string | null
          city: string | null
          construction_address: string | null
          construction_deadline: string | null
          construction_status: string | null
          created_at: string
          created_by: string | null
          customer_type: string
          desired_rooms: string[]
          desired_style: string | null
          email: string | null
          id: string
          investment_range: string | null
          lead_source: string | null
          move_in_deadline: string | null
          name: string
          notes: string | null
          phone: string | null
          purchase_deadline: string | null
          purchase_reason: string | null
          seller_user_id: string
          status: string
          store_id: string | null
          store_name: string | null
          tenant_id: string | null
          updated_at: string
          updated_by: string | null
          urgency_level: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          architect_name?: string | null
          architect_profile_id?: string | null
          archived_at?: string | null
          archived_by?: string | null
          birth_date?: string | null
          city?: string | null
          construction_address?: string | null
          construction_deadline?: string | null
          construction_status?: string | null
          created_at?: string
          created_by?: string | null
          customer_type?: string
          desired_rooms?: string[]
          desired_style?: string | null
          email?: string | null
          id?: string
          investment_range?: string | null
          lead_source?: string | null
          move_in_deadline?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          purchase_deadline?: string | null
          purchase_reason?: string | null
          seller_user_id: string
          status?: string
          store_id?: string | null
          store_name?: string | null
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
          urgency_level?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          architect_name?: string | null
          architect_profile_id?: string | null
          archived_at?: string | null
          archived_by?: string | null
          birth_date?: string | null
          city?: string | null
          construction_address?: string | null
          construction_deadline?: string | null
          construction_status?: string | null
          created_at?: string
          created_by?: string | null
          customer_type?: string
          desired_rooms?: string[]
          desired_style?: string | null
          email?: string | null
          id?: string
          investment_range?: string | null
          lead_source?: string | null
          move_in_deadline?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          purchase_deadline?: string | null
          purchase_reason?: string | null
          seller_user_id?: string
          status?: string
          store_id?: string | null
          store_name?: string | null
          tenant_id?: string | null
          updated_at?: string
          updated_by?: string | null
          urgency_level?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_customers_architect_profile_id_fkey"
            columns: ["architect_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "crm_customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_interactions: {
        Row: {
          created_at: string
          customer_id: string | null
          description: string
          id: string
          interaction_type: string
          next_action: string | null
          next_followup_at: string | null
          project_id: string | null
          store_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          description: string
          id?: string
          interaction_type?: string
          next_action?: string | null
          next_followup_at?: string | null
          project_id?: string | null
          store_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          description?: string
          id?: string
          interaction_type?: string
          next_action?: string | null
          next_followup_at?: string | null
          project_id?: string | null
          store_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_interactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_interactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_interactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_leads: {
        Row: {
          architect_profile_id: string | null
          archived_at: string | null
          archived_by: string | null
          converted_project_id: string | null
          created_at: string
          created_by: string | null
          crm_status: string
          crm_tags: string[]
          customer_id: string | null
          id: string
          lead_name: string
          lead_source: string | null
          next_action: string | null
          next_followup_at: string | null
          notes: string | null
          phone: string | null
          project_id: string | null
          seller_user_id: string
          status: string
          store_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          architect_profile_id?: string | null
          archived_at?: string | null
          archived_by?: string | null
          converted_project_id?: string | null
          created_at?: string
          created_by?: string | null
          crm_status?: string
          crm_tags?: string[]
          customer_id?: string | null
          id?: string
          lead_name: string
          lead_source?: string | null
          next_action?: string | null
          next_followup_at?: string | null
          notes?: string | null
          phone?: string | null
          project_id?: string | null
          seller_user_id: string
          status?: string
          store_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          architect_profile_id?: string | null
          archived_at?: string | null
          archived_by?: string | null
          converted_project_id?: string | null
          created_at?: string
          created_by?: string | null
          crm_status?: string
          crm_tags?: string[]
          customer_id?: string | null
          id?: string
          lead_name?: string
          lead_source?: string | null
          next_action?: string | null
          next_followup_at?: string | null
          notes?: string | null
          phone?: string | null
          project_id?: string | null
          seller_user_id?: string
          status?: string
          store_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_leads_architect_profile_id_fkey"
            columns: ["architect_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "crm_leads_converted_project_id_fkey"
            columns: ["converted_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_leads_seller_user_id_fkey"
            columns: ["seller_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "crm_leads_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_order_approvals: {
        Row: {
          approval_type: string
          approved_at: string | null
          approved_by: string | null
          confirmation_text: string | null
          created_at: string
          id: string
          order_id: string | null
          project_id: string | null
          rejected_reason: string | null
          session_info: Json | null
          status: string
          store_id: string | null
          updated_at: string
        }
        Insert: {
          approval_type: string
          approved_at?: string | null
          approved_by?: string | null
          confirmation_text?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          project_id?: string | null
          rejected_reason?: string | null
          session_info?: Json | null
          status?: string
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          approval_type?: string
          approved_at?: string | null
          approved_by?: string | null
          confirmation_text?: string | null
          created_at?: string
          id?: string
          order_id?: string | null
          project_id?: string | null
          rejected_reason?: string | null
          session_info?: Json | null
          status?: string
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_order_approvals_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "crm_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_order_approvals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_order_approvals_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_orders: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          brand_confirmed_at: string | null
          brand_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          delivered_at: string | null
          expected_deadline: string | null
          id: string
          invoiced_at: string | null
          notes: string | null
          project_id: string
          quote_id: string | null
          real_deadline: string | null
          received_at: string | null
          risk_level: string
          seller_user_id: string
          sent_to_brand_at: string | null
          status: string
          store_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          brand_confirmed_at?: string | null
          brand_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          expected_deadline?: string | null
          id?: string
          invoiced_at?: string | null
          notes?: string | null
          project_id: string
          quote_id?: string | null
          real_deadline?: string | null
          received_at?: string | null
          risk_level?: string
          seller_user_id: string
          sent_to_brand_at?: string | null
          status?: string
          store_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          brand_confirmed_at?: string | null
          brand_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          expected_deadline?: string | null
          id?: string
          invoiced_at?: string | null
          notes?: string | null
          project_id?: string
          quote_id?: string | null
          real_deadline?: string | null
          received_at?: string | null
          risk_level?: string
          seller_user_id?: string
          sent_to_brand_at?: string | null
          status?: string
          store_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_orders_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_orders_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "crm_quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_quotes: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          discount_value: number
          final_value: number
          gross_value: number
          id: string
          notes: string | null
          payment_terms: string | null
          project_id: string
          seller_user_id: string
          status: string
          store_id: string | null
          updated_at: string
          updated_by: string | null
          valid_until: string | null
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount_value?: number
          final_value?: number
          gross_value?: number
          id?: string
          notes?: string | null
          payment_terms?: string | null
          project_id: string
          seller_user_id: string
          status?: string
          store_id?: string | null
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount_value?: number
          final_value?: number
          gross_value?: number
          id?: string
          notes?: string | null
          payment_terms?: string | null
          project_id?: string
          seller_user_id?: string
          status?: string
          store_id?: string | null
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quotes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_quotes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sales_targets: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          period_month: string
          seller_user_id: string | null
          store_id: string | null
          target_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          period_month: string
          seller_user_id?: string | null
          store_id?: string | null
          target_value?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          period_month?: string
          seller_user_id?: string | null
          store_id?: string | null
          target_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_sales_targets_seller_user_id_fkey"
            columns: ["seller_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "crm_sales_targets_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_support_tickets: {
        Row: {
          brand_id: string | null
          created_at: string
          customer_id: string | null
          description: string
          due_date: string | null
          id: string
          impact: string | null
          issue_type: string
          order_id: string | null
          product_id: string | null
          project_id: string | null
          responsible_user_id: string | null
          status: string
          store_id: string | null
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string
          customer_id?: string | null
          description: string
          due_date?: string | null
          id?: string
          impact?: string | null
          issue_type: string
          order_id?: string | null
          product_id?: string | null
          project_id?: string | null
          responsible_user_id?: string | null
          status?: string
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string
          customer_id?: string | null
          description?: string
          due_date?: string | null
          id?: string
          impact?: string | null
          issue_type?: string
          order_id?: string | null
          product_id?: string | null
          project_id?: string | null
          responsible_user_id?: string | null
          status?: string
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_support_tickets_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_support_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_support_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "crm_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_support_tickets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_support_tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_support_tickets_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_technical_notebooks: {
        Row: {
          created_at: string
          generated_by: string
          id: string
          project_id: string
          signed_at: string | null
          signed_by: string | null
          snapshot: Json
          status: string
          store_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          generated_by: string
          id?: string
          project_id: string
          signed_at?: string | null
          signed_by?: string | null
          snapshot?: Json
          status?: string
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          generated_by?: string
          id?: string
          project_id?: string
          signed_at?: string | null
          signed_by?: string | null
          snapshot?: Json
          status?: string
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_technical_notebooks_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "crm_technical_notebooks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_technical_notebooks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      curated_collection_products: {
        Row: {
          collection_id: string
          created_at: string
          display_order: number
          id: string
          product_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          display_order?: number
          id?: string
          product_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          display_order?: number
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "curated_collection_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "curated_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "curated_collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      curated_collections: {
        Row: {
          cover_image: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          title: string
          updated_at: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      design_style_tags: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      designers: {
        Row: {
          bio: string | null
          created_at: string
          id: string
          name: string
          photo_url: string | null
        }
        Insert: {
          bio?: string | null
          created_at?: string
          id?: string
          name: string
          photo_url?: string | null
        }
        Update: {
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          photo_url?: string | null
        }
        Relationships: []
      }
      environments: {
        Row: {
          created_at: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_designers: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          name: string
          photo_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name: string
          photo_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          photo_url?: string | null
        }
        Relationships: []
      }
      featured_products: {
        Row: {
          created_at: string
          display_order: number
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      finish_categories: {
        Row: {
          brand_id: string
          created_at: string
          display_order: number
          finish_group: string
          id: string
          name: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          display_order?: number
          finish_group?: string
          id?: string
          name: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          display_order?: number
          finish_group?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "finish_categories_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      finishes: {
        Row: {
          created_at: string
          display_order: number
          finish_category_id: string
          id: string
          image_url: string
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          finish_category_id: string
          id?: string
          image_url: string
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          finish_category_id?: string
          id?: string
          image_url?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "finishes_finish_category_id_fkey"
            columns: ["finish_category_id"]
            isOneToOne: false
            referencedRelation: "finish_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_images: {
        Row: {
          alt_text: string | null
          created_at: string
          display_order: number
          id: string
          image_url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
        }
        Relationships: []
      }
      marketing_events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          event_type: string
          id: string
          preview_image_url: string | null
          store_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          event_type?: string
          id?: string
          preview_image_url?: string | null
          store_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          preview_image_url?: string | null
          store_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      master_users: {
        Row: {
          created_at: string
          id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          has_advanced_reports: boolean
          has_custom_branding: boolean
          has_financial_module: boolean
          id: string
          max_architects: number | null
          max_products: number | null
          max_storage_mb: number | null
          max_users: number | null
          name: string
          price_monthly: number | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          has_advanced_reports?: boolean
          has_custom_branding?: boolean
          has_financial_module?: boolean
          id?: string
          max_architects?: number | null
          max_products?: number | null
          max_storage_mb?: number | null
          max_users?: number | null
          name: string
          price_monthly?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          has_advanced_reports?: boolean
          has_custom_branding?: boolean
          has_financial_module?: boolean
          id?: string
          max_architects?: number | null
          max_products?: number | null
          max_storage_mb?: number | null
          max_users?: number | null
          name?: string
          price_monthly?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      price_brands: {
        Row: {
          created_at: string
          default_markup_percent: number
          id: string
          name: string
          slug: string
          source_brand_name: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_markup_percent?: number
          id?: string
          name: string
          slug: string
          source_brand_name?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_markup_percent?: number
          id?: string
          name?: string
          slug?: string
          source_brand_name?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_brands_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      price_categories: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          name: string
          slug: string
          source_category_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          name: string
          slug: string
          source_category_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
          source_category_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_categories_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "price_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      price_finish_markup_rules: {
        Row: {
          brand_id: string
          created_at: string
          finish_key: string
          finish_label: string
          id: string
          is_active: boolean
          markup_percent: number
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          finish_key: string
          finish_label: string
          id?: string
          is_active?: boolean
          markup_percent?: number
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          finish_key?: string
          finish_label?: string
          id?: string
          is_active?: boolean
          markup_percent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_finish_markup_rules_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "price_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      price_finishes: {
        Row: {
          brand_id: string
          code: string | null
          created_at: string
          finish_type: string | null
          id: string
          name: string
          slug: string
          source_finish_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          code?: string | null
          created_at?: string
          finish_type?: string | null
          id?: string
          name: string
          slug: string
          source_finish_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          code?: string | null
          created_at?: string
          finish_type?: string | null
          id?: string
          name?: string
          slug?: string
          source_finish_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_finishes_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "price_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_finishes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      price_product_variations: {
        Row: {
          brand_id: string
          category_id: string
          created_at: string
          description: string | null
          dimensions: string | null
          id: string
          module: string | null
          product_id: string
          source_variation_id: string | null
          tenant_id: string
          updated_at: string
          variation_code: string | null
          variation_name: string | null
        }
        Insert: {
          brand_id: string
          category_id: string
          created_at?: string
          description?: string | null
          dimensions?: string | null
          id?: string
          module?: string | null
          product_id: string
          source_variation_id?: string | null
          tenant_id: string
          updated_at?: string
          variation_code?: string | null
          variation_name?: string | null
        }
        Update: {
          brand_id?: string
          category_id?: string
          created_at?: string
          description?: string | null
          dimensions?: string | null
          id?: string
          module?: string | null
          product_id?: string
          source_variation_id?: string | null
          tenant_id?: string
          updated_at?: string
          variation_code?: string | null
          variation_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_product_variations_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "price_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_product_variations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "price_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "price_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_product_variations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      price_products: {
        Row: {
          brand_id: string
          category_id: string
          created_at: string
          description: string | null
          designer: string | null
          id: string
          markup_percent: number | null
          name: string
          reference_code: string | null
          slug: string
          source_product_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          category_id: string
          created_at?: string
          description?: string | null
          designer?: string | null
          id?: string
          markup_percent?: number | null
          name: string
          reference_code?: string | null
          slug: string
          source_product_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          category_id?: string
          created_at?: string
          description?: string | null
          designer?: string | null
          id?: string
          markup_percent?: number | null
          name?: string
          reference_code?: string | null
          slug?: string
          source_product_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "price_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "price_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      price_table: {
        Row: {
          brand_id: string
          category_id: string
          created_at: string
          currency: string
          finish_id: string
          id: string
          price: number
          product_id: string
          source_price_id: string | null
          source_reference: string | null
          tenant_id: string
          updated_at: string
          variation_id: string
        }
        Insert: {
          brand_id: string
          category_id: string
          created_at?: string
          currency?: string
          finish_id: string
          id?: string
          price: number
          product_id: string
          source_price_id?: string | null
          source_reference?: string | null
          tenant_id: string
          updated_at?: string
          variation_id: string
        }
        Update: {
          brand_id?: string
          category_id?: string
          created_at?: string
          currency?: string
          finish_id?: string
          id?: string
          price?: number
          product_id?: string
          source_price_id?: string | null
          source_reference?: string | null
          tenant_id?: string
          updated_at?: string
          variation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_table_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "price_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_table_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "price_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_table_finish_id_fkey"
            columns: ["finish_id"]
            isOneToOne: false
            referencedRelation: "price_finishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_table_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "price_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_table_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_table_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "price_product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_composition_suggestions: {
        Row: {
          created_at: string
          display_order: number
          id: string
          product_id: string
          suggested_product_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          product_id: string
          suggested_product_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          product_id?: string
          suggested_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_composition_suggestions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_composition_suggestions_suggested_product_id_fkey"
            columns: ["suggested_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_downloads: {
        Row: {
          created_at: string
          display_order: number
          download_type: string
          id: string
          label: string
          product_id: string
          url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          download_type: string
          id?: string
          label: string
          product_id: string
          url: string
        }
        Update: {
          created_at?: string
          display_order?: number
          download_type?: string
          id?: string
          label?: string
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_downloads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_environments: {
        Row: {
          created_at: string
          environment_id: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          environment_id: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string
          environment_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_environments_environment_id_fkey"
            columns: ["environment_id"]
            isOneToOne: false
            referencedRelation: "environments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_environments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_finish_categories: {
        Row: {
          created_at: string
          finish_category_id: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          finish_category_id: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string
          finish_category_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_finish_categories_finish_category_id_fkey"
            columns: ["finish_category_id"]
            isOneToOne: false
            referencedRelation: "finish_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_finish_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_style_tags: {
        Row: {
          created_at: string
          id: string
          product_id: string
          style_tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          style_tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          style_tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_style_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_style_tags_style_tag_id_fkey"
            columns: ["style_tag_id"]
            isOneToOne: false
            referencedRelation: "design_style_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          ambient_images: string[] | null
          brand_id: string
          category: string
          created_at: string
          description: string | null
          designer_id: string | null
          file_2d: string | null
          file_3d: string | null
          finish_link: string | null
          id: string
          images: string[] | null
          is_hidden: boolean
          name: string
          tech_sheet: string | null
        }
        Insert: {
          ambient_images?: string[] | null
          brand_id: string
          category: string
          created_at?: string
          description?: string | null
          designer_id?: string | null
          file_2d?: string | null
          file_3d?: string | null
          finish_link?: string | null
          id?: string
          images?: string[] | null
          is_hidden?: boolean
          name: string
          tech_sheet?: string | null
        }
        Update: {
          ambient_images?: string[] | null
          brand_id?: string
          category?: string
          created_at?: string
          description?: string | null
          designer_id?: string | null
          file_2d?: string | null
          file_3d?: string | null
          finish_link?: string | null
          id?: string
          images?: string[] | null
          is_hidden?: boolean
          name?: string
          tech_sheet?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_designer_id_fkey"
            columns: ["designer_id"]
            isOneToOne: false
            referencedRelation: "designers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          approved: boolean
          birth_date: string | null
          created_at: string
          email: string | null
          full_name: string | null
          global_role: string
          id: string
          last_login_at: string | null
          phone: string | null
          seller_id: string | null
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          approved?: boolean
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          global_role?: string
          id?: string
          last_login_at?: string | null
          phone?: string | null
          seller_id?: string | null
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          approved?: boolean
          birth_date?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          global_role?: string
          id?: string
          last_login_at?: string | null
          phone?: string | null
          seller_id?: string | null
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      project_environment_images: {
        Row: {
          created_at: string
          display_order: number
          environment_name: string
          id: string
          image_url: string
          project_id: string
          store_id: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          environment_name: string
          id?: string
          image_url: string
          project_id: string
          store_id?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          environment_name?: string
          id?: string
          image_url?: string
          project_id?: string
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_environment_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_environment_images_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      project_item_checklist: {
        Row: {
          check_key: string
          checked: boolean
          created_at: string
          id: string
          project_item_id: string
          store_id: string | null
        }
        Insert: {
          check_key: string
          checked?: boolean
          created_at?: string
          id?: string
          project_item_id: string
          store_id?: string | null
        }
        Update: {
          check_key?: string
          checked?: boolean
          created_at?: string
          id?: string
          project_item_id?: string
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_item_checklist_project_item_id_fkey"
            columns: ["project_item_id"]
            isOneToOne: false
            referencedRelation: "project_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_item_checklist_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      project_items: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          created_by: string | null
          discount_price: number | null
          environment_label: string | null
          id: string
          notes: string | null
          presentation_dimensions: string | null
          presentation_image_2_index: number | null
          price: number | null
          product_id: string
          project_id: string
          quantity: number
          selected_finish_id: string | null
          selected_finish_id_2: string | null
          store_id: string | null
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string | null
          discount_price?: number | null
          environment_label?: string | null
          id?: string
          notes?: string | null
          presentation_dimensions?: string | null
          presentation_image_2_index?: number | null
          price?: number | null
          product_id: string
          project_id: string
          quantity?: number
          selected_finish_id?: string | null
          selected_finish_id_2?: string | null
          store_id?: string | null
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string | null
          discount_price?: number | null
          environment_label?: string | null
          id?: string
          notes?: string | null
          presentation_dimensions?: string | null
          presentation_image_2_index?: number | null
          price?: number | null
          product_id?: string
          project_id?: string
          quantity?: number
          selected_finish_id?: string | null
          selected_finish_id_2?: string | null
          store_id?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_items_selected_finish_id_2_fkey"
            columns: ["selected_finish_id_2"]
            isOneToOne: false
            referencedRelation: "finishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_items_selected_finish_id_fkey"
            columns: ["selected_finish_id"]
            isOneToOne: false
            referencedRelation: "finishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          architect_name: string | null
          archived_at: string | null
          archived_by: string | null
          client_name: string | null
          consultant_name: string | null
          created_at: string
          created_by: string | null
          crm_approval_status: string
          crm_architect_profile_id: string | null
          crm_customer_id: string | null
          crm_delivery_status: string
          crm_expected_close_date: string | null
          crm_expected_value: number | null
          crm_last_contact_at: string | null
          crm_margin_percent: number | null
          crm_next_followup_at: string | null
          crm_notes: string | null
          crm_order_status: string
          crm_quote_status: string
          crm_risk_level: string
          crm_sold_value: number | null
          crm_status: string
          crm_tags: string[]
          id: string
          initial_notes: string | null
          name: string
          sale_completed_at: string | null
          seller_user_id: string | null
          share_token: string | null
          store_id: string | null
          technical_notebook_signed_at: string | null
          updated_by: string | null
          user_id: string
        }
        Insert: {
          architect_name?: string | null
          archived_at?: string | null
          archived_by?: string | null
          client_name?: string | null
          consultant_name?: string | null
          created_at?: string
          created_by?: string | null
          crm_approval_status?: string
          crm_architect_profile_id?: string | null
          crm_customer_id?: string | null
          crm_delivery_status?: string
          crm_expected_close_date?: string | null
          crm_expected_value?: number | null
          crm_last_contact_at?: string | null
          crm_margin_percent?: number | null
          crm_next_followup_at?: string | null
          crm_notes?: string | null
          crm_order_status?: string
          crm_quote_status?: string
          crm_risk_level?: string
          crm_sold_value?: number | null
          crm_status?: string
          crm_tags?: string[]
          id?: string
          initial_notes?: string | null
          name: string
          sale_completed_at?: string | null
          seller_user_id?: string | null
          share_token?: string | null
          store_id?: string | null
          technical_notebook_signed_at?: string | null
          updated_by?: string | null
          user_id: string
        }
        Update: {
          architect_name?: string | null
          archived_at?: string | null
          archived_by?: string | null
          client_name?: string | null
          consultant_name?: string | null
          created_at?: string
          created_by?: string | null
          crm_approval_status?: string
          crm_architect_profile_id?: string | null
          crm_customer_id?: string | null
          crm_delivery_status?: string
          crm_expected_close_date?: string | null
          crm_expected_value?: number | null
          crm_last_contact_at?: string | null
          crm_margin_percent?: number | null
          crm_next_followup_at?: string | null
          crm_notes?: string | null
          crm_order_status?: string
          crm_quote_status?: string
          crm_risk_level?: string
          crm_sold_value?: number | null
          crm_status?: string
          crm_tags?: string[]
          id?: string
          initial_notes?: string | null
          name?: string
          sale_completed_at?: string | null
          seller_user_id?: string | null
          share_token?: string | null
          store_id?: string | null
          technical_notebook_signed_at?: string | null
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_crm_architect_profile_id_fkey"
            columns: ["crm_architect_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "projects_crm_customer_id_fkey"
            columns: ["crm_customer_id"]
            isOneToOne: false
            referencedRelation: "crm_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_seller_user_id_fkey"
            columns: ["seller_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "projects_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_posts: {
        Row: {
          body: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          cta_label: string | null
          cta_url: string | null
          event_date: string | null
          id: string
          is_published: boolean
          post_type: string
          store_id: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_url?: string | null
          event_date?: string | null
          id?: string
          is_published?: boolean
          post_type: string
          store_id?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          cta_label?: string | null
          cta_url?: string | null
          event_date?: string | null
          id?: string
          is_published?: boolean
          post_type?: string
          store_id?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "relationship_posts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_events: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json
          scope: string | null
          success: boolean
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          scope?: string | null
          success?: boolean
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          scope?: string | null
          success?: boolean
        }
        Relationships: []
      }
      security_rate_limits: {
        Row: {
          action: string
          actor_user_id: string | null
          blocked_until: string | null
          hit_count: number
          id: string
          ip_address: unknown
          scope_hash: string
          updated_at: string
          window_start: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          blocked_until?: string | null
          hit_count?: number
          id?: string
          ip_address?: unknown
          scope_hash: string
          updated_at?: string
          window_start: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          blocked_until?: string | null
          hit_count?: number
          id?: string
          ip_address?: unknown
          scope_hash?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      store_brands: {
        Row: {
          brand_id: string
          created_at: string
          created_by: string | null
          id: string
          status: string
          store_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          status?: string
          store_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          status?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_brands_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_brands_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_categories: {
        Row: {
          category_id: string
          created_at: string
          created_by: string | null
          id: string
          status: string
          store_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          status?: string
          store_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          status?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          role: string
          status: string
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role: string
          status?: string
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: string
          status?: string
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_members_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_products: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          product_id: string
          status: string
          store_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          product_id: string
          status?: string
          store_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          product_id?: string
          status?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          accent_color: string
          background_color: string
          city: string | null
          cnpj: string | null
          country: string
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          custom_welcome_text: string | null
          display_name: string | null
          document: string | null
          email: string | null
          favicon_url: string | null
          id: string
          legal_name: string | null
          logo_url: string | null
          max_architects: number | null
          max_products: number | null
          max_users: number | null
          name: string
          notes: string | null
          owner_user_id: string | null
          phone: string | null
          plan: string | null
          plan_id: string | null
          primary_color: string
          secondary_color: string
          slug: string
          state: string | null
          status: string
          storage_limit_mb: number | null
          text_color: string
          theme_mode: string
          updated_at: string
          updated_by: string | null
          website: string | null
        }
        Insert: {
          accent_color?: string
          background_color?: string
          city?: string | null
          cnpj?: string | null
          country?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          custom_welcome_text?: string | null
          display_name?: string | null
          document?: string | null
          email?: string | null
          favicon_url?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          max_architects?: number | null
          max_products?: number | null
          max_users?: number | null
          name: string
          notes?: string | null
          owner_user_id?: string | null
          phone?: string | null
          plan?: string | null
          plan_id?: string | null
          primary_color?: string
          secondary_color?: string
          slug: string
          state?: string | null
          status?: string
          storage_limit_mb?: number | null
          text_color?: string
          theme_mode?: string
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          accent_color?: string
          background_color?: string
          city?: string | null
          cnpj?: string | null
          country?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          custom_welcome_text?: string | null
          display_name?: string | null
          document?: string | null
          email?: string | null
          favicon_url?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          max_architects?: number | null
          max_products?: number | null
          max_users?: number | null
          name?: string
          notes?: string | null
          owner_user_id?: string | null
          phone?: string | null
          plan?: string | null
          plan_id?: string | null
          primary_color?: string
          secondary_color?: string
          slug?: string
          state?: string | null
          status?: string
          storage_limit_mb?: number | null
          text_color?: string
          theme_mode?: string
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          slug?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      price_search_index: {
        Row: {
          base_price: number | null
          brand_id: string | null
          brand_markup_percent: number | null
          brand_name: string | null
          category_id: string | null
          category_name: string | null
          currency: string | null
          dimensions: string | null
          finish_code: string | null
          finish_id: string | null
          finish_name: string | null
          finish_type: string | null
          markup_percent: number | null
          module: string | null
          price: number | null
          price_id: string | null
          product_id: string | null
          product_markup_percent: number | null
          product_name: string | null
          reference_code: string | null
          source_product_id: string | null
          source_reference: string | null
          tenant_id: string | null
          variation_code: string | null
          variation_id: string | null
          variation_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_table_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "price_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_table_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "price_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_table_finish_id_fkey"
            columns: ["finish_id"]
            isOneToOne: false
            referencedRelation: "price_finishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_table_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "price_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_table_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_table_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "price_product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_access_profile: {
        Args: { _profile_user_id: string; _viewer_id: string }
        Returns: boolean
      }
      can_access_project: { Args: { _project_id: string }; Returns: boolean }
      can_manage_operations: { Args: { _user_id: string }; Returns: boolean }
      check_rate_limit: {
        Args: {
          _action: string
          _actor_user_id?: string
          _block_seconds: number
          _ip_address?: unknown
          _max_hits: number
          _scope: string
          _window_seconds: number
        }
        Returns: Json
      }
      current_tenant_id: { Args: never; Returns: string }
      current_user_can_manage_store_users: {
        Args: { target_store_id: string }
        Returns: boolean
      }
      current_user_has_store_access: {
        Args: { target_store_id: string }
        Returns: boolean
      }
      current_user_id: { Args: never; Returns: string }
      current_user_is_store_admin: {
        Args: { target_store_id: string }
        Returns: boolean
      }
      current_user_role: { Args: { target_store_id: string }; Returns: string }
      current_user_store_ids: { Args: never; Returns: string[] }
      current_user_store_role: {
        Args: { target_store_id: string }
        Returns: string
      }
      get_shared_project_by_token: { Args: { _token: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_manager: { Args: { _user_id: string }; Returns: boolean }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
      is_architect: { Args: { _user_id: string }; Returns: boolean }
      is_manager: { Args: { _user_id: string }; Returns: boolean }
      is_master_admin: { Args: never; Returns: boolean }
      is_master_admin_user: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      is_seller: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      list_sellers: {
        Args: never
        Returns: {
          full_name: string
          user_id: string
        }[]
      }
      user_has_store_access: {
        Args: { target_store_id: string }
        Returns: boolean
      }
      user_has_store_role: {
        Args: { allowed_roles: string[]; target_store_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "vendedor" | "gestor" | "arquiteto"
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
      app_role: ["admin", "user", "vendedor", "gestor", "arquiteto"],
    },
  },
} as const
