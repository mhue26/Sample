import Image from "next/image";

import { authOptions } from "@/utils/auth";
import { getServerSession } from "next-auth";
import LandingClient from "./landing/LandingClient";

export const metadata = {
	title: "TutorTools — Modern Platform for Private Tutors",
	description: "Manage your scheduling, billing, and students — all in one place.",
};

export default async function Home() {
	const session = await getServerSession(authOptions);
	return (
		<>
			<LandingClient />
			<section className="bg-gradient-to-b from-white to-gray-50">
				<div className="mx-auto max-w-7xl px-4 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
					<div>
						<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
							TutorTools is the #1 tutoring platform for private tutors
						</h1>
						<p className="mt-4 text-lg text-gray-700">
							Manage your scheduling, billing, and students — all in one place.
						</p>
						<div className="mt-6 flex flex-col sm:flex-row gap-3">
							<a href="#trial" className="rounded-md bg-black text-white px-5 py-3 text-center hover:opacity-90">Start Free Trial</a>
							<a href="#demo" className="rounded-md border px-5 py-3 text-center hover:bg-gray-50">Book a Demo</a>
						</div>
						<p className="mt-2 text-xs text-gray-500">No credit card required</p>

						<div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-gray-700" data-fade>
							<div className="rounded-md border bg-white px-3 py-2">Easy Setup</div>
							<div className="rounded-md border bg-white px-3 py-2">Custom Branding</div>
							<div className="rounded-md border bg-white px-3 py-2">Online Payments</div>
							<div className="rounded-md border bg-white px-3 py-2">Automated Reminders</div>
						</div>
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
					{ title: "Lesson Scheduling", points: [
						"Drag-and-drop calendar with conflicts prevention",
						"Automated reminders via email/SMS",
						"Recurring lessons and availability blocks",
						"Sync with Google/Apple calendars",
					]},
					{ title: "Student & Contact Management", points: [
						"Unified profiles with notes and tags",
						"Parent/guardian relationships",
						"Quick filters and saved segments",
						"Import/export CSV",
					]},
					{ title: "Invoicing & Payments", points: [
						"Auto-generate invoices from lessons",
						"Online payments with Stripe",
						"Payment plans and dunning",
						"Export to bookkeeping",
					]},
					{ title: "Website Builder / Student Portal", points: [
						"Customizable pages and branding",
						"Student portal for schedules and payments",
						"Forms and lead capture",
						"SEO-friendly templates",
					]},
					{ title: "Workflow Automation / Self-Booking", points: [
						"Self-service booking links",
						"Lesson confirmation flows",
						"Zapier and webhooks",
						"Templates and reusable workflows",
					]},
				].map((m, i) => (
					<div key={m.title} className={`grid grid-cols-1 lg:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? 'lg:[&>div:first-child]:order-last' : ''}`}>
						<div data-fade>
							<h3 className="text-2xl font-semibold">{m.title}</h3>
							<ul className="mt-4 space-y-2 text-gray-700 list-disc list-inside">
								{m.points.map((p) => (<li key={p}>{p}</li>))}
							</ul>
							<div className="mt-6 rounded-xl border bg-white aspect-[16/10]" />
							<figure className="mt-4 border-l-4 border-gray-200 pl-4 text-sm text-gray-600">
								<blockquote>“I saved hours every week and grew my studio.”</blockquote>
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
								<blockquote className="text-gray-700">“TutorTools keeps me organized, reduces no-shows, and gets me paid on time.”</blockquote>
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
						<a href="#trial" className="rounded-md bg-black text-white px-5 py-3 hover:opacity-90">Start Free Trial</a>
						<a href="/signin" className="rounded-md border px-5 py-3 hover:bg-gray-50">Sign in</a>
					</div>
				</div>
				<div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
					{["Basic","Pro","Premium"].map((plan, idx) => (
						<div key={plan} className={`rounded-xl border bg-white p-6 ${idx===1 ? 'ring-2 ring-black' : ''}`} data-fade>
							<div className="font-semibold">{plan}</div>
							<div className="mt-2 text-3xl font-bold">$49<span className="text-base font-medium text-gray-500">/mo</span></div>
							<ul className="mt-4 space-y-2 text-sm text-gray-700 list-disc list-inside">
								<li>Unlimited students</li>
								<li>Online invoices & payments</li>
								<li>Scheduling & reminders</li>
							</ul>
							<a href="#trial" className="mt-6 inline-block rounded-md bg-black text-white px-4 py-2 hover:opacity-90">Start</a>
						</div>
					))}
				</div>

				{/* App quick links (previous features) */}
				<div className="mt-16 border-t pt-10" data-fade>
					<h4 className="text-lg font-semibold">App quick links</h4>
					<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
						<a className="rounded-lg border bg-white p-6 hover:shadow transition" href="/students">
							<div className="font-semibold">Manage Students</div>
							<div className="text-sm text-gray-600 mt-1">Create, view, update, and delete students.</div>
						</a>
						{session?.user ? (
							<a className="rounded-lg border bg-white p-6 hover:shadow transition" href="/students/new">
								<div className="font-semibold">Add a Student</div>
								<div className="text-sm text-gray-600 mt-1">Quickly add a new student record.</div>
							</a>
						) : null}
					</div>
				</div>
			</section>
		</>
	);
}
