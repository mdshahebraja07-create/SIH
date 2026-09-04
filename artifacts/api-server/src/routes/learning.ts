import { Router, type IRouter } from "express";
import { and, asc, count, desc, eq, gte, sql } from "drizzle-orm";
import { courseEnrollments, courses, db, learningActivity } from "@workspace/db";
import { ensureCourseCatalog } from "../data/courses";
import { requireApprovedProfile, type AppRole } from "../lib/auth";

const router: IRouter = Router();
const activityTypes = ["LESSON_COMPLETED", "COURSE_PROGRESS", "ASSESSMENT_COMPLETED", "RESOURCE_ACCESSED"] as const;
type ActivityType = typeof activityTypes[number];

function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours}h ${remainder ? `${remainder}m` : ""}`.trim() : `${minutes}m`;
}

function coursePayload(course: typeof courses.$inferSelect, progress = 0, enrolled = false) {
  return {
    id: course.id,
    title: course.title,
    category: course.category,
    level: course.level,
    duration: durationLabel(course.durationMinutes),
    durationMinutes: course.durationMinutes,
    lessons: course.lessons,
    progress,
    description: course.description,
    trainer: course.trainerName,
    initials: course.trainerInitials,
    color: course.color,
    accent: course.accent,
    skills: course.skills,
    status: course.status,
    enrolled,
  };
}

function dateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dateDifferenceInDays(left: string, right: string): number {
  return Math.round((Date.parse(`${left}T00:00:00Z`) - Date.parse(`${right}T00:00:00Z`)) / 86_400_000);
}

function calculateStreak(activityDates: string[]): number {
  const uniqueDates = [...new Set(activityDates)].sort((left, right) => right.localeCompare(left));
  if (!uniqueDates.length) return 0;
  let streak = 1;
  for (let index = 1; index < uniqueDates.length; index += 1) {
    if (dateDifferenceInDays(uniqueDates[index - 1], uniqueDates[index]) !== 1) break;
    streak += 1;
  }
  return streak;
}

async function activeProfile(req: Parameters<typeof requireApprovedProfile>[0], res: Parameters<typeof requireApprovedProfile>[1], roles?: AppRole[]) {
  return requireApprovedProfile(req, res, roles);
}

router.get("/courses", async (req, res) => {
  const profile = await activeProfile(req, res);
  if (!profile) return;
  try {
    await ensureCourseCatalog();
    const rows = await db
      .select({ course: courses, progress: courseEnrollments.progress, enrolled: sql<boolean>`(${courseEnrollments.id} is not null)` })
      .from(courses)
      .leftJoin(courseEnrollments, and(eq(courseEnrollments.courseId, courses.id), eq(courseEnrollments.userId, profile.id)))
      .where(eq(courses.status, "PUBLISHED"))
      .orderBy(asc(courses.createdAt));
    res.json({ courses: rows.map(({ course, progress, enrolled }) => coursePayload(course, progress ?? 0, enrolled)) });
  } catch (error) {
    req.log.error({ err: error }, "Course catalog lookup failed");
    res.status(500).json({ message: "The learning library is temporarily unavailable." });
  }
});

router.get("/courses/:id", async (req, res) => {
  const profile = await activeProfile(req, res);
  if (!profile) return;
  try {
    await ensureCourseCatalog();
    const [row] = await db
      .select({ course: courses, progress: courseEnrollments.progress, enrolled: sql<boolean>`(${courseEnrollments.id} is not null)` })
      .from(courses)
      .leftJoin(courseEnrollments, and(eq(courseEnrollments.courseId, courses.id), eq(courseEnrollments.userId, profile.id)))
      .where(and(eq(courses.id, req.params.id), eq(courses.status, "PUBLISHED")))
      .limit(1);
    if (!row) {
      res.status(404).json({ message: "Course not found." });
      return;
    }
    res.json({ course: coursePayload(row.course, row.progress ?? 0, row.enrolled) });
  } catch (error) {
    req.log.error({ err: error }, "Course lookup failed");
    res.status(500).json({ message: "This course is temporarily unavailable." });
  }
});

router.post("/courses/:id/enroll", async (req, res) => {
  const profile = await activeProfile(req, res, ["TRAINEE"]);
  if (!profile) return;
  try {
    await ensureCourseCatalog();
    const [course] = await db.select().from(courses).where(and(eq(courses.id, req.params.id), eq(courses.status, "PUBLISHED"))).limit(1);
    if (!course) {
      res.status(404).json({ message: "Course not found." });
      return;
    }
    await db.insert(courseEnrollments).values({ userId: profile.id, courseId: course.id }).onConflictDoNothing();
    res.status(201).json({ course: coursePayload(course, 0, true) });
  } catch (error) {
    req.log.error({ err: error }, "Course enrollment failed");
    res.status(500).json({ message: "We could not enroll you in that course." });
  }
});

router.post("/courses/:id/progress", async (req, res) => {
  const profile = await activeProfile(req, res, ["TRAINEE"]);
  if (!profile) return;
  const progress = Number(req.body?.progress);
  const durationMinutes = Number(req.body?.durationMinutes ?? 15);
  if (!Number.isInteger(progress) || progress < 0 || progress > 100 || !Number.isInteger(durationMinutes) || durationMinutes < 0 || durationMinutes > 480) {
    res.status(400).json({ message: "Progress must be a whole number from 0 to 100." });
    return;
  }
  try {
    const [updated] = await db
      .update(courseEnrollments)
      .set({ progress, completedAt: progress === 100 ? new Date() : null, updatedAt: new Date() })
      .where(and(eq(courseEnrollments.userId, profile.id), eq(courseEnrollments.courseId, req.params.id)))
      .returning();
    if (!updated) {
      res.status(404).json({ message: "Enroll in this course before saving progress." });
      return;
    }
    await db.insert(learningActivity).values({
      userId: profile.id,
      activityDate: dateString(new Date()),
      activityType: "COURSE_PROGRESS",
      entityType: "course",
      entityId: req.params.id,
      durationMinutes,
    }).onConflictDoNothing();
    const [course] = await db.select().from(courses).where(eq(courses.id, req.params.id)).limit(1);
    if (!course) {
      res.status(404).json({ message: "Course not found." });
      return;
    }
    res.json({ course: coursePayload(course, updated.progress, true) });
  } catch (error) {
    req.log.error({ err: error }, "Course progress update failed");
    res.status(500).json({ message: "We could not save your progress." });
  }
});

router.post("/learning/activity", async (req, res) => {
  const profile = await activeProfile(req, res, ["TRAINEE"]);
  if (!profile) return;
  const { activityType, entityType, entityId } = req.body as { activityType?: unknown; entityType?: unknown; entityId?: unknown };
  const durationMinutes = Number(req.body?.durationMinutes ?? 0);
  if (!activityTypes.includes(activityType as ActivityType) || typeof entityType !== "string" || !entityType || typeof entityId !== "string" || !entityId || !Number.isInteger(durationMinutes) || durationMinutes < 0 || durationMinutes > 480) {
    res.status(400).json({ message: "That learning activity is invalid." });
    return;
  }
  try {
    await db.insert(learningActivity).values({
      userId: profile.id,
      activityDate: dateString(new Date()),
      activityType: activityType as ActivityType,
      entityType,
      entityId,
      durationMinutes,
    }).onConflictDoNothing();
    res.status(201).json({ recorded: true });
  } catch (error) {
    req.log.error({ err: error }, "Learning activity recording failed");
    res.status(500).json({ message: "We could not record that learning activity." });
  }
});

router.get("/learning/summary", async (req, res) => {
  const profile = await activeProfile(req, res, ["TRAINEE"]);
  if (!profile) return;
  try {
    const enrollments = await db
      .select({ course: courses, progress: courseEnrollments.progress, enrolledAt: courseEnrollments.startedAt, completedAt: courseEnrollments.completedAt })
      .from(courseEnrollments)
      .innerJoin(courses, eq(courseEnrollments.courseId, courses.id))
      .where(eq(courseEnrollments.userId, profile.id))
      .orderBy(desc(courseEnrollments.updatedAt));
    const activities = await db
      .select({ activityDate: learningActivity.activityDate, activityType: learningActivity.activityType, entityId: learningActivity.entityId, durationMinutes: learningActivity.durationMinutes, createdAt: learningActivity.createdAt })
      .from(learningActivity)
      .where(eq(learningActivity.userId, profile.id))
      .orderBy(desc(learningActivity.createdAt))
      .limit(50);
    const weeklyStart = new Date();
    weeklyStart.setUTCDate(weeklyStart.getUTCDate() - 6);
    const weeklyStartDate = dateString(weeklyStart);
    const weeklyMinutes = activities.filter((activity) => activity.activityDate >= weeklyStartDate).reduce((total, activity) => total + activity.durationMinutes, 0);
    const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
      const day = new Date();
      day.setUTCDate(day.getUTCDate() - (6 - index));
      const dayString = dateString(day);
      return activities.filter((activity) => activity.activityDate === dayString).reduce((total, activity) => total + activity.durationMinutes, 0);
    });
    const overallProgress = enrollments.length ? Math.round(enrollments.reduce((total, enrollment) => total + enrollment.progress, 0) / enrollments.length) : 0;
    res.json({
      streak: calculateStreak(activities.map((activity) => activity.activityDate)),
      overallProgress,
      weeklyMinutes,
      weeklyActivity,
      enrolledCourses: enrollments.map(({ course, progress, enrolledAt, completedAt }) => ({ ...coursePayload(course, progress, true), enrolledAt, completedAt })),
      activities: activities.slice(0, 6).map((activity) => ({
        id: `${activity.activityDate}-${activity.activityType}-${activity.entityId}`,
        action: activity.activityType === "COURSE_PROGRESS" ? "Progressed" : activity.activityType === "LESSON_COMPLETED" ? "Completed" : activity.activityType === "ASSESSMENT_COMPLETED" ? "Assessed" : "Opened",
        title: activity.entityId,
        date: activity.activityDate,
        durationMinutes: activity.durationMinutes,
      })),
    });
  } catch (error) {
    req.log.error({ err: error }, "Learning summary lookup failed");
    res.status(500).json({ message: "Your learning summary is temporarily unavailable." });
  }
});

export default router;