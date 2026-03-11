import { getCurrentSession } from "@/lib/auth";

export async function getGoogleAccessToken(): Promise<string | null> {
  const { data, error } = await getCurrentSession();

  if (error) {
    throw error;
  }

  return data.session?.provider_token ?? null;
}
