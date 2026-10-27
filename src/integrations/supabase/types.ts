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
      daily_prompts: {
        Row: {
          category: string
          created_at: string
          id: number
          is_active: boolean
          prompt_text: string
          sequence: number
        }
        Insert: {
          category: string
          created_at?: string
          id?: number
          is_active?: boolean
          prompt_text: string
          sequence: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: number
          is_active?: boolean
          prompt_text?: string
          sequence?: number
        }
        Relationships: []
      }
      match_history: {
        Row: {
          created_at: string
          id: string
          matched_user_id: string | null
          open_feedback: string | null
          separation_category: string
          thread_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          matched_user_id?: string | null
          open_feedback?: string | null
          separation_category: string
          thread_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          matched_user_id?: string | null
          open_feedback?: string | null
          separation_category?: string
          thread_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      match_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
          thread_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "match_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      match_settings: {
        Row: {
          baseline_weight: number
          counterweight_target: number
          daily_weight: number
          height_bonus: number
          id: number
          intent_bonus: number
          max_matches_per_user: number
          repeat_cooldown_days: number
        }
        Insert: {
          baseline_weight?: number
          counterweight_target?: number
          daily_weight?: number
          height_bonus?: number
          id?: number
          intent_bonus?: number
          max_matches_per_user?: number
          repeat_cooldown_days?: number
        }
        Update: {
          baseline_weight?: number
          counterweight_target?: number
          daily_weight?: number
          height_bonus?: number
          id?: number
          intent_bonus?: number
          max_matches_per_user?: number
          repeat_cooldown_days?: number
        }
        Relationships: []
      }
      match_threads: {
        Row: {
          created_at: string
          drop_date: string
          ended_at: string | null
          ended_by: string | null
          id: string
          status: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          drop_date: string
          ended_at?: string | null
          ended_by?: string | null
          id?: string
          status?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          drop_date?: string
          ended_at?: string | null
          ended_by?: string | null
          id?: string
          status?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          drop_date: string
          id: string
          matched_user_id: string
          partner_status: string
          score: number
          similarity_score: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          drop_date: string
          id?: string
          matched_user_id: string
          partner_status?: string
          score: number
          similarity_score: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          drop_date?: string
          id?: string
          matched_user_id?: string
          partner_status?: string
          score?: number
          similarity_score?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      matching_preferences: {
        Row: {
          balance: string
          campus_lock: boolean
          created_at: string
          id: string
          intention: string | null
          pause_matching: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: string
          campus_lock?: boolean
          created_at?: string
          id?: string
          intention?: string | null
          pause_matching?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: string
          campus_lock?: boolean
          created_at?: string
          id?: string
          intention?: string | null
          pause_matching?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          baseline_embedding: string | null
          campus_hub: string | null
          created_at: string
          display_name: string | null
          gender: string | null
          height_in: number | null
          id: string
          seed_prompts: Json | null
          target_preference: string | null
          updated_at: string
        }
        Insert: {
          baseline_embedding?: string | null
          campus_hub?: string | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          height_in?: number | null
          id: string
          seed_prompts?: Json | null
          target_preference?: string | null
          updated_at?: string
        }
        Update: {
          baseline_embedding?: string | null
          campus_hub?: string | null
          created_at?: string
          display_name?: string | null
          gender?: string | null
          height_in?: number | null
          id?: string
          seed_prompts?: Json | null
          target_preference?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prompt_responses: {
        Row: {
          answer_embedding: string | null
          created_at: string
          drop_date: string | null
          embedding: string | null
          id: number
          prompt_id: number | null
          response_text: string
          user_id: string
        }
        Insert: {
          answer_embedding?: string | null
          created_at?: string
          drop_date?: string | null
          embedding?: string | null
          id?: number
          prompt_id?: number | null
          response_text: string
          user_id: string
        }
        Update: {
          answer_embedding?: string | null
          created_at?: string
          drop_date?: string | null
          embedding?: string | null
          id?: number
          prompt_id?: number | null
          response_text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_responses_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "daily_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
    }
    Functions: {
      balance_fit: {
        Args: { balance: string; sim: number; target: number }
        Returns: number
      }
      current_drop_date: { Args: never; Returns: string }
      end_connection: {
        Args: { p_note: string; p_reason: string; p_thread: string }
        Returns: undefined
      }
      expire_old_matches: { Args: { p_drop: string }; Returns: undefined }
      gender_fits: { Args: { gender: string; pref: string }; Returns: boolean }
      generate_nightly_matches: { Args: { p_drop: string }; Returns: number }
      get_current_prompt: {
        Args: never
        Returns: {
          category: string
          drop_date: string
          id: number
          prompt_text: string
        }[]
      }
      get_my_matches: {
        Args: never
        Returns: {
          balance: string
          campus_hub: string
          daily_answer: string
          date_of_birth: string
          display_name: string
          drop_date: string
          height_in: number
          intention: string
          match_id: string
          matched_user_id: string
          my_answer: string
          partner_status: string
          prompt_text: string
          seed_prompts: Json
          similarity_score: number
          status: string
          thread_id: string
          unread_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_thread_member: {
        Args: { _thread: string; _user: string }
        Returns: boolean
      }
      mark_thread_read: { Args: { p_thread: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
