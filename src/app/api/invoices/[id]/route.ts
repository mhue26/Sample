import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext } from "@/utils/auth";

const VALID_STATUSES = ["DRAFT", "SENT", "PAID", "PARTIALLY_PAID", "OVERDUE", "CANCELLED"] as const;
type InvoiceStatus = typeof VALID_STATUSES[number];

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const ctx = await getOrgContext();
	if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { id } = await params;
	const invoice = await prisma.invoice.findFirst({
		where: { id, organisationId: ctx.organisationId },
		include: {
			student: { select: { id: true, firstName: true, lastName: true, email: true } },
			term: { select: { id: true, name: true, startDate: true, endDate: true, year: true } },
			payments: { orderBy: { date: "desc" } },
			lineItems: { orderBy: { createdAt: "asc" } },
		},
	});
	if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

	return NextResponse.json(invoice);
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const ctx = await getOrgContext();
	if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { id } = await params;
	const body = await request.json();
	const { status, dueDate, notes, total } = body;

	if (status !== undefined && !VALID_STATUSES.includes(status as InvoiceStatus)) {
		return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
	}

	const existing = await prisma.invoice.findFirst({
		where: { id, organisationId: ctx.organisationId },
	});
	if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

	const data: {
		status?: InvoiceStatus;
		dueDate?: Date | null;
		notes?: string | null;
		total?: number;
		amount?: number;
	} = {};
	if (status) data.status = status as InvoiceStatus;
	if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
	if (notes !== undefined) data.notes = notes;
	if (existing.status === "DRAFT" && typeof total === "number" && total >= 0) {
		const totalCents = Math.round(total);
		data.total = totalCents;
		data.amount = totalCents + existing.discount;
	}

	const invoice = await prisma.invoice.update({ where: { id }, data });
	return NextResponse.json(invoice);
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const ctx = await getOrgContext();
	if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	if (ctx.role !== "OWNER" && ctx.role !== "ADMIN") {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const { id } = await params;
	const existing = await prisma.invoice.findFirst({
		where: { id, organisationId: ctx.organisationId },
		include: { payments: { select: { id: true } } },
	});
	if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
	if (existing.status !== "DRAFT") {
		return NextResponse.json({ error: "Only draft invoices can be deleted" }, { status: 400 });
	}
	if (existing.payments.length > 0) {
		return NextResponse.json({ error: "Cannot delete invoice with payments" }, { status: 400 });
	}

	await prisma.invoice.delete({ where: { id } });
	return NextResponse.json({ deleted: true });
}
