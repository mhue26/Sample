"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type ScheduleEventType = "lesson" | "event" | "checkin";
type LessonStatus = "SCHEDULED" | "IN_PROGRESS" | "CANCELLED" | "NEEDS_REVIEW" | "COMPLETED";

interface ScheduleEvent {
	id: string | number;
	type: ScheduleEventType;
	status?: LessonStatus;
	title: string;
	description: string;
	participant: string;
	startTime: string;
	endTime?: string;
}

interface ScheduleCardProps {
	lessons: ScheduleEvent[];
	events: ScheduleEvent[];
	checkins: ScheduleEvent[];
	needsReviewCount: number;
}

const TYPE_STYLES: Record<ScheduleEventType, { bg: string; text: string; border: string; label: string }> = {
	lesson: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-l-emerald-500", label: "Lesson" },
	event: { bg: "bg-amber-50", text: "text-amber-700", border: "border-l-amber-500", label: "Event" },
	checkin: { bg: "bg-blue-50", text: "text-blue-700", border: "border-l-blue-500", label: "Check-in" },
};

function formatTimeDisplay(isoStr: string) {
	const d = new Date(isoStr);
	return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDateHeader(date: Date) {
	return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default function ScheduleCard({ lessons, events, checkins, needsReviewCount }: ScheduleCardProps) {
	const [activeTab, setActiveTab] = useState<"lessons" | "events" | "checkins">("lessons");
	const [optimisticStatusById, setOptimisticStatusById] = useState<Record<string, LessonStatus>>({});
	const [updatingIds, setUpdatingIds] = useState<Record<string, boolean>>({});
	const [selectedDate, setSelectedDate] = useState(() => {
		const d = new Date();
		d.setHours(0, 0, 0, 0);
		return d;
	});

	const tabs = [
		{ key: "lessons" as const, label: "Lessons" },
		{ key: "events" as const, label: "Events" },
		{ key: "checkins" as const, label: "Check-ins" },
	];

	const allItems = useMemo(() => {
		switch (activeTab) {
			case "lessons": return lessons;
			case "events": return events;
			case "checkins": return checkins;
		}
	}, [activeTab, lessons, events, checkins]);

	const filteredItems = useMemo(() => {
		const dayStart = selectedDate.getTime();
		const dayEnd = dayStart + 24 * 60 * 60 * 1000;
		return allItems.filter((item) => {
			const t = new Date(item.startTime).getTime();
			return t >= dayStart && t < dayEnd;
		});
	}, [allItems, selectedDate]);

	const changeDate = (offset: number) => {
		setSelectedDate((prev) => {
			const next = new Date(prev);
			next.setDate(next.getDate() + offset);
			return next;
		});
	};

	const goToday = () => {
		const d = new Date();
		d.setHours(0, 0, 0, 0);
		setSelectedDate(d);
	};

	const getEffectiveStatus = (item: ScheduleEvent): LessonStatus | null => {
		if (item.type !== "lesson") return null;
		const persistedStatus = optimisticStatusById[String(item.id)] ?? item.status ?? "SCHEDULED";
		if (persistedStatus === "IN_PROGRESS" && item.endTime) {
			const hasEnded = new Date(item.endTime).getTime() < Date.now();
			if (hasEnded) return "NEEDS_REVIEW";
		}
		return persistedStatus;
	};

	const updateLessonStatus = async (meetingId: string | number, nextStatus: LessonStatus, cancelReason?: string) => {
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
			SCHEDULED: "bg-blue-50 text-blue-700",
			IN_PROGRESS: "bg-amber-50 text-amber-700",
			CANCELLED: "bg-red-50 text-red-700",
			NEEDS_REVIEW: "bg-purple-50 text-purple-700",
			COMPLETED: "bg-emerald-50 text-emerald-700",
		};
		return (
			<span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1 ${map[status]}`}>
				{status.replace("_", " ")}
			</span>
		);
	};

	return (
		<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col h-full">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-xl font-semibold text-gray-900">Schedule</h2>
				<Link
					href="/calendar"
					className="text-sm font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
				>
					See All
				</Link>
			</div>

			<div className="flex items-center justify-between mb-4">
				<button
					onClick={() => changeDate(-1)}
					className="p-1 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
				>
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
					</svg>
				</button>
				<button
					onClick={goToday}
					className="text-base font-medium text-gray-700 hover:text-gray-900 transition-colors"
				>
					{formatDateHeader(selectedDate)}
				</button>
				<button
					onClick={() => changeDate(1)}
					className="p-1 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
				>
					<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
				</button>
			</div>

			<div className="flex gap-1 mb-4 border-b border-gray-100">
				{tabs.map((tab) => (
					<button
						key={tab.key}
						onClick={() => setActiveTab(tab.key)}
						className={`pb-2 px-3 text-base font-medium transition-colors border-b-2 ${
							activeTab === tab.key
								? "text-gray-900 border-gray-900"
								: "text-gray-400 border-transparent hover:text-gray-600"
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>
			{activeTab === "lessons" && needsReviewCount > 0 && (
				<div className="mb-3 rounded-lg border border-purple-100 bg-purple-50 px-3 py-2 text-sm text-purple-700">
					{needsReviewCount} lesson{needsReviewCount === 1 ? "" : "s"} need review
				</div>
			)}

			<div className="flex-1 overflow-y-auto space-y-3 min-h-0">
				{filteredItems.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<p className="text-base text-gray-400">Nothing scheduled</p>
					</div>
				) : (
					filteredItems.map((item) => {
						const style = TYPE_STYLES[item.type];
						const effectiveStatus = getEffectiveStatus(item);
						const isUpdating = updatingIds[String(item.id)] === true;
						return (
							<div
								key={`${item.type}-${item.id}`}
								className={`flex gap-3 p-3 rounded-xl border-l-[3px] ${style.border} bg-gray-50/50`}
							>
								<div className="flex flex-col text-right min-w-[60px] shrink-0">
									<span className="text-base font-semibold text-gray-800">
										{formatTimeDisplay(item.startTime)}
									</span>
									{item.endTime && (
										<span className="text-sm text-gray-400">
											{formatTimeDisplay(item.endTime)}
										</span>
									)}
								</div>
								<div className="flex-1 min-w-0">
									{item.type === "lesson" && effectiveStatus
										? renderStatusPill(effectiveStatus)
										: (
											<span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1 ${style.bg} ${style.text}`}>
												{style.label}
											</span>
										)}
									<p className="text-base font-medium text-gray-800 truncate">{item.title}</p>
									<p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
										<svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
										</svg>
										{item.participant}
									</p>
									{item.type === "lesson" && effectiveStatus === "SCHEDULED" && (
										<div className="mt-2 flex items-center gap-2">
											<button
												type="button"
												disabled={isUpdating}
												onClick={() => updateLessonStatus(item.id, "IN_PROGRESS")}
												className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-[#3D4756] text-white hover:bg-[#2A3441] transition-colors disabled:opacity-50"
											>
												Start
											</button>
											<button
												type="button"
												disabled={isUpdating}
												onClick={() => {
													const reason = window.prompt("Reason for cancellation (optional):", "");
													updateLessonStatus(item.id, "CANCELLED", reason ?? undefined);
												}}
												className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
											>
												Cancel
											</button>
										</div>
									)}
								</div>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}
