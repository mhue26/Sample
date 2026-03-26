import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext } from "@/utils/auth";
import { syncManyMeetingLedgerEntries, syncMeetingLedgerEntry } from "@/lib/ledger";

interface RouteParams {
	params: Promise<{ id: string }>;
}

type RecurringScope = "this" | "all" | "future";
type LessonStatus = "SCHEDULED" | "IN_PROGRESS" | "CANCELLED" | "NEEDS_REVIEW" | "COMPLETED";

function parseRecurringScope(value: unknown): RecurringScope | null {
	if (value === "this" || value === "all" || value === "future") return value;
	return null;
}

function parseLessonStatus(value: unknown): LessonStatus | null {
	if (
		value === "SCHEDULED" ||
		value === "IN_PROGRESS" ||
		value === "CANCELLED" ||
		value === "NEEDS_REVIEW" ||
		value === "COMPLETED"
	) {
		return value;
	}
	return null;
}

function isAllowedTransition(current: LessonStatus, next: LessonStatus): boolean {
	if (current === next) return true;
	if (current === "COMPLETED" && next !== "COMPLETED") return false;
	return true;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
	const ctx = await getOrgContext();
	if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { id } = await params;
	const meetingId = parseInt(id, 10);
	if (Number.isNaN(meetingId)) {
		return NextResponse.json({ error: "Invalid meeting id" }, { status: 400 });
	}

	const where: { id: number; organisationId: string; createdById?: string } = {
		id: meetingId,
		organisationId: ctx.organisationId,
	};
	if (ctx.role === "TEACHER") where.createdById = ctx.userId;

	const meeting = await prisma.meeting.findFirst({
		where,
		include: { student: true },
	});
	if (!meeting) {
		return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
	}

	return NextResponse.json(meeting);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
	const ctx = await getOrgContext();
	if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { id } = await params;
	const meetingId = parseInt(id, 10);
	if (Number.isNaN(meetingId)) {
		return NextResponse.json({ error: "Invalid meeting id" }, { status: 400 });
	}

	const where: { id: number; organisationId: string; createdById?: string } = {
		id: meetingId,
		organisationId: ctx.organisationId,
	};
	if (ctx.role === "TEACHER") where.createdById = ctx.userId;

	const existing = await prisma.meeting.findFirst({ where });
	if (!existing) {
		return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
	}

	const body = await request.json();
	const rawScope = body.scope ?? "this";
	const scope = parseRecurringScope(rawScope);
	if (!scope) {
		return NextResponse.json({ error: "Invalid scope" }, { status: 400 });
	}

	const parsedStartTime = body.startTime != null ? new Date(body.startTime) : null;
	if (parsedStartTime != null && Number.isNaN(parsedStartTime.getTime())) {
		return NextResponse.json({ error: "Invalid startTime" }, { status: 400 });
	}
	const parsedEndTime = body.endTime != null ? new Date(body.endTime) : null;
	if (parsedEndTime != null && Number.isNaN(parsedEndTime.getTime())) {
		return NextResponse.json({ error: "Invalid endTime" }, { status: 400 });
	}
	const parsedStatus = body.status != null ? parseLessonStatus(body.status) : null;
	if (body.status != null && !parsedStatus) {
		return NextResponse.json({ error: "Invalid status" }, { status: 400 });
	}
	const fallbackStatusFromIsCompleted: LessonStatus | null =
		typeof body.isCompleted === "boolean" ? (body.isCompleted ? "COMPLETED" : "SCHEDULED") : null;
	const desiredStatus = parsedStatus ?? fallbackStatusFromIsCompleted;
	if (desiredStatus && !isAllowedTransition(existing.status as LessonStatus, desiredStatus)) {
		return NextResponse.json(
			{ error: `Invalid status transition from ${existing.status} to ${desiredStatus}` },
			{ status: 400 }
		);
	}

	const sharedUpdateData: Record<string, unknown> = {};
	if (typeof body.title === "string") sharedUpdateData.title = body.title;
	if (typeof body.description === "string" || body.description === null)
		sharedUpdateData.description = body.description;
	if (typeof body.meetingLocation === "string" || body.meetingLocation === null)
		sharedUpdateData.meetingLocation = body.meetingLocation;
	if (typeof body.lessonPlan === "string" || body.lessonPlan === null)
		sharedUpdateData.lessonPlan = body.lessonPlan;
	if (typeof body.homework === "string" || body.homework === null)
		sharedUpdateData.homework = body.homework;
	if (typeof body.lessonSummary === "string" || body.lessonSummary === null)
		sharedUpdateData.lessonSummary = body.lessonSummary;
	if (typeof body.nextLessonPrep === "string" || body.nextLessonPrep === null)
		sharedUpdateData.nextLessonPrep = body.nextLessonPrep;
	if (typeof body.cancelReason === "string" || body.cancelReason === null)
		sharedUpdateData.cancelReason = body.cancelReason;
	if (desiredStatus) {
		sharedUpdateData.status = desiredStatus;
		sharedUpdateData.isCompleted = desiredStatus === "COMPLETED";
	}
	const sid = typeof body.studentId === "number" ? body.studentId : parseInt(String(body.studentId), 10);
	if (!Number.isNaN(sid)) sharedUpdateData.studentId = sid;

	if (scope === "all" || scope === "future") {
		if (existing.recurrenceSeriesId == null) {
			return NextResponse.json(
				{ error: "Scope 'all' and 'future' only apply to recurring events" },
				{ status: 400 }
			);
		}

		const seriesWhere: {
			recurrenceSeriesId: string;
			organisationId: string;
			recurrenceIndex?: { gte: number };
		} = {
			recurrenceSeriesId: existing.recurrenceSeriesId,
			organisationId: ctx.organisationId,
		};
		if (scope === "future") {
			seriesWhere.recurrenceIndex = { gte: existing.recurrenceIndex ?? 0 };
		}

		const targets = await prisma.meeting.findMany({
			where: seriesWhere,
			select: { id: true, startTime: true, endTime: true },
			orderBy: { recurrenceIndex: "asc" },
		});

		const startDeltaMs =
			parsedStartTime != null ? parsedStartTime.getTime() - existing.startTime.getTime() : null;
		const endDeltaMs =
			parsedEndTime != null ? parsedEndTime.getTime() - existing.endTime.getTime() : null;
		const shouldShiftStart = startDeltaMs != null;
		const shouldShiftEnd = endDeltaMs != null;

		if (!shouldShiftStart && !shouldShiftEnd) {
			if (Object.keys(sharedUpdateData).length > 0) {
				await prisma.meeting.updateMany({
					where: seriesWhere,
					data: sharedUpdateData,
				});
			}
		} else {
			await prisma.$transaction(
				targets.map((target) => {
					const perMeetingData: Record<string, unknown> = { ...sharedUpdateData };
					if (shouldShiftStart && startDeltaMs != null) {
						perMeetingData.startTime = new Date(target.startTime.getTime() + startDeltaMs);
					}
					if (shouldShiftEnd && endDeltaMs != null) {
						perMeetingData.endTime = new Date(target.endTime.getTime() + endDeltaMs);
					}
					return prisma.meeting.update({
						where: { id: target.id },
						data: perMeetingData,
					});
				})
			);
		}

		const updated = await prisma.meeting.findFirst({
			where: { id: meetingId, organisationId: ctx.organisationId },
			include: { student: true },
		});

		const prepForHandoff =
			typeof body.nextLessonPrep === "string" ? body.nextLessonPrep.trim() : "";
		if (desiredStatus === "COMPLETED" && prepForHandoff && existing.recurrenceSeriesId != null) {
			const nextMeeting = await prisma.meeting.findFirst({
				where: {
					organisationId: ctx.organisationId,
					recurrenceSeriesId: existing.recurrenceSeriesId,
					recurrenceIndex: { gt: existing.recurrenceIndex ?? -1 },
				},
				orderBy: { recurrenceIndex: "asc" },
				select: { id: true },
			});
			if (nextMeeting) {
				await prisma.meeting.update({
					where: { id: nextMeeting.id },
					data: { lessonPlan: prepForHandoff },
				});
			}
		}

		await syncManyMeetingLedgerEntries(targets.map((t) => t.id));

		return NextResponse.json(updated);
	}

	// scope "this": update only this meeting; if recurring, optionally split from series
	const updateData: Record<string, unknown> = { ...sharedUpdateData };
	if (parsedStartTime != null) updateData.startTime = parsedStartTime;
	if (parsedEndTime != null) updateData.endTime = parsedEndTime;
	// When editing "this event only" and it's part of a series, detach from series so it's a one-off
	const shouldDetachFromSeries =
		existing.recurrenceSeriesId != null &&
		(parsedStartTime != null ||
			parsedEndTime != null ||
			typeof body.title === "string" ||
			typeof body.description === "string" ||
			body.description === null ||
			typeof body.meetingLocation === "string" ||
			body.meetingLocation === null ||
			!Number.isNaN(sid));
	if (shouldDetachFromSeries) {
		updateData.recurrenceSeriesId = null;
		updateData.recurrenceIndex = null;
	}

	const updated = await prisma.meeting.update({
		where: { id: meetingId },
		data: updateData,
		include: { student: true },
	});

	const prepForHandoff =
		typeof body.nextLessonPrep === "string" ? body.nextLessonPrep.trim() : "";
	if (
		desiredStatus === "COMPLETED" &&
		prepForHandoff &&
		existing.recurrenceSeriesId != null &&
		existing.recurrenceIndex != null
	) {
		const nextMeeting = await prisma.meeting.findFirst({
			where: {
				organisationId: ctx.organisationId,
				recurrenceSeriesId: existing.recurrenceSeriesId,
				recurrenceIndex: existing.recurrenceIndex + 1,
			},
			select: { id: true },
		});
		if (nextMeeting) {
			await prisma.meeting.update({
				where: { id: nextMeeting.id },
				data: { lessonPlan: prepForHandoff },
			});
		}
	}

	await syncMeetingLedgerEntry(meetingId);

	return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
	const ctx = await getOrgContext();
	if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { id } = await params;
	const meetingId = parseInt(id, 10);
	if (Number.isNaN(meetingId)) {
		return NextResponse.json({ error: "Invalid meeting id" }, { status: 400 });
	}

	const where: { id: number; organisationId: string; createdById?: string } = {
		id: meetingId,
		organisationId: ctx.organisationId,
	};
	if (ctx.role === "TEACHER") where.createdById = ctx.userId;

	await prisma.meeting.deleteMany({ where });
	return NextResponse.json({ ok: true });
}
