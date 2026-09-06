import { sql } from "drizzle-orm";
import { boolean, check, date, integer, index, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

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
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export const courseStatusEnum = pgEnum("course_status", ["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const contentTypeEnum = pgEnum("content_type", ["VIDEO", "PDF", "PRESENTATION", "DOCUMENT", "LINK"]);
export const uploadStatusEnum = pgEnum("upload_status", ["UPLOADING", "SUCCESS", "FAILED"]);
export const assessmentStatusEnum = pgEnum("assessment_status", ["DRAFT", "PUBLISHED", "CLOSED"]);
export const attemptStatusEnum = pgEnum("attempt_status", ["IN_PROGRESS", "SUBMITTED", "GRADED"]);
export const verificationStatusEnum = pgEnum("verification_status", ["PENDING", "VERIFIED", "REVOKED"]);
export const questionnaireStatusEnum = pgEnum("questionnaire_status", ["DRAFT", "PUBLISHED", "CLOSED"]);
export const activityTypeEnum = pgEnum("learning_activity_type", ["RESOURCE_ACCESS", "LESSON_COMPLETE", "COURSE_PROGRESS", "ASSESSMENT_COMPLETE"]);

export const traineeProfiles = pgTable("trainee_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id").notNull().unique().references(() => profiles.id, { onDelete: "cascade" }),
  headline: text("headline").notNull().default(""),
  photoUrl: text("photo_url").notNull().default(""),
  qualifications: text("qualifications").notNull().default(""),
  workExperience: text("work_experience").notNull().default(""),
  interests: text("interests").notNull().default(""),
  skills: jsonb("skills").$type<string[]>().notNull().default([]),
  careerGoals: text("career_goals").notNull().default(""),
  linkedinUrl: text("linkedin_url").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [index("trainee_profiles_profile_id_idx").on(table.profileId)]);

export const trainerProfiles = pgTable("trainer_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  profileId: uuid("profile_id").notNull().unique().references(() => profiles.id, { onDelete: "cascade" }),
  designation: text("designation").notNull().default(""),
  organization: text("organization").notNull().default(""),
  experienceYears: integer("experience_years").notNull().default(0),
  qualifications: text("qualifications").notNull().default(""),
  specialization: text("specialization").notNull().default(""),
  subjects: jsonb("subjects").$type<string[]>().notNull().default([]),
  availability: text("availability").notNull().default(""),
  certifications: jsonb("certifications").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [index("trainer_profiles_profile_id_idx").on(table.profileId)]);

export const courses = pgTable("courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull(),
  level: text("level").notNull(),
  trainerId: uuid("trainer_id").notNull().references(() => profiles.id, { onDelete: "restrict" }),
  duration: text("duration").notNull().default(""),
  thumbnailUrl: text("thumbnail_url").notNull().default(""),
  status: courseStatusEnum("status").notNull().default("DRAFT"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  index("courses_trainer_id_idx").on(table.trainerId),
  index("courses_status_idx").on(table.status),
  index("courses_created_at_idx").on(table.createdAt),
]);

export const courseEnrollments = pgTable("course_enrollments", {
  id: uuid("id").defaultRandom().primaryKey(),
  traineeId: uuid("trainee_id").notNull().references(() => profiles.id, { onDelete: "restrict" }),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true }).defaultNow().notNull(),
  progressPercent: integer("progress_percent").notNull().default(0),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  status: text("status").notNull().default("ENROLLED"),
}, (table) => [
  uniqueIndex("course_enrollments_trainee_course_uidx").on(table.traineeId, table.courseId),
  index("course_enrollments_trainee_id_idx").on(table.traineeId),
  index("course_enrollments_course_id_idx").on(table.courseId),
  index("course_enrollments_status_idx").on(table.status),
  index("course_enrollments_enrolled_at_idx").on(table.enrolledAt),
]);

export const courseResources = pgTable("course_resources", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  contentType: contentTypeEnum("content_type").notNull(),
  storagePath: text("storage_path"),
  externalLink: text("external_link"),
  visibility: text("visibility").notNull().default("PRIVATE"),
  uploadedBy: uuid("uploaded_by").notNull().references(() => profiles.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("course_resources_course_id_idx").on(table.courseId),
  index("course_resources_uploaded_by_idx").on(table.uploadedBy),
  index("course_resources_content_type_idx").on(table.contentType),
]);

