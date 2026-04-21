import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { createPaymentLedgerEntry } from "@/lib/ledger";

const stripe = process.env.STRIPE_SECRET_KEY
	? new Stripe(process.env.STRIPE_SECRET_KEY)
	: null;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
	if (!stripe || !webhookSecret) {
		return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
	}

	const body = await request.text();
	const sig = request.headers.get("stripe-signature");
	if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

	let event: Stripe.Event;
	try {
		event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
	} catch (err) {
		const message = err instanceof Error ? err.message : "Unknown error";
		return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
	}

	if (event.type === "checkout.session.completed") {
		const session = event.data.object as Stripe.Checkout.Session;
		const invoiceId = session.metadata?.invoiceId;
		const organisationId = session.metadata?.organisationId;
		const studentId = session.metadata?.studentId;
		const amountTotal = session.amount_total;

		if (!invoiceId || !organisationId || !studentId || amountTotal == null) {
			return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
		}

		const invoice = await prisma.invoice.findFirst({
			where: { id: invoiceId, organisationId },
			include: { payments: { select: { amount: true } } },
		});
		if (!invoice) {
			return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
		}

		// Idempotency: if we already recorded this payment (e.g. by payment_intent id), skip
		const paymentIntentId = session.payment_intent as string | null;
		if (paymentIntentId) {
			const existing = await prisma.payment.findFirst({
				where: { reference: paymentIntentId, invoiceId },
			});
			if (existing) return NextResponse.json({ received: true });
		}

		const member = await prisma.organisationMember.findFirst({
			where: { organisationId },
			select: { userId: true },
		});
		if (!member) {
			return NextResponse.json({ error: "No organisation member to record payment" }, { status: 500 });
		}

		const reference = paymentIntentId || `stripe-${session.id}`;
		const numericStudentId = parseInt(studentId, 10);

		await prisma.$transaction(async (tx) => {
			const payment = await tx.payment.create({
				data: {
					amount: amountTotal,
					method: "CARD",
					reference,
					date: new Date(),
					notes: "Paid via Stripe",
					organisationId,
					studentId: numericStudentId,
					invoiceId,
					recordedById: member.userId,
				},
			});
			await createPaymentLedgerEntry(tx, {
				id: payment.id,
				amount: payment.amount,
				date: payment.date,
				method: payment.method,
				reference: payment.reference,
				organisationId: payment.organisationId,
				studentId: payment.studentId,
				invoiceId: payment.invoiceId,
			});
		});

		const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0) + amountTotal;
		const newStatus = totalPaid >= invoice.total ? "PAID" : "PARTIALLY_PAID";
		await prisma.invoice.update({
			where: { id: invoiceId },
			data: { status: newStatus },
		});
	}

	return NextResponse.json({ received: true });
}
