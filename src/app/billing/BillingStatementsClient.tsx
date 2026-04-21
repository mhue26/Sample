"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Invoice {
	id: string;
	number: string;
	amount: number;
	discount: number;
	total: number;
	status: string;
	dueDate: string | null;
	notes: string | null;
	createdAt: string;
	student: { id: number; firstName: string; lastName: string };
	term: { id: number; name: string } | null;
	paidAmount: number;
}

interface PaymentEntry {
	id: string;
	amount: number;
	method: string;
	reference: string | null;
	date: string;
	student: { firstName: string; lastName: string };
	invoiceNumber: string | null;
}

interface QuoteEntry {
	id: string;
	number: string;
	total: number;
	status: string;
	student: { id: number; firstName: string; lastName: string };
	term: { id: number; name: string; year: number } | null;
	convertedToInvoiceId: string | null;
}

interface BillingStatementsClientProps {
	quotes: QuoteEntry[];
	invoices: Invoice[];
	recentPayments: PaymentEntry[];
	students: { id: number; firstName: string; lastName: string }[];
	terms: { id: number; name: string; year: number }[];
	canManage: boolean;
	canBackfillLedger?: boolean;
	currency: string;
}

const statusColors: Record<string, string> = {
	DRAFT: "bg-gray-100 text-gray-800",
	SENT: "bg-blue-100 text-blue-800",
	PAID: "bg-green-100 text-green-800",
	PARTIALLY_PAID: "bg-yellow-100 text-yellow-800",
	OVERDUE: "bg-red-100 text-red-800",
	CANCELLED: "bg-gray-100 text-gray-500",
};

const methodLabels: Record<string, string> = {
	CASH: "Cash",
	BANK_TRANSFER: "Bank Transfer",
	CARD: "Card",
	OTHER: "Other",
};

