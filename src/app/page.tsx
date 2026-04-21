import Link from "next/link";

export const metadata = {
	title: "Tutorlytics — Focus on teaching. We handle the admin.",
	description: "Student management, scheduling, classes, and billing for private tutors. Built to help you focus on what matters: teaching.",
};

export default function Home() {
	return (
		<div className="font-sans" style={{ fontFamily: "'Work Sans', sans-serif" }}>
			{/* Hero: classroom wall + framed whiteboard around centre copy */}
			<section
				className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 sm:pb-20 overflow-hidden"
				style={{ backgroundColor: "#D6E3F8", width: "100vw", marginLeft: "calc(-50vw + 50%)", marginRight: "calc(-50vw + 50%)", marginTop: "-5rem" }}
			>
				{/* Wall decorations (outside the board) */}
				<div className="absolute inset-0 pointer-events-none">
					<svg className="absolute -top-20 -right-20 w-96 h-96 opacity-40" viewBox="0 0 200 200" fill="none">
						<circle cx="100" cy="100" r="90" fill="#E8EFF9" />
					</svg>
					<svg className="absolute -bottom-10 -left-10 w-72 h-72 opacity-50" viewBox="0 0 200 200" fill="none">
						<circle cx="100" cy="100" r="85" fill="rgba(255,255,255,0.6)" />
					</svg>
					<svg className="absolute top-1/4 left-1/4 w-24 h-24 opacity-30" viewBox="0 0 100 100" fill="none">
						<circle cx="50" cy="50" r="40" fill="#B8D4F0" />
					</svg>
					<svg className="absolute top-2/3 right-1/3 w-16 h-16 opacity-35" viewBox="0 0 100 100" fill="none">
						<circle cx="50" cy="50" r="35" fill="rgba(255,255,255,0.7)" />
					</svg>
				</div>

				<div className="relative z-10 w-full max-w-4xl lg:max-w-5xl mx-auto mt-12 sm:mt-16 md:mt-20">
					{/* Traditional wall-mounted whiteboard: thin metal frame + enamel surface */}
					<div className="shadow-[0_12px_40px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.06)]">
						<div
							className="rounded-t-sm rounded-b-none border-[3px] sm:border-4 border-b-0 border-solid px-0.5 pt-0.5 pb-0.5"
							style={{
								borderColor: "#B4B8C2",
								background: "linear-gradient(180deg, #D8DCE3 0%, #B8BCC6 45%, #A8ACB8 100%)",
								boxShadow: "inset 0 1px 0 rgba(255,255,255,0.65)",
							}}
						>
							{/* Writable surface (matte enamel) */}
							<div
								className="relative rounded-[2px] px-8 py-12 sm:px-12 sm:py-16 lg:px-14 lg:py-20 text-center"
								style={{
									backgroundColor: "#FFFFFF",
									backgroundImage: "radial-gradient(#D1D5DB 0.5px, transparent 0.5px)",
									backgroundSize: "16px 16px",
									boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.04), inset 0 2px 12px rgba(0,0,0,0.03)",
								}}
							>
								<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-[#3D4756]">
									<span className="block">Focus on teaching.</span>
									<span className="block mt-2 sm:mt-3">We handle the admin.</span>
								</h1>
								<div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
									<Link
										href="/signup"
										className="w-full sm:w-auto px-8 py-3 bg-[#3D4756] text-white rounded-lg font-semibold text-base hover:bg-[#2A3441] transition-colors duration-200 shadow-sm"
									>
										Get started free
									</Link>
									<Link
										href="/signin"
										className="w-full sm:w-auto px-8 py-3 text-[#584b53] font-medium hover:text-[#3D4756] transition-colors"
									>
										Log in
									</Link>
								</div>
							</div>
						</div>
						{/* Marker tray — continues side rails of the frame */}
						<div
							className="h-3.5 sm:h-4 w-full rounded-b-sm border-x-[3px] sm:border-x-4 border-b-[3px] sm:border-b-4 -mt-px shadow-[inset_0_2px_4px_rgba(0,0,0,0.25)]"
							style={{
								background: "linear-gradient(180deg, #6D7179 0%, #4A4D54 55%, #3F4248 100%)",
								borderColor: "#B4B8C2",
							}}
							aria-hidden
						/>
					</div>
				</div>
			</section>

			{/* Features with subtle background pattern */}
			<section
				id="features"
				className="relative bg-white py-16 lg:py-24 overflow-hidden"
				style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)", marginRight: "calc(-50vw + 50%)" }}
			>
				{/* Decorative elements */}
				<div className="absolute inset-0 pointer-events-none">
					<div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ backgroundColor: "#D6E3F8", transform: "translate(-50%, -50%)" }} />
					<div className="absolute bottom-20 right-0 w-96 h-96 rounded-full opacity-10" style={{ backgroundColor: "#D6E3F8", transform: "translate(30%, 30%)" }} />
					<div className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full opacity-5" style={{ backgroundColor: "#D6E3F8", transform: "translate(-50%, -50%)" }} />
				</div>

				<div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="space-y-16">
						{[
							{
								title: "Students & contacts",
								points: [
									"Unified profiles with subjects, goals, and notes",
									"Parent/guardian relationships and contact info",
									"Archive and filters to organize your roster",
								],
								status: "live",
								icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
							},
							{
								title: "Classes & organization",
								points: [
									"Create and manage color-coded classes",
									"Assign students to classes",
									"Quick access from your dashboard",
								],
								status: "live",
								icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
							},
							{
								title: "Calendar & scheduling",
								points: [
									"Meetings for lessons, check-ins, and events",
									"Terms and holidays with school-year alignment",
									"Completion tracking and scheduling forms",
								],
								status: "live",
								icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
							},
							{
								title: "Billing & invoicing",
								points: [
									"Invoices from completed lessons",
									"Payment tracking and revenue views",
									"PDF export for records",
								],
								status: "soon",
								icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
							},
							{
								title: "AI teaching assistant",
								points: [
									"Real-time transcription and lesson summaries",
									"AI-drafted parent messages",
									"Homework and deadline extraction",
								],
								status: "roadmap",
								icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
							},
						].map((m) => (
							<div key={m.title} className="flex gap-6 items-start max-w-3xl">
								<div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#D6E3F8" }}>
									<svg className="w-6 h-6 text-[#3D4756]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={m.icon} />
									</svg>
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<h3 className="text-2xl font-semibold text-[#3D4756]">{m.title}</h3>
										{m.status === "soon" && (
											<span className="px-2 py-0.5 text-xs font-medium rounded-full" style={{ backgroundColor: "#D6E3F8", color: "#3D4756" }}>
												Coming soon
											</span>
										)}
										{m.status === "roadmap" && (
											<span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-[#A1ACBD] rounded-full">Roadmap</span>
										)}
									</div>
									<ul className="mt-4 space-y-2 text-gray-700 list-disc list-inside">
										{m.points.map((p) => (
											<li key={p}>{p}</li>
										))}
									</ul>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Trust / Social proof with blue accent */}
			<section
				className="relative py-12 overflow-hidden"
				style={{ backgroundColor: "#D6E3F8", width: "100vw", marginLeft: "calc(-50vw + 50%)", marginRight: "calc(-50vw + 50%)" }}
			>
				<div className="absolute inset-0 pointer-events-none opacity-30">
					<div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.4) 0%, transparent 50%)" }} />
					<div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 80% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)" }} />
				</div>
				<div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
					<p className="text-[#3D4756] font-medium">Built for tutors, by people who care about teaching.</p>
				</div>
			</section>

			{/* Final CTA with blue accent elements */}
			<section
				className="relative py-16 lg:py-20 bg-white overflow-hidden"
				style={{ width: "100vw", marginLeft: "calc(-50vw + 50%)", marginRight: "calc(-50vw + 50%)" }}
			>
				<div className="absolute inset-0 pointer-events-none">
					<div className="absolute bottom-0 left-1/2 w-[600px] h-[300px] rounded-full opacity-15" style={{ backgroundColor: "#D6E3F8", transform: "translate(-50%, 60%)" }} />
				</div>
				<div className="relative z-10 mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
					<h2 className="text-2xl sm:text-3xl font-semibold text-[#3D4756] mb-4">Ready to simplify your tutoring business?</h2>
					<p className="text-gray-600 mb-8">Get started in minutes. No credit card required.</p>
					<Link
						href="/signup"
						className="inline-block px-8 py-3 bg-[#3D4756] text-white rounded-lg font-semibold text-base hover:bg-[#2A3441] transition-colors duration-200 shadow-sm"
					>
						Start free
					</Link>
				</div>
			</section>
		</div>
	);
}
