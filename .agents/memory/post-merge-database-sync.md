---
name: Post-merge database sync
description: Environment-specific guidance for keeping automatic Drizzle setup reliable after task merges.
---

When a schema object already exists in the development database, give it an explicit stable name in the Drizzle schema. Automatic post-merge setup must use non-interactive dependency installation and schema synchronization.

**Why:** Drizzle can detect an unnamed constraint as a new object when PostgreSQL already has the equivalent constraint under a different generated name. Its repair prompt requires a TTY and otherwise produces misleading output during automated setup.

**How to apply:** Keep `scripts/post-merge.sh` non-interactive, use the workspace package name for database scripts, and explicitly name constraints that were created before Drizzle managed them.