import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/utils/auth";
import { getStudentLedgerBalanceCents } from "@/lib/ledger";
import StudentAccountLedger from "../StudentAccountLedger";
import { getLessonDisplayTitle } from "@/utils/teachingPeriods";
import DeleteIcon from "./DeleteIcon";
import ArchiveIcon from "./ArchiveIcon";
import EditIcon from "./EditIcon";
import SubjectsDisplay from "../SubjectsDisplay";
import StudentTabs from "../StudentTabs";
import EditableGoals from "./EditableGoals";
import CheckInsSection from "./CheckInsSection";
import ResultsSection from "./ResultsSection";
import StudentAvatar from "../StudentAvatar";

function formatCurrencyFromCents(valueInCents: number): string {
	const dollars = (valueInCents / 100).toFixed(2);
	return `$${dollars}`;
}

async function deleteStudent(id: number) {
	"use server";
	const ctx = await requireOrgContext();
	const student = await prisma.student.findFirst({
		where: { id, organisationId: ctx.organisationId },
	});
	if (!student) return;
	await prisma.student.delete({ where: { id } });
	redirect("/students");
}

export default async function StudentDetail({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ tab?: string }>;
}) {
	const { id: idString } = await params;
	const sp = await searchParams;
	const id = Number(idString);
	if (Number.isNaN(id)) notFound();

	const ctx = await requireOrgContext();
	const initialTab =
		sp.tab === "account" ? ("account" as const) : ("profile" as const);
	const canManageBilling = ctx.role === "OWNER" || ctx.role === "ADMIN";

	const student = await prisma.student.findFirst({
		where: { id, organisationId: ctx.organisationId },
		include: {
			meetings: {
				where: {
					startTime: { gte: new Date() },
					status: { in: ["SCHEDULED", "IN_PROGRESS", "NEEDS_REVIEW"] },
				},
				orderBy: { startTime: "asc" },
				take: 1,
			},
			class: true,
		},
	});

	if (!student) notFound();

	const allMeetings = await prisma.meeting.findMany({
		where: { studentId: id, organisationId: ctx.organisationId },
		orderBy: { startTime: "desc" },
	});

	const [terms, holidays, keyDates, ledgerEntries, balanceCents, payAgg, billingSettings] = await Promise.all([
		prisma.term.findMany({
			where: { organisationId: ctx.organisationId },
			orderBy: { startDate: "desc" },
		}),
		prisma.holiday.findMany({
			where: { organisationId: ctx.organisationId },
			orderBy: { startDate: "desc" },
		}),
		(prisma as any).keyDate?.findMany({
			where: {
				organisationId: ctx.organisationId,
				OR: [
					{ scope: "ORGANISATION" },
					student.classId
						? { AND: [{ scope: "CLASS" }, { classId: student.classId }] }
						: { AND: [{ scope: "YEAR_LEVEL" }, { year: student.year }] },
				],
			},
			orderBy: { date: "asc" },
		}) ?? [],
		prisma.ledgerEntry.findMany({
			where: {
				studentId: id,
				organisationId: ctx.organisationId,
				voidedAt: null,
			},
			orderBy: [{ effectiveDate: "desc" }, { createdAt: "desc" }],
			take: 200,
		}),
		getStudentLedgerBalanceCents(id, ctx.organisationId),
		prisma.ledgerEntry.aggregate({
			where: {
				studentId: id,
				organisationId: ctx.organisationId,
				voidedAt: null,
				type: "PAYMENT",
			},
			_sum: { amountCents: true },
		}),
		prisma.billingSettings.findUnique({
			where: { organisationId: ctx.organisationId },
		}),
	]);

	const totalPaidCents = Math.abs(payAgg._sum.amountCents ?? 0);

	const teachingPeriods: any[] = [
		...terms.map((term) => ({ ...term, type: "term" as const })),
		...holidays.map((holiday) => ({ ...holiday, type: "holiday" as const })),
	];

	const parseContactInfo = (phone: string | null) => {
		if (!phone) return [];
		return phone.split(" | ").map((contact) => {
			const colonIndex = contact.indexOf(": ");
			if (colonIndex > -1) {
				return { method: contact.substring(0, colonIndex), details: contact.substring(colonIndex + 2) };
			}
			return { method: "Phone", details: contact };
		});
	};

	const contactInfos = parseContactInfo(student.phone);

	const calculateTimeAgo = (date: Date) => {
		const now = new Date();
		const diffDays = Math.floor(Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
		if (diffDays === 0) return "(today)";
		if (diffDays === 1) return "(1 day ago)";
		if (diffDays < 30) return `(${diffDays} days ago)`;
		const diffMonths = Math.floor(diffDays / 30);
		const remainingDays = diffDays % 30;
		if (diffMonths === 1) {
			if (remainingDays === 0) return "(1 month ago)";
			return `(1 month and ${remainingDays} day${remainingDays > 1 ? "s" : ""} ago)`;
		}
		if (remainingDays === 0) return `(${diffMonths} months ago)`;
		return `(${diffMonths} months and ${remainingDays} day${remainingDays > 1 ? "s" : ""} ago)`;
	};

	const timeAgo = calculateTimeAgo(new Date(student.createdAt));

	const upcomingKeyDates = (keyDates as any[])
		.map((kd) => {
			const date = new Date(kd.date);
			const diffDays = Math.ceil(
				(date.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000)
			);
			return {
				id: kd.id as string,
				title: kd.title as string,
				date,
				diffDays,
			};
		})
		.filter((kd) => kd.diffDays >= -7) // show recent + upcoming
		.sort((a, b) => a.date.getTime() - b.date.getTime());

	return (
		<div className="space-y-6 pt-8 font-sans" style={{ fontFamily: "'Work Sans', sans-serif" }}>
			<div className="space-y-6">
				<Link href="/students" className="text-sm text-gray-600 hover:underline cursor-pointer">← Back to Students</Link>

				<div className="flex flex-col items-center gap-3">
					<StudentAvatar
						firstName={student.firstName}
						lastName={student.lastName}
						studentId={student.id}
					/>
					<h2 className="text-2xl font-semibold">{student.firstName} {student.lastName}</h2>
					<div className="flex items-center gap-3">
						<EditIcon studentId={student.id} />
						<ArchiveIcon studentId={student.id} />
						<DeleteIcon studentId={student.id} deleteAction={deleteStudent} />
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<div>
						<EditableGoals studentId={student.id} initialNotes={student.notes} />
					</div>
					<div>
						{student.meetings.length > 0 ? (
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 h-full">
								<div className="flex items-start gap-3">
									<svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
									<div className="flex-1">
										<h3 className="text-sm font-medium text-blue-900 mb-1">Upcoming</h3>
										<div className="text-sm text-blue-800 space-y-2">
											<div>
												<div className="text-xs text-blue-600 font-medium">Title</div>
												<div>
													{getLessonDisplayTitle(student.meetings[0], teachingPeriods.filter((p: { type: string }) => p.type === "term"))}
												</div>
											</div>
											<div>
												<div className="text-xs text-blue-600 font-medium">Date</div>
												<div>{new Date(student.meetings[0].startTime).toLocaleDateString("en-GB")}</div>
											</div>
											<div>
												<div className="text-xs text-blue-600 font-medium">Time</div>
												<div>
													{new Date(student.meetings[0].startTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })}
													{" - "}
													{new Date(student.meetings[0].endTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })}
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						) : (
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 h-full">
								<div className="flex items-start gap-3">
									<svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
									<div className="flex-1">
										<h3 className="text-sm font-medium text-blue-900 mb-1">Upcoming</h3>
										<div className="text-blue-600 italic text-sm">No upcoming events scheduled</div>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<CheckInsSection studentId={student.id} />
				<ResultsSection studentId={student.id} />
			</div>

			<StudentTabs
				meetings={allMeetings}
				teachingPeriods={teachingPeriods}
				studentName={`${student.firstName} ${student.lastName}`}
				studentSubjects={student.schoolSubjects || ""}
				initialTab={initialTab}
				accountTab={
					<StudentAccountLedger
						balanceCents={balanceCents}
						totalPaidCents={totalPaidCents}
						currency={billingSettings?.currency ?? "AUD"}
						canManageBilling={canManageBilling}
						entries={ledgerEntries.map((e) => ({
							id: e.id,
							type: e.type,
							amountCents: e.amountCents,
							effectiveDate: e.effectiveDate.toISOString(),
							description: e.description,
							voidedAt: e.voidedAt?.toISOString() ?? null,
						}))}
					/>
				}
			>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="bg-white rounded-2xl shadow-sm p-6">
						<h3 className="text-lg font-medium mb-4">Student Information</h3>
						<div className="space-y-4">
							<div>
								<div className="text-sm text-gray-600">Name</div>
								<div className="font-medium">{student.firstName} {student.lastName}</div>
							</div>
							<div>
								<div className="text-sm text-gray-600">Email</div>
								<div className="font-medium">{student.email || "—"}</div>
							</div>
							{contactInfos.length > 0 ? (
								contactInfos.map((contact, index) => (
									<div key={index}>
										<div className="text-sm text-gray-600">{contact.method}</div>
										<div className="font-medium">{contact.details}</div>
									</div>
								))
							) : (
								<div>
									<div className="text-sm text-gray-600">Contact</div>
									<div className="font-medium">—</div>
								</div>
							)}
						</div>
					</div>

					{(() => {
						const PARENT_DELIMITER = " || ";
						const names = (student.parentName || "").split(PARENT_DELIMITER).map((s) => s.trim()).filter(Boolean);
						const relationships = (student.parentEmail || "").split(PARENT_DELIMITER).map((s) => s.trim());
						const phones = (student.parentPhone || "").split(PARENT_DELIMITER).map((s) => s.trim());
						const n = Math.max(names.length, relationships.length, phones.length);
						if (n === 0) return null;
						const parentList = Array.from({ length: n }, (_, i) => ({
							relationship: relationships[i] ?? "",
							name: names[i] ?? "",
							phone: phones[i] ?? "",
						}));
						return (
							<div className="bg-white rounded-2xl shadow-sm p-6">
								<h3 className="text-lg font-medium mb-4">Parent Information</h3>
								<div className="space-y-6">
									{parentList.map((p, i) => (
										<div key={i} className={i > 0 ? "pt-4 border-t border-gray-100" : ""}>
											{parentList.length > 1 && (
												<div className="text-xs font-medium text-gray-400 mb-2">Parent {i + 1}</div>
											)}
											<div className="space-y-4">
												{p.relationship && (
													<div>
														<div className="text-sm text-gray-600">Relationship</div>
														<div className="font-medium">{p.relationship}</div>
													</div>
												)}
												{(p.name || p.relationship !== "N/A") && (
													<div>
														<div className="text-sm text-gray-600">Name</div>
														<div className="font-medium">{p.name || "—"}</div>
													</div>
												)}
												{p.phone && (
													<div>
														<div className="text-sm text-gray-600">Contact</div>
														<div className="font-medium">{p.phone.replace(/\s*\|\s*/g, ", ")}</div>
													</div>
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						);
					})()}

					<div className="bg-white rounded-2xl shadow-sm p-6">
						<h3 className="text-lg font-medium mb-4">Academic Information</h3>
						<div className="space-y-4">
							<div>
								<div className="text-sm text-gray-600">School Subjects</div>
								<div className="font-medium">
									<SubjectsDisplay subjects={student.schoolSubjects || ""} allowColorPicker={true} />
								</div>
							</div>
							<div>
								<div className="text-sm text-gray-600">Year Level</div>
								<div className="font-medium">
									{student.year == null
										? "—"
										: student.year >= 13
											? "Graduated"
											: `Year ${student.year}`}
								</div>
							</div>
							<div>
								<div className="text-sm text-gray-600">School</div>
								<div className="font-medium">{student.school || "—"}</div>
							</div>
							<div>
								<div className="text-sm text-gray-600">Student Since</div>
								<div className="font-medium">{new Date(student.createdAt).toLocaleDateString("en-GB")} <span className="text-gray-500">{timeAgo}</span></div>
							</div>
							{student.class && (
								<div>
									<div className="text-sm text-gray-600">Class</div>
									<div className="font-medium flex items-center gap-2">
										<div className="w-3 h-3 rounded-full" style={{ backgroundColor: student.class.color }}></div>
										{student.class.name}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				<div className="bg-white rounded-2xl shadow-sm p-6">
					<h3 className="text-lg font-medium mb-4">Events</h3>
					{upcomingKeyDates.length > 0 ? (
						<ul className="space-y-2 text-sm">
							{upcomingKeyDates.slice(0, 6).map((kd) => (
								<li key={kd.id} className="flex items-center justify-between">
									<div>
										<p className="font-medium text-gray-900">{kd.title}</p>
										<p className="text-gray-600">
											{kd.date.toLocaleDateString("en-GB", {
												weekday: "short",
												day: "numeric",
												month: "short",
											})}
										</p>
									</div>
									<div className="text-xs text-gray-600 whitespace-nowrap">
										{kd.diffDays > 0
											? `In ${kd.diffDays} day${kd.diffDays === 1 ? "" : "s"}`
											: kd.diffDays === 0
											? "Today"
											: `${Math.abs(kd.diffDays)} day${
													Math.abs(kd.diffDays) === 1 ? "" : "s"
											  } ago`}
									</div>
								</li>
							))}
						</ul>
					) : (
						<p className="text-sm text-gray-500">
							No events found for this student.
						</p>
					)}
				</div>

				<div className="bg-white rounded-2xl shadow-sm p-6">
					<h3 className="text-lg font-medium mb-4">Lesson Information</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<div>
							<div className="text-sm text-gray-600">Hourly Rate</div>
							<div className="font-medium text-lg">{formatCurrencyFromCents(student.hourlyRateCents)}</div>
						</div>
						<div>
							<div className="text-sm text-gray-600">Subjects</div>
							<div className="font-medium">
								<SubjectsDisplay subjects={student.subjects || ""} allowColorPicker={false} />
							</div>
						</div>
						<div>
							<div className="text-sm text-gray-600">Location</div>
							<div className="font-medium">{student.meetingLocation || "—"}</div>
						</div>
					</div>
				</div>
			</StudentTabs>
		</div>
	);
}
