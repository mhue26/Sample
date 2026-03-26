import type { BillingChargeTiming, Class, LessonStatus, Meeting, Student } from "@/generated/prisma";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

type Db = Prisma.TransactionClient | typeof prisma;

export type MeetingForCharge = Pick<
	Meeting,
	| "id"
	| "organisationId"
	| "studentId"
	| "title"
	| "startTime"
	| "endTime"
	| "status"
	| "hourlyRateCents"
	| "totalCents"
>;

export type StudentForCharge = Pick<Student, "hourlyRateCents"> & {
	class: Pick<Class, "defaultRateCents"> | null;
};

/**
 * Lesson charge: prefer meeting.totalCents, else duration × hourly (meeting override, student, class default, org default).
 */
export function computeLessonChargeCents(
	meeting: MeetingForCharge,
	student: StudentForCharge,
	defaultHourlyCents: number
): number {
	if (meeting.totalCents != null && meeting.totalCents > 0) {
		return meeting.totalCents;
	}
	const hourly =
		meeting.hourlyRateCents ??
		student.hourlyRateCents ??
		student.class?.defaultRateCents ??
		defaultHourlyCents;
	const durationMs = meeting.endTime.getTime() - meeting.startTime.getTime();
	const durationHours = Math.max(0, durationMs / (1000 * 60 * 60));
	return Math.round(durationHours * hourly);
}

function shouldPostLessonCharge(status: LessonStatus, chargeTiming: BillingChargeTiming): boolean {
	if (status === "CANCELLED") return false;
	if (chargeTiming === "ON_COMPLETE") return status === "COMPLETED";
	return true;
}

