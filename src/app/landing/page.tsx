import LandingClient from "./LandingClient";

export const metadata = {
	title: "{TutorTools} — Modern Platform for {{TargetAudience}}",
	description: "Manage your scheduling, billing, and students — all in one place.",
};

export default function LandingPage() {
	return (
		<>
			<LandingClient />
			<header data-landing-header className="fixed top-4 left-4 right-4 z-[60] bg-white/90 backdrop-blur-md border border-gray-200 rounded-xl shadow-lg">
				<div className="w-full px-6 py-4 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="h-8 w-8 rounded bg-gray-900" />
						<div className="font-semibold">{TutorTools}</div>
					</div>
					<nav className="hidden md:flex items-center gap-6 text-sm text-gray-700">
						<a href="#features" className="hover:text-black">Features</a>
						<a href="#pricing" className="hover:text-black">Pricing</a>
						<a href="#social" className="hover:text-black">Reviews</a>
						<a href="/signin" className="hover:text-black">Sign in</a>
						<a href="#trial" className="rounded-md bg-blue-600 text-white px-3 py-2 hover:bg-blue-700">Start Free Trial</a>
					</nav>
				</div>
			</header>

			<main className="pt-20">
				<section className="bg-gradient-to-b from-white to-gray-50">
					<div className="mx-auto max-w-7xl px-4 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
						<div>
							<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
								{TutorTools} is the #1 {{Industry}} platform for {{TargetAudience}}
							</h1>
							<p className="mt-4 text-lg text-gray-700">
								Manage your scheduling, billing, and students — all in one place.
							</p>
							<div className="mt-6 flex flex-col sm:flex-row gap-3">
								<a href="/signup" className="rounded-md bg-blue-600 text-white px-5 py-3 text-center hover:bg-blue-700">Create an account</a>
								<a href="/about" className="rounded-md border px-5 py-3 text-center hover:bg-gray-50">About us</a>
							</div>
							<p className="mt-2 text-xs text-gray-500">No credit card required</p>
						</div>
						<div className="relative" data-fade>
							<div className="aspect-[16/10] rounded-xl border bg-white shadow-sm" />
							<div className="absolute -bottom-8 -right-8 w-40 aspect-[3/2] rounded-xl border bg-white shadow-sm hidden sm:block" />
							<div className="absolute -top-8 -left-8 w-28 aspect-[3/2] rounded-xl border bg-white shadow-sm hidden sm:block" />
						</div>
					</div>
				</section>

				<section id="features" className="mx-auto max-w-7xl px-4 py-16 lg:py-24 space-y-16">
					{[
						{
							title: "Lesson Scheduling",
							points: [
								"Drag-and-drop calendar with conflicts prevention",
								"Automated reminders via email/SMS",
								"Recurring lessons and availability blocks",
								"Sync with Google/Apple calendars",
							],
						},
						{
							title: "Student & Contact Management",
							points: [
								"Unified profiles with notes and tags",
								"Parent/guardian relationships",
								"Quick filters and saved segments",
								"Import/export CSV",
							],
						},
						{
							title: "Invoicing & Payments",
							points: [
								"Auto-generate invoices from lessons",
								"Online payments with Stripe",
								"Payment plans and dunning",
								"Export to bookkeeping",
							],
						},
						{
							title: "Website Builder / Student Portal",
							points: [
								"Customizable pages and branding",
								"Student portal for schedules and payments",
								"Forms and lead capture",
								"SEO-friendly templates",
							],
						},
						{
							title: "Workflow Automation / Self-Booking",
							points: [
								"Self-service booking links",
								"Lesson confirmation flows",
								"Zapier and webhooks",
								"Templates and reusable workflows",
							],
						},
					].map((m, i) => (
						<div key={m.title} className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? 'lg:[&>div:first-child]:order-last' : ''}`}> 
							<div data-fade>
								<h3 className="text-2xl font-semibold">{m.title}</h3>
								<ul className="mt-4 space-y-2 text-gray-700 list-disc list-inside">
									{m.points.map((p) => (
										<li key={p}>{p}</li>
									))}
								</ul>
								<div className="mt-6 rounded-xl border bg-white aspect-[16/10]" />
								<figure className="mt-4 border-l-4 border-gray-200 pl-4 text-sm text-gray-600">
									<blockquote>“{{ShortQuote}} — highlight a concrete outcome.”</blockquote>
									<figcaption className="mt-2 font-medium">Jane Doe, Music Studio Owner</figcaption>
								</figure>
							</div>
							<div data-fade>
								<div className="rounded-xl border bg-white shadow-sm aspect-[4/3]" />
							</div>
						</div>
					))}
				</section>

				<section id="social" className="bg-gray-50">
					<div className="mx-auto max-w-7xl px-4 py-16 lg:py-24">
						<div className="flex flex-col items-center text-center" data-fade>
							<div className="text-sm text-gray-600">Rated 4.8 / 5 from 300+ users</div>
							<div className="mt-2 flex items-center gap-4 opacity-80">
								<div className="h-6 w-20 rounded bg-gray-300" />
								<div className="h-6 w-20 rounded bg-gray-300" />
								<div className="h-6 w-20 rounded bg-gray-300" />
							</div>
						</div>
						<div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
							{[1,2,3].map((i) => (
								<figure key={i} className="rounded-xl border bg-white p-6" data-fade>
									<blockquote className="text-gray-700">“{{LongerQuote}} Vestibulum ante ipsum primis in faucibus orci luctus.”</blockquote>
									<figcaption className="mt-4 text-sm font-medium">Alex Johnson — Piano Teacher</figcaption>
								</figure>
							))}
						</div>
					</div>
				</section>

				<section id="pricing" className="mx-auto max-w-7xl px-4 py-16 lg:py-24">
					<div className="text-center" data-fade>
						<h3 className="text-2xl font-semibold">Try it Free for 30 Days</h3>
						<p className="mt-2 text-gray-700">Upgrade any time. Cancel any time.</p>
						<div className="mt-6 flex items-center justify-center gap-3">
							<a href="#trial" className="rounded-md bg-blue-600 text-white px-5 py-3 hover:bg-blue-700">Start Free Trial</a>
							<a href="/signin" className="rounded-md border px-5 py-3 hover:bg-gray-50">Sign in</a>
						</div>
					</div>
					<div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
						{["Basic","Pro","Premium"].map((plan, idx) => (
							<div key={plan} className={`rounded-xl border bg-white p-6 ${idx===1 ? 'ring-2 ring-black' : ''}`} data-fade>
								<div className="font-semibold">{plan}</div>
								<div className="mt-2 text-3xl font-bold">${{Price}}<span className="text-base font-medium text-gray-500">/mo</span></div>
								<ul className="mt-4 space-y-2 text-sm text-gray-700 list-disc list-inside">
									<li>{{Feature1}}</li>
									<li>{{Feature2}}</li>
									<li>{{Feature3}}</li>
								</ul>
								<a href="#trial" className="mt-6 inline-block rounded-md bg-blue-600 text-white px-4 py-2 hover:bg-blue-700">Start</a>
							</div>
						))}
					</div>
				</section>
			</main>

			<footer className="border-t bg-gray-800">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
						{/* Company Info */}
						<div className="md:col-span-2">
							<h3 className="text-lg font-semibold text-white mb-4">TutorTools</h3>
							<p className="text-gray-300 mb-4">
								The comprehensive platform for private tutors to manage students, 
								schedule lessons, and grow their teaching business.
							</p>
							<div className="flex space-x-4">
								<a href="#" className="text-gray-400 hover:text-white">
									<span className="sr-only">Twitter</span>
									<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
										<path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
									</svg>
								</a>
								<a href="#" className="text-gray-400 hover:text-white">
									<span className="sr-only">GitHub</span>
									<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
										<path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
									</svg>
								</a>
								<a href="#" className="text-gray-400 hover:text-white">
									<span className="sr-only">LinkedIn</span>
									<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
										<path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
									</svg>
								</a>
							</div>
						</div>

						{/* Quick Links */}
						<div>
							<h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Product</h4>
							<ul className="space-y-3">
								<li><a href="#features" className="text-gray-300 hover:text-white">Features</a></li>
								<li><a href="#pricing" className="text-gray-300 hover:text-white">Pricing</a></li>
								<li><a href="#" className="text-gray-300 hover:text-white">Demo</a></li>
								<li><a href="#" className="text-gray-300 hover:text-white">Updates</a></li>
							</ul>
						</div>

						{/* Support */}
						<div>
							<h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support</h4>
							<ul className="space-y-3">
								<li><a href="/contact" className="text-gray-300 hover:text-white">Contact Us</a></li>
							</ul>
						</div>
					</div>

					<div className="mt-8 pt-8 border-t border-gray-600">
						<div className="flex flex-col md:flex-row justify-between items-center">
							<p className="text-gray-400 text-sm">
								© 2025 TutorTools. All rights reserved.
							</p>
							<div className="flex space-x-6 mt-4 md:mt-0">
								<a href="/" className="text-gray-400 hover:text-white text-sm">Privacy Policy</a>
								<a href="/" className="text-gray-400 hover:text-white text-sm">Terms of Service</a>
								<a href="/" className="text-gray-400 hover:text-white text-sm">Cookie Policy</a>
							</div>
						</div>
					</div>
				</div>
			</footer>
		</>
	);
}