export const trainerLibrary = pgTable("trainer_library", {
  id: uuid("id").defaultRandom().primaryKey(),
  trainerId: uuid("trainer_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  contentType: contentTypeEnum("content_type").notNull(),
  storageBucketPath: text("storage_bucket_path").notNull().default(""),
  fileSizeBytes: integer("file_size_bytes"),
  uploadStatus: uploadStatusEnum("upload_status").notNull().default("UPLOADING"),
  visibility: text("visibility").notNull().default("PRIVATE"),
  linkedCourseId: uuid("linked_course_id").references(() => courses.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  index("trainer_library_trainer_id_idx").on(table.trainerId),
  index("trainer_library_linked_course_id_idx").on(table.linkedCourseId),
  index("trainer_library_upload_status_idx").on(table.uploadStatus),
  index("trainer_library_created_at_idx").on(table.createdAt),
]);

export const assessments = pgTable("assessments", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "restrict" }),
  trainerId: uuid("trainer_id").notNull().references(() => profiles.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  deadline: timestamp("deadline", { withTimezone: true }),
  totalMarks: integer("total_marks").notNull(),
  status: assessmentStatusEnum("status").notNull().default("DRAFT"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("assessments_course_id_idx").on(table.courseId),
  index("assessments_trainer_id_idx").on(table.trainerId),
  index("assessments_status_idx").on(table.status),
  index("assessments_deadline_idx").on(table.deadline),
]);

export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  assessmentId: uuid("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  marks: integer("marks").notNull(),
  orderIndex: integer("order_index").notNull(),
}, (table) => [
  index("questions_assessment_id_idx").on(table.assessmentId),
  uniqueIndex("questions_assessment_order_uidx").on(table.assessmentId, table.orderIndex),
]);

export const questionOptions = pgTable("question_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  optionText: text("option_text").notNull(),
  // Never expose this column in trainee-facing responses before submission.
  isCorrect: boolean("is_correct").notNull().default(false),
}, (table) => [index("question_options_question_id_idx").on(table.questionId)]);

export const assessmentAttempts = pgTable("assessment_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  assessmentId: uuid("assessment_id").notNull().references(() => assessments.id, { onDelete: "restrict" }),
  traineeId: uuid("trainee_id").notNull().references(() => profiles.id, { onDelete: "restrict" }),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  score: integer("score"),
  status: attemptStatusEnum("status").notNull().default("IN_PROGRESS"),
}, (table) => [
  index("assessment_attempts_assessment_id_idx").on(table.assessmentId),
  index("assessment_attempts_trainee_id_idx").on(table.traineeId),
  index("assessment_attempts_status_idx").on(table.status),
  index("assessment_attempts_started_at_idx").on(table.startedAt),
]);

export const assessmentAnswers = pgTable("assessment_answers", {
  id: uuid("id").defaultRandom().primaryKey(),
  attemptId: uuid("attempt_id").notNull().references(() => assessmentAttempts.id, { onDelete: "cascade" }),
  questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "restrict" }),
  selectedOptionId: uuid("selected_option_id").references(() => questionOptions.id, { onDelete: "set null" }),
  isCorrect: boolean("is_correct"),
}, (table) => [
  uniqueIndex("assessment_answers_attempt_question_uidx").on(table.attemptId, table.questionId),
  index("assessment_answers_question_id_idx").on(table.questionId),
]);

export const certificates = pgTable("certificates", {
  id: uuid("id").defaultRandom().primaryKey(),
  traineeId: uuid("trainee_id").notNull().references(() => profiles.id, { onDelete: "restrict" }),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "restrict" }),
  certificateId: text("certificate_id").notNull().unique(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
  issuingOrganization: text("issuing_organization").notNull(),
  verificationStatus: verificationStatusEnum("verification_status").notNull().default("PENDING"),
}, (table) => [
  index("certificates_trainee_id_idx").on(table.traineeId),
  index("certificates_course_id_idx").on(table.courseId),
  index("certificates_issued_at_idx").on(table.issuedAt),
  index("certificates_verification_status_idx").on(table.verificationStatus),
]);

export const feedback = pgTable("feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  traineeId: uuid("trainee_id").notNull().references(() => profiles.id, { onDelete: "restrict" }),
  courseId: uuid("course_id").references(() => courses.id, { onDelete: "set null" }),
  resourceId: uuid("resource_id").references(() => courseResources.id, { onDelete: "set null" }),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  check("feedback_course_or_resource_check", sql`${table.courseId} is not null or ${table.resourceId} is not null`),
  check("feedback_rating_check", sql`${table.rating} between 1 and 5`),
  index("feedback_trainee_id_idx").on(table.traineeId),
  index("feedback_course_id_idx").on(table.courseId),
  index("feedback_resource_id_idx").on(table.resourceId),
  index("feedback_created_at_idx").on(table.createdAt),
]);

