import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";

export default async function BillingPage() {
	const session = await getServerSession(authOptions);
	
	if (!session?.user) {
		return (
			<div className="space-y-2">
				<div className="text-sm text-gray-600">You must sign in to view invoicing information.</div>
				<a href="/signin" className="text-blue-600 hover:underline">Sign in</a>
			</div>
		);
	}

	return (
		<div className="space-y-6 pt-8 font-sans" style={{ fontFamily: "'Work Sans', sans-serif" }}>
			<div>
				<h1 className="text-2xl font-semibold">Invoicing</h1>
				<p className="text-gray-600 mt-2">Create and manage invoices for your students.</p>
			</div>

			{/* Quick Actions */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				<button className="rounded-lg border p-4 hover:bg-gray-50 text-left">
					<div className="flex items-center mb-2">
						<svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
						</svg>
						<h2 className="font-medium">Create Invoice</h2>
					</div>
					<p className="text-sm text-gray-600">Generate a new invoice for a student.</p>
				</button>
				<button className="rounded-lg border p-4 hover:bg-gray-50 text-left">
					<div className="flex items-center mb-2">
						<svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						<h2 className="font-medium">View Invoices</h2>
					</div>
					<p className="text-sm text-gray-600">See all your invoices and their status.</p>
				</button>
				<button className="rounded-lg border p-4 hover:bg-gray-50 text-left">
					<div className="flex items-center mb-2">
						<svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
						<h2 className="font-medium">Payment Tracking</h2>
					</div>
					<p className="text-sm text-gray-600">Track payments and outstanding balances.</p>
				</button>
			</div>

			{/* Recent Invoices */}
			<div className="bg-white rounded-lg border p-6">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-medium">Recent Invoices</h2>
					<button className="text-sm text-blue-600 hover:text-blue-700">View all</button>
				</div>
				<div className="text-center py-8">
					<div className="text-gray-400 mb-4">
						<svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
					</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
					<p className="text-gray-500">Create your first invoice to start billing your students.</p>
					<div className="mt-4">
						<button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
							<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
							</svg>
							Create First Invoice
						</button>
					</div>
				</div>
			</div>

			{/* Invoice Templates */}
			<div className="bg-white rounded-lg border p-6">
				<h2 className="text-lg font-medium mb-4">Invoice Templates</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="border rounded-lg p-4">
						<h3 className="font-medium text-gray-900 mb-2">Single Lesson</h3>
						<p className="text-sm text-gray-600 mb-3">Perfect for one-time lessons or make-up sessions.</p>
						<button className="text-sm text-blue-600 hover:text-blue-700">Use Template</button>
					</div>
					<div className="border rounded-lg p-4">
						<h3 className="font-medium text-gray-900 mb-2">Monthly Package</h3>
						<p className="text-sm text-gray-600 mb-3">Ideal for regular weekly or monthly lesson packages.</p>
						<button className="text-sm text-blue-600 hover:text-blue-700">Use Template</button>
					</div>
				</div>
			</div>

			{/* Payment Methods */}
			<div className="bg-white rounded-lg border p-6">
				<h2 className="text-lg font-medium mb-4">Payment Methods</h2>
				<div className="text-center py-8">
					<div className="text-gray-400 mb-4">
						<svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
						</svg>
					</div>
					<h3 className="text-lg font-medium text-gray-900 mb-2">Set up payment methods</h3>
					<div className="mt-4">
						<button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
							<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
							</svg>
							Add Payment Method
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
