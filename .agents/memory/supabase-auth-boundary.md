---
name: Supabase auth boundary
description: The current connected Supabase capability and the safe boundary for identity versus application permissions.
---

Use Supabase Auth as the identity provider, but do not treat client-editable user metadata as an authorization source. The connected project currently exposes authenticated Auth/PostgREST access, while its public profile table and schema-administration path are not available through the attached connection. Until a supported migration/admin channel is provisioned, keep role and account status in the server-owned application database and enforce them in API handlers.

**Why:** The project had email Auth enabled, but PostgREST reported no public profiles table and the Auth admin endpoint rejected the attached key. Creating a browser-controlled role claim would undermine the requested server-side authorization.

**How to apply:** Do not claim Row Level Security is active or move permission checks into user metadata. When Supabase schema administration becomes available, migrate profiles and policies deliberately, then update the server boundary in one change.