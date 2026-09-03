import { ReplitConnectors } from "@replit/connectors-sdk";

const connectors = new ReplitConnectors();

export type SupabaseError = {
  message?: string;
  msg?: string;
  error_description?: string;
  error_code?: string;
};

export async function supabaseRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ response: Response; data: T | SupabaseError | null }> {
  const extraHeaders = init.headers instanceof Headers
    ? Object.fromEntries(init.headers.entries())
    : (init.headers as Record<string, string> | undefined) ?? {};
  const response = await connectors.proxy("supabase", path, {
    method: init.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...extraHeaders,
    },
    body: init.body,
  });

  const text = await response.text();
  if (!text) return { response, data: null };

  try {
    return { response, data: JSON.parse(text) as T | SupabaseError };
  } catch {
    return { response, data: null };
  }
}

export function getSupabaseError(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const error = data as SupabaseError;
  return error.error_description ?? error.message ?? error.msg ?? fallback;
}