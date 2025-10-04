import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/utils/auth";
import { getServerSession } from "next-auth";
import DeleteIcon from "./DeleteIcon";
import ArchiveIcon from "./ArchiveIcon";
import EditIcon from "./EditIcon";
import SubjectsDisplay from "../SubjectsDisplay";
import LessonBreakdown from "../LessonBreakdown";
import StudentTabs from "../StudentTabs";

function formatCurrencyFromCents(valueInCents: number): string {
	const dollars = (valueInCents / 100).toFixed(2);
	return `$${dollars}`;
}

async function updateStudent(id: number, formData: FormData) {
	"use server";
    const session = await getServerSession(authOptions);
	if (!session?.user) redirect("/signin");
	const firstName = String(formData.get("firstName") || "").trim();
	const lastName = String(formData.get("lastName") || "").trim();
	const email = String(formData.get("email") || "").trim();
	const phone = String(formData.get("phone") || "").trim() || null;
	const subjects = String(formData.get("subjects") || "").trim();
	const year = Number(String(formData.get("year") || "0")) || null;
	const school = String(formData.get("school") || "").trim() || null;
	const hourlyRate = Number(String(formData.get("hourlyRate") || "0"));
	const notes = String(formData.get("notes") || "").trim() || null;
	
	
	// Parent information
	const parentName = String(formData.get("parentName") || "").trim() || null;
	const parentEmail = String(formData.get("parentEmail") || "").trim() || null;
	const parentPhone = String(formData.get("parentPhone") || "").trim() || null;

	await prisma.student.update({
		where: { id },
		data: {
			firstName,
			lastName,
			email,
			phone,
			subjects,
			year,
			school,
			hourlyRateCents: Math.round(hourlyRate * 100),
			notes,
			parentName,
			parentEmail,
			parentPhone,
		},
	});

	redirect(`/students/${id}`);
}

async function deleteStudent(id: number) {
	"use server";
    const session = await getServerSession(authOptions);
	if (!session?.user) redirect("/signin");
    await prisma.student.delete({ where: { id } });
	redirect("/students");
}

