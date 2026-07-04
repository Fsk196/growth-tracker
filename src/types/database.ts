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
      boards: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      field_definitions: {
        Row: {
          board_id: string
          created_at: string
          field_key: string
          field_type: string
          id: string
          label: string
          select_options: Json | null
        }
        Insert: {
          board_id: string
          created_at?: string
          field_key: string
          field_type: string
          id?: string
          label: string
          select_options?: Json | null
        }
        Update: {
          board_id?: string
          created_at?: string
          field_key?: string
          field_type?: string
          id?: string
          label?: string
          select_options?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "field_definitions_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      learnings: {
        Row: {
          applied_in_task_id: string | null
          board_id: string
          created_at: string
          date: string
          id: string
          source: string | null
          still_fuzzy_on: string | null
          topic: string
          understood: string | null
          user_id: string
        }
        Insert: {
          applied_in_task_id?: string | null
          board_id: string
          created_at?: string
          date?: string
          id?: string
          source?: string | null
          still_fuzzy_on?: string | null
          topic: string
          understood?: string | null
          user_id: string
        }
        Update: {
          applied_in_task_id?: string | null
          board_id?: string
          created_at?: string
          date?: string
          id?: string
          source?: string | null
          still_fuzzy_on?: string | null
          topic?: string
          understood?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learnings_applied_in_task_id_fkey"
            columns: ["applied_in_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learnings_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          board_id: string
          color: string | null
          created_at: string
          id: string
          name: string
          status: string
          user_id: string
        }
        Insert: {
          board_id: string
          color?: string | null
          created_at?: string
          id?: string
          name: string
          status?: string
          user_id: string
        }
        Update: {
          board_id?: string
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_gap_history: {
        Row: {
          id: string
          recorded_at: string
          score: number
          skill_gap_id: string
        }
        Insert: {
          id?: string
          recorded_at?: string
          score: number
          skill_gap_id: string
        }
        Update: {
          id?: string
          recorded_at?: string
          score?: number
          skill_gap_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_gap_history_skill_gap_id_fkey"
            columns: ["skill_gap_id"]
            isOneToOne: false
            referencedRelation: "skill_gaps"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_gaps: {
        Row: {
          board_id: string
          created_at: string
          current_level_desc: string | null
          current_score: number
          id: string
          last_reviewed_date: string
          skill_area: string
          target_level_desc: string | null
          user_id: string
        }
        Insert: {
          board_id: string
          created_at?: string
          current_level_desc?: string | null
          current_score: number
          id?: string
          last_reviewed_date?: string
          skill_area: string
          target_level_desc?: string | null
          user_id: string
        }
        Update: {
          board_id?: string
          created_at?: string
          current_level_desc?: string | null
          current_score?: number
          id?: string
          last_reviewed_date?: string
          skill_area?: string
          target_level_desc?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_gaps_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          board_id: string
          created_at: string
          custom_fields: Json
          date: string
          id: string
          impact: string | null
          project_id: string | null
          time_spent: number | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          board_id: string
          created_at?: string
          custom_fields?: Json
          date?: string
          id?: string
          impact?: string | null
          project_id?: string | null
          time_spent?: number | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          board_id?: string
          created_at?: string
          custom_fields?: Json
          date?: string
          id?: string
          impact?: string | null
          project_id?: string | null
          time_spent?: number | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      wins: {
        Row: {
          board_id: string
          created_at: string
          date: string
          id: string
          linked_task_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          board_id: string
          created_at?: string
          date?: string
          id?: string
          linked_task_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          board_id?: string
          created_at?: string
          date?: string
          id?: string
          linked_task_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wins_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wins_linked_task_id_fkey"
            columns: ["linked_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aggregate_tasks: {
        Args: {
          p_agg?: string
          p_board_id: string
          p_group_by_field?: string
          p_group_by_is_custom?: boolean
          p_project_id?: string
          p_x_field: string
          p_x_is_custom?: boolean
          p_y_field?: string
          p_y_is_custom?: boolean
        }
        Returns: {
          agg_value: number
          group_value: string
          x_value: string
        }[]
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