export default function BillingStatementsClient({
	quotes,
	invoices,
	recentPayments,
	students,
	terms,
	canManage,
	canBackfillLedger,
	currency,
}: BillingStatementsClientProps) {
	const router = useRouter();
	const [showGenerate, setShowGenerate] = useState(false);
	const [showGenerateQuotes, setShowGenerateQuotes] = useState(false);
	const [showGenerateLessons, setShowGenerateLessons] = useState(false);
	const [showPayment, setShowPayment] = useState(false);
	const [loading, setLoading] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);
	const [backfillLoading, setBackfillLoading] = useState(false);
	const [activeTab, setActiveTab] = useState<"invoices" | "payments" | "quotes">("invoices");

	const [genTermId, setGenTermId] = useState("");
	const [genQuoteTermId, setGenQuoteTermId] = useState("");
	const [genLessonsFrom, setGenLessonsFrom] = useState("");
	const [genLessonsTo, setGenLessonsTo] = useState("");
	const [payForm, setPayForm] = useState({
		studentId: "",
		invoiceId: "",
		amount: "",
		method: "CASH",
		reference: "",
		date: new Date().toISOString().split("T")[0],
		notes: "",
	});

	const currencySymbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : "$";
	const fmt = (cents: number) => `${currencySymbol}${(cents / 100).toFixed(2)}`;

	const runLedgerBackfill = async () => {
		if (!confirm("Sync ledger from all existing meetings and payments? Safe to run more than once.")) return;
		setBackfillLoading(true);
		try {
			const res = await fetch("/api/admin/backfill-ledger", { method: "POST" });
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				alert(data.error || "Backfill failed");
				return;
			}
			alert(
				`Ledger sync complete.\nPayments linked: ${data.paymentEntriesCreated}\nMeetings processed: ${data.meetingsProcessed}`
			);
			router.refresh();
		} finally {
			setBackfillLoading(false);
		}
	};

	const generateInvoices = async () => {
		if (!genTermId) return;
		setLoading(true);
		setActionError(null);
		try {
			const res = await fetch("/api/invoices", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ termId: genTermId }),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				setActionError(data.error || "Failed to generate invoices. Please try again.");
				return;
			}
			setShowGenerate(false);
			router.refresh();
		} finally {
			setLoading(false);
		}
	};

	const generateQuotes = async () => {
		if (!genQuoteTermId) return;
		setLoading(true);
		setActionError(null);
		try {
			const res = await fetch("/api/quotes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ termId: genQuoteTermId }),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				setActionError(data.error || "Failed to create quotes. Please try again.");
				return;
			}
			setShowGenerateQuotes(false);
			router.refresh();
		} finally {
			setLoading(false);
		}
	};

	const generateFromLessons = async () => {
		if (!genLessonsFrom || !genLessonsTo) return;
		setLoading(true);
		setActionError(null);
		try {
			const res = await fetch("/api/invoices/generate-from-lessons", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ dateFrom: genLessonsFrom, dateTo: genLessonsTo }),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				setActionError(data.error || "Failed to generate invoices. Please try again.");
				return;
			}
			setShowGenerateLessons(false);
			router.refresh();
		} finally {
			setLoading(false);
		}
	};

	const updateInvoiceStatus = async (id: string, status: string) => {
		const res = await fetch(`/api/invoices/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ status }),
		});
		if (res.ok) router.refresh();
	};

	const convertQuoteToInvoice = async (quoteId: string) => {
		setLoading(true);
		setActionError(null);
		try {
			const res = await fetch(`/api/quotes/${quoteId}/convert-to-invoice`, { method: "POST" });
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				setActionError(data.error || "Failed to convert quote. Please try again.");
				return;
			}
			router.refresh();
		} finally {
			setLoading(false);
		}
	};

	const recordPayment = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setActionError(null);
		try {
			const res = await fetch("/api/payments", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payForm),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				setActionError(data.error || "Failed to record payment. Please try again.");
				return;
			}
			setShowPayment(false);
			setPayForm({
				studentId: "",
				invoiceId: "",
				amount: "",
				method: "CASH",
				reference: "",
				date: new Date().toISOString().split("T")[0],
				notes: "",
			});
			router.refresh();
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			{actionError && (
				<div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
					<span>{actionError}</span>
					<button type="button" onClick={() => setActionError(null)} className="flex-shrink-0 rounded p-1 text-red-600 hover:bg-red-100" aria-label="Dismiss">
						<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
					</button>
				</div>
			)}
			<p className="text-sm text-gray-600">
				<Link href="/billing" className="text-[#3D4756] font-medium hover:underline">
					← Back to Billing
				</Link>
				<span className="text-gray-500">
					{" "}
					· Optional numbered documents and Stripe checkout. Day-to-day balances live on the main Billing page.
				</span>
			</p>

			{canManage && (
				<div className="flex flex-wrap gap-3">
					<button
						onClick={() => {
							setShowGenerate(!showGenerate);
							setShowGenerateLessons(false);
						}}
						className="bg-blue-600/80 text-white px-4 py-2.5 rounded-2xl text-sm font-medium hover:bg-blue-700/80 transition-colors"
					>
						Generate Invoices (Term)
					</button>
					<button
						onClick={() => {
							setShowGenerateQuotes(!showGenerateQuotes);
							setShowGenerate(false);
							setShowGenerateLessons(false);
						}}
						className="bg-amber-600/80 text-white px-4 py-2.5 rounded-2xl text-sm font-medium hover:bg-amber-700/80 transition-colors"
					>
						Create Quotes (Term)
					</button>
					<button
						onClick={() => {
							setShowGenerateLessons(!showGenerateLessons);
							setShowGenerate(false);
							setShowGenerateQuotes(false);
						}}
						className="bg-indigo-600/80 text-white px-4 py-2.5 rounded-2xl text-sm font-medium hover:bg-indigo-700/80 transition-colors"
					>
						Generate from Lessons
					</button>
					<button
						onClick={() => setShowPayment(!showPayment)}
						className="bg-green-600/80 text-white px-4 py-2.5 rounded-2xl text-sm font-medium hover:bg-green-700/80 transition-colors"
					>
						Record payment (with invoice)
					</button>
					{canBackfillLedger && (
						<button
							type="button"
							onClick={runLedgerBackfill}
							disabled={backfillLoading}
							className="bg-slate-600/80 text-white px-4 py-2.5 rounded-2xl text-sm font-medium hover:bg-slate-700/80 transition-colors disabled:opacity-50"
						>
							{backfillLoading ? "Syncing ledger…" : "Sync ledger (history)"}
						</button>
					)}
				</div>
			)}

			{showGenerate && (
				<div className="bg-white rounded-2xl shadow-sm p-6">
					<h3 className="text-lg font-medium mb-3">Generate Invoices for Term</h3>
					<div className="flex gap-3 items-end">
						<div className="flex-1">
							<label className="block text-sm text-gray-700 mb-1">Select Term</label>
							<select
								value={genTermId}
								onChange={(e) => setGenTermId(e.target.value)}
								className="w-full border rounded-lg px-3 py-2 text-sm"
							>
								<option value="">Choose a term...</option>
								{terms.map((t) => (
									<option key={t.id} value={t.id}>
										{t.name} ({t.year})
									</option>
								))}
							</select>
						</div>
						<button
							onClick={generateInvoices}
							disabled={!genTermId || loading}
							className="bg-[#3D4756] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2A3441] disabled:opacity-50 transition-colors"
						>
							{loading ? "Generating..." : "Generate"}
						</button>
						<button onClick={() => setShowGenerate(false)} className="text-gray-500 px-3 py-2 text-sm">
							Cancel
						</button>
					</div>
					<p className="text-xs text-gray-500 mt-2">
						This creates a draft invoice for every active student using the default term rate. Students who already have an
						invoice for this term are skipped.
					</p>
				</div>
			)}

			{showGenerateQuotes && (
				<div className="bg-white rounded-2xl shadow-sm p-6">
					<h3 className="text-lg font-medium mb-3">Create Quotes for Term</h3>
					<div className="flex gap-3 items-end">
						<div className="flex-1">
							<label className="block text-sm text-gray-700 mb-1">Select Term</label>
							<select
								value={genQuoteTermId}
								onChange={(e) => setGenQuoteTermId(e.target.value)}
								className="w-full border rounded-lg px-3 py-2 text-sm"
							>
								<option value="">Choose a term...</option>
								{terms.map((t) => (
									<option key={t.id} value={t.id}>
										{t.name} ({t.year})
									</option>
								))}
							</select>
						</div>
						<button
							onClick={generateQuotes}
							disabled={!genQuoteTermId || loading}
							className="bg-[#3D4756] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2A3441] disabled:opacity-50 transition-colors"
						>
							{loading ? "Creating..." : "Create quotes"}
						</button>
						<button onClick={() => setShowGenerateQuotes(false)} className="text-gray-500 px-3 py-2 text-sm">
							Cancel
						</button>
					</div>
					<p className="text-xs text-gray-500 mt-2">
						Creates a draft quote per active student for the term. Use the Quotes tab to convert quotes to invoices when
						accepted.
					</p>
				</div>
			)}

			{showGenerateLessons && (
				<div className="bg-white rounded-2xl shadow-sm p-6">
					<h3 className="text-lg font-medium mb-3">Generate Invoices from Completed Lessons</h3>
					<div className="flex flex-wrap gap-3 items-end">
						<div>
							<label className="block text-sm text-gray-700 mb-1">From date</label>
							<input
								type="date"
								value={genLessonsFrom}
								onChange={(e) => setGenLessonsFrom(e.target.value)}
								className="w-full border rounded-lg px-3 py-2 text-sm"
							/>
						</div>
						<div>
							<label className="block text-sm text-gray-700 mb-1">To date</label>
							<input
								type="date"
								value={genLessonsTo}
								onChange={(e) => setGenLessonsTo(e.target.value)}
								className="w-full border rounded-lg px-3 py-2 text-sm"
							/>
						</div>
						<button
							onClick={generateFromLessons}
							disabled={!genLessonsFrom || !genLessonsTo || loading}
							className="bg-[#3D4756] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2A3441] disabled:opacity-50 transition-colors"
						>
							{loading ? "Generating..." : "Generate"}
						</button>
						<button onClick={() => setShowGenerateLessons(false)} className="text-gray-500 px-3 py-2 text-sm">
							Cancel
						</button>
					</div>
					<p className="text-xs text-gray-500 mt-2">
						Creates one draft invoice per student with completed lessons in this date range. Each lesson is a line item
						using the student&apos;s hourly rate (or meeting total if set). Already-invoiced lessons are skipped.
					</p>
				</div>
			)}

			{showPayment && (
				<form onSubmit={recordPayment} className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
					<h3 className="text-lg font-medium">Record payment</h3>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="block text-sm text-gray-700 mb-1">Student</label>
							<select
								value={payForm.studentId}
								onChange={(e) => setPayForm({ ...payForm, studentId: e.target.value })}
								required
								className="w-full border rounded-lg px-3 py-2 text-sm"
							>
								<option value="">Select student...</option>
								{students.map((s) => (
									<option key={s.id} value={s.id}>
										{s.firstName} {s.lastName}
									</option>
								))}
							</select>
						</div>
						<div>
							<label className="block text-sm text-gray-700 mb-1">Invoice (optional)</label>
							<select
								value={payForm.invoiceId}
								onChange={(e) => setPayForm({ ...payForm, invoiceId: e.target.value })}
								className="w-full border rounded-lg px-3 py-2 text-sm"
							>
								<option value="">No invoice</option>
								{invoices
									.filter(
										(i) =>
											i.status !== "PAID" &&
											i.status !== "CANCELLED" &&
											(!payForm.studentId || i.student.id === parseInt(payForm.studentId, 10))
									)
									.map((i) => (
										<option key={i.id} value={i.id}>
											{i.number} - {i.student.firstName} {i.student.lastName} ({fmt(i.total)})
										</option>
									))}
							</select>
						</div>
					</div>
					<div className="grid grid-cols-3 gap-3">
						<div>
							<label className="block text-sm text-gray-700 mb-1">Amount ({currencySymbol})</label>
							<input
								type="number"
								step="0.01"
								min="0"
								value={payForm.amount}
								onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
								required
								className="w-full border rounded-lg px-3 py-2 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
							/>
						</div>
						<div>
							<label className="block text-sm text-gray-700 mb-1">Method</label>
							<select
								value={payForm.method}
								onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
								className="w-full border rounded-lg px-3 py-2 text-sm"
							>
								<option value="CASH">Cash</option>
								<option value="BANK_TRANSFER">Bank Transfer</option>
								<option value="CARD">Card</option>
								<option value="OTHER">Other</option>
							</select>
						</div>
						<div>
							<label className="block text-sm text-gray-700 mb-1">Date</label>
							<input
								type="date"
								value={payForm.date}
								onChange={(e) => setPayForm({ ...payForm, date: e.target.value })}
								required
								className="w-full border rounded-lg px-3 py-2 text-sm"
							/>
						</div>
					</div>
					<input
						type="text"
						placeholder="Reference (optional)"
						value={payForm.reference}
						onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })}
						className="w-full border rounded-lg px-3 py-2 text-sm"
					/>
					<div className="flex gap-2">
						<button
							type="submit"
							disabled={loading}
							className="bg-[#3D4756] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2A3441] disabled:opacity-50"
						>
							{loading ? "Saving..." : "Record"}
						</button>
						<button type="button" onClick={() => setShowPayment(false)} className="text-gray-500 px-3 py-2 text-sm">
							Cancel
						</button>
					</div>
				</form>
			)}

			<div>
				<p className="text-xs text-gray-500 mb-2">Invoices, payments log, and quotes</p>
				<div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
					<button
						onClick={() => setActiveTab("invoices")}
						className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "invoices" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
					>
						Invoices ({invoices.length})
					</button>
					<button
						onClick={() => setActiveTab("payments")}
						className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "payments" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
					>
						Payments ({recentPayments.length})
					</button>
					<button
						onClick={() => setActiveTab("quotes")}
						className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "quotes" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
					>
						Quotes ({quotes.length})
					</button>
				</div>
			</div>

			{activeTab === "invoices" && (
				<div className="bg-white rounded-2xl shadow-sm overflow-hidden">
					{invoices.length > 0 ? (
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b bg-gray-50">
									<th className="text-left px-4 py-3 font-medium text-gray-600">Invoice</th>
									<th className="text-left px-4 py-3 font-medium text-gray-600">Student</th>
									<th className="text-left px-4 py-3 font-medium text-gray-600">Term</th>
									<th className="text-left px-4 py-3 font-medium text-gray-600">Due date</th>
									<th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
									<th className="text-right px-4 py-3 font-medium text-gray-600">Paid</th>
									<th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
									{canManage && <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>}
								</tr>
							</thead>
							<tbody>
								{invoices.map((inv) => (
									<tr key={inv.id} className="border-b hover:bg-gray-50">
										<td className="px-4 py-3 font-medium">
											<Link
												href={`/billing/invoices/${inv.id}`}
												className="text-[#3D4756] hover:text-[#2A3441] hover:underline"
											>
												{inv.number}
											</Link>
										</td>
										<td className="px-4 py-3">
											{inv.student.firstName} {inv.student.lastName}
										</td>
										<td className="px-4 py-3 text-gray-500">{inv.term?.name || "—"}</td>
										<td className="px-4 py-3 text-gray-600">
											{inv.dueDate
												? new Date(inv.dueDate).toLocaleDateString("en-GB", {
														day: "numeric",
														month: "short",
														year: "numeric",
													})
												: "—"}
										</td>
										<td className="px-4 py-3 text-right">{fmt(inv.total)}</td>
										<td className="px-4 py-3 text-right text-green-600">{fmt(inv.paidAmount)}</td>
										<td className="px-4 py-3 text-center">
											<span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[inv.status] || ""}`}>
												{inv.status.replace("_", " ")}
											</span>
										</td>
										{canManage && (
											<td className="px-4 py-3 text-center">
												<select
													value=""
													onChange={(e) => {
														if (e.target.value) updateInvoiceStatus(inv.id, e.target.value);
													}}
													className="text-xs border rounded px-1 py-0.5"
												>
													<option value="">Change...</option>
													<option value="SENT">Mark Sent</option>
													<option value="PAID">Mark Paid</option>
													<option value="OVERDUE">Mark Overdue</option>
													<option value="CANCELLED">Cancel</option>
												</select>
											</td>
										)}
									</tr>
								))}
							</tbody>
						</table>
					) : (
						<div className="text-center py-12">
							<svg
								className="w-16 h-16 mx-auto text-gray-300 mb-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1}
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
							<h3 className="text-lg font-medium text-gray-400 mb-2">No invoices yet</h3>
							<p className="text-sm text-gray-400">Generate invoices for a term to get started.</p>
						</div>
					)}
				</div>
			)}

			{activeTab === "quotes" && (
				<div className="bg-white rounded-2xl shadow-sm overflow-hidden">
					{quotes.length > 0 ? (
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b bg-gray-50">
									<th className="text-left px-4 py-3 font-medium text-gray-600">Quote</th>
									<th className="text-left px-4 py-3 font-medium text-gray-600">Student</th>
									<th className="text-left px-4 py-3 font-medium text-gray-600">Term</th>
									<th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
									<th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
									{canManage && <th className="text-center px-4 py-3 font-medium text-gray-600">Actions</th>}
								</tr>
							</thead>
							<tbody>
								{quotes.map((q) => (
									<tr key={q.id} className="border-b hover:bg-gray-50">
										<td className="px-4 py-3 font-medium">{q.number}</td>
										<td className="px-4 py-3">
											{q.student.firstName} {q.student.lastName}
										</td>
										<td className="px-4 py-3 text-gray-500">{q.term ? `${q.term.name} ${q.term.year}` : "—"}</td>
										<td className="px-4 py-3 text-right">{fmt(q.total)}</td>
										<td className="px-4 py-3 text-center">
											<span
												className={`text-xs px-2 py-1 rounded-full font-medium ${q.status === "CONVERTED" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
											>
												{q.status}
											</span>
										</td>
										{canManage && (
											<td className="px-4 py-3 text-center">
												{q.status !== "CONVERTED" ? (
													<button
														onClick={() => convertQuoteToInvoice(q.id)}
														disabled={loading}
														className="text-xs text-[#3D4756] hover:underline disabled:opacity-50"
													>
														Convert to invoice
													</button>
												) : (
													<span className="text-xs text-gray-500">Converted</span>
												)}
											</td>
										)}
									</tr>
								))}
							</tbody>
						</table>
					) : (
						<div className="text-center py-12">
							<h3 className="text-lg font-medium text-gray-400 mb-2">No quotes yet</h3>
							<p className="text-sm text-gray-400">Create quotes using the button above.</p>
						</div>
					)}
				</div>
			)}

			{activeTab === "payments" && (
				<div className="bg-white rounded-2xl shadow-sm overflow-hidden">
					{recentPayments.length > 0 ? (
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b bg-gray-50">
									<th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
									<th className="text-left px-4 py-3 font-medium text-gray-600">Student</th>
									<th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
									<th className="text-left px-4 py-3 font-medium text-gray-600">Method</th>
									<th className="text-left px-4 py-3 font-medium text-gray-600">Invoice</th>
									<th className="text-left px-4 py-3 font-medium text-gray-600">Reference</th>
								</tr>
							</thead>
							<tbody>
								{recentPayments.map((p) => (
									<tr key={p.id} className="border-b hover:bg-gray-50">
										<td className="px-4 py-3">
											{new Date(p.date).toLocaleDateString("en-GB", {
												day: "numeric",
												month: "short",
												year: "numeric",
											})}
										</td>
										<td className="px-4 py-3">
											{p.student.firstName} {p.student.lastName}
										</td>
										<td className="px-4 py-3 text-right font-medium text-green-600">{fmt(p.amount)}</td>
										<td className="px-4 py-3">{methodLabels[p.method] || p.method}</td>
										<td className="px-4 py-3 text-gray-500">{p.invoiceNumber || "—"}</td>
										<td className="px-4 py-3 text-gray-500">{p.reference || "—"}</td>
									</tr>
								))}
							</tbody>
						</table>
					) : (
						<div className="text-center py-12">
							<h3 className="text-lg font-medium text-gray-400 mb-2">No payments recorded</h3>
							<p className="text-sm text-gray-400">Record a payment to see it here.</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
