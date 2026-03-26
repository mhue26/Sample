"use server";

import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/utils/auth";
import { redirect } from "next/navigation";
import { LessonStatus } from "@/generated/prisma";
import { syncManyMeetingLedgerEntries, syncMeetingLedgerEntry } from "@/lib/ledger";

export async function createMeeting(formData: FormData): Promise<{ meetingIds: number[] } | { error: string }> {
	const ctx = await requireOrgContext();

	const title = formData.get("title") as string;
	const studentId = formData.get("studentId") as string;
	const meetingDate = formData.get("meetingDate") as string;
	const startTime = formData.get("startTime") as string;
	const endTime = formData.get("endTime") as string;
	const teacherIdRaw = ((formData.get("teacherId") as string | null) ?? "").trim();
	const description = (formData.get("description") as string) || "";
	const lessonPlanRaw = (formData.get("lessonPlan") as string | null) ?? "";
	const lessonPlanInput = lessonPlanRaw.trim();
	const lessonSubjectsRaw = (formData.get("lessonSubjects") as string | null) ?? "";
	const lessonSubjects = lessonSubjectsRaw.trim();
	const combinedDescription =
		lessonSubjects.length > 0
			? `Subjects: ${lessonSubjects}${description ? `\n\n${description}` : ""}`
			: description || null;
	const isCompleted = formData.get("isCompleted") === "on";
	const meetingLocationRaw = (formData.get("location") as string) || (formData.get("meetingLocation") as string) || "";
	const meetingLocation = meetingLocationRaw.trim() || null;
	const hourlyRateCentsRaw = formData.get("hourlyRateCents") as string | null;
	const totalCentsRaw = formData.get("totalCents") as string | null;
	const hourlyRateCents = hourlyRateCentsRaw ? parseInt(hourlyRateCentsRaw, 10) : null;
	const totalCents = totalCentsRaw ? parseInt(totalCentsRaw, 10) : null;
	const isRepeating = formData.get("isRepeating") === "on";
	const repeatType = formData.get("repeatType") as string;
	const repeatCount = parseInt(formData.get("repeatCount") as string) || 1;
	const repeatEndCondition = (formData.get("repeatEndCondition") as string) || "count";
	const repeatTermIdRaw = formData.get("repeatTermId") as string | null;
	const repeatTermId = repeatTermIdRaw ? parseInt(repeatTermIdRaw, 10) : null;

	if (!title || !studentId || !meetingDate || !startTime || !endTime) {
		return { error: "All required fields must be filled" };
	}

	const student = await prisma.student.findFirst({
		where: { id: parseInt(studentId), organisationId: ctx.organisationId },
	});
	if (!student) return { error: "Student not found" };

	let createdById = ctx.userId;
	if (ctx.role === "OWNER" || ctx.role === "ADMIN") {
		if (teacherIdRaw) {
			createdById = teacherIdRaw;
		}
	}

	const prepSeedMeeting = await prisma.meeting.findFirst({
		where: {
			organisationId: ctx.organisationId,
			studentId: parseInt(studentId),
			status: "COMPLETED",
			nextLessonPrep: { not: null },
		},
		orderBy: { startTime: "desc" },
		select: { nextLessonPrep: true },
	});
	const fallbackLessonPlan = (prepSeedMeeting?.nextLessonPrep ?? "").trim();
	const lessonPlan = lessonPlanInput || fallbackLessonPlan || null;

	const baseStartTime = new Date(`${meetingDate}T${startTime}`);
	const baseEndTime = new Date(`${meetingDate}T${endTime}`);

	const endDate =
		isRepeating && repeatEndCondition === "term" && repeatTermId
			? (await prisma.term.findFirst({
					where: { id: repeatTermId, organisationId: ctx.organisationId },
				}))?.endDate
			: null;
	const termEndDate = endDate ? new Date(endDate) : null;
	if (termEndDate) termEndDate.setHours(23, 59, 59, 999);

	if (isRepeating && repeatType && (repeatCount > 1 || (repeatEndCondition === "term" && repeatTermId))) {
		const maxOccurrences = repeatEndCondition === "term" ? 260 : repeatCount; // ~5 years weekly
		const slots: { start: Date; end: Date }[] = [];
		for (let i = 0; i < maxOccurrences; i++) {
			const meetingStartTime = new Date(baseStartTime);
			const meetingEndTime = new Date(baseEndTime);
			if (i > 0) {
				switch (repeatType) {
					case "daily":
						meetingStartTime.setDate(meetingStartTime.getDate() + i);
						meetingEndTime.setDate(meetingEndTime.getDate() + i);
						break;
					case "weekly":
						meetingStartTime.setDate(meetingStartTime.getDate() + i * 7);
						meetingEndTime.setDate(meetingEndTime.getDate() + i * 7);
						break;
					case "biweekly":
						meetingStartTime.setDate(meetingStartTime.getDate() + i * 14);
						meetingEndTime.setDate(meetingEndTime.getDate() + i * 14);
						break;
					case "monthly":
						meetingStartTime.setMonth(meetingStartTime.getMonth() + i);
						meetingEndTime.setMonth(meetingEndTime.getMonth() + i);
						break;
				}
			}
			if (termEndDate && meetingStartTime > termEndDate) break;
			if (repeatEndCondition === "count" && i >= repeatCount) break;
			slots.push({ start: meetingStartTime, end: meetingEndTime });
		}
		if (slots.length === 0)
			return { error: "No occurrences fall within the selected term. Check the start date and term dates." };
		const total = slots.length;
		const recurrenceSeriesId = crypto.randomUUID();
		const meetings = slots.map((slot, i) => ({
			title: i === 0 ? title : `${title} (${i + 1}/${total})`,
			description: combinedDescription,
			meetingLocation,
			lessonPlan,
			startTime: slot.start,
			endTime: slot.end,
			isCompleted: false,
			status: LessonStatus.SCHEDULED,
			createdById,
			organisationId: ctx.organisationId,
			studentId: parseInt(studentId),
			recurrenceSeriesId,
			recurrenceIndex: i,
			...(hourlyRateCents != null && { hourlyRateCents }),
			...(totalCents != null && { totalCents }),
		}));
		await prisma.meeting.createMany({ data: meetings });
		const created = await prisma.meeting.findMany({
			where: { recurrenceSeriesId, organisationId: ctx.organisationId },
			select: { id: true },
			orderBy: { recurrenceIndex: "asc" },
		});
		const result = { meetingIds: created.map((m) => m.id) };
		await syncManyMeetingLedgerEntries(result.meetingIds);
		if (formData.get("redirect") === "true") redirect("/calendar");
		return result;
	}

	const meeting = await prisma.meeting.create({
		data: {
			title,
			description: combinedDescription,
			meetingLocation,
			lessonPlan,
			startTime: baseStartTime,
			endTime: baseEndTime,
			isCompleted,
			status: isCompleted ? "COMPLETED" : "SCHEDULED",
			createdById,
			organisationId: ctx.organisationId,
			studentId: parseInt(studentId),
			...(hourlyRateCents != null && { hourlyRateCents }),
			...(totalCents != null && { totalCents }),
		},
	});
	const result = { meetingIds: [meeting.id] };
	await syncMeetingLedgerEntry(meeting.id);
	if (formData.get("redirect") === "true") redirect("/calendar");
	return result;
}
