import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgContext } from "@/utils/auth";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const ctx = await getOrgContext();
	if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const { id } = await params;
	const studentId = parseInt(id, 10);
	if (isNaN(studentId)) {
		return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
	}

	const formData = await request.formData();
	const notes = String(formData.get("notes") || "").trim() || null;

	const updated = await prisma.student.updateMany({
		where: { id: studentId, organisationId: ctx.organisationId },
		data: { notes },
	});
	if (updated.count === 0) {
		return NextResponse.json({ error: "Student not found" }, { status: 404 });
	}

	return NextResponse.json({ success: true });
}
