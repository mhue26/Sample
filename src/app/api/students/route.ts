import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext } from "@/utils/auth";

export async function POST(request: NextRequest) {
	const ctx = await getOrgContext();
	if (!ctx) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const body = await request.json().catch(() => ({}));
	const firstName = String(body?.firstName ?? "").trim();
	const lastName = String(body?.lastName ?? "").trim();
	const subjects = String(body?.subjects ?? "").trim() || "";
	const yearRaw = body?.year;
	const year = yearRaw === "" || yearRaw === null || yearRaw === undefined
		? null
		: Number(yearRaw);
	const hourlyRateRaw = body?.hourlyRate;
	let hourlyRateCents = 0;
	if (hourlyRateRaw === "" || hourlyRateRaw === null || hourlyRateRaw === undefined) {
		const prefs = await prisma.organisationPreferences.findUnique({
			where: { organisationId: ctx.organisationId },
			select: { defaultStudentRateCents: true },
		});
		hourlyRateCents = prefs?.defaultStudentRateCents ?? 0;
	} else {
		const hourlyRate = Number(hourlyRateRaw);
		hourlyRateCents =
			Number.isNaN(hourlyRate) || hourlyRate < 0 ? 0 : Math.round(hourlyRate * 100);
	}

	if (!firstName) {
		return NextResponse.json({ error: "First name is required" }, { status: 400 });
	}
	if (!lastName) {
		return NextResponse.json({ error: "Last name is required" }, { status: 400 });
	}
	const yearFinal = year != null && (Number.isNaN(year) || year < 1) ? null : year;

	const student = await prisma.student.create({
		data: {
			firstName,
			lastName,
			subjects,
			year: yearFinal,
			hourlyRateCents: hourlyRateCents,
			organisationId: ctx.organisationId,
		},
		select: {
			id: true,
			firstName: true,
			lastName: true,
			email: true,
			phone: true,
			subjects: true,
			hourlyRateCents: true,
			year: true,
			isArchived: true,
		},
	});

	return NextResponse.json({
		student: {
			...student,
			subjects: student.subjects ?? null,
		},
	});
}
