#!/bin/sh
set +e
npx prisma migrate deploy
pnpm run db:seed
pnpm start
