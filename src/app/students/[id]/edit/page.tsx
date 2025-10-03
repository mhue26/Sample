import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SubjectsMultiSelect from "../../SubjectsMultiSelect";
import EditStudentClient from "./EditStudentClient";

async function updateStudent(id: number, formData: FormData) {
	"use server";
    const session = await getServerSession(authOptions);
	if (!session?.user) redirect("/signin");
	
	const fullName = String(formData.get("fullName") || "").trim();
	const nameParts = fullName.split(" ");
	const firstName = nameParts[0] || "";
	const lastName = nameParts.slice(1).join(" ") || "";
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
	const schoolSubjects = String(formData.get("schoolSubjects") || "").trim() || null;
	const year = Number(String(formData.get("year") || "0")) || null;
	const school = String(formData.get("school") || "").trim() || null;
	const hourlyRate = Number(String(formData.get("hourlyRate") || "0"));
	
	// Handle meeting location based on type
	const meetingLocationType = String(formData.get("meetingLocationType") || "").trim();
	const meetingLocationDetails = String(formData.get("meetingLocationDetails") || "").trim();
	const meetingPlatform = String(formData.get("meetingPlatform") || "").trim();
	
	let meetingLocation = null;
	if (meetingLocationType === "In-Person" && meetingLocationDetails) {
		meetingLocation = meetingLocationDetails;
	} else if (meetingLocationType === "Online" && meetingPlatform) {
		meetingLocation = meetingPlatform;
	}
	
	const notes = String(formData.get("notes") || "").trim() || null;
	const studentSince = String(formData.get("studentSince") || "");
	
	// Parent information
	const parentName = String(formData.get("parentName") || "").trim() || null;
	const parentEmail = String(formData.get("parentEmail") || "").trim() || null;
	const parentPhone = String(formData.get("parentPhone") || "").trim() || null;
	
	// Resource link
	const resourceLink = String(formData.get("resourceLink") || "").trim() || null;
	
	try {
		await prisma.student.update({
			where: { id },
			data: {
				firstName,
				lastName,
				email,
				phone,
				subjects,
				schoolSubjects,
				year,
				school,
				hourlyRateCents: Math.round(hourlyRate * 100),
				meetingLocation,
				notes,
				createdAt: new Date(studentSince),
				parentName,
				parentEmail,
				parentPhone,
				resourceLink,
			},
		});
		
		redirect(`/students/${id}`);
	} catch (error) {
		console.error("Error updating student:", error);
		throw error;
	}
}

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
	const session = await getServerSession(authOptions);
	if (!session?.user) redirect("/signin");

	const { id } = await params;
	const studentId = parseInt(id);

	if (isNaN(studentId)) {
		notFound();
	}

	const student = await prisma.student.findUnique({
		where: { id: studentId },
	});

	if (!student) {
		notFound();
	}

	// Parse contact information
	const contactInfos = [];
	if (student.phone) {
		const contacts = student.phone.split(" | ");
		contacts.forEach((contact, index) => {
			const [method, ...details] = contact.split(": ");
			if (method && details.length > 0) {
				contactInfos.push({
					method: method.trim(),
					details: details.join(": ").trim()
				});
			}
		});
	}

	// Ensure we have at least one contact field
	if (contactInfos.length === 0) {
		contactInfos.push({ method: "", details: "" });
	}

	const updateStudentAction = updateStudent.bind(null, studentId);

	return (
		<div className="space-y-6 pt-8">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold">Edit Student</h2>
				<Link href={`/students/${id}`} className="text-sm text-gray-600 hover:underline">← Back to student</Link>
			</div>

			<form action={updateStudentAction} className="space-y-6">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<div className="bg-white p-6 rounded-lg border">
						<h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3>
						<div className="space-y-4">
							<label className="block">
								<div className="text-sm text-gray-700">Name</div>
								<input 
									name="fullName" 
									required 
									defaultValue={`${student.firstName} ${student.lastName}`}
									className="mt-1 w-full border rounded-md px-3 py-2" 
								/>
							</label>
							<label className="block">
								<div className="text-sm text-gray-700">Email</div>
								<input 
									type="email" 
									name="email" 
									required 
									defaultValue={student.email}
									className="mt-1 w-full border rounded-md px-3 py-2" 
								/>
							</label>
							<div>
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
									className="mt-3 text-sm text-blue-600 hover:underline add-contact-btn"
								>
									+ Add another alternative contact
								</button>
							</div>
						</div>
					</div>

					<div className="bg-white p-6 rounded-lg border">
						<h3 className="text-lg font-medium text-gray-900 mb-4">Parent Information</h3>
						<div className="space-y-4">
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
							</div>
							<label className="block">
								<div className="text-sm text-gray-700">Phone</div>
								<input 
									name="parentPhone" 
									defaultValue={student.parentPhone || ""}
									className="mt-1 w-full border rounded-md px-3 py-2" 
								/>
							</label>
						</div>
					</div>

					<div className="bg-white p-6 rounded-lg border">
						<h3 className="text-lg font-medium text-gray-900 mb-4">Academic Information</h3>
						<div className="space-y-4">
							<label className="block">
								<div className="text-sm text-gray-700">School Subjects</div>
								<SubjectsMultiSelect name="schoolSubjects" defaultValue={student.schoolSubjects || ""} />
							</label>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<label className="block sm:col-span-2">
									<div className="text-sm text-gray-700">School</div>
									<input 
										name="school" 
										type="text" 
										defaultValue={student.school || ""}
										placeholder="Enter school name"
										className="mt-1 w-full border rounded-md px-3 py-2" 
									/>
								</label>
								<label className="block">
									<div className="text-sm text-gray-700">Year</div>
									<select name="year" defaultValue={student.year || ""} className="mt-1 w-full border rounded-md px-3 py-2">
										<option value="">Select year</option>
										{Array.from({ length: 12 }, (_, i) => i + 1).map(year => (
											<option key={year} value={year}>
												Year {year}
											</option>
										))}
									</select>
								</label>
							</div>
							<label className="block">
								<div className="text-sm text-gray-700">Student Since</div>
								<input 
									name="studentSince" 
									type="date" 
									defaultValue={new Date(student.createdAt).toISOString().split('T')[0]}
									className="mt-1 w-full border rounded-md px-3 py-2" 
								/>
							</label>
							<label className="block">
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

					<div className="bg-white p-6 rounded-lg border">
						<h3 className="text-lg font-medium text-gray-900 mb-4">Lesson Information</h3>
						<div className="space-y-4">
							<label className="block">
								<div className="text-sm text-gray-700">Subjects</div>
								<SubjectsMultiSelect name="subjects" defaultValue={student.subjects || ""} />
							</label>
							<label className="block">
								<div className="text-sm text-gray-700">Hourly rate</div>
								<input 
									name="hourlyRate" 
									type="number" 
									step="0.01" 
									min="0" 
									defaultValue={student.hourlyRateCents / 100}
									className="mt-1 w-full border rounded-md px-3 py-2" 
								/>
							</label>
							<label className="block">
								<div className="text-sm text-gray-700">Resource Link</div>
								<input 
									name="resourceLink" 
									type="url" 
									defaultValue={student.resourceLink || ""}
									placeholder="https://example.com"
									className="mt-1 w-full border rounded-md px-3 py-2" 
								/>
							</label>
							<div className="block">
								<div className="text-sm text-gray-700">Mode</div>
								<select 
									name="meetingLocationType" 
									defaultValue={student.meetingLocation === "Online" ? "Online" : student.meetingLocation ? "In-Person" : ""}
									className="mt-1 w-full border rounded-md px-3 py-2"
									id="locationTypeSelect"
								>
									<option value="">Select location type</option>
									<option value="In-Person">In-Person</option>
									<option value="Online">Online</option>
								</select>
							</div>
							<div id="locationDetails" className="block" style={{display: "none"}}>
								<div className="text-sm text-gray-700">Location</div>
								<input 
									id="location-input"
									name="meetingLocationDetails" 
									type="text" 
									defaultValue=""
									className="mt-1 w-full border rounded-md px-3 py-2" 
								/>
							</div>
							<div id="platformDetails" className="block" style={{display: "none"}}>
								<div className="text-sm text-gray-700">Platform</div>
								<select 
									name="meetingPlatform" 
									defaultValue=""
									className="mt-1 w-full border rounded-md px-3 py-2"
								>
									<option value="">Select platform</option>
									<option value="Zoom">Zoom</option>
									<option value="Google Meet">Google Meet</option>
									<option value="Microsoft Teams">Microsoft Teams</option>
									<option value="Webex">Webex</option>
								</select>
							</div>
						</div>
					</div>
				</div>

				<div className="flex items-center gap-3 pt-4">
					<button type="submit" className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700">
						Update
					</button>
					<Link href={`/students/${id}`} className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50">
						Cancel
					</Link>
				</div>
			</form>

			{/* Client component to handle dynamic form behavior */}
			<EditStudentClient meetingLocation={student.meetingLocation} />
		</div>
	);
}