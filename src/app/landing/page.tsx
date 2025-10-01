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

			<footer className="border-t">
				<div className="mx-auto max-w-7xl px-4 py-10">
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 text-sm">
						<nav className="space-y-2">
							<div className="font-semibold">Product</div>
							<a href="#features" className="block hover:underline">Features</a>
							<a href="#pricing" className="block hover:underline">Pricing</a>
							<a href="#" className="block hover:underline">Blog</a>
						</nav>
						<nav className="space-y-2">
							<div className="font-semibold">Company</div>
							<a href="#" className="block hover:underline">About</a>
							<a href="#" className="block hover:underline">Support</a>
							<a href="#" className="block hover:underline">Contact</a>
						</nav>
						<div className="space-y-2">
							<div className="font-semibold">Language</div>
							<div className="rounded-md border inline-flex items-center gap-2 px-3 py-2">English ▼</div>
						</div>
					</div>
					<div className="mt-8 text-xs text-gray-500">© {new Date().getFullYear()} {TutorTools}. All rights reserved.</div>
				</div>
			</footer>
		</>
	);
}


