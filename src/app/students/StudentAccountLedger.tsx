import Link from "next/link";

export type LedgerRow = {
	id: string;
	type: string;
	amountCents: number;
	effectiveDate: string;
	description: string;
	voidedAt: string | null;
};

function fmt(cents: number) {
	return `$${(Math.abs(cents) / 100).toFixed(2)}`;
}

function fmtSigned(cents: number) {
	if (cents === 0) return "$0.00";
	const neg = cents < 0;
	const v = (Math.abs(cents) / 100).toFixed(2);
	return neg ? `($${v})` : `$${v}`;
}

export default function StudentAccountLedger({
	balanceCents,
	totalPaidCents,
	entries,
	currency,
	canManageBilling,
}: {
	balanceCents: number;
	totalPaidCents: number;
	entries: LedgerRow[];
	currency: string;
	canManageBilling: boolean;
}) {
	// Running balance: oldest first
	const asc = [...entries].sort(
		(a, b) =>
			new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime() ||
			a.id.localeCompare(b.id)
	);
	let running = 0;
	const runningById = new Map<string, number>();
	for (const e of asc) {
		running += e.amountCents;
		runningById.set(e.id, running);
	}

	return (
		<div className="space-y-6">
			<p className="text-sm text-gray-600">
				Lesson charges and payments for this student. Positive balance means amount owed. The ledger is the
				source of truth for what they owe; invoices are optional statements for reporting.
			</p>

			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
					<div className="text-sm text-gray-500 mb-1">Balance due</div>
					<div
						className={`text-2xl font-semibold ${balanceCents > 0 ? "text-orange-600" : balanceCents < 0 ? "text-green-600" : "text-gray-800"}`}
					>
						{fmtSigned(balanceCents)}
					</div>
					<div className="text-xs text-gray-400 mt-1">{currency}</div>
				</div>
				<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
					<div className="text-sm text-gray-500 mb-1">Total paid (ledger)</div>
					<div className="text-2xl font-semibold text-green-600">{fmt(totalPaidCents)}</div>
				</div>
				<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-center gap-2">
					{canManageBilling && (
						<>
							<Link
								href="/billing"
								className="inline-flex justify-center items-center rounded-lg bg-[#3D4756] text-white px-4 py-2.5 text-sm font-medium hover:bg-[#2A3441] transition-colors text-center"
							>
								Record payment
							</Link>
							<Link
								href="/billing/statements"
								className="text-center text-sm text-[#3D4756] hover:underline"
							>
								Statements &amp; invoices
							</Link>
						</>
					)}
				</div>
			</div>

			<div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
				<div className="px-4 py-3 border-b border-gray-100">
					<h4 className="font-medium text-gray-900">Transaction history</h4>
				</div>
				{entries.length === 0 ? (
					<div className="text-center py-12 text-gray-500 text-sm">
						No ledger entries yet. Schedule a lesson to add a charge (per your organisation settings), or record a
						payment from Billing.
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b bg-gray-50 text-left text-gray-600">
									<th className="px-4 py-3 font-medium">Date</th>
									<th className="px-4 py-3 font-medium">Description</th>
									<th className="px-4 py-3 font-medium text-right">Charge</th>
									<th className="px-4 py-3 font-medium text-right">Credit</th>
									<th className="px-4 py-3 font-medium text-right">Balance</th>
								</tr>
							</thead>
							<tbody>
								{entries.map((e) => {
									const charge = e.amountCents > 0 ? e.amountCents : null;
									const credit = e.amountCents < 0 ? -e.amountCents : null;
									const bal = runningById.get(e.id) ?? 0;
									return (
										<tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50/80">
											<td className="px-4 py-3 whitespace-nowrap text-gray-700">
												{new Date(e.effectiveDate).toLocaleDateString("en-AU", {
													day: "numeric",
													month: "short",
													year: "numeric",
												})}
											</td>
											<td className="px-4 py-3 text-gray-800">
												<span className="text-xs text-gray-400 mr-2">{e.type.replace("_", " ")}</span>
												{e.description}
											</td>
											<td className="px-4 py-3 text-right text-gray-900">
												{charge != null ? fmt(charge) : "—"}
											</td>
											<td className="px-4 py-3 text-right text-green-600">
												{credit != null ? fmt(credit) : "—"}
											</td>
											<td className="px-4 py-3 text-right font-medium text-gray-800">{fmtSigned(bal)}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
}
