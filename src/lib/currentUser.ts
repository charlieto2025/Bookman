import { db } from "@/lib/db";

// No auth system yet - every request acts as this single seeded user.
// The data model is already multi-tenant (everything is scoped by userId),
// so swapping this out for real sessions later doesn't require a schema change.
const DEFAULT_USER_EMAIL = process.env.DEFAULT_USER_EMAIL ?? "writer@bookman.local";

export async function getCurrentUser() {
  return db.user.upsert({
    where: { email: DEFAULT_USER_EMAIL },
    update: {},
    create: { email: DEFAULT_USER_EMAIL, name: "Writer" },
  });
}
