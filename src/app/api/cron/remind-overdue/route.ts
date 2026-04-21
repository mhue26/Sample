import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const REMINDER_COOLDOWN_DAYS = 7;

export async function GET(request: NextRequest) {
	const authHeader = request.headers.get("authorization");
	const secret = process.env.CRON_SECRET || process.env.BILLING_REMINDER_SECRET;
	if (secret && authHeader !== `Bearer ${secret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl?.origin || "https://localhost:3000";

	// Mark all SENT/PARTIALLY_PAID invoices with a past due date as OVERDUE in one query
	const startOfToday = new Date();
	startOfToday.setHours(0, 0, 0, 0);
	await prisma.invoice.updateMany({
		where: {
			status: { in: ["SENT", "PARTIALLY_PAID"] },
			dueDate: { lt: startOfToday },
		},
		data: { status: "OVERDUE" },
	});

	// Find OVERDUE invoices with student email where we haven't sent a reminder in the cooldown period
	const cooldown = new Date();
	cooldown.setDate(cooldown.getDate() - REMINDER_COOLDOWN_DAYS);

	const overdueInvoices = await prisma.invoice.findMany({
		where: {
			status: "OVERDUE",
			student: { email: { not: null } },
			OR: [
				{ lastReminderAt: null },
				{ lastReminderAt: { lt: cooldown } },
			],
		},
		include: {
			organisation: { select: { name: true } },
			student: { select: { firstName: true, lastName: true, email: true } },
		},
	});

	let sent = 0;
	if (resend) {
		const fromEmail = process.env.RESEND_FROM_EMAIL ?? "invoices@resend.dev";
		for (const inv of overdueInvoices) {
			const toEmail = inv.student.email?.trim();
			if (!toEmail) continue;

			const printUrl = `${baseUrl}/billing/invoices/${inv.id}/print`;
			const totalFormatted = `$${(inv.total / 100).toFixed(2)}`;

			const { error } = await resend.emails.send({
				from: fromEmail,
				to: [toEmail],
				subject: `Reminder: Overdue invoice ${inv.number} from ${inv.organisation.name}`,
				html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #333;">
  <p>Hi ${inv.student.firstName},</p>
  <p>This is a friendly reminder that invoice <strong>${inv.number}</strong> from ${inv.organisation.name} is overdue.</p>
  <p><strong>Amount due: ${totalFormatted}</strong></p>
  <p><a href="${printUrl}" style="display: inline-block; background: #3D4756; color: white; padding: 10px 18px; text-decoration: none; border-radius: 8px;">View invoice</a></p>
  <p style="margin-top: 24px; font-size: 14px; color: #666;">Please arrange payment at your earliest convenience.</p>
</body>
</html>
				`.trim(),
			});

			if (!error) {
				await prisma.invoice.update({
					where: { id: inv.id },
					data: { lastReminderAt: new Date() },
				});
				sent++;
			}
		}
	}

	return NextResponse.json({
		overdueCount: overdueInvoices.length,
		remindersSent: sent,
		emailConfigured: !!resend,
	});
}
