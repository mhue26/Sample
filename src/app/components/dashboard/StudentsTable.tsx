"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StudentAvatar from "@/app/students/StudentAvatar";

interface LessonRow {
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

interface StudentsTableProps {
	lessons: LessonRow[];
}

type SortField = "date" | "student";
type SortDir = "asc" | "desc";

const STATUS_STYLES: Record<
	string,
	{
		label: string;
		className: string;
	}
> = {
	COMPLETED: {
		label: "Completed",
		className: "bg-emerald-50 text-emerald-700",
	},
	NEEDS_REVIEW: {
		label: "Needs review",
		className: "bg-amber-50 text-amber-700",
	},
	CANCELLED: {
		label: "Cancelled",
		className: "bg-red-50 text-red-600",
	},
	IN_PROGRESS: {
		label: "In progress",
		className: "bg-blue-50 text-blue-700",
	},
	SCHEDULED: {
		label: "Scheduled",
		className: "bg-gray-100 text-gray-600",
	},
};

function formatLessonDate(isoStr: string) {
	const d = new Date(isoStr);
	return d.toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function formatLessonTime(isoStr: string) {
	const d = new Date(isoStr);
	return d.toLocaleTimeString("en-US", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
}

export default function StudentsTable({ lessons }: StudentsTableProps) {
	const router = useRouter();
	const [sortField, _setSortField] = useState<SortField>("date");
	const [sortDir, setSortDir] = useState<SortDir>("desc");
	const [deleting, setDeleting] = useState(false);
	const [pendingDelete, setPendingDelete] = useState<{
		id: number;
		title: string;
	} | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	useEffect(() => {
		if (!pendingDelete) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape" && !deleting) {
				setPendingDelete(null);
				setDeleteError(null);
			}
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [pendingDelete, deleting]);

	const toggleSort = () => {
		setSortDir((d) => (d === "asc" ? "desc" : "asc"));
	};

	const sorted = useMemo(() => {
		const rows = [...lessons];
		const dir = sortDir === "asc" ? 1 : -1;
		rows.sort((a, b) => {
			if (sortField === "student") {
				return (
					dir *
					`${a.studentFirstName} ${a.studentLastName}`.localeCompare(
						`${b.studentFirstName} ${b.studentLastName}`,
					)
				);
			}
			return (
				dir *
				(new Date(a.lessonDate).getTime() - new Date(b.lessonDate).getTime())
			);
		});
		return rows;
	}, [lessons, sortField, sortDir]);

	const displayed = useMemo(() => sorted.slice(0, 10), [sorted]);

	function closeDeleteModal() {
		if (deleting) return;
		setPendingDelete(null);
		setDeleteError(null);
	}

	async function confirmDeleteLesson() {
		if (!pendingDelete) return;
		setDeleting(true);
		setDeleteError(null);
		try {
			const res = await fetch(`/api/meetings/${pendingDelete.id}`, {
				method: "DELETE",
			});
			if (!res.ok) {
				setDeleteError(
					"Could not delete this lesson. You may not have permission, or it no longer exists.",
				);
				return;
			}
			setPendingDelete(null);
			router.refresh();
		} finally {
			setDeleting(false);
		}
	}

	return (
		<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
			<div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
				<h2 className="text-xl font-semibold text-gray-900">Recent Lessons</h2>
				<div className="flex items-center gap-2 flex-wrap justify-end">
					<button
						onClick={toggleSort}
						className="flex items-center gap-1.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
					>
						<svg
							className="w-3.5 h-3.5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
							/>
						</svg>
						Sort by {sortField === "date" ? "Date" : "Student"}
					</button>
					<Link
						href="/calendar"
						className="text-sm font-medium text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
					>
						See All
					</Link>
				</div>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full">
					<thead>
						<tr className="border-b border-gray-100">
							<th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3 pr-4">
								Lesson
							</th>
							<th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3 pr-4">
								Date
							</th>
							<th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3 pr-4">
								Time
							</th>
							<th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3">
								Student
							</th>
							<th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pb-3">
								Status
							</th>
							<th className="w-12 pb-3 text-right">
								<span className="sr-only">Actions</span>
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-50">
						{sorted.length === 0 ? (
							<tr>
								<td
									colSpan={6}
									className="py-8 text-center text-sm text-gray-400"
								>
									No past lessons to show yet.
								</td>
							</tr>
						) : (
							displayed.map((lesson) => {
								const rowId = Number(lesson.id);
								const statusKey = (lesson.status || "").toUpperCase();
								const style =
									STATUS_STYLES[statusKey] ??
									STATUS_STYLES.SCHEDULED;
								return (
									<tr
										key={lesson.id}
										className="group hover:bg-gray-50/50 transition-colors"
									>
										<td className="py-3 pr-4">
											<p className="text-base font-medium text-gray-900">
												{lesson.lessonTitle}
											</p>
											{lesson.subjects && (
												<p className="mt-0.5 text-xs text-gray-400">
													{lesson.subjects}
												</p>
											)}
										</td>
										<td className="py-3 pr-4">
											<p className="text-sm text-gray-600">
												{formatLessonDate(lesson.lessonDate)}
											</p>
										</td>
										<td className="py-3 pr-4">
											<p className="text-sm text-gray-600">
												{formatLessonTime(lesson.lessonDate)}
											</p>
										</td>
										<td className="py-3">
											<div className="flex items-center gap-3">
												<StudentAvatar
													firstName={lesson.studentFirstName}
													lastName={lesson.studentLastName}
													studentId={Number(lesson.studentId ?? lesson.id)}
													size={32}
												/>
												<div>
													<Link
														href={
															lesson.studentId
																? `/students/${lesson.studentId}`
																: "#"
														}
														className="text-base font-medium text-gray-900 hover:underline"
													>
														{lesson.studentFirstName}{" "}
														{lesson.studentLastName}
													</Link>
												</div>
											</div>
										</td>
										<td className="py-3">
											<span
												className={`inline-flex text-[10px] font-semibold px-2.5 py-1 rounded-full ${style.className}`}
											>
												{style.label}
											</span>
										</td>
										<td className="py-3 pl-2 text-right align-middle">
											<button
												type="button"
												onClick={() => {
													setDeleteError(null);
													setPendingDelete({
														id: rowId,
														title: lesson.lessonTitle || "Lesson",
													});
												}}
												disabled={deleting}
												className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
												aria-label={`Delete lesson ${lesson.lessonTitle}`}
											>
												<svg
													className="w-4 h-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
													/>
												</svg>
											</button>
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>

			{pendingDelete && (
				<div className="fixed inset-0 z-[100]">
					<button
						type="button"
						className="absolute inset-0 bg-black/40"
						aria-label="Close dialog"
						onClick={closeDeleteModal}
						disabled={deleting}
					/>
					<div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
						<div
							className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200 pointer-events-auto"
							role="dialog"
							aria-modal="true"
							aria-labelledby="delete-lesson-title"
							aria-describedby="delete-lesson-desc"
						>
							<div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
								<div className="min-w-0">
									<h3
										id="delete-lesson-title"
										className="text-base font-semibold text-gray-900"
									>
										Delete lesson?
									</h3>
									<p
										id="delete-lesson-desc"
										className="mt-2 text-sm text-gray-600 leading-relaxed"
									>
										<span className="font-medium text-gray-900 break-words line-clamp-3">
											{pendingDelete.title}
										</span>{" "}
										will be removed permanently. This cannot be undone.
									</p>
								</div>
								<button
									type="button"
									onClick={closeDeleteModal}
									disabled={deleting}
									className="flex-shrink-0 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
									aria-label="Close"
								>
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
							{deleteError && (
								<div className="px-5 pt-3">
									<p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
										{deleteError}
									</p>
								</div>
							)}
							<div className="p-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
								<button
									type="button"
									onClick={closeDeleteModal}
									disabled={deleting}
									className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={() => void confirmDeleteLesson()}
									disabled={deleting}
									className="w-full sm:w-auto px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
								>
									{deleting ? "Deleting…" : "Delete lesson"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
