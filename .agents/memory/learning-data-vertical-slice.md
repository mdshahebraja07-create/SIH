---
name: Learning data vertical slice
description: Durable decisions for course enrollment, progress, activity, and streak persistence.
---

Course catalog and trainee learning state are server-owned. Learning activity is deduplicated by user, UTC activity date, activity type, entity type, and entity ID; streaks are calculated from distinct UTC dates rather than page views or client counters.

**Why:** The product must replace demo counters with auditable learning signals while remaining consistent across browsers and time zones.

**How to apply:** New trainee progress, lesson, assessment, and resource events should use the same activity deduplication key and UTC date convention, and summary metrics should be derived from persisted rows.