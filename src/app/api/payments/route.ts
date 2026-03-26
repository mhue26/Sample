import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext } from "@/utils/auth";
import { createPaymentLedgerEntry } from "@/lib/ledger";

export async function GET() {
	const ctx = await getOrgContext();
	if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const payments = await prisma.payment.findMany({
		where: { organisationId: ctx.organisationId },
		include: {
			student: { select: { id: true, firstName: true, lastName: true } },
			invoice: { select: { id: true, number: true } },
		},
		orderBy: { date: "desc" },
		take: 50,
	});

	return NextResponse.json(payments);
}

export async function POST(request: NextRequest) {
	const ctx = await getOrgContext();
	if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const body = await request.json();
	const { invoiceId, studentId, amount, method, reference, date, notes } = body;

	if (!studentId || !amount || !method || !date) {
		return NextResponse.json({ error: "Student, amount, method, and date are required" }, { status: 400 });
	}

	const amountCents = Math.round(parseFloat(amount) * 100);
	const paymentDate = new Date(date);

	const payment = await prisma.$transaction(async (tx) => {
		const p = await tx.payment.create({
			data: {
				amount: amountCents,
				method,
				reference: reference || null,
				date: paymentDate,
				notes: notes || null,
				organisationId: ctx.organisationId,
				studentId: parseInt(studentId),
				invoiceId: invoiceId || null,
				recordedById: ctx.userId,
			},
		});
		await createPaymentLedgerEntry(tx, {
			id: p.id,
			amount: p.amount,
			date: p.date,
			method: p.method,
			reference: p.reference,
			organisationId: p.organisationId,
			studentId: p.studentId,
			invoiceId: p.invoiceId,
		});
		return p;
	});

	if (invoiceId) {
		const allPayments = await prisma.payment.findMany({
			where: { invoiceId },
			select: { amount: true },
		});
		const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
		const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
		if (invoice) {
			let newStatus = invoice.status;
			if (totalPaid >= invoice.total) {
				newStatus = "PAID";
			} else if (totalPaid > 0) {
				newStatus = "PARTIALLY_PAID";
			}
			if (newStatus !== invoice.status) {
				await prisma.invoice.update({ where: { id: invoiceId }, data: { status: newStatus } });
			}
		}
	}

	return NextResponse.json(payment);
}
