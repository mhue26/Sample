import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/utils/auth";
import { getServerSession } from "next-auth";

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
	const hourlyRate = Number(String(formData.get("hourlyRate") || "0"));
	const notes = String(formData.get("notes") || "").trim() || null;
	const isActive = String(formData.get("isActive") || "true") === "true";

	await prisma.student.update({
		where: { id },
		data: {
			firstName,
			lastName,
			email,
			phone,
			subjects,
			hourlyRateCents: Math.round(hourlyRate * 100),
			notes,
			isActive,
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

export default async function StudentDetail({ params }: { params: { id: string } }) {
	const id = Number(params.id);
	if (Number.isNaN(id)) notFound();

	const session = await getServerSession(authOptions);
	if (!session?.user) redirect("/signin");

	const student = await prisma.student.findFirst({ where: { id, userId: (session.user as any).id } });
	if (!student) notFound();

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold">{student.firstName} {student.lastName}</h2>
				<Link href="/students" className="text-sm text-gray-600 hover:underline">Back to list</Link>
			</div>

			<div className="bg-white rounded-lg border p-4 space-y-4">
				<form action={updateStudent.bind(null, student.id)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<label className="block">
						<div className="text-sm text-gray-700">First name</div>
						<input name="firstName" defaultValue={student.firstName} className="mt-1 w-full border rounded-md px-3 py-2" />
					</label>
					<label className="block">
						<div className="text-sm text-gray-700">Last name</div>
						<input name="lastName" defaultValue={student.lastName} className="mt-1 w-full border rounded-md px-3 py-2" />
					</label>
					<label className="block sm:col-span-2">
						<div className="text-sm text-gray-700">Email</div>
						<input type="email" name="email" defaultValue={student.email} className="mt-1 w-full border rounded-md px-3 py-2" />
					</label>
					<label className="block sm:col-span-2">
						<div className="text-sm text-gray-700">Phone</div>
						<input name="phone" defaultValue={student.phone ?? undefined} className="mt-1 w-full border rounded-md px-3 py-2" />
					</label>
					<label className="block sm:col-span-2">
						<div className="text-sm text-gray-700">Subjects (comma-separated)</div>
						<input name="subjects" defaultValue={student.subjects} className="mt-1 w-full border rounded-md px-3 py-2" />
					</label>
					<label className="block sm:col-span-2">
						<div className="text-sm text-gray-700">Hourly rate (e.g., 45)</div>
						<input name="hourlyRate" type="number" step="0.01" min="0" defaultValue={student.hourlyRateCents / 100} className="mt-1 w-full border rounded-md px-3 py-2" />
					</label>
					<label className="block sm:col-span-2">
						<div className="text-sm text-gray-700">Notes</div>
						<textarea name="notes" rows={4} defaultValue={student.notes ?? undefined} className="mt-1 w-full border rounded-md px-3 py-2" />
					</label>
					<label className="block sm:col-span-2">
						<div className="text-sm text-gray-700">Status</div>
						<select name="isActive" defaultValue={student.isActive ? "true" : "false"} className="mt-1 w-full border rounded-md px-3 py-2">
							<option value="true">Active</option>
							<option value="false">Inactive</option>
						</select>
					</label>
					<div className="flex items-center gap-2 sm:col-span-2">
						<button className="rounded-md bg-black text-white px-3 py-2 text-sm hover:opacity-90">Save changes</button>
						<button formAction={deleteStudent.bind(null, student.id)} className="rounded-md bg-red-600 text-white px-3 py-2 text-sm hover:opacity-90">Delete</button>
					</div>
				</form>
			</div>

			<div className="bg-white rounded-lg border p-4">
				<div className="text-sm text-gray-600">Email</div>
				<div className="font-medium">{student.email}</div>
				<div className="mt-2 text-sm text-gray-600">Rate</div>
				<div className="font-medium">{formatCurrencyFromCents(student.hourlyRateCents)}</div>
				<div className="mt-2 text-sm text-gray-600">Subjects</div>
				<div className="font-medium">{student.subjects || "—"}</div>
			</div>
		</div>
	);
}


