import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role", { enum: ["TRAINEE", "TRAINER", "ADMIN"] }).notNull(),
  status: text("status", { enum: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"] }).notNull(),
  location: text("location").notNull().default(""),
  bio: text("bio").notNull().default(""),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;