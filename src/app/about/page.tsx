export default function AboutPage() {
	return (
		<div className="w-full space-y-12">
			{/* Hero Section */}
			<div className="text-center">
				<h1 className="text-4xl font-bold text-gray-900 mb-4">About TutorTools</h1>
				<p className="text-xl text-gray-600 max-w-2xl mx-auto">
					We're on a mission to empower private tutors with the tools they need to build successful, sustainable teaching businesses.
				</p>
			</div>

			{/* Mission Section */}
			<div className="bg-white rounded-lg border p-8">
				<h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
				<p className="text-gray-700 leading-relaxed">
					Private tutoring is one of the most rewarding professions, but managing the business side can be overwhelming. 
					We believe that great tutors should focus on what they do best—teaching—while we handle the rest.
				</p>
			</div>

			{/* What We Do Section */}
			<div className="grid md:grid-cols-2 gap-8">
				<div className="bg-white rounded-lg border p-6">
					<h3 className="text-xl font-semibold text-gray-900 mb-4">What We Do</h3>
					<p className="text-gray-700 leading-relaxed mb-4">
						TutorTools provides a comprehensive platform that handles all aspects of running a tutoring business:
					</p>
					<ul className="space-y-2 text-gray-700">
						<li className="flex items-start">
							<span className="text-blue-600 mr-2">•</span>
							<span>Student and contact management</span>
						</li>
						<li className="flex items-start">
							<span className="text-blue-600 mr-2">•</span>
							<span>Automated scheduling and calendar management</span>
						</li>
						<li className="flex items-start">
							<span className="text-blue-600 mr-2">•</span>
							<span>Online payment processing and invoicing</span>
						</li>
						<li className="flex items-start">
							<span className="text-blue-600 mr-2">•</span>
							<span>Custom website and student portal creation</span>
						</li>
						<li className="flex items-start">
							<span className="text-blue-600 mr-2">•</span>
							<span>Automated reminders and communication</span>
						</li>
					</ul>
				</div>

				<div className="bg-white rounded-lg border p-6">
					<h3 className="text-xl font-semibold text-gray-900 mb-4">Why We Built This</h3>
					<p className="text-gray-700 leading-relaxed mb-4">
						We understand the challenges tutors face because we've been there. The constant juggling of schedules, 
						payments, and student communication can take away from the joy of teaching.
					</p>
					<p className="text-gray-700 leading-relaxed">
						Our platform is designed by tutors, for tutors, with a deep understanding of what it takes to run 
						a successful tutoring business in today's digital world.
					</p>
				</div>
			</div>

			{/* Values Section */}
			<div className="bg-gray-50 rounded-lg p-8">
				<h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Our Values</h2>
				<div className="grid md:grid-cols-3 gap-6">
					<div className="text-center">
						<div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
							</svg>
						</div>
						<h3 className="font-semibold text-gray-900 mb-2">Tutor-First</h3>
						<p className="text-sm text-gray-600">Every feature is designed with tutors' needs in mind</p>
					</div>
					<div className="text-center">
						<div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
							</svg>
						</div>
						<h3 className="font-semibold text-gray-900 mb-2">Efficiency</h3>
						<p className="text-sm text-gray-600">Streamline your workflow to focus on teaching</p>
					</div>
					<div className="text-center">
						<div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
							</svg>
						</div>
						<h3 className="font-semibold text-gray-900 mb-2">Support</h3>
						<p className="text-sm text-gray-600">We're here to help you succeed every step of the way</p>
					</div>
				</div>
			</div>

			{/* Team Section */}
			<div className="bg-white rounded-lg border p-8">
				<h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Our Team</h2>
				<div className="text-center">
					<p className="text-gray-700 leading-relaxed mb-6">
						We're a team of educators, developers, and entrepreneurs who are passionate about supporting 
						the tutoring community. Our diverse backgrounds in education and technology help us create 
						solutions that truly work for tutors.
					</p>
					<div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto">
						<p className="text-gray-600 italic">
							"Every feature we build starts with one question: 'How does this help tutors teach better?' 
							That focus drives everything we do."
						</p>
						<p className="text-sm text-gray-500 mt-2">— The TutorTools Team</p>
					</div>
				</div>
			</div>

			{/* CTA Section */}
			<div className="bg-blue-50 rounded-lg p-8 text-center">
				<h2 className="text-2xl font-semibold text-gray-900 mb-4">Ready to Transform Your Tutoring Business?</h2>
				<p className="text-gray-700 mb-6">
					Join thousands of tutors who are already using TutorTools to grow their businesses.
				</p>
				<div className="flex flex-col sm:flex-row gap-3 justify-center">
					<a href="/signup" className="rounded-md bg-blue-600 text-white px-6 py-3 hover:bg-blue-700">
						Get Started Free
					</a>
					<a href="/contact" className="rounded-md border border-blue-600 text-blue-600 px-6 py-3 hover:bg-blue-50">
						Contact Us
					</a>
				</div>
			</div>
		</div>
	);
}
