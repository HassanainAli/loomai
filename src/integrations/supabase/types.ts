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
      admin_actions: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json
          id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json
          id?: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json
          id?: string
        }
        Relationships: []
      }
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
      loom_plus_members: {
        Row: {
          granted_at: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          user_id: string
        }
        Update: {
          granted_at?: string
          user_id?: string
        }
        Relationships: []
      }
      match_drop_runs: {
        Row: {
          drop_date: string
          id: string
          outcome: string
          pairs_created: number | null
          started_at: string
          triggered_by: string
        }
        Insert: {
          drop_date: string
          id?: string
          outcome: string
          pairs_created?: number | null
          started_at?: string
          triggered_by: string
        }
        Update: {
          drop_date?: string
          id?: string
          outcome?: string
          pairs_created?: number | null
          started_at?: string
          triggered_by?: string
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
          source: string
          thread_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          matched_user_id?: string | null
          open_feedback?: string | null
          separation_category: string
          source?: string
          thread_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          matched_user_id?: string | null
          open_feedback?: string | null
          separation_category?: string
          source?: string
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
          engine_paused: boolean
          feedback_decay_days: number
          feedback_focus_boost: number
          feedback_penalty_weight: number
          height_bonus: number
          id: number
          intent_bonus: number
          max_matches_per_user: number
          min_campus_participants: number
          repeat_cooldown_days: number
        }
        Insert: {
          baseline_weight?: number
          counterweight_target?: number
          daily_weight?: number
          engine_paused?: boolean
          feedback_decay_days?: number
          feedback_focus_boost?: number
          feedback_penalty_weight?: number
          height_bonus?: number
          id?: number
          intent_bonus?: number
          max_matches_per_user?: number
          min_campus_participants?: number
          repeat_cooldown_days?: number
        }
        Update: {
          baseline_weight?: number
          counterweight_target?: number
          daily_weight?: number
          engine_paused?: boolean
          feedback_decay_days?: number
          feedback_focus_boost?: number
          feedback_penalty_weight?: number
          height_bonus?: number
          id?: number
          intent_bonus?: number
          max_matches_per_user?: number
          min_campus_participants?: number
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
          last_activity_at: string
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
          last_activity_at?: string
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
          last_activity_at?: string
          status?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          base_sim: number | null
          created_at: string
          drop_date: string
          feedback_penalty: number | null
          id: string
          matched_user_id: string
          partner_status: string
          score: number
          similarity_score: number
          status: string
          style_fit: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          base_sim?: number | null
          created_at?: string
          drop_date: string
          feedback_penalty?: number | null
          id?: string
          matched_user_id: string
          partner_status?: string
          score: number
          similarity_score: number
          status?: string
          style_fit?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          base_sim?: number | null
          created_at?: string
          drop_date?: string
          feedback_penalty?: number | null
          id?: string
          matched_user_id?: string
          partner_status?: string
          score?: number
          similarity_score?: number
          status?: string
          style_fit?: number | null
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
          is_test_account: boolean
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
          is_test_account?: boolean
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
          is_test_account?: boolean
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
      admin_get_stats: { Args: never; Returns: Json }
      admin_log_action: {
        Args: { p_action: string; p_details: Json }
        Returns: undefined
      }
      admin_run_drop_now: { Args: never; Returns: number }
      admin_set_campus_minimum: { Args: { p_min: number }; Returns: undefined }
      admin_set_engine_paused: {
        Args: { p_paused: boolean }
        Returns: undefined
      }
      admin_set_loom_plus: {
        Args: { p_email: string; p_on: boolean }
        Returns: string
      }
      auto_end_stale_threads: { Args: never; Returns: number }
      balance_fit: {
        Args: { balance: string; sim: number; target: number }
        Returns: number
      }
      campus_participant_count: { Args: { p_campus: string }; Returns: number }
      current_drop_date: { Args: never; Returns: string }
      end_connection: {
        Args: { p_note: string; p_reason: string; p_thread: string }
        Returns: undefined
      }
      expire_old_matches: { Args: { p_drop: string }; Returns: undefined }
      gender_fits: { Args: { gender: string; pref: string }; Returns: boolean }
      generate_nightly_matches: { Args: { p_drop: string }; Returns: number }
      generate_nightly_matches_wrapped: {
        Args: { p_drop: string }
        Returns: number
      }
      get_campus_status: {
        Args: never
        Returns: {
          campus: string
          participants: number
          threshold: number
          unlocked: boolean
        }[]
      }
      get_current_prompt: {
        Args: never
        Returns: {
          category: string
          drop_date: string
          id: number
          prompt_text: string
        }[]
      }
      get_drop_state: {
        Args: never
        Returns: {
          answered_today: boolean
          had_match_last_drop: boolean
          in_active_chat: boolean
        }[]
      }
      get_match_diagnostics: {
        Args: { p_match: string }
        Returns: {
          base_sim: number
          daily_sim: number
          score: number
          style_fit: number
          unlocked: boolean
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
      log_recalibration: { Args: { p_reason: string }; Returns: undefined }
      mark_thread_read: { Args: { p_thread: string }; Returns: undefined }
      require_admin: { Args: never; Returns: undefined }
      respond_to_match: {
        Args: { p_action: string; p_match: string }
        Returns: string
      }
      run_drop: { Args: { p_drop: string; p_trigger: string }; Returns: number }
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
