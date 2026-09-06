import { Router, type IRouter, type Request, type Response } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, profiles } from "@workspace/db";
import {
  authenticateWithPassword,
  clearSessionCookie,
  getAuthenticatedProfile,
  isAllowedStatus,
  profilePayload,
  requireAdminProfile,
  setSessionCookie,
} from "../lib/auth";
import { getSupabaseError, supabaseRequest } from "../lib/supabase";

const router: IRouter = Router();
const publicRoles = ["TRAINEE", "TRAINER"] as const;
const accountStatuses = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"] as const;
type ManagedAccountStatus = (typeof accountStatuses)[number];

function isPublicRole(value: unknown): value is (typeof publicRoles)[number] {
  return publicRoles.includes(value as (typeof publicRoles)[number]);
}

function isManagedAccountStatus(value: unknown): value is ManagedAccountStatus {
  return accountStatuses.includes(value as ManagedAccountStatus);
}

function trainerApplicationPayload(profile: typeof profiles.$inferSelect) {
  return {
    ...profilePayload(profile),
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

router.post("/auth/signup", async (req, res) => {
  const { email, password, name, role } = req.body as {
    email?: string;
    password?: string;
    name?: string;
    role?: string;
  };
  if (!email || !password || password.length < 8 || !name?.trim() || !isPublicRole(role)) {
    res.status(400).json({ message: "Enter your name, a valid email, a password of at least 8 characters, and choose Trainee or Trainer." });
    return;
  }

  try {
    const { response, data } = await supabaseRequest<{
      id: string;
      email?: string;
      email_confirmed_at?: string | null;
      confirmation_sent_at?: string | null;
    }>("/auth/v1/signup", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), password, data: { display_name: name.trim() } }),
    });
    if (!response.ok || !data || !("id" in data)) {
      res.status(response.status === 422 ? 409 : 400).json({ message: getSupabaseError(data, "We could not create that account.") });
      return;
    }

    const emailVerified = Boolean(data.email_confirmed_at);
    await db.insert(profiles).values({
      id: data.id,
      email: (data.email ?? email).trim().toLowerCase(),
      fullName: name.trim(),
      role,
      status: role === "TRAINER" ? "PENDING" : "APPROVED",
      emailVerified,
    });

    res.status(201).json({
      needsEmailVerification: !emailVerified,
      status: role === "TRAINER" ? "PENDING" : "APPROVED",
      message: emailVerified
        ? role === "TRAINER" ? "Your trainer application is waiting for approval." : "Your account is ready."
        : "Check your inbox to verify your email before signing in.",
    });
  } catch (error) {
    req.log.error({ err: error }, "Signup failed");
    res.status(500).json({ message: "Account creation is temporarily unavailable." });
  }
});

async function login(req: Request, res: Response) {
  const { email, password, expectedRole } = req.body as { email?: string; password?: string; expectedRole?: string };
  if (!email || !password) {
    res.status(400).json({ message: "Enter your email and password." });
    return;
  }

  try {
    const auth = await authenticateWithPassword(email.trim().toLowerCase(), password);
    const profile = await db.query.profiles.findFirst({ where: eq(profiles.id, auth.user.id) });
    if (!profile) {
      clearSessionCookie(res);
      res.status(403).json({ message: "Your account is not provisioned for this workspace yet." });
      return;
    }
    if (expectedRole && profile.role !== expectedRole) {
      clearSessionCookie(res);
      res.status(403).json({ message: `This account is a ${profile.role.toLowerCase()} account. Use the matching sign-in.` });
      return;
    }
    if (!isAllowedStatus(profile.status)) {
      clearSessionCookie(res);
      res.status(403).json({
        status: profile.status,
        message: profile.status === "PENDING" ? "Your account is waiting for approval." : profile.status === "REJECTED" ? "Your account application was not approved." : "Your account is currently suspended.",
      });
      return;
    }
    setSessionCookie(res, auth);
    res.json({ user: profilePayload(profile) });
  } catch (error) {
    res.status(401).json({ message: error instanceof Error ? error.message : "We could not sign you in." });
  }
}

