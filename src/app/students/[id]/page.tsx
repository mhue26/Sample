import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/utils/auth";
import { getServerSession } from "next-auth";
import DeleteIcon from "./DeleteIcon";
import ArchiveIcon from "./ArchiveIcon";

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

	return (
		<div className="space-y-6 pt-8 max-w-[90rem] mx-auto font-sans" style={{ fontFamily: "'Work Sans', sans-serif" }}>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<h2 className="text-2xl font-semibold">{student.firstName} {student.lastName}</h2>
					<ArchiveIcon studentId={student.id} />
					<DeleteIcon studentId={student.id} deleteAction={deleteStudent} />
				</div>
				<Link href="/students" className="text-sm text-gray-600 hover:underline">← Back to list</Link>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Basic Information Card */}
				<div className="bg-white rounded-lg border p-6">
					<h3 className="text-lg font-medium mb-4">Basic Information</h3>
					<div className="space-y-4">
						<div>
							<div className="text-sm text-gray-600">Full Name</div>
							<div className="font-medium">{student.firstName} {student.lastName}</div>
						</div>
						<div>
							<div className="text-sm text-gray-600">Email</div>
							<div className="font-medium">{student.email}</div>
						</div>
						<div>
							<div className="text-sm text-gray-600">Phone</div>
							<div className="font-medium">{student.phone || "—"}</div>
						</div>
						<div>
							<div className="text-sm text-gray-600">Year Level</div>
							<div className="font-medium">{student.year ? `Grade ${student.year}` : "—"}</div>
						</div>
					</div>
				</div>

				{/* Academic Information Card */}
				<div className="bg-white rounded-lg border p-6">
					<h3 className="text-lg font-medium mb-4">Academic Information</h3>
					<div className="space-y-4">
						<div>
							<div className="text-sm text-gray-600">Subjects</div>
							<div className="font-medium">{student.subjects || "—"}</div>
						</div>
						<div>
							<div className="text-sm text-gray-600">Hourly Rate</div>
							<div className="font-medium text-lg">{formatCurrencyFromCents(student.hourlyRateCents)}</div>
						</div>
						<div>
							<div className="text-sm text-gray-600">Student Since</div>
							<div className="font-medium">{new Date(student.createdAt).toLocaleDateString()}</div>
						</div>
						{student.isArchived && (
							<div>
								<div className="text-sm text-gray-600">Archived On</div>
								<div className="font-medium text-orange-600">{new Date(student.updatedAt).toLocaleDateString()}</div>
							</div>
						)}
					</div>
				</div>

				{/* Parent Information Card */}
				<div className="bg-white rounded-lg border p-6">
					<h3 className="text-lg font-medium mb-4">Parent Information</h3>
					<div className="space-y-4">
						<div>
							<div className="text-sm text-gray-600">Parent Name</div>
							<div className="font-medium">{student.parentName || "—"}</div>
						</div>
						<div>
							<div className="text-sm text-gray-600">Parent Email</div>
							<div className="font-medium">{student.parentEmail || "—"}</div>
						</div>
						<div>
							<div className="text-sm text-gray-600">Parent Phone</div>
							<div className="font-medium">{student.parentPhone || "—"}</div>
						</div>
					</div>
				</div>

				{/* Notes Card */}
				{student.notes && (
					<div className="bg-white rounded-lg border p-6 lg:col-span-3">
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


