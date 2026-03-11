export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          email: string | null;
          full_name: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          email?: string | null;
          full_name?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          email?: string | null;
          full_name?: string | null;
        };
        Relationships: [];
      };
      classes: {
        Row: {
          id: string;
          teacher_id: string;
          created_at: string;
          updated_at: string;
          title: string;
          section: string | null;
          period_label: string | null;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          created_at?: string;
          updated_at?: string;
          title: string;
          section?: string | null;
          period_label?: string | null;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          created_at?: string;
          updated_at?: string;
          title?: string;
          section?: string | null;
          period_label?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "classes_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      assignments: {
        Row: {
          id: string;
          teacher_id: string;
          class_id: string;
          created_at: string;
          updated_at: string;
          title: string;
          summary: string;
          due_date: string | null;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          class_id: string;
          created_at?: string;
          updated_at?: string;
          title: string;
          summary?: string;
          due_date?: string | null;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          class_id?: string;
          created_at?: string;
          updated_at?: string;
          title?: string;
          summary?: string;
          due_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "assignments_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assignments_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
        ];
      };
      learning_objectives: {
        Row: {
          id: string;
          teacher_id: string;
          created_at: string;
          updated_at: string;
          title: string;
          description: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          created_at?: string;
          updated_at?: string;
          title: string;
          description?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          created_at?: string;
          updated_at?: string;
          title?: string;
          description?: string;
        };
        Relationships: [
          {
            foreignKeyName: "learning_objectives_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      assignment_objectives: {
        Row: {
          id: string;
          teacher_id: string;
          assignment_id: string;
          objective_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          assignment_id: string;
          objective_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          assignment_id?: string;
          objective_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assignment_objectives_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assignment_objectives_assignment_id_fkey";
            columns: ["assignment_id"];
            isOneToOne: false;
            referencedRelation: "assignments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assignment_objectives_objective_id_fkey";
            columns: ["objective_id"];
            isOneToOne: false;
            referencedRelation: "learning_objectives";
            referencedColumns: ["id"];
          },
        ];
      };
      analysis_runs: {
        Row: {
          id: string;
          teacher_id: string;
          assignment_id: string;
          created_at: string;
          provider: string;
          status: "pending" | "completed" | "failed";
          started_at: string | null;
          completed_at: string | null;
          error_message: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          assignment_id: string;
          created_at?: string;
          provider?: string;
          status?: "pending" | "completed" | "failed";
          started_at?: string | null;
          completed_at?: string | null;
          error_message?: string | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          assignment_id?: string;
          created_at?: string;
          provider?: string;
          status?: "pending" | "completed" | "failed";
          started_at?: string | null;
          completed_at?: string | null;
          error_message?: string | null;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "analysis_runs_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "analysis_runs_assignment_id_fkey";
            columns: ["assignment_id"];
            isOneToOne: false;
            referencedRelation: "assignments";
            referencedColumns: ["id"];
          },
        ];
      };
      error_patterns: {
        Row: {
          id: string;
          teacher_id: string;
          assignment_id: string;
          analysis_run_id: string | null;
          objective_id: string | null;
          created_at: string;
          updated_at: string;
          title: string;
          description: string;
          students_affected: number;
          affected_student_ids: Json;
          dismissed_at: string | null;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          assignment_id: string;
          analysis_run_id?: string | null;
          objective_id?: string | null;
          created_at?: string;
          updated_at?: string;
          title: string;
          description?: string;
          students_affected?: number;
          affected_student_ids?: Json;
          dismissed_at?: string | null;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          assignment_id?: string;
          analysis_run_id?: string | null;
          objective_id?: string | null;
          created_at?: string;
          updated_at?: string;
          title?: string;
          description?: string;
          students_affected?: number;
          affected_student_ids?: Json;
          dismissed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "error_patterns_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "error_patterns_assignment_id_fkey";
            columns: ["assignment_id"];
            isOneToOne: false;
            referencedRelation: "assignments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "error_patterns_analysis_run_id_fkey";
            columns: ["analysis_run_id"];
            isOneToOne: false;
            referencedRelation: "analysis_runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "error_patterns_objective_id_fkey";
            columns: ["objective_id"];
            isOneToOne: false;
            referencedRelation: "learning_objectives";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type SupabaseTableName = keyof Database["public"]["Tables"];