export const questionnaires = pgTable("questionnaires", {
  id: uuid("id").defaultRandom().primaryKey(),
  trainerId: uuid("trainer_id").notNull().references(() => profiles.id, { onDelete: "restrict" }),
  courseId: uuid("course_id").references(() => courses.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  deadline: timestamp("deadline", { withTimezone: true }),
  status: questionnaireStatusEnum("status").notNull().default("DRAFT"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  index("questionnaires_trainer_id_idx").on(table.trainerId),
  index("questionnaires_course_id_idx").on(table.courseId),
  index("questionnaires_status_idx").on(table.status),
  index("questionnaires_deadline_idx").on(table.deadline),
]);

export const questionnaireResponses = pgTable("questionnaire_responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  questionnaireId: uuid("questionnaire_id").notNull().references(() => questionnaires.id, { onDelete: "cascade" }),
  traineeId: uuid("trainee_id").notNull().references(() => profiles.id, { onDelete: "restrict" }),
  response: jsonb("response").notNull().default({}),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("questionnaire_responses_questionnaire_trainee_uidx").on(table.questionnaireId, table.traineeId),
  index("questionnaire_responses_trainee_id_idx").on(table.traineeId),
  index("questionnaire_responses_submitted_at_idx").on(table.submittedAt),
]);

export const competencies = pgTable("competencies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("competencies_name_category_uidx").on(table.name, table.category),
  index("competencies_category_idx").on(table.category),
]);

export const traineeCompetencies = pgTable("trainee_competencies", {
  id: uuid("id").defaultRandom().primaryKey(),
  traineeId: uuid("trainee_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  competencyId: uuid("competency_id").notNull().references(() => competencies.id, { onDelete: "cascade" }),
  currentLevel: integer("current_level").notNull().default(0),
  requiredLevel: integer("required_level").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("trainee_competencies_trainee_competency_uidx").on(table.traineeId, table.competencyId),
  index("trainee_competencies_trainee_id_idx").on(table.traineeId),
  index("trainee_competencies_competency_id_idx").on(table.competencyId),
]);

export const trainerCompetencies = pgTable("trainer_competencies", {
  id: uuid("id").defaultRandom().primaryKey(),
  trainerId: uuid("trainer_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  competencyId: uuid("competency_id").notNull().references(() => competencies.id, { onDelete: "cascade" }),
  level: integer("level").notNull().default(0),
  yearsExperience: integer("years_experience").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("trainer_competencies_trainer_competency_uidx").on(table.trainerId, table.competencyId),
  index("trainer_competencies_trainer_id_idx").on(table.trainerId),
  index("trainer_competencies_competency_id_idx").on(table.competencyId),
]);

export const courseCompetencies = pgTable("course_competencies", {
  id: uuid("id").defaultRandom().primaryKey(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  competencyId: uuid("competency_id").notNull().references(() => competencies.id, { onDelete: "cascade" }),
  targetLevel: integer("target_level").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("course_competencies_course_competency_uidx").on(table.courseId, table.competencyId),
  index("course_competencies_course_id_idx").on(table.courseId),
  index("course_competencies_competency_id_idx").on(table.competencyId),
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("notifications_user_id_idx").on(table.userId),
  index("notifications_user_read_idx").on(table.userId, table.read),
  index("notifications_created_at_idx").on(table.createdAt),
]);

export const announcements = pgTable("announcements", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  publishedBy: uuid("published_by").notNull().references(() => profiles.id, { onDelete: "restrict" }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  active: boolean("active").notNull().default(false),
}, (table) => [
  index("announcements_published_by_idx").on(table.publishedBy),
  index("announcements_active_idx").on(table.active),
  index("announcements_published_at_idx").on(table.publishedAt),
]);

export const achievements = pgTable("achievements", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  publishedBy: uuid("published_by").notNull().references(() => profiles.id, { onDelete: "restrict" }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  active: boolean("active").notNull().default(false),
}, (table) => [
  index("achievements_published_by_idx").on(table.publishedBy),
  index("achievements_active_idx").on(table.active),
  index("achievements_published_at_idx").on(table.publishedAt),
]);

// activity_date is intentionally a UTC calendar date, not a timestamp; streak logic uses this convention.
export const learningActivity = pgTable("learning_activity", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "restrict" }),
  activityDate: date("activity_date").notNull(),
  activityType: activityTypeEnum("activity_type").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("learning_activity_dedup_uidx").on(table.userId, table.activityDate, table.activityType, table.entityType, table.entityId),
  index("learning_activity_user_date_idx").on(table.userId, table.activityDate),
  index("learning_activity_activity_type_idx").on(table.activityType),
  index("learning_activity_created_at_idx").on(table.createdAt),
]);

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("activity_logs_user_id_idx").on(table.userId),
  index("activity_logs_action_idx").on(table.action),
  index("activity_logs_entity_idx").on(table.entityType, table.entityId),
  index("activity_logs_created_at_idx").on(table.createdAt),
]);