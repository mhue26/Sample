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
	// Process multiple alternative contacts
	const contacts = [];
	let contactIndex = 1;
	while (formData.get(`contactMethod${contactIndex}`)) {
		const method = String(formData.get(`contactMethod${contactIndex}`) || "").trim();
		const details = String(formData.get(`contactDetails${contactIndex}`) || "").trim();
		if (method && details) {
			contacts.push(`${method}: ${details}`);
		}
		contactIndex++;
	}
	const phone = contacts.length > 0 ? contacts.join(" | ") : null;
	const subjects = String(formData.get("subjects") || "").trim();
	const year = Number(String(formData.get("year") || "0")) || null;
	const hourlyRate = Number(String(formData.get("hourlyRate") || "0"));
	const notes = String(formData.get("notes") || "").trim() || null;
	const studentSince = String(formData.get("studentSince") || "");
	
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
			createdAt: studentSince ? new Date(studentSince) : undefined,
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

	// Parse existing phone data (multiple contacts separated by " | ")
	const parseContactInfo = (phone: string | null) => {
		if (!phone) return [{ method: "", details: "" }];
		
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

	return (
		<div className="space-y-6 pt-8">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold">Edit Student</h2>
				<Link href={`/students/${id}`} className="text-sm text-gray-600 hover:underline">← Back to student</Link>
			</div>

			<form action={updateStudent.bind(null, id)} className="bg-white p-6 rounded-lg border space-y-6">
				{/* Student Information Section */}
				<div>
					<h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3>
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
						<div className="sm:col-span-2">
							<div className="text-sm text-gray-700 mb-3">Alternative Contact</div>
							<div className="space-y-3" id="alternative-contacts">
								{contactInfos.map((contact, index) => (
									<div key={index + 1} className="flex gap-2">
										<select 
											name={`contactMethod${index + 1}`}
											defaultValue={contact.method}
											className="flex-1 border rounded-md px-3 py-2"
										>
											<option value="">Select method</option>
											<option value="Phone">Phone</option>
											<option value="WhatsApp">WhatsApp</option>
											<option value="Instagram">Instagram</option>
											<option value="WeChat">WeChat</option>
										</select>
										<input 
											name={`contactDetails${index + 1}`}
											defaultValue={contact.details}
											placeholder="Enter contact details"
											className="flex-1 border rounded-md px-3 py-2" 
										/>
										{index > 0 && (
											<button 
												type="button" 
												className="px-2 py-1 text-red-600 hover:text-red-800"
												onClick={() => {
													const element = document.querySelector(`[name="contactMethod${index + 1}"]`)?.closest('.flex');
													element?.remove();
												}}
											>
												×
											</button>
										)}
									</div>
								))}
							</div>
							<button 
								type="button" 
								className="mt-2 text-sm text-blue-600 hover:text-blue-800 add-contact-btn"
							>
								+ Add another alternative contact
							</button>
							<script dangerouslySetInnerHTML={{
								__html: `
									let contactCount = ${contactInfos.length};
									document.addEventListener('DOMContentLoaded', function() {
										const addBtn = document.querySelector('.add-contact-btn');
										if (addBtn) {
											addBtn.addEventListener('click', function() {
												contactCount++;
												const container = document.getElementById('alternative-contacts');
												const newContact = document.createElement('div');
												newContact.className = 'flex gap-2';
												newContact.innerHTML = \`
													<select name="contactMethod\${contactCount}" class="flex-1 border rounded-md px-3 py-2">
														<option value="">Select method</option>
														<option value="Phone">Phone</option>
														<option value="WhatsApp">WhatsApp</option>
														<option value="Instagram">Instagram</option>
														<option value="WeChat">WeChat</option>
													</select>
													<input name="contactDetails\${contactCount}" placeholder="Enter contact details" class="flex-1 border rounded-md px-3 py-2" />
													<button type="button" class="px-2 py-1 text-red-600 hover:text-red-800" onclick="this.parentElement.remove()">×</button>
												\`;
												container.appendChild(newContact);
											});
										}
									});
								`
							}} />
						</div>
					</div>
				</div>

				{/* Parent Information Section */}
				<div className="border-t pt-6">
					<h3 className="text-lg font-medium text-gray-900 mb-4">Parent Information</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<label className="block">
							<div className="text-sm text-gray-700">Name</div>
							<input 
								name="parentName" 
								defaultValue={student.parentName || ""}
								className="mt-1 w-full border rounded-md px-3 py-2" 
							/>
						</label>
						<label className="block">
							<div className="text-sm text-gray-700">Email</div>
							<input 
								type="email" 
								name="parentEmail" 
								defaultValue={student.parentEmail || ""}
								className="mt-1 w-full border rounded-md px-3 py-2" 
							/>
						</label>
						<label className="block sm:col-span-2">
							<div className="text-sm text-gray-700">Phone</div>
							<input 
								name="parentPhone" 
								defaultValue={student.parentPhone || ""}
								className="mt-1 w-full border rounded-md px-3 py-2" 
							/>
						</label>
					</div>
				</div>

				{/* Academic Information Section */}
				<div className="border-t pt-6">
					<h3 className="text-lg font-medium text-gray-900 mb-4">Academic Information</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<label className="block sm:col-span-2">
							<div className="text-sm text-gray-700">Subjects</div>
							<SubjectsMultiSelect name="subjects" defaultValue={student.subjects || ""} />
						</label>
						<label className="block sm:col-span-2">
							<div className="text-sm text-gray-700">Year level</div>
							<select name="year" defaultValue={student.year || ""} className="mt-1 w-full border rounded-md px-3 py-2">
								<option value="">Select year level</option>
								{Array.from({ length: 12 }, (_, i) => i + 1).map(year => (
									<option key={year} value={year}>
										Year {year}
									</option>
								))}
							</select>
						</label>
						<label className="block sm:col-span-2">
							<div className="text-sm text-gray-700">Hourly rate</div>
							<input 
								name="hourlyRate" 
								type="number" 
								step="0.01" 
								min="0" 
								defaultValue={student.hourlyRateCents / 100}
								className="mt-1 w-full border rounded-md px-3 py-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
							/>
						</label>
						<label className="block sm:col-span-2">
							<div className="text-sm text-gray-700">Student Since</div>
							<input 
								name="studentSince" 
								type="date" 
								defaultValue={new Date(student.createdAt).toISOString().split('T')[0]}
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
				</div>

				<div className="flex items-center gap-3 pt-4">
					<button 
						type="submit" 
						className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
					>
						Update
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
