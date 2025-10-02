import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/utils/auth";
import { getServerSession } from "next-auth";
import DeleteIcon from "./DeleteIcon";
import ArchiveIcon from "./ArchiveIcon";
import SubjectsDisplay from "../SubjectsDisplay";

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

	const student = await prisma.student.findFirst({ where: { id, userId: (session.user as any).id } });
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
					<ArchiveIcon studentId={student.id} />
					<DeleteIcon studentId={student.id} deleteAction={deleteStudent} />
				</div>
				<Link href="/students" className="text-sm text-gray-600 hover:underline">← Back to list</Link>
			</div>

			<div className="space-y-6">
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
					<div className="bg-white rounded-lg border p-6">
						<h3 className="text-lg font-medium mb-4">Parent Information</h3>
						<div className="space-y-4">
							<div>
								<div className="text-sm text-gray-600">Name</div>
								<div className="font-medium">{student.parentName || "—"}</div>
							</div>
							<div>
								<div className="text-sm text-gray-600">Email</div>
								<div className="font-medium">{student.parentEmail || "—"}</div>
							</div>
							<div>
								<div className="text-sm text-gray-600">Phone</div>
								<div className="font-medium">{student.parentPhone || "—"}</div>
							</div>
						</div>
					</div>

					{/* Academic Information Card */}
					<div className="bg-white rounded-lg border p-6">
						<h3 className="text-lg font-medium mb-4">Academic Information</h3>
						<div className="space-y-4">
							<div>
								<div className="text-sm text-gray-600">Subjects</div>
								<div className="font-medium">
									<SubjectsDisplay subjects={student.subjects || ""} allowColorPicker={true} />
								</div>
							</div>
							<div>
								<div className="text-sm text-gray-600">Year Level</div>
								<div className="font-medium">{student.year ? `Year ${student.year}` : "—"}</div>
							</div>
							<div>
								<div className="text-sm text-gray-600">Hourly Rate</div>
								<div className="font-medium text-lg">{formatCurrencyFromCents(student.hourlyRateCents)}</div>
							</div>
							<div>
								<div className="text-sm text-gray-600">Student Since</div>
								<div className="font-medium">{new Date(student.createdAt).toLocaleDateString('en-GB')} <span className="text-gray-500">{timeAgo}</span></div>
							</div>
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
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
							<div className="text-sm text-gray-600">Meeting Location</div>
							<div className="font-medium">{student.meetingLocation || "—"}</div>
						</div>
						<div>
							<div className="text-sm text-gray-600">Resource Link</div>
							<div className="font-medium">
								{student.resourceLink ? (
									<a 
										href={student.resourceLink} 
										target="_blank" 
										rel="noopener noreferrer"
										className="text-blue-600 hover:text-blue-800 underline break-all"
									>
										{student.resourceLink}
									</a>
								) : (
									"—"
								)}
							</div>
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
			</div>

			{/* Action Buttons */}
			<div className="flex items-center gap-3">
				<Link 
					href={`/students/${student.id}/edit`}
					className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
				>
					Edit Student
				</Link>
			</div>
		</div>
	);
}


