import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/utils/auth";
import CalendarClient from "./CalendarClient";
import { getCalendarEvents } from "./getCalendarEvents";

interface CalendarSearchParams {
  month?: string;
  year?: string;
  view?: "month" | "week" | "fiveday" | "threeday" | "day";
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<CalendarSearchParams> }) {
	const ctx = await requireOrgContext();

	const params = await searchParams;
	const now = new Date();
	const currentMonth = params.month ? parseInt(params.month) - 1 : now.getMonth();
	const currentYear = params.year ? parseInt(params.year) : now.getFullYear();

	const startOfMonth = new Date(currentYear, currentMonth, 1);
	const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

	const queryStart = new Date(startOfMonth);
	queryStart.setDate(queryStart.getDate() - 7);
	const queryEnd = new Date(endOfMonth);
	queryEnd.setDate(queryEnd.getDate() + 7);

	const { events, meetings } = await getCalendarEvents(
		{
			organisationId: ctx.organisationId,
			userId: ctx.userId,
			role: ctx.role,
		},
		{ from: queryStart, to: queryEnd }
	);

	const upcomingStart = new Date();
	const upcomingEnd = new Date();
	upcomingEnd.setDate(upcomingEnd.getDate() + 7);

	const upcomingWhere: any = {
		organisationId: ctx.organisationId,
		startTime: { gte: upcomingStart, lte: upcomingEnd },
	};
	if (ctx.role === "TEACHER") {
		upcomingWhere.createdById = ctx.userId;
	}

	const upcomingMeetings = await prisma.meeting.findMany({
		where: upcomingWhere,
		include: { student: true },
		orderBy: { startTime: "asc" },
	});

	const students = await prisma.student.findMany({
		where: { organisationId: ctx.organisationId, isArchived: false },
		orderBy: { firstName: "asc" },
		select: { id: true, firstName: true, lastName: true },
	});

	return (
		<CalendarClient
			meetings={meetings as any}
			upcomingMeetings={upcomingMeetings as any}
			currentYear={currentYear}
			currentMonth={currentMonth}
			calendarEvents={events}
			initialView={params.view ?? "month"}
			students={students}
			userId={ctx.userId}
		/>
	);
}
