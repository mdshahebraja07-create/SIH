import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db, profiles, type Profile } from "@workspace/db";
import { getSupabaseError, supabaseRequest } from "./supabase";

export type AppRole = "TRAINEE" | "TRAINER" | "ADMIN";
export type AccountStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

type SupabaseAuthResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: { id: string; email?: string; email_confirmed_at?: string | null };
};

type SupabaseUser = {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
};

type SessionCookie = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

const COOKIE_NAME = "capacity_connect_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET must be configured.");
  return secret;
}

function sign(value: string): string {
  return createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function encodeSession(session: SessionCookie): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(value: string | undefined): SessionCookie | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  if (signature.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionCookie;
    if (!parsed.accessToken || !parsed.refreshToken || !Number.isFinite(parsed.expiresAt)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(header.split(";").flatMap((part) => {
    const separator = part.indexOf("=");
    if (separator < 0) return [];
    return [[part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim())]];
  }));
}

export function setSessionCookie(res: Response, auth: SupabaseAuthResponse): void {
  const session: SessionCookie = {
    accessToken: auth.access_token,
    refreshToken: auth.refresh_token,
    expiresAt: Date.now() + Math.max(auth.expires_in - 30, 30) * 1000,
  };
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${encodeURIComponent(encodeSession(session))}; Max-Age=${SESSION_TTL_SECONDS}; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
}

export function clearSessionCookie(res: Response): void {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
}

async function refreshSession(session: SessionCookie): Promise<SupabaseAuthResponse | null> {
  const { response, data } = await supabaseRequest<SupabaseAuthResponse>(
    "/auth/v1/token?grant_type=refresh_token",
    { method: "POST", body: JSON.stringify({ refresh_token: session.refreshToken }) },
  );
  return response.ok && data && "access_token" in data ? data : null;
}

async function getSupabaseUser(accessToken: string): Promise<SupabaseUser | null> {
  const { response, data } = await supabaseRequest<SupabaseUser>("/auth/v1/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return response.ok && data && "id" in data ? data : null;
}

export async function getAuthenticatedProfile(req: Request, res: Response): Promise<Profile | null> {
  const cookies = parseCookies(req.headers.cookie);
  let session = decodeSession(cookies[COOKIE_NAME]);
  if (!session) return null;

  if (session.expiresAt <= Date.now()) {
    const refreshed = await refreshSession(session);
    if (!refreshed) {
      clearSessionCookie(res);
      return null;
    }
    setSessionCookie(res, refreshed);
    session = {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      expiresAt: Date.now() + Math.max(refreshed.expires_in - 30, 30) * 1000,
    };
  }

  const user = await getSupabaseUser(session.accessToken);
  if (!user) {
    clearSessionCookie(res);
    return null;
  }

  const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, user.id) });
  if (!profile) return null;
  return profile;
}

export async function requireAdminProfile(req: Request, res: Response): Promise<Profile | null> {
  const profile = await getAuthenticatedProfile(req, res);
  if (!profile) {
    res.status(401).json({ message: "Sign in required." });
    return null;
  }
  if (!isAllowedStatus(profile.status)) {
    clearSessionCookie(res);
    res.status(401).json({ message: "Your account is not active." });
    return null;
  }
  if (profile.role !== "ADMIN") {
    res.status(403).json({ message: "Administrator access is required." });
    return null;
  }
  return profile;
}

export function profilePayload(profile: Profile) {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.fullName,
    role: profile.role,
    status: profile.status,
    location: profile.location,
    bio: profile.bio,
    skills: profile.skills,
    emailVerified: profile.emailVerified,
  };
}

export function isAllowedStatus(status: AccountStatus): boolean {
  return status === "APPROVED";
}

export async function authenticateWithPassword(email: string, password: string): Promise<SupabaseAuthResponse> {
  const { response, data } = await supabaseRequest<SupabaseAuthResponse>(
    "/auth/v1/token?grant_type=password",
    { method: "POST", body: JSON.stringify({ email, password }) },
  );
  if (!response.ok || !data || !("access_token" in data)) {
    throw new Error(getSupabaseError(data, "We could not sign you in with those details."));
  }
  return data;
}
