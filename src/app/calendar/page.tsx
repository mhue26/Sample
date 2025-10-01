import { prisma } from "@/lib/prisma";
import { authOptions } from "@/utils/auth";
import { getServerSession } from "next-auth";
import CalendarClient from "./CalendarClient";
import { createMeeting } from "./actions";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string; year?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return (
      <div className="space-y-2">
        <div className="text-sm text-gray-600">You must sign in to view the calendar.</div>
        <a href="/signin" className="text-blue-600 hover:underline">Sign in</a>
      </div>
    );
  }

  // Get the current month/year from URL params or default to current date
  const params = await searchParams;
  const now = new Date();
  const currentMonth = params.month ? parseInt(params.month) - 1 : now.getMonth();
  const currentYear = params.year ? parseInt(params.year) : now.getFullYear();
  const displayDate = new Date(currentYear, currentMonth);
  
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

  const meetings = await prisma.meeting.findMany({
    where: {
      userId: (session.user as any).id,
      startTime: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    include: {
      student: true,
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  // Get upcoming meetings (next 7 days)
  const upcomingStart = new Date();
  const upcomingEnd = new Date();
  upcomingEnd.setDate(upcomingEnd.getDate() + 7);

  const upcomingMeetings = await prisma.meeting.findMany({
    where: {
      userId: (session.user as any).id,
      startTime: {
        gte: upcomingStart,
        lte: upcomingEnd,
      },
    },
    include: {
      student: true,
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  // Get all students for the form
  const students = await prisma.student.findMany({
    where: {
      userId: (session.user as any).id,
      isArchived: false,
    },
    orderBy: { firstName: "asc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  });

  return (
    <CalendarClient 
      meetings={meetings}
      upcomingMeetings={upcomingMeetings}
      currentYear={currentYear}
      currentMonth={currentMonth}
      students={students}
      createMeeting={createMeeting}
    />
  );
}
