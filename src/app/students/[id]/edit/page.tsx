import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/utils/auth";
import { getServerSession } from "next-auth";
import SubjectsMultiSelect from "../../SubjectsMultiSelect";

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

export default async function EditStudent({ params }: { params: Promise<{ id: string }> }) {
	const { id: idString } = await params;
	const id = Number(idString);
	if (Number.isNaN(id)) notFound();

	const session = await getServerSession(authOptions);
	if (!session?.user) redirect("/signin");

	const student = await prisma.student.findFirst({ 
		where: { id, userId: (session.user as any).id } 
	});
	if (!student) notFound();

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold">Edit Student</h2>
				<Link href={`/students/${id}`} className="text-sm text-gray-600 hover:underline">← Back to student</Link>
			</div>

			<form action={updateStudent.bind(null, id)} className="bg-white p-6 rounded-lg border space-y-6">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<label className="block">
						<div className="text-sm text-gray-700">First name</div>
						<input 
							name="firstName" 
							required 
							defaultValue={student.firstName}
							className="mt-1 w-full border rounded-md px-3 py-2" 
						/>
					</label>
					<label className="block">
						<div className="text-sm text-gray-700">Last name</div>
						<input 
							name="lastName" 
							required 
							defaultValue={student.lastName}
							className="mt-1 w-full border rounded-md px-3 py-2" 
						/>
					</label>
					<label className="block sm:col-span-2">
						<div className="text-sm text-gray-700">Email</div>
						<input 
							type="email" 
							name="email" 
							required 
							defaultValue={student.email}
							className="mt-1 w-full border rounded-md px-3 py-2" 
						/>
					</label>
					<label className="block sm:col-span-2">
						<div className="text-sm text-gray-700">Phone</div>
						<input 
							name="phone" 
							defaultValue={student.phone || ""}
							className="mt-1 w-full border rounded-md px-3 py-2" 
						/>
					</label>
					<label className="block sm:col-span-2">
						<div className="text-sm text-gray-700">Subjects</div>
						<SubjectsMultiSelect name="subjects" defaultValue={student.subjects || ""} />
					</label>
					<label className="block sm:col-span-2">
						<div className="text-sm text-gray-700">Year level</div>
						<select name="year" className="mt-1 w-full border rounded-md px-3 py-2">
							<option value="">Select year level</option>
							{Array.from({ length: 12 }, (_, i) => i + 1).map(year => (
								<option key={year} value={year} selected={student.year === year}>
									Year {year}
								</option>
							))}
						</select>
					</label>
					<label className="block sm:col-span-2">
						<div className="text-sm text-gray-700">Hourly rate (e.g., 45)</div>
						<input 
							name="hourlyRate" 
							type="number" 
							step="0.01" 
							min="0" 
							defaultValue={student.hourlyRateCents / 100}
							className="mt-1 w-full border rounded-md px-3 py-2" 
						/>
					</label>
					<label className="block sm:col-span-2">
						<div className="text-sm text-gray-700">Notes</div>
						<textarea 
							name="notes" 
							rows={4} 
							defaultValue={student.notes || ""}
							className="mt-1 w-full border rounded-md px-3 py-2" 
						/>
					</label>
				</div>

				{/* Parent Information Section */}
				<div className="border-t pt-6">
					<h3 className="text-lg font-medium text-gray-900 mb-4">Parent Information</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<label className="block">
							<div className="text-sm text-gray-700">Parent Name</div>
							<input 
								name="parentName" 
								defaultValue={student.parentName || ""}
								className="mt-1 w-full border rounded-md px-3 py-2" 
							/>
						</label>
						<label className="block">
							<div className="text-sm text-gray-700">Parent Email</div>
							<input 
								type="email" 
								name="parentEmail" 
								defaultValue={student.parentEmail || ""}
								className="mt-1 w-full border rounded-md px-3 py-2" 
							/>
						</label>
						<label className="block sm:col-span-2">
							<div className="text-sm text-gray-700">Parent Phone</div>
							<input 
								name="parentPhone" 
								defaultValue={student.parentPhone || ""}
								className="mt-1 w-full border rounded-md px-3 py-2" 
							/>
						</label>
					</div>
				</div>

				<div className="flex items-center gap-3 pt-4">
					<button 
						type="submit" 
						className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
					>
						Update Student
					</button>
					<Link 
						href={`/students/${id}`}
						className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
					>
						Cancel
					</Link>
				</div>
			</form>
		</div>
	);
}
