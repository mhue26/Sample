"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CalendarNavigation from "./CalendarNavigation";
import CalendarGrid from "./CalendarGrid";
import CalendarTimeGrid from "./CalendarTimeGrid";
import TeachingPeriodsModal from "./TermsHolidaysModal";
import { useModal } from "../contexts/ModalContext";
import type { CalendarEventDTO } from "./getCalendarEvents";

interface Student {
  id: number;
  firstName: string;
  lastName: string;
}

type LessonStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "CANCELLED"
  | "NEEDS_REVIEW"
  | "COMPLETED";

interface CalendarMeeting {
  id: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  isCompleted: boolean;
  status?: LessonStatus;
  student: Student;
}

interface CalendarClientProps {
  meetings: CalendarMeeting[];
  upcomingMeetings: CalendarMeeting[];
  currentYear: number;
  currentMonth: number;
  calendarEvents: CalendarEventDTO[];
  initialView?: "month" | "week" | "fiveday" | "threeday" | "day";
  students: Student[];
  userId: string;
}

export default function CalendarClient({ 
  meetings, 
  upcomingMeetings, 
  currentYear, 
  currentMonth, 
  calendarEvents,
  initialView = "month",
  students: _students,
  userId
}: CalendarClientProps) {
  type CalendarView = "month" | "week" | "fiveday" | "threeday" | "day";

  const [view, setView] = useState<CalendarView>(initialView);
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    const today = new Date();
    const isCurrentMonthView =
      currentYear === today.getFullYear() && currentMonth === today.getMonth();
    if (isCurrentMonthView) {
      return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }
    return new Date(currentYear, currentMonth, 1);
  });
  const [timeRange, setTimeRange] = useState<string>('week');
  const [currentTerm, setCurrentTerm] = useState<any>(null);
  const [currentWeek, setCurrentWeek] = useState<number | null>(null);
  const [teachingPeriods, setTeachingPeriods] = useState<any[]>([]);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [optimisticStatusById, setOptimisticStatusById] = useState<Record<string, LessonStatus>>({});
  const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});
  const { setModalType } = useModal();

  const loadCurrentTerm = async () => {
    try {
      const [termsResponse, holidaysResponse] = await Promise.all([
        fetch(`/api/terms`),
        fetch(`/api/holidays`)
      ]);
      
      const terms = termsResponse.ok ? await termsResponse.json() : [];
      const holidays = holidaysResponse.ok ? await holidaysResponse.json() : [];
      
      // Combine all teaching periods
      const allPeriods = [
        ...terms.map((term: any) => ({ ...term, type: 'term' as const })),
        ...holidays.map((holiday: any) => ({ ...holiday, type: 'holiday' as const }))
      ];
      
      setTeachingPeriods(allPeriods);
    } catch (error) {
      console.error('Error loading current term:', error);
    }
  };

  useEffect(() => {
    loadCurrentTerm();
  }, [userId]);

  // Keep the top "Term • Week" pill aligned with the currently viewed date in the calendar.
  useEffect(() => {
    const terms = teachingPeriods.filter((period) => period.type === "term" && period.isActive);
    if (terms.length === 0) {
      setCurrentTerm(null);
      setCurrentWeek(null);
      return;
    }

    const normalizedCurrentDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate()
    );

    const displayedTerm = terms.find((term) => {
      const startDate = new Date(term.startDate);
      const endDate = new Date(term.endDate);
      const normalizedStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const normalizedEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      return normalizedCurrentDate >= normalizedStartDate && normalizedCurrentDate <= normalizedEndDate;
    });

    if (!displayedTerm) {
      setCurrentTerm(null);
      setCurrentWeek(null);
      return;
    }

    const startDate = new Date(displayedTerm.startDate);
    const endDate = new Date(displayedTerm.endDate);
    const normalizedStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const normalizedEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    // Match CalendarGrid week numbering: weeks are Sun-Sat rows containing the term.
    const periodStartWeek = new Date(normalizedStartDate);
    periodStartWeek.setDate(periodStartWeek.getDate() - periodStartWeek.getDay());

    const periodEndWeek = new Date(normalizedEndDate);
    periodEndWeek.setDate(periodEndWeek.getDate() + (6 - periodEndWeek.getDay()));

    const currentWeekStart = new Date(normalizedCurrentDate);
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());

    const msPerWeek = 1000 * 60 * 60 * 24 * 7;
    const totalWeeks = Math.floor((periodEndWeek.getTime() - periodStartWeek.getTime()) / msPerWeek) + 1;
    const rawWeekNumber = Math.floor((currentWeekStart.getTime() - periodStartWeek.getTime()) / msPerWeek) + 1;
    const weekNumber = Math.min(Math.max(1, rawWeekNumber), totalWeeks);

    setCurrentTerm(displayedTerm);
    setCurrentWeek(weekNumber);
  }, [currentDate, teachingPeriods]);

  // Reload teaching periods when component becomes visible again or when window regains focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadCurrentTerm();
      }
    };

    const handleFocus = () => {
      loadCurrentTerm();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [userId]);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatMeetingDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const meetingDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    
    if (meetingDate.getTime() === todayDate.getTime()) {
      return "Today";
    } else if (meetingDate.getTime() === tomorrowDate.getTime()) {
      return "Tomorrow";
    } else {
      return new Date(date).toLocaleDateString('en-GB', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric' 
      });
    }
  };


  const getFilteredMeetings = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let endDate: Date;
    
    switch (timeRange) {
      case 'today':
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'tomorrow':
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 2);
        break;
      case 'week':
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'month':
        endDate = new Date(today);
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      default:
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 7);
    }
    
    return upcomingMeetings.filter(meeting => {
      const meetingDate = new Date(meeting.startTime);
      return meetingDate >= today && meetingDate < endDate;
    });
  };

  const getEffectiveStatus = (meeting: CalendarMeeting): LessonStatus => {
    const persistedStatus = optimisticStatusById[String(meeting.id)] ?? meeting.status ?? "SCHEDULED";
    if (persistedStatus === "IN_PROGRESS") {
      const hasEnded = new Date(meeting.endTime).getTime() < Date.now();
      if (hasEnded) return "NEEDS_REVIEW";
    }
    return persistedStatus;
  };

  const updateLessonStatus = async (
    meetingId: string,
    nextStatus: LessonStatus,
    cancelReason?: string
  ) => {
    const key = String(meetingId);
    setUpdatingIds((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          cancelReason: cancelReason?.trim() ? cancelReason.trim() : null,
          scope: "this",
        }),
      });
      if (!res.ok) throw new Error("Failed to update lesson status");
      setOptimisticStatusById((prev) => ({ ...prev, [key]: nextStatus }));
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingIds((prev) => ({ ...prev, [key]: false }));
    }
  };

  const renderStatusPill = (status: LessonStatus) => {
    const map: Record<LessonStatus, string> = {
      SCHEDULED: "bg-blue-100 text-blue-800",
      IN_PROGRESS: "bg-amber-100 text-amber-800",
      CANCELLED: "bg-red-100 text-red-800",
      NEEDS_REVIEW: "bg-purple-100 text-purple-800",
      COMPLETED: "bg-green-100 text-green-800",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[status]}`}>
        {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <>
      <div className="space-y-6 pt-8 font-sans" style={{ fontFamily: "'Work Sans', sans-serif" }}>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-[#3D4756]">Calendar</h2>
          {currentTerm && (
            <div className="flex items-center rounded-full px-4 py-2 shadow-sm" style={{ backgroundColor: '#FEF5eF' }}>
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-base font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[#584b53] focus:ring-offset-1 rounded-sm cursor-pointer"
                style={{ color: '#584b53' }}
                aria-label="Open teaching period editor"
              >
                {currentTerm.name}
              </button>
              {currentWeek && (
                <span className="ml-2 text-base" style={{ color: '#584b53' }}>• Week {currentWeek}</span>
              )}
            </div>
          )}
        </div>

        {/* Main Calendar Content: Upcoming left, Calendar right */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Upcoming Meetings - left column, same height as calendar on large screens */}
          <div className="w-full lg:w-80 lg:flex-shrink-0 lg:flex lg:flex-col">
            <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col h-[420px] lg:h-full min-h-0">
              <div className="flex items-center justify-between mb-4 flex-shrink-0">
                <h3 className="text-lg font-medium">Upcoming</h3>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="week">Next Week</option>
                  <option value="month">Next Month</option>
                </select>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                {getFilteredMeetings().length === 0 ? (
                  <p className="text-gray-500">No upcoming events scheduled.</p>
                ) : (
                  <div className="space-y-3">
                    {getFilteredMeetings().map((meeting) => {
                      const effectiveStatus = getEffectiveStatus(meeting);
                      const isUpdating = updatingIds[String(meeting.id)] === true;
                      return (
                      <div key={meeting.id} className="p-3 bg-gray-50 rounded-2xl">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                          <div className="font-medium">{meeting.title}</div>
                          <div className="text-sm text-gray-600">
                            with {meeting.student.firstName} {meeting.student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatMeetingDate(new Date(meeting.startTime))} at {formatTime(new Date(meeting.startTime))}
                          </div>
                          </div>
                          {renderStatusPill(effectiveStatus)}
                        </div>
                        {effectiveStatus === "SCHEDULED" && (
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => updateLessonStatus(meeting.id, "IN_PROGRESS")}
                              className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-[#3D4756] text-white hover:bg-[#2A3441] transition-colors disabled:opacity-50"
                            >
                              Start
                            </button>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => {
                                const reason = window.prompt("Reason for cancellation (optional):", "");
                                updateLessonStatus(meeting.id, "CANCELLED", reason ?? undefined);
                              }}
                              className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        {(effectiveStatus === "IN_PROGRESS" || effectiveStatus === "NEEDS_REVIEW") && (
                          <div className="mt-2">
                            <Link
                              href={`/calendar/event/lesson/${meeting.id}/edit`}
                              className="inline-flex px-2.5 py-1 text-[11px] font-medium rounded-md bg-[#3D4756] text-white hover:bg-[#2A3441] transition-colors"
                            >
                              Review
                            </Link>
                          </div>
                        )}
                        {effectiveStatus === "CANCELLED" && meeting.description && (
                          <p className="mt-2 text-xs text-red-600">{meeting.description}</p>
                        )}
                      </div>
                    );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Calendar View - right column, takes remaining space */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-sm p-6">
            <CalendarNavigation
              userId={userId}
              view={view}
              currentDate={currentDate}
              onViewChange={setView}
              onDateChange={setCurrentDate}
            />

            {view === "month" ? (
              <CalendarGrid 
                meetings={meetings} 
                currentYear={currentYear} 
                currentMonth={currentMonth}
                teachingPeriods={teachingPeriods}
                calendarEvents={calendarEvents}
              />
            ) : (
              <CalendarTimeGrid
                meetings={meetings}
                currentDate={currentDate}
                view={view as "week" | "fiveday" | "threeday" | "day"}
                calendarEvents={calendarEvents}
              />
            )}
            </div>
          </div>
        </div>
      </div>

      {userId && (
        <TeachingPeriodsModal
          isOpen={showTermsModal}
          onClose={() => {
            setShowTermsModal(false);
            setModalType('none');
          }}
          userId={userId}
        />
      )}
    </>
  );
}

