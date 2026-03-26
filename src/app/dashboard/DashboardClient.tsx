"use client";

import Link from "next/link";
import LineChart from "@/app/components/charts/LineChart";
import DonutChart from "@/app/components/charts/DonutChart";
import BarChart from "@/app/components/charts/BarChart";
import ScheduleCard from "@/app/components/dashboard/ScheduleCard";
import StudentsTable from "@/app/components/dashboard/StudentsTable";

interface ChartPoint {
	label: string;
	value: number;
}

interface ScheduleEvent {
	id: string | number;
	type: "lesson" | "event" | "checkin";
	status?: "SCHEDULED" | "IN_PROGRESS" | "CANCELLED" | "NEEDS_REVIEW" | "COMPLETED";
	title: string;
	description: string;
	participant: string;
	startTime: string;
	endTime?: string;
}

interface LessonLogRow {
	id: number | string;
	studentId: number | string | null;
	studentFirstName: string;
	studentLastName: string;
	subjects: string;
	isArchived: boolean;
	lessonDate: string;
	lessonTitle: string;
	status: string;
}

interface DashboardClientProps {
	userName: string | null;
	todayFormatted: string;
	lessonHoursData: ChartPoint[];
	teachingHoursThisWeek: number;
	hoursPercentChange: number;
	activeStudentsCount: number;
	archivedStudentsCount: number;
	revenueBarData: ChartPoint[];
	totalRevenue: number;
	revenuePercentChange: number;
	upcomingLessonsBarData: ChartPoint[];
	totalUpcomingLessons: number;
	scheduleLessons: ScheduleEvent[];
	scheduleEvents: ScheduleEvent[];
	scheduleCheckins: ScheduleEvent[];
	needsReviewCount: number;
	lessonLogRows: LessonLogRow[];
}

function PercentBadge({ value }: { value: number }) {
	if (value === 0) return null;
	const isPositive = value > 0;
	return (
		<span
			className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
				isPositive ? "text-emerald-600" : "text-red-500"
			}`}
		>
			<svg
				className={`w-3 h-3 ${isPositive ? "" : "rotate-180"}`}
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2.5}
					d="M5 10l7-7m0 0l7 7m-7-7v18"
				/>
			</svg>
			{isPositive ? "+" : ""}
			{value}%
		</span>
	);
}

function CardShell({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 ${className}`}
		>
			{children}
		</div>
	);
}

function SeeAllButton({ href }: { href: string }) {
	return (
		<Link
			href={href}
			className="text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
		>
			See All
		</Link>
	);
}

