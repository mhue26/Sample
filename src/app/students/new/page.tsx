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
	const contactMethod = String(formData.get("contactMethod") || "").trim();
	const contactDetails = String(formData.get("contactDetails") || "").trim();
	const phone = contactMethod && contactDetails ? `${contactMethod}: ${contactDetails}` : null;
	const subjects = String(formData.get("subjects") || "").trim();
	const schoolSubjects = String(formData.get("schoolSubjects") || "").trim() || null;
	const year = Number(String(formData.get("year") || "0")) || null;
	const school = String(formData.get("school") || "").trim() || null;
	const hourlyRate = Number(String(formData.get("hourlyRate") || "0"));
	const meetingLocation = String(formData.get("meetingLocation") || "").trim() || null;
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
			schoolSubjects,
			year,
			school,
			hourlyRateCents: Math.round(hourlyRate * 100),
			meetingLocation,
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
					<div className="sm:col-span-2">
						<div className="text-sm text-gray-700 mb-3">Alternative Contact</div>
						<div className="space-y-3" id="alternative-contacts">
							<div className="flex gap-2">
								<select name="contactMethod1" className="flex-1 border rounded-md px-3 py-2">
									<option value="">Select method</option>
									<option value="Phone">Phone</option>
									<option value="WhatsApp">WhatsApp</option>
									<option value="Instagram">Instagram</option>
									<option value="WeChat">WeChat</option>
								</select>
								<input name="contactDetails1" placeholder="Enter contact details" className="flex-1 border rounded-md px-3 py-2" />
							</div>
						</div>
						<button 
							type="button" 
							className="mt-2 text-sm text-blue-600 hover:text-blue-800 add-contact-btn"
						>
							+ Add another alternative contact
						</button>
						<script dangerouslySetInnerHTML={{
							__html: `
								let contactCount = 1;
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
				
				{/* Academic Information Section */}
				<div className="border-t pt-4">
					<h3 className="text-lg font-medium text-gray-900 mb-4">Academic Information</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<label className="block sm:col-span-2">
							<div className="text-sm text-gray-700">School Subjects</div>
							<SubjectsMultiSelect name="schoolSubjects" />
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
							<div className="text-sm text-gray-700">School</div>
							<input 
								name="school" 
								type="text" 
								placeholder="Enter school name"
								className="mt-1 w-full border rounded-md px-3 py-2" 
							/>
						</label>
						<label className="block sm:col-span-2">
							<div className="text-sm text-gray-700">Notes</div>
							<textarea name="notes" rows={4} className="mt-1 w-full border rounded-md px-3 py-2" />
						</label>
					</div>
				</div>

				{/* Lesson Information Section */}
				<div className="border-t pt-4">
					<h3 className="text-lg font-medium text-gray-900 mb-4">Lesson Information</h3>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<label className="block sm:col-span-2">
							<div className="text-sm text-gray-700">Subjects</div>
							<SubjectsMultiSelect name="subjects" />
						</label>
						<label className="block sm:col-span-2">
							<div className="text-sm text-gray-700">Hourly rate</div>
							<input name="hourlyRate" type="number" step="0.01" min="0" className="mt-1 w-full border rounded-md px-3 py-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
						</label>
						<div className="block sm:col-span-2">
							<div className="text-sm text-gray-700">Mode</div>
							<select 
								name="meetingLocationType" 
								className="mt-1 w-full border rounded-md px-3 py-2"
								id="locationTypeSelect"
							>
								<option value="">Select location type</option>
								<option value="In-Person">In-Person</option>
								<option value="Online">Online</option>
							</select>
						</div>
						<div id="locationDetails" className="block sm:col-span-2" style={{display: "none"}}>
							<div className="text-sm text-gray-700">Location</div>
							<input 
								id="location-input"
								name="meetingLocationDetails" 
								type="text" 
								placeholder=""
								className="mt-1 w-full border rounded-md px-3 py-2" 
							/>
						</div>
						<div id="platformDetails" className="block sm:col-span-2" style={{display: "none"}}>
							<div className="text-sm text-gray-700">Platform</div>
							<select 
								name="meetingPlatform" 
								className="mt-1 w-full border rounded-md px-3 py-2"
							>
								<option value="">Select platform</option>
								<option value="Zoom">Zoom</option>
								<option value="Google Meet">Google Meet</option>
								<option value="Microsoft Teams">Microsoft Teams</option>
								<option value="Webex">Webex</option>
							</select>
						</div>
						<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAHcXZQq3Y8iCLQLb9Z1KxFqpSMik5vPs0&libraries=places" async defer></script>
						<script dangerouslySetInnerHTML={{
							__html: `
								let autocomplete;
								
								function initAutocomplete() {
									const locationInput = document.getElementById('location-input');
									if (locationInput && window.google && window.google.maps && window.google.maps.places) {
										autocomplete = new google.maps.places.Autocomplete(locationInput, {
											types: ['establishment', 'geocode'],
											componentRestrictions: { country: 'au' } // Restrict to Australia, change as needed
										});
										
										// Optional: Listen for place selection
										autocomplete.addListener('place_changed', function() {
											const place = autocomplete.getPlace();
											if (place.formatted_address) {
												locationInput.value = place.formatted_address;
											}
										});
									}
								}
								
								document.addEventListener('DOMContentLoaded', function() {
									const locationTypeSelect = document.getElementById('locationTypeSelect');
									const locationDetails = document.getElementById('locationDetails');
									const platformDetails = document.getElementById('platformDetails');
									const locationDetailsInput = document.querySelector('input[name="meetingLocationDetails"]');
									const platformSelect = document.querySelector('select[name="meetingPlatform"]');
									
									function toggleLocationInput() {
										if (locationTypeSelect.value === 'In-Person') {
											locationDetails.style.display = 'block';
											platformDetails.style.display = 'none';
											// Initialize autocomplete when the input becomes visible
											setTimeout(initAutocomplete, 100);
											// Clear platform selection
											if (platformSelect) {
												platformSelect.value = '';
											}
										} else if (locationTypeSelect.value === 'Online') {
											locationDetails.style.display = 'none';
											platformDetails.style.display = 'block';
											// Clear location input
											if (locationDetailsInput) {
												locationDetailsInput.value = '';
											}
										} else {
											locationDetails.style.display = 'none';
											platformDetails.style.display = 'none';
											if (locationDetailsInput) {
												locationDetailsInput.value = '';
											}
											if (platformSelect) {
												platformSelect.value = '';
											}
										}
									}
									
									// Add event listener for dropdown change
									if (locationTypeSelect) {
										locationTypeSelect.addEventListener('change', toggleLocationInput);
									}
									
									// Initialize autocomplete when Google Maps API loads
									window.initAutocomplete = initAutocomplete;
									
									// Set up the form submission to combine the values
									const form = document.querySelector('form');
									if (form) {
										form.addEventListener('submit', function(e) {
											const locationType = locationTypeSelect ? locationTypeSelect.value : '';
											const locationDetailsValue = locationDetailsInput ? locationDetailsInput.value : '';
											const platformValue = platformSelect ? platformSelect.value : '';
											
											// Remove any existing hidden input
											const existingHidden = form.querySelector('input[name="meetingLocation"][type="hidden"]');
											if (existingHidden) {
												existingHidden.remove();
											}
											
											// Create a hidden input with the final meetingLocation value
											const hiddenInput = document.createElement('input');
											hiddenInput.type = 'hidden';
											hiddenInput.name = 'meetingLocation';
											
											if (locationType === 'Online') {
												hiddenInput.value = platformValue || 'Online';
											} else if (locationType === 'In-Person') {
												hiddenInput.value = locationDetailsValue || 'In-Person';
											} else {
												hiddenInput.value = '';
											}
											
											form.appendChild(hiddenInput);
										});
									}
								});
							`
						}} />
					</div>
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