function lessonChargeDescription(meeting: MeetingForCharge): string {
	const d = meeting.startTime.toLocaleDateString("en-AU", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
	return `Lesson: ${meeting.title} (${d})`;
}

/**
 * Upsert or void the single ledger row for this meeting (meetingId is unique).
 */
export async function syncMeetingLedgerEntry(meetingId: number, db: Db = prisma): Promise<void> {
	const meeting = await db.meeting.findUnique({
		where: { id: meetingId },
		include: {
			student: { include: { class: { select: { defaultRateCents: true } } } },
		},
	});
	if (!meeting) return;

	const settings = await db.billingSettings.findUnique({
		where: { organisationId: meeting.organisationId },
	});
	const chargeTiming = settings?.chargeTiming ?? "ON_SCHEDULE";
	const defaultHourly = settings?.defaultTermRateCents ?? 0;

	const post = shouldPostLessonCharge(meeting.status, chargeTiming);
	const amount = computeLessonChargeCents(meeting, meeting.student, defaultHourly);
	const description = lessonChargeDescription(meeting);

	const existing = await db.ledgerEntry.findUnique({
		where: { meetingId },
	});

	if (!post) {
		if (existing && !existing.voidedAt) {
			await db.ledgerEntry.update({
				where: { meetingId },
				data: { voidedAt: new Date() },
			});
		}
		return;
	}

	if (existing) {
		await db.ledgerEntry.update({
			where: { meetingId },
			data: {
				type: "LESSON_CHARGE",
				amountCents: amount,
				effectiveDate: meeting.startTime,
				description,
				voidedAt: null,
				studentId: meeting.studentId,
				organisationId: meeting.organisationId,
			},
		});
		return;
	}

	await db.ledgerEntry.create({
		data: {
			type: "LESSON_CHARGE",
			amountCents: amount,
			effectiveDate: meeting.startTime,
			description,
			organisationId: meeting.organisationId,
			studentId: meeting.studentId,
			meetingId: meeting.id,
		},
	});
}

export async function syncManyMeetingLedgerEntries(meetingIds: number[]): Promise<void> {
	for (const id of meetingIds) {
		await syncMeetingLedgerEntry(id);
	}
}

const methodLabels: Record<string, string> = {
	CASH: "Cash",
	BANK_TRANSFER: "Bank transfer",
	CARD: "Card",
	OTHER: "Other",
};

/**
 * Idempotent: one ledger row per payment (paymentId unique).
 */
export async function createPaymentLedgerEntry(
	db: Db,
	payment: {
		id: string;
		amount: number;
		date: Date;
		method: string;
		reference: string | null;
		organisationId: string;
		studentId: number;
		invoiceId: string | null;
	}
): Promise<void> {
	const existing = await db.ledgerEntry.findUnique({ where: { paymentId: payment.id } });
	if (existing) return;

	const methodLabel = methodLabels[payment.method] ?? payment.method;
	let desc = `Payment — ${methodLabel}`;
	if (payment.reference) desc += ` (${payment.reference})`;

	await db.ledgerEntry.create({
		data: {
			type: "PAYMENT",
			amountCents: -payment.amount,
			effectiveDate: payment.date,
			description: desc,
			organisationId: payment.organisationId,
			studentId: payment.studentId,
			paymentId: payment.id,
			invoiceId: payment.invoiceId,
		},
	});
}

/** Sum of non-voided entry amounts: positive = customer owes. */
export async function getStudentLedgerBalanceCents(
	studentId: number,
	organisationId: string
): Promise<number> {
	const rows = await prisma.ledgerEntry.findMany({
		where: {
			studentId,
			organisationId,
			voidedAt: null,
		},
		select: { amountCents: true },
	});
	return rows.reduce((s, r) => s + r.amountCents, 0);
}

export async function getOrganisationStudentBalances(
	organisationId: string
): Promise<{ studentId: number; balanceCents: number }[]> {
	const rows = await prisma.ledgerEntry.findMany({
		where: { organisationId, voidedAt: null },
		select: { studentId: true, amountCents: true },
	});
	const byStudent = new Map<number, number>();
	for (const r of rows) {
		byStudent.set(r.studentId, (byStudent.get(r.studentId) ?? 0) + r.amountCents);
	}
	return Array.from(byStudent.entries()).map(([studentId, balanceCents]) => ({
		studentId,
		balanceCents,
	}));
}

/** Lifetime payments recorded on the ledger (PAYMENT rows are negative cents). */
export async function getOrganisationTotalCollectedCents(organisationId: string): Promise<number> {
	const agg = await prisma.ledgerEntry.aggregate({
		where: {
			organisationId,
			voidedAt: null,
			type: "PAYMENT",
		},
		_sum: { amountCents: true },
	});
	return Math.abs(agg._sum.amountCents ?? 0);
}

/** Per-student total paid (absolute sum of PAYMENT ledger amounts). */
export async function getOrganisationStudentPaymentTotalsCents(
	organisationId: string
): Promise<Map<number, number>> {
	const rows = await prisma.ledgerEntry.groupBy({
		by: ["studentId"],
		where: {
			organisationId,
			voidedAt: null,
			type: "PAYMENT",
		},
		_sum: { amountCents: true },
	});
	const m = new Map<number, number>();
	for (const r of rows) {
		m.set(r.studentId, Math.abs(r._sum.amountCents ?? 0));
	}
	return m;
}

export type BillingSectionStudent = {
	id: number;
	firstName: string;
	lastName: string;
	balanceCents: number;
	paidCents: number;
};

export type BillingSection = {
	classId: number | null;
	className: string;
	owedCents: number;
	collectedCents: number;
	students: BillingSectionStudent[];
};

/**
 * Group students by class for billing table (including "No class").
 * Sorts sections by class name; "No class" last. Students sorted by first name.
 */
export function buildBillingSectionsFromStudents(
	studentRows: {
		id: number;
		firstName: string;
		lastName: string;
		classId: number | null;
		class: { id: number; name: string } | null;
	}[],
	balanceByStudent: Map<number, number>,
	paidByStudent: Map<number, number>
): BillingSection[] {
	type Acc = {
		classId: number | null;
		className: string;
		owedCents: number;
		collectedCents: number;
		students: BillingSectionStudent[];
	};
	const groups = new Map<string, Acc>();

	for (const s of studentRows) {
		const classId = s.classId ?? s.class?.id ?? null;
		const className = s.class?.name ?? "No class";
		const key = classId != null ? `c:${classId}` : "none";
		const bal = balanceByStudent.get(s.id) ?? 0;
		const paid = paidByStudent.get(s.id) ?? 0;

		let acc = groups.get(key);
		if (!acc) {
			acc = { classId, className, owedCents: 0, collectedCents: 0, students: [] };
			groups.set(key, acc);
		}
		acc.owedCents += Math.max(0, bal);
		acc.collectedCents += paid;
		acc.students.push({
			id: s.id,
			firstName: s.firstName,
			lastName: s.lastName,
			balanceCents: bal,
			paidCents: paid,
		});
	}

	for (const acc of groups.values()) {
		acc.students.sort((a, b) => a.firstName.localeCompare(b.firstName) || a.lastName.localeCompare(b.lastName));
	}

	const sections = [...groups.values()];
	sections.sort((a, b) => {
		if (a.classId == null && b.classId != null) return 1;
		if (a.classId != null && b.classId == null) return -1;
		return a.className.localeCompare(b.className);
	});

	return sections;
}

/**
 * One-off: link existing payments and meetings to the ledger for an organisation (or all orgs if omitted).
 */
export async function backfillLedgerData(organisationId?: string): Promise<{
	paymentEntriesCreated: number;
	meetingsProcessed: number;
}> {
	const orgWhere = organisationId ? { organisationId } : {};

	const payments = await prisma.payment.findMany({ where: orgWhere });
	let paymentEntriesCreated = 0;
	for (const p of payments) {
		const ex = await prisma.ledgerEntry.findUnique({ where: { paymentId: p.id } });
		if (ex) continue;
		await prisma.$transaction(async (tx) => {
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
		});
		paymentEntriesCreated++;
	}

	const meetings = await prisma.meeting.findMany({
		where: orgWhere,
		select: { id: true },
	});
	for (const m of meetings) {
		await syncMeetingLedgerEntry(m.id);
	}

	return { paymentEntriesCreated, meetingsProcessed: meetings.length };
}
