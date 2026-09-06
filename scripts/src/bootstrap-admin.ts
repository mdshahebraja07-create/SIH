import { ReplitConnectors } from "@replit/connectors-sdk";
import { eq } from "drizzle-orm";
import { db, pool, profiles } from "@workspace/db";

type SupabaseSignupResponse = {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
};

type SupabaseError = {
  message?: string;
  msg?: string;
  error_description?: string;
};

const connectors = new ReplitConnectors();

function requiredSecret(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be set as a Replit Secret for this one-time command.`);
  return value;
}

function errorMessage(data: unknown): string {
  if (!data || typeof data !== "object") return "Supabase did not create the account.";
  const error = data as SupabaseError;
  return error.error_description ?? error.message ?? error.msg ?? "Supabase did not create the account.";
}

async function main() {
  if (process.env.ADMIN_BOOTSTRAP_ENABLED !== "true") {
    throw new Error("Set ADMIN_BOOTSTRAP_ENABLED=true only while running this one-time command.");
  }

  const email = requiredSecret("ADMIN_BOOTSTRAP_EMAIL").toLowerCase();
  const password = requiredSecret("ADMIN_BOOTSTRAP_PASSWORD");
  const fullName = process.env.ADMIN_BOOTSTRAP_NAME?.trim() || "Capacity Connect Admin";

  if (password.length < 8) throw new Error("ADMIN_BOOTSTRAP_PASSWORD must be at least 8 characters.");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("ADMIN_BOOTSTRAP_EMAIL must be a valid email address.");

  const existingAdmin = await db.query.profiles.findFirst({ where: eq(profiles.role, "ADMIN") });
  if (existingAdmin) {
    throw new Error("An ADMIN profile already exists. The one-time bootstrap will not create or promote another account.");
  }

  const existingProfile = await db.query.profiles.findFirst({ where: eq(profiles.email, email) });
  if (existingProfile) {
    throw new Error("That email already has an application profile. The bootstrap will not promote an existing account.");
  }

  const response = await connectors.proxy("supabase", "/auth/v1/signup", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, data: { display_name: fullName } }),
  });
  const text = await response.text();
  const data = text ? (JSON.parse(text) as SupabaseSignupResponse | SupabaseError) : null;

  if (!response.ok || !data || !("id" in data)) {
    throw new Error(`Supabase signup failed (${response.status}): ${errorMessage(data)}`);
  }

  await db.insert(profiles).values({
    id: data.id,
    email: (data.email ?? email).toLowerCase(),
    fullName,
    role: "ADMIN",
    status: "APPROVED",
    emailVerified: Boolean(data.email_confirmed_at),
  });

  console.log(`Admin profile provisioned for ${email}.`);
  console.log(`Supabase email verification required: ${!data.email_confirmed_at}.`);
  console.log("Remove ADMIN_BOOTSTRAP_ENABLED, ADMIN_BOOTSTRAP_EMAIL, ADMIN_BOOTSTRAP_PASSWORD, and ADMIN_BOOTSTRAP_NAME from Replit after this command.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Admin bootstrap failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });