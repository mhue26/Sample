import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/utils/auth";
import {
	buildBillingSectionsFromStudents,
	getOrganisationStudentBalances,
	getOrganisationStudentPaymentTotalsCents,
	getOrganisationTotalCollectedCents,
} from "@/lib/ledger";
import BillingLedgerClient from "./BillingLedgerClient";

export default async function BillingPage() {
	const ctx = await requireOrgContext();

	const [students, settings, ledgerBalances, totalCollectedCents, paidByStudent] = await Promise.all([
		prisma.student.findMany({
			where: { organisationId: ctx.organisationId, isArchived: false },
			select: {
				id: true,
				firstName: true,
				lastName: true,
				classId: true,
				class: { select: { id: true, name: true } },
			},
			orderBy: { firstName: "asc" },
		}),
		prisma.billingSettings.findUnique({
			where: { organisationId: ctx.organisationId },
		}),
		getOrganisationStudentBalances(ctx.organisationId),
		getOrganisationTotalCollectedCents(ctx.organisationId),
		getOrganisationStudentPaymentTotalsCents(ctx.organisationId),
	]);

	const balanceByStudent = new Map(ledgerBalances.map((b) => [b.studentId, b.balanceCents]));

	let totalOwedCents = 0;
	let creditOnAccountCents = 0;
	for (const s of students) {
		const b = balanceByStudent.get(s.id) ?? 0;
		if (b > 0) totalOwedCents += b;
		if (b < 0) creditOnAccountCents += -b;
	}

	const sections = buildBillingSectionsFromStudents(students, balanceByStudent, paidByStudent);

	const canManage = ctx.role === "OWNER" || ctx.role === "ADMIN";

	const currency = settings?.currency || "AUD";
	const sym = currency === "GBP" ? "£" : currency === "EUR" ? "€" : "$";
	const fmtCard = (cents: number) => `${sym}${(cents / 100).toFixed(2)}`;

	return (
		<div className="space-y-6 pt-8 font-sans" style={{ fontFamily: "'Work Sans', sans-serif" }}>
			<div>
				<h1 className="text-2xl font-semibold text-[#3D4756]">Billing</h1>
				<p className="mt-2 text-sm text-gray-600 max-w-3xl">
					Lesson charges post when lessons are scheduled (or when marked complete—see Settings → Billing). Payments reduce
					each student&apos;s balance. This ledger is the source of truth for who owes what.
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="bg-white rounded-2xl shadow-sm p-6">
					<div className="text-sm text-gray-500 mb-1">Total collected</div>
					<div className="text-2xl font-semibold text-green-600">{fmtCard(totalCollectedCents)}</div>
					<div className="text-xs text-gray-400 mt-1">All payments on the ledger</div>
				</div>
				<div className="bg-white rounded-2xl shadow-sm p-6">
					<div className="text-sm text-gray-500 mb-1">Total owed</div>
					<div className="text-2xl font-semibold text-orange-600">{fmtCard(totalOwedCents)}</div>
					<div className="text-xs text-gray-400 mt-1">Sum of positive balances</div>
				</div>
				<div className="bg-white rounded-2xl shadow-sm p-6">
					<div className="text-sm text-gray-500 mb-1">Credit on account</div>
					<div className="text-2xl font-semibold text-green-700">{fmtCard(creditOnAccountCents)}</div>
					<div className="text-xs text-gray-400 mt-1">Prepaid / overpayment (negative balances)</div>
				</div>
			</div>

			<BillingLedgerClient
				sections={sections}
				students={students.map((s) => ({ id: s.id, firstName: s.firstName, lastName: s.lastName }))}
				canManage={canManage}
				currency={settings?.currency || "AUD"}
			/>
		</div>
	);
}