router.post("/auth/login", (req, res) => void login(req, res));
router.post("/auth/admin/login", (req, res) => {
  req.body = { ...req.body, expectedRole: "ADMIN" };
  void login(req, res);
});

router.get("/auth/admin/trainer-applications", async (req, res) => {
  try {
    const admin = await requireAdminProfile(req, res);
    if (!admin) return;

    const applications = await db
      .select()
      .from(profiles)
      .where(eq(profiles.role, "TRAINER"))
      .orderBy(desc(profiles.createdAt));

    res.json({ applications: applications.map(trainerApplicationPayload) });
  } catch (error) {
    req.log.error({ err: error }, "Trainer applications lookup failed");
    res.status(500).json({ message: "Trainer applications are temporarily unavailable." });
  }
});

router.get("/auth/admin/users", async (req, res) => {
  try {
    const admin = await requireAdminProfile(req, res);
    if (!admin) return;

    const users = await db
      .select()
      .from(profiles)
      .orderBy(desc(profiles.createdAt));

    res.json({ users: users.map(trainerApplicationPayload) });
  } catch (error) {
    req.log.error({ err: error }, "Admin user lookup failed");
    res.status(500).json({ message: "Users are temporarily unavailable." });
  }
});

router.patch("/auth/admin/users/:id/status", async (req, res) => {
  try {
    const admin = await requireAdminProfile(req, res);
    if (!admin) return;

    const { id } = req.params;
    const { status } = req.body as { status?: unknown };
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      res.status(400).json({ message: "That user id is invalid." });
      return;
    }
    if (!isManagedAccountStatus(status) || status === "PENDING") {
      res.status(400).json({ message: "Choose Approved, Rejected, or Suspended." });
      return;
    }
    if (id === admin.id) {
      res.status(400).json({ message: "You cannot change your own administrator status." });
      return;
    }

    const [updatedProfile] = await db
      .update(profiles)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(profiles.id, id), eq(profiles.role, "TRAINEE")))
      .returning();

    if (!updatedProfile) {
      res.status(404).json({ message: "Trainee not found." });
      return;
    }

    req.log.info({ userId: id, status }, "Trainee account status changed");
    res.json({ user: trainerApplicationPayload(updatedProfile) });
  } catch (error) {
    req.log.error({ err: error }, "Admin user status change failed");
    res.status(500).json({ message: "We could not update that user." });
  }
});

router.patch("/auth/admin/trainer-applications/:id/status", async (req, res) => {
  try {
    const admin = await requireAdminProfile(req, res);
    if (!admin) return;

    const { id } = req.params;
    const { status } = req.body as { status?: unknown };
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      res.status(400).json({ message: "That trainer application id is invalid." });
      return;
    }
    if (!isManagedAccountStatus(status)) {
      res.status(400).json({ message: "Choose a valid account status." });
      return;
    }

    const [updatedProfile] = await db
      .update(profiles)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(profiles.id, id), eq(profiles.role, "TRAINER")))
      .returning();

    if (!updatedProfile) {
      res.status(404).json({ message: "Trainer application not found." });
      return;
    }

    req.log.info({ trainerId: id, status }, "Trainer application status changed");
    res.json({ application: trainerApplicationPayload(updatedProfile) });
  } catch (error) {
    req.log.error({ err: error }, "Trainer application status change failed");
    res.status(500).json({ message: "We could not update that trainer application." });
  }
});

router.get("/auth/me", async (req, res) => {
  try {
    const profile = await getAuthenticatedProfile(req, res);
    if (!profile || !isAllowedStatus(profile.status)) {
      if (profile && !isAllowedStatus(profile.status)) clearSessionCookie(res);
      res.status(401).json({ message: "Sign in required." });
      return;
    }
    res.json({ user: profilePayload(profile) });
  } catch (error) {
    req.log.error({ err: error }, "Session lookup failed");
    res.status(401).json({ message: "Sign in required." });
  }
});

router.post("/auth/logout", (_req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

export default router;