/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_CLASSROOM_PROVIDER?: "mock" | "supabase";
  readonly VITE_LMS_PROVIDER?: "mock" | "google_classroom";
  readonly VITE_GOOGLE_CLASSROOM_CLIENT_ID?: string;
  readonly VITE_GOOGLE_CLASSROOM_API_BASE_URL?: string;
  readonly VITE_GOOGLE_CLASSROOM_SCOPES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
