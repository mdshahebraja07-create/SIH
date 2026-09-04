import { boolean, date, integer, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique("profiles_email_key"),
  fullName: text("full_name").notNull(),
  role: text("role", { enum: ["TRAINEE", "TRAINER", "ADMIN"] }).notNull(),
  status: text("status", { enum: ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"] }).notNull(),
  location: text("location").notNull().default(""),
  bio: text("bio").notNull().default(""),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  emailVerified: boolean("email_verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export const courses = pgTable("courses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  level: text("level").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(0),
  lessons: integer("lessons").notNull().default(0),
  description: text("description").notNull(),
  trainerName: text("trainer_name").notNull(),
  trainerInitials: text("trainer_initials").notNull(),
  color: text("color").notNull(),
  accent: text("accent").notNull(),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  status: text("status", { enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] }).notNull().default("PUBLISHED"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export const courseEnrollments = pgTable("course_enrollments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  progress: integer("progress").notNull().default(0),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => ({
  userCourseUnique: unique("course_enrollments_user_course_key").on(table.userId, table.courseId),
}));

export const learningActivity = pgTable("learning_activity", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  activityDate: date("activity_date").notNull(),
  activityType: text("activity_type", {
    enum: ["LESSON_COMPLETED", "COURSE_PROGRESS", "ASSESSMENT_COMPLETED", "RESOURCE_ACCESSED"],
  }).notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  dedupeKey: unique("learning_activity_dedupe_key").on(
    table.userId,
    table.activityDate,
    table.activityType,
    table.entityType,
    table.entityId,
  ),
}));

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type LearningActivity = typeof learningActivity.$inferSelect;