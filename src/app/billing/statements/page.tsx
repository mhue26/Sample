import { prisma } from "@/lib/prisma";
import { requireOrgContext } from "@/utils/auth";
import { markOverdueInvoices } from "@/lib/billing";
import BillingStatementsClient from "../BillingStatementsClient";

export default async function BillingStatementsPage() {
	const ctx = await requireOrgContext();

	await markOverdueInvoices(ctx.organisationId);

	const [invoices, recentPayments, quotes, students, terms, settings] = await Promise.all([
		prisma.invoice.findMany({
			where: { organisationId: ctx.organisationId },
			include: {
				student: { select: { id: true, firstName: true, lastName: true } },
				term: { select: { id: true, name: true } },
				payments: { select: { amount: true } },
			},
			orderBy: { createdAt: "desc" },
		}),
		prisma.payment.findMany({
			where: { organisationId: ctx.organisationId },
			include: {
				student: { select: { firstName: true, lastName: true } },
				invoice: { select: { number: true } },
			},
			orderBy: { date: "desc" },
			take: 50,
		}),
		prisma.quote.findMany({
			where: { organisationId: ctx.organisationId },
			include: {
				student: { select: { id: true, firstName: true, lastName: true } },
				term: { select: { id: true, name: true, year: true } },
			},
			orderBy: { createdAt: "desc" },
		}),
		prisma.student.findMany({
			where: { organisationId: ctx.organisationId, isArchived: false },
			select: { id: true, firstName: true, lastName: true },
			orderBy: { firstName: "asc" },
		}),
		prisma.term.findMany({
			where: { organisationId: ctx.organisationId },
			orderBy: [{ year: "desc" }, { startDate: "desc" }],
		}),
		prisma.billingSettings.findUnique({
			where: { organisationId: ctx.organisationId },
		}),
	]);

	const canManage = ctx.role === "OWNER" || ctx.role === "ADMIN";

	return (
		<div className="space-y-6 pt-8 font-sans" style={{ fontFamily: "'Work Sans', sans-serif" }}>
			<div>
				<h1 className="text-2xl font-semibold text-[#3D4756]">Statements &amp; tools</h1>
				<p className="mt-2 text-sm text-gray-600 max-w-3xl">
					Generate invoices and quotes, record payments against an invoice, or sync historical data into the ledger.
				</p>
			</div>

			<BillingStatementsClient
				quotes={quotes.map((q) => ({
					id: String(q.id),
					number: q.number,
					total: q.total,
					status: q.status,
					student: q.student,
					term: q.term,
					convertedToInvoiceId: q.convertedToInvoiceId,
				}))}
				invoices={invoices.map((inv) => ({
					id: String(inv.id),
					number: inv.number,
					amount: inv.amount,
					discount: inv.discount,
					total: inv.total,
					status: inv.status,
					dueDate: inv.dueDate?.toISOString() || null,
					notes: inv.notes,
					createdAt: inv.createdAt.toISOString(),
					student: inv.student,
					term: inv.term,
					paidAmount: inv.payments.reduce((s, p) => s + p.amount, 0),
				}))}
				recentPayments={recentPayments.map((p) => ({
					id: String(p.id),
					amount: p.amount,
					method: p.method,
					reference: p.reference,
					date: p.date.toISOString(),
					student: p.student,
					invoiceNumber: p.invoice?.number || null,
				}))}
				students={students}
				terms={terms.map((t) => ({ id: t.id, name: t.name, year: t.year }))}
				canManage={canManage}
				canBackfillLedger={ctx.role === "OWNER"}
				currency={settings?.currency || "AUD"}
			/>
		</div>
	);
}
