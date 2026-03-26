"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { BillingSection } from "@/lib/ledger";

interface BillingLedgerClientProps {
	sections: BillingSection[];
	students: { id: number; firstName: string; lastName: string }[];
	canManage: boolean;
	currency: string;
}

export default function BillingLedgerClient({
	sections,
	students,
	canManage,
	currency,
}: BillingLedgerClientProps) {
	const router = useRouter();
	const [showPayment, setShowPayment] = useState(false);
	const [loading, setLoading] = useState(false);
	const [payForm, setPayForm] = useState({
		studentId: "",
		amount: "",
		method: "CASH",
		reference: "",
		date: new Date().toISOString().split("T")[0],
		notes: "",
	});

	const currencySymbol = currency === "GBP" ? "£" : currency === "EUR" ? "€" : "$";
	const fmt = (cents: number) => `${currencySymbol}${(cents / 100).toFixed(2)}`;

	const recordPayment = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		await fetch("/api/payments", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				...payForm,
				invoiceId: "",
				amount: payForm.amount,
			}),
		});
		setShowPayment(false);
		setPayForm({
			studentId: "",
			amount: "",
			method: "CASH",
			reference: "",
			date: new Date().toISOString().split("T")[0],
			notes: "",
		});
		setLoading(false);
		router.refresh();
	};

	return (
		<div className="space-y-6">
			{canManage && (
				<div className="flex flex-wrap gap-3">
					<button
						type="button"
						onClick={() => setShowPayment(!showPayment)}
						className="bg-green-600/80 text-white px-4 py-2.5 rounded-2xl text-sm font-medium hover:bg-green-700/80 transition-colors"
					>
						Record payment
					</button>
				</div>
			)}

			{showPayment && canManage && (
				<form onSubmit={recordPayment} className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
					<h3 className="text-lg font-medium">Record payment</h3>
					<p className="text-xs text-gray-500">
						Applied to the student&apos;s ledger. For invoice-linked or online payments, use{" "}
						<Link href="/billing/statements" className="text-[#3D4756] underline">
							Statements
						</Link>
						.
					</p>
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<label className="block text-sm text-gray-700 mb-1">Student</label>
							<select
								value={payForm.studentId}
								onChange={(e) => setPayForm({ ...payForm, studentId: e.target.value })}
								required
								className="w-full border rounded-lg px-3 py-2 text-sm"
							>
								<option value="">Select student…</option>
								{students.map((s) => (
									<option key={s.id} value={s.id}>
										{s.firstName} {s.lastName}
									</option>
								))}
							</select>
						</div>
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
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div>
							<label className="block text-sm text-gray-700 mb-1">Method</label>
							<select
								value={payForm.method}
								onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
								className="w-full border rounded-lg px-3 py-2 text-sm"
							>
								<option value="CASH">Cash</option>
								<option value="BANK_TRANSFER">Bank transfer</option>
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
						<div className="sm:col-span-1" />
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
							{loading ? "Saving…" : "Record"}
						</button>
						<button type="button" onClick={() => setShowPayment(false)} className="text-gray-500 px-3 py-2 text-sm">
							Cancel
						</button>
					</div>
				</form>
			)}

			<div className="bg-white rounded-2xl shadow-sm overflow-hidden">
				<div className="px-4 py-3 border-b bg-gray-50">
					<h2 className="text-base font-semibold text-[#3D4756]">Students by class</h2>
					<p className="text-xs text-gray-500 mt-0.5">
						Balance due uses the ledger (lesson charges minus payments).{" "}
						<strong>Total paid</strong> is lifetime payments on the ledger.
					</p>
				</div>
				{sections.length > 0 ? (
					<div className="divide-y divide-gray-100">
						{sections.map((sec) => (
							<div key={sec.classId ?? "none"}>
								<div className="px-4 py-2.5 bg-gray-50/90 flex flex-wrap items-center justify-between gap-2 text-sm">
									<span className="font-semibold text-[#3D4756]">{sec.className}</span>
									<span className="text-gray-600">
										Owed <span className="font-medium text-orange-600">{fmt(sec.owedCents)}</span>
										{" · "}
										Collected <span className="font-medium text-green-600">{fmt(sec.collectedCents)}</span>
									</span>
								</div>
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-gray-100 bg-white">
											<th className="text-left px-4 py-2 font-medium text-gray-600">Student</th>
											<th className="text-right px-4 py-2 font-medium text-gray-600">Balance due</th>
											<th className="text-right px-4 py-2 font-medium text-gray-600">Total paid</th>
											<th className="text-right px-4 py-2 font-medium text-gray-600 w-36" />
										</tr>
									</thead>
									<tbody>
										{sec.students.map((s) => (
											<tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
												<td className="px-4 py-2.5 font-medium text-gray-900">
													{s.firstName} {s.lastName}
												</td>
												<td
													className={`px-4 py-2.5 text-right font-semibold ${
														s.balanceCents > 0
															? "text-orange-600"
															: s.balanceCents < 0
																? "text-green-600"
																: "text-gray-500"
													}`}
												>
													{fmt(s.balanceCents)}
												</td>
												<td className="px-4 py-2.5 text-right text-green-700 font-medium">{fmt(s.paidCents)}</td>
												<td className="px-4 py-2.5 text-right">
													<Link
														href={`/students/${s.id}?tab=account`}
														className="text-sm text-[#3D4756] hover:text-[#2A3441] hover:underline font-medium"
													>
														View account
													</Link>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						))}
					</div>
				) : (
					<div className="text-center py-10 text-sm text-gray-500">No active students.</div>
				)}
			</div>

			<p className="text-sm text-gray-500">
				Need numbered invoices, quotes, or Stripe checkout?{" "}
				<Link href="/billing/statements" className="text-[#3D4756] font-medium hover:underline">
					Open Statements &amp; tools
				</Link>
				.
			</p>
		</div>
	);
}