export default async function StudentDetail({ params }: { params: Promise<{ id: string }> }) {
	const { id: idString } = await params;
	const id = Number(idString);
	if (Number.isNaN(id)) notFound();

	const session = await getServerSession(authOptions);
	if (!session?.user) redirect("/signin");

	const student = await prisma.student.findFirst({ 
		where: { id, userId: (session.user as any).id },
		include: {
			meetings: {
				where: {
					startTime: {
						gte: new Date()
					},
					isCompleted: false
				},
				orderBy: {
					startTime: 'asc'
				},
				take: 1
			},
			class: true
		}
	});

	// Fetch all meetings for lesson breakdown
	const allMeetings = await prisma.meeting.findMany({
		where: {
			studentId: id,
			userId: (session.user as any).id
		},
		orderBy: {
			startTime: 'desc'
		}
	});

	// Fetch teaching periods (terms and holidays)
	const [terms, holidays] = await Promise.all([
		prisma.term.findMany({
			where: { userId: (session.user as any).id },
			orderBy: { startDate: 'desc' }
		}),
		prisma.holiday.findMany({
			where: { userId: (session.user as any).id },
			orderBy: { startDate: 'desc' }
		})
	]);

	const teachingPeriods = [
		...terms.map(term => ({ ...term, type: 'term' as const })),
		...holidays.map(holiday => ({ ...holiday, type: 'holiday' as const }))
	];
	if (!student) notFound();

	// Parse contact information (multiple contacts separated by " | ")
	const parseContactInfo = (phone: string | null) => {
		if (!phone) return [];
		
		const contacts = phone.split(" | ");
		return contacts.map(contact => {
			const colonIndex = contact.indexOf(": ");
			if (colonIndex > -1) {
				return {
					method: contact.substring(0, colonIndex),
					details: contact.substring(colonIndex + 2)
				};
			}
			// If no colon, assume it's a phone number
			return { method: "Phone", details: contact };
		});
	};

	const contactInfos = parseContactInfo(student.phone);

	// Calculate time since student was created
	const calculateTimeAgo = (date: Date) => {
		const now = new Date();
		const diffTime = Math.abs(now.getTime() - date.getTime());
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
		
		if (diffDays === 0) return "(today)";
		if (diffDays === 1) return "(1 day ago)";
		if (diffDays < 30) return `(${diffDays} days ago)`;
		
		const diffMonths = Math.floor(diffDays / 30);
		const remainingDays = diffDays % 30;
		
		if (diffMonths === 1) {
			if (remainingDays === 0) return "(1 month ago)";
			if (remainingDays === 1) return "(1 month and 1 day ago)";
			return `(1 month and ${remainingDays} days ago)`;
		}
		
		if (remainingDays === 0) return `(${diffMonths} months ago)`;
		if (remainingDays === 1) return `(${diffMonths} months and 1 day ago)`;
		return `(${diffMonths} months and ${remainingDays} days ago)`;
	};

	const timeAgo = calculateTimeAgo(new Date(student.createdAt));

	return (
		<div className="space-y-6 pt-8 font-sans" style={{ fontFamily: "'Work Sans', sans-serif" }}>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<h2 className="text-2xl font-semibold">{student.firstName} {student.lastName}</h2>
					<EditIcon studentId={student.id} />
					<ArchiveIcon studentId={student.id} />
					<DeleteIcon studentId={student.id} deleteAction={deleteStudent} />
				</div>
				<Link href="/students" className="text-sm text-gray-600 hover:underline">← Back to list</Link>
			</div>

			{/* Goals Callout */}
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
				<div className="flex items-start gap-3">
					<div className="flex-shrink-0">
						<svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div className="flex-1">
						<h3 className="text-sm font-medium text-blue-900 mb-1">Student Goals</h3>
						<div className="text-sm text-blue-800">
							{student.notes ? (
								<div className="whitespace-pre-wrap">{student.notes}</div>
							) : (
								<div className="text-blue-600 italic">No goals set yet. Click edit to add student goals and objectives.</div>
							)}
						</div>
					</div>
				</div>
			</div>

			<StudentTabs 
				meetings={allMeetings}
				teachingPeriods={teachingPeriods}
				studentName={`${student.firstName} ${student.lastName}`}
				studentSubjects={student.schoolSubjects || ""}
			>
				{/* Next Lesson Card */}
				{student.meetings.length > 0 ? (
					<div className="bg-white rounded-lg border p-6">
						<h3 className="text-lg font-medium mb-4">Upcoming</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							<div>
								<div className="text-sm text-gray-600">Title</div>
								<div className="font-medium">{student.meetings[0].title}</div>
							</div>
							<div>
								<div className="text-sm text-gray-600">Date</div>
								<div className="font-medium">{new Date(student.meetings[0].startTime).toLocaleDateString('en-GB')}</div>
							</div>
							<div>
								<div className="text-sm text-gray-600">Time</div>
								<div className="font-medium">
									{new Date(student.meetings[0].startTime).toLocaleTimeString('en-GB', { 
										hour: '2-digit', 
										minute: '2-digit',
										hour12: true 
									})} - {new Date(student.meetings[0].endTime).toLocaleTimeString('en-GB', { 
										hour: '2-digit', 
										minute: '2-digit',
										hour12: true 
									})}
								</div>
							</div>
							<div>
								<div className="text-sm text-gray-600">Duration</div>
								<div className="font-medium">
									{Math.round((new Date(student.meetings[0].endTime).getTime() - new Date(student.meetings[0].startTime).getTime()) / (1000 * 60 * 60))} hours
								</div>
							</div>
						</div>
						{student.meetings[0].description && (
							<div className="mt-4">
								<div className="text-sm text-gray-600">Description</div>
								<div className="font-medium text-gray-700">{student.meetings[0].description}</div>
							</div>
						)}
					</div>
				) : (
					<div className="bg-white rounded-lg border p-6">
						<h3 className="text-lg font-medium mb-4">Upcoming</h3>
						<div className="text-gray-500">No upcoming events scheduled</div>
					</div>
				)}

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Student Information Card */}
					<div className="bg-white rounded-lg border p-6">
						<h3 className="text-lg font-medium mb-4">Student Information</h3>
						<div className="space-y-4">
							<div>
								<div className="text-sm text-gray-600">Name</div>
								<div className="font-medium">{student.firstName} {student.lastName}</div>
							</div>
							<div>
								<div className="text-sm text-gray-600">Email</div>
								<div className="font-medium">{student.email}</div>
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

					{/* Parent Information Card */}
					{student.parentEmail !== "N/A" && (
						<div className="bg-white rounded-lg border p-6">
							<h3 className="text-lg font-medium mb-4">Parent Information</h3>
							<div className="space-y-4">
								{student.parentEmail && (
									<div>
										<div className="text-sm text-gray-600">Relationship</div>
										<div className="font-medium">{student.parentEmail}</div>
									</div>
								)}
								<div>
									<div className="text-sm text-gray-600">Name</div>
									<div className="font-medium">{student.parentName || "—"}</div>
								</div>
							{student.parentPhone && (
								<div>
									<div className="text-sm text-gray-600">Preferred Contact</div>
									<div className="font-medium">{student.parentPhone}</div>
								</div>
							)}
							{(() => {
								// Parse alternative contacts from notes
								try {
									if (student.notes && student.notes.startsWith('{"alternativeContacts":')) {
										const parsed = JSON.parse(student.notes);
										const alternativeContacts = parsed.alternativeContacts || [];
										if (alternativeContacts.length > 0) {
											return (
												<div>
													<div className="text-sm text-gray-600">Alternative Contacts</div>
													<div className="space-y-2">
														{alternativeContacts.map((contact: any, index: number) => (
															<div key={index} className="font-medium">
																{contact.method}: {contact.details}
															</div>
														))}
													</div>
												</div>
											);
										}
									}
								} catch (e) {
									// Ignore parsing errors
								}
								return null;
							})()}
							</div>
						</div>
					)}

					{/* Academic Information Card */}
					<div className="bg-white rounded-lg border p-6">
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
								<div className="font-medium">{student.year ? `Year ${student.year}` : "—"}</div>
							</div>
							<div>
								<div className="text-sm text-gray-600">School</div>
								<div className="font-medium">{student.school || "—"}</div>
							</div>
							<div>
								<div className="text-sm text-gray-600">Student Since</div>
								<div className="font-medium">{new Date(student.createdAt).toLocaleDateString('en-GB')} <span className="text-gray-500">{timeAgo}</span></div>
							</div>
							{student.class && (
								<div>
									<div className="text-sm text-gray-600">Class</div>
									<div className="font-medium flex items-center gap-2">
										<div 
											className="w-3 h-3 rounded-full" 
											style={{ backgroundColor: student.class.color }}
										></div>
										{student.class.name}
									</div>
								</div>
							)}
							{student.isArchived && (
								<div>
									<div className="text-sm text-gray-600">Archived On</div>
									<div className="font-medium text-orange-600">{new Date(student.updatedAt).toLocaleDateString('en-GB')} <span className="text-gray-500">{calculateTimeAgo(new Date(student.updatedAt))}</span></div>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Lesson Information Card */}
				<div className="bg-white rounded-lg border p-6">
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

				{/* Notes Card */}
				{student.notes && (
					<div className="bg-white rounded-lg border p-6">
						<h3 className="text-lg font-medium mb-4">Notes</h3>
						<div className="text-gray-700 whitespace-pre-wrap">{student.notes}</div>
					</div>
				)}
			</StudentTabs>

		</div>
	);
}


