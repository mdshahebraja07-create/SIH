#!/bin/bash
set -e
pnpm install --no-frozen-lockfile --reporter append-only
pnpm --filter @workspace/db run push-force
