import { NextResponse } from "next/server";
import { getOrgContext } from "@/utils/auth";
import { backfillLedgerData } from "@/lib/ledger";

/** OWNER-only: populate ledger from existing payments and meetings. Safe to run multiple times. */
export async function POST() {
	const ctx = await getOrgContext();
	if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	if (ctx.role !== "OWNER") {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const result = await backfillLedgerData(ctx.organisationId);
	return NextResponse.json(result);
}