export default function DashboardClient({
	userName,
	todayFormatted,
	lessonHoursData,
	teachingHoursThisWeek,
	hoursPercentChange,
	activeStudentsCount,
	archivedStudentsCount,
	revenueBarData,
	totalRevenue,
	revenuePercentChange,
	upcomingLessonsBarData,
	totalUpcomingLessons,
	scheduleLessons,
	scheduleEvents,
	scheduleCheckins,
	needsReviewCount,
	lessonLogRows,
}: DashboardClientProps) {
	const totalStudents = activeStudentsCount + archivedStudentsCount;

	return (
		<div
			className="space-y-6 pt-8 font-sans"
			style={{ fontFamily: "'Work Sans', sans-serif" }}
		>
			{/* Header */}
			<div className="flex items-center justify-between flex-wrap gap-4">
				<h1 className="text-3xl font-semibold text-[#3D4756]">
					Welcome{userName ? `, ${userName}` : ""}!
				</h1>
				<div className="flex items-center rounded-full px-4 py-2 shadow-sm bg-[#FEF5eF]">
					<svg
						className="w-5 h-5 mr-2 text-[#584b53]"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<p className="text-sm font-medium text-[#584b53]">
						Today is {todayFormatted}
					</p>
				</div>
			</div>

			{/* ── Row 1: Lesson Hours (2/3) + Students Donut (1/3) ──────────── */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Lesson Hours Line Chart */}
				<CardShell className="lg:col-span-2">
					<div className="flex items-start justify-between mb-1">
						<h2 className="text-base font-semibold text-gray-900">
							Avg. Lesson Hours
						</h2>
						<div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-100">
							<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							Last 8 weeks
						</div>
					</div>
					<div className="flex items-end gap-3 mb-4">
						<span className="text-4xl font-bold text-gray-900">
							{teachingHoursThisWeek}
						</span>
						<span className="text-sm text-gray-500 mb-1">hrs this week</span>
						<PercentBadge value={hoursPercentChange} />
						{hoursPercentChange !== 0 && (
							<span className="text-xs text-gray-400 mb-0.5">VS Last Week</span>
						)}
					</div>
					<LineChart
						data={lessonHoursData}
						lineColor="#f59e0b"
						fillColor="rgba(245,158,11,0.10)"
						height={160}
					/>
				</CardShell>

				{/* Students Donut */}
				<CardShell className="min-h-[290px]">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-base font-semibold text-gray-900">Students</h2>
						<SeeAllButton href="/students" />
					</div>
					<div className="flex items-center justify-center py-2">
						<DonutChart
							segments={[
								{
									label: "Active",
									value: activeStudentsCount,
									color: "#86d4c8",
								},
								{
									label: "Archived",
									value: archivedStudentsCount,
									color: "#3d4756",
								},
							]}
							total={totalStudents}
						/>
					</div>
				</CardShell>
			</div>

			{/* ── Row 2: Revenue + Upcoming Lessons + Schedule ──────────────── */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{/* Revenue */}
				<CardShell className="min-h-[290px] flex flex-col">
					<div className="flex items-center justify-between mb-1">
						<h2 className="text-base font-semibold text-gray-900">Revenue</h2>
						<SeeAllButton href="/billing" />
					</div>
					<div className="mb-2">
						<span className="text-3xl font-bold text-gray-900">
							${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
						</span>
						<div className="flex items-center gap-2 mt-1">
							<PercentBadge value={revenuePercentChange} />
							{revenuePercentChange !== 0 && (
								<span className="text-xs text-gray-400">VS Last Week</span>
							)}
						</div>
					</div>
					<div className="flex-1 min-h-0">
						<BarChart
							data={revenueBarData}
							color="#86d4c8"
							highlightColor="#86d4c8"
							yAxisLabel="USD"
							valueSuffix=" $"
							metricLabel="Revenue"
							height={0}
						/>
					</div>
				</CardShell>

				{/* Upcoming Lessons */}
				<CardShell className="min-h-[290px] flex flex-col">
					<div className="flex items-center justify-between mb-1">
						<h2 className="text-base font-semibold text-gray-900">
							Upcoming Lessons
						</h2>
						<SeeAllButton href="/calendar" />
					</div>
					<div className="mb-2">
						<span className="text-3xl font-bold text-gray-900">
							{totalUpcomingLessons}
						</span>
						<span className="text-sm text-gray-500 ml-1">scheduled</span>
					</div>
					<div className="flex-1 min-h-0">
						<BarChart
							data={upcomingLessonsBarData}
							color="#d6e3f8"
							highlightColor="#d6e3f8"
							yAxisLabel="Lessons"
							valueSuffix=""
							metricLabel="Upcoming lessons"
							height={0}
						/>
					</div>
				</CardShell>

				{/* Schedule */}
				<div className="md:col-span-2 lg:col-span-1 min-h-[290px]">
					<ScheduleCard
						lessons={scheduleLessons}
						events={scheduleEvents}
						checkins={scheduleCheckins}
						needsReviewCount={needsReviewCount}
					/>
				</div>
			</div>

			{/* ── Row 3: Lesson Log ───────────────────────────────────────── */}
			<StudentsTable lessons={lessonLogRows} />
		</div>
	);
}
