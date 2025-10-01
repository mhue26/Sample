import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/utils/auth";
import { getServerSession } from "next-auth";
import SubjectsMultiSelect from "../SubjectsMultiSelect";

async function createStudent(formData: FormData) {
	"use server";
    const session = await getServerSession(authOptions);
	if (!session?.user) {
		redirect("/signin");
	}
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

	await prisma.student.create({
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
			userId: (session.user as any).id as string,
		},
	});

	redirect("/students");
}

export default function NewStudentPage() {
	return (
		<div className="space-y-4">
			<h2 className="text-2xl font-semibold">Add Student</h2>
			<form action={createStudent} className="bg-white p-4 rounded-lg border space-y-3">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<label className="block">
						<div className="text-sm text-gray-700">First name</div>
						<input name="firstName" required className="mt-1 w-full border rounded-md px-3 py-2" />
					</label>
					<label className="block">
						<div className="text-sm text-gray-700">Last name</div>
						<input name="lastName" required className="mt-1 w-full border rounded-md px-3 py-2" />
					</label>
					<label className="block sm:col-span-2">
						<div className="text-sm text-gray-700">Email</div>
						<input type="email" name="email" required className="mt-1 w-full border rounded-md px-3 py-2" />
					</label>
					<label className="block sm:col-span-2">
						<div className="text-sm text-gray-700">Phone</div>
						<input name="phone" className="mt-1 w-full border rounded-md px-3 py-2" />
					</label>
					<label className="block sm:col-span-2">
						<div className="text-sm text-gray-700">Subjects</div>
						<SubjectsMultiSelect name="subjects" />
					</label>
					<label className="block sm:col-span-2">
						<div className="text-sm text-gray-700">Year level</div>
						<select name="year" className="mt-1 w-full border rounded-md px-3 py-2">
							<option value="">Select year level</option>
							{Array.from({ length: 12 }, (_, i) => i + 1).map(year => (
								<option key={year} value={year}>Year {year}</option>
							))}
						</select>
					</label>
					<label className="block sm:col-span-2">
						<div className="text-sm text-gray-700">Hourly rate (e.g., 45)</div>
						<input name="hourlyRate" type="number" step="0.01" min="0" className="mt-1 w-full border rounded-md px-3 py-2" />
					</label>
					<label className="block sm:col-span-2">
						<div className="text-sm text-gray-700">Notes</div>
						<textarea name="notes" rows={4} className="mt-1 w-full border rounded-md px-3 py-2" />
					</label>
				</div>
				
				{/* Parent Information Section */}
				<div className="border-t pt-4">
					<h3 className="text-lg font-medium text-gray-900 mb-4">Parent Information</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<label className="block sm:col-span-2">
							<div className="text-sm text-gray-700">Parent/Guardian Name</div>
							<input name="parentName" className="mt-1 w-full border rounded-md px-3 py-2" />
						</label>
						<label className="block sm:col-span-2">
							<div className="text-sm text-gray-700">Parent/Guardian Email</div>
							<input type="email" name="parentEmail" className="mt-1 w-full border rounded-md px-3 py-2" />
						</label>
						<label className="block sm:col-span-2">
							<div className="text-sm text-gray-700">Parent/Guardian Phone</div>
							<input name="parentPhone" className="mt-1 w-full border rounded-md px-3 py-2" />
						</label>
					</div>
				</div>
				
				<div className="flex items-center gap-2">
					<button className="rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700">Save</button>
					<a href="/students" className="text-sm text-gray-600 hover:underline">Cancel</a>
				</div>
			</form>
		</div>
	);
}


