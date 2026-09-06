---
name: Supabase auth boundary
description: The current connected Supabase capability and the safe boundary for identity versus application permissions.
---

Use Supabase Auth as the identity provider, but do not treat client-editable user metadata as an authorization source. Supabase Auth is accessed through the attached Replit connector, while application schema and role/status remain in the server-owned Replit PostgreSQL database. Keep authorization in API handlers.

**Why:** The first-admin bootstrap cannot run until the Supabase connector is attached, and the signup flow may require email confirmation before password login succeeds. Creating a browser-controlled role claim would undermine server-side authorization.

**How to apply:** Do not claim Row Level Security is active or move permission checks into user metadata. Use the one-time bootstrap only with temporary Replit Secrets, disable its guard afterward, and verify `profiles.role/status` from PostgreSQL.