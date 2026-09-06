import { eq } from "drizzle-orm";
import { db, pool, profiles } from "@workspace/db";

function emailArgument(): string {
  const index = process.argv.indexOf("--email");
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value) throw new Error("Usage: pnpm --filter @workspace/scripts run verify-admin -- --email you@example.com");
  return value.trim().toLowerCase();
}

async function main() {
  const email = emailArgument();
  const profile = await db.query.profiles.findFirst({ where: eq(profiles.email, email) });
  if (!profile) {
    console.log(JSON.stringify({ found: false, email }, null, 2));
    return;
  }

  console.log(JSON.stringify({
    found: true,
    id: profile.id,
    email: profile.email,
    role: profile.role,
    status: profile.status,
    emailVerified: profile.emailVerified,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Admin verification failed.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });