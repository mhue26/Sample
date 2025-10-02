"use client";

import { useState } from "react";
import Link from "next/link";
import SubjectsDisplay from "./SubjectsDisplay";

type StudentItem = {
	id: string;
	firstName: string;
	lastName: string;
	email: string | null;
	phone: string | null;
	subjects: string | null;
	hourlyRateCents: number;
	year?: number | null; // Year level as number (e.g., 5, 10, 12)
	isActive?: boolean; // Keep for backward compatibility
	isArchived?: boolean; // Keep for backward compatibility
	updatedAt?: string | Date; // For showing when student was archived
};

function formatCurrencyFromCents(valueInCents: number): string {
	const dollars = (valueInCents / 100).toFixed(2);
	return `$${dollars}`;
}

export default function StudentsClient({ students, archivedStudents }: { students: StudentItem[], archivedStudents: StudentItem[] }) {
	const [view, setView] = useState<"list" | "card">("list");
	const [showPastStudents, setShowPastStudents] = useState(false);

	return (
		<div className="space-y-6 pt-8 font-sans" style={{ fontFamily: "'Work Sans', sans-serif" }}>
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold">Students</h2>
				<div className="flex items-center gap-2">
					<button
						className={`rounded-md border px-3 py-1.5 text-sm ${view === "list" ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50"}`}
						onClick={() => setView("list")}
					>
						List View
					</button>
					<button
						className={`rounded-md border px-3 py-1.5 text-sm ${view === "card" ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50"}`}
						onClick={() => setView("card")}
					>
						Card View
					</button>
					<Link
						className="rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700"
						href="/students/new"
					>
						Add Student
					</Link>
				</div>
			</div>

			{view === "list" ? (
				<div className="rounded-lg border bg-white">
					<table className="w-full text-left text-sm">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-3 py-2 w-1/4">Name</th>
								<th className="px-3 py-2 w-1/4">Subjects</th>
								<th className="px-3 py-2 w-1/4">Rate</th>
								<th className="px-3 py-2 w-1/4">Year</th>
							</tr>
						</thead>
						<tbody>
							{students.map((s) => (
								<tr key={s.id} className="border-t">
									<td className="px-3 py-2">
										<Link className="text-blue-600 hover:underline" href={`/students/${s.id}`}>
											{s.firstName} {s.lastName}
										</Link>
									</td>
									<td className="px-3 py-2">
										<SubjectsDisplay subjects={s.subjects || ""} />
									</td>
									<td className="px-3 py-2">{formatCurrencyFromCents(s.hourlyRateCents)}</td>
									<td className="px-3 py-2">{s.year ? `Year ${s.year}` : "—"}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
					{students.map((s) => (
						<div key={s.id} className="rounded-lg border bg-white p-4 hover:shadow-sm transition-shadow">
							<div className="flex items-start justify-between">
								<div>
									<h3 className="font-medium">
										<Link className="text-blue-600 hover:underline" href={`/students/${s.id}`}>
											{s.firstName} {s.lastName}
										</Link>
									</h3>
									<p className="text-sm text-gray-600">{s.email ?? "—"}</p>
									<p className="text-sm text-gray-600">{s.phone ?? "—"}</p>
								</div>
								<span className={`text-xs px-2 py-1 rounded ${s.year ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
									{s.year ? `Year ${s.year}` : "—"}
								</span>
							</div>
							<div className="mt-3 text-sm text-gray-700">
								<div className="flex items-center gap-2">
									<span className="text-gray-500">Subjects:</span>
									<SubjectsDisplay subjects={s.subjects || ""} />
								</div>
								<p><span className="text-gray-500">Rate:</span> {formatCurrencyFromCents(s.hourlyRateCents)}</p>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Past Students Section */}
			<div className="mt-8">
				<button
					onClick={() => setShowPastStudents(!showPastStudents)}
					className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
				>
					<svg 
						className={`w-4 h-4 transition-transform ${showPastStudents ? 'rotate-90' : ''}`}
						fill="none" 
						stroke="currentColor" 
						viewBox="0 0 24 24"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
					<span className="font-medium">Past Students</span>
					<span className="text-sm text-gray-500">({archivedStudents.length} archived)</span>
				</button>

				{showPastStudents && (
					<div className="mt-4">
						{view === "list" ? (
							<div className="rounded-lg border bg-white">
								<table className="w-full text-left text-sm">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-3 py-2 w-1/6">Name</th>
											<th className="px-3 py-2 w-1/6">Email</th>
											<th className="px-3 py-2 w-1/6">Phone</th>
											<th className="px-3 py-2 w-1/6">Subjects</th>
											<th className="px-3 py-2 w-1/6">Rate</th>
											<th className="px-3 py-2 w-1/6">Year</th>
										</tr>
									</thead>
									<tbody>
										{archivedStudents.length > 0 ? (
											archivedStudents.map((s) => (
												<tr key={s.id} className="border-t">
													<td className="px-3 py-2">
														<Link className="text-blue-600 hover:underline" href={`/students/${s.id}`}>
															{s.firstName} {s.lastName}
														</Link>
													</td>
													<td className="px-3 py-2">{s.email ?? "—"}</td>
													<td className="px-3 py-2">{s.phone ?? "—"}</td>
													<td className="px-3 py-2">
														<SubjectsDisplay subjects={s.subjects || ""} />
													</td>
													<td className="px-3 py-2">{formatCurrencyFromCents(s.hourlyRateCents)}</td>
													<td className="px-3 py-2">{s.year ? `Year ${s.year}` : "—"}</td>
												</tr>
											))
										) : (
											<tr>
												<td colSpan={6} className="px-3 py-8 text-center text-gray-500">
													<svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
													</svg>
													<p>No archived students yet</p>
													<p className="text-sm mt-1">Students you archive will appear here</p>
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						) : (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
								{archivedStudents.length > 0 ? (
									archivedStudents.map((s) => (
										<div key={s.id} className="rounded-lg border bg-white p-4 hover:shadow-sm transition-shadow">
											<div className="flex items-start justify-between">
												<div>
													<h3 className="font-medium">
														<Link className="text-blue-600 hover:underline" href={`/students/${s.id}`}>
															{s.firstName} {s.lastName}
														</Link>
													</h3>
													<p className="text-sm text-gray-600">{s.email ?? "—"}</p>
													<p className="text-sm text-gray-600">{s.phone ?? "—"}</p>
												</div>
												<span className={`text-xs px-2 py-1 rounded ${s.year ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
													{s.year ? `Year ${s.year}` : "—"}
												</span>
											</div>
											<div className="mt-3 text-sm text-gray-700">
												<div className="flex items-center gap-2">
													<span className="text-gray-500">Subjects:</span>
													<SubjectsDisplay subjects={s.subjects || ""} />
												</div>
												<p><span className="text-gray-500">Rate:</span> {formatCurrencyFromCents(s.hourlyRateCents)}</p>
											</div>
										</div>
									))
								) : (
									<div className="col-span-full rounded-lg border bg-white p-8 text-center text-gray-500">
										<svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										<p>No archived students yet</p>
										<p className="text-sm mt-1">Students you archive will appear here</p>
									</div>
								)}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}


