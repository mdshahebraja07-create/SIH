---
name: Capacity Connect demo scope
description: Product and implementation boundary for the current Capacity Connect learning-platform demo.
---

The Capacity Connect experience is currently a frontend-first demonstration of the end-to-end trainee, trainer, and admin story. It uses local React state for immediate interactions and keeps real authentication, shared persistence, and protected backend workflows outside the demo scope.

**Why:** This lets the product brief be explored through working role-based flows without implying that local demo data is production-safe or multi-user.

**How to apply:** Preserve the explainable learning and competency journeys in the UI; add backend persistence and access control as a deliberate next phase rather than quietly mixing demo state with production assumptions.