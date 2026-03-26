/**
 * Populate LedgerEntry rows from existing Payment and Meeting records.
 *
 * Usage (from repo root):
 *   npx tsx scripts/backfill-ledger.ts
 *   npx tsx scripts/backfill-ledger.ts <organisationId>   # single org (e.g. multi-tenant admin)
 *
 * Prefer POST /api/admin/backfill-ledger when logged in as OWNER (scoped to your org).
 */
import { backfillLedgerData } from "../src/lib/ledger";
import { prisma } from "../src/lib/prisma";

async function main() {
	const orgId = process.argv[2]?.trim() || undefined;
	const result = await backfillLedgerData(orgId);
	// eslint-disable-next-line no-console
	console.log("Backfill complete:", result);
	await prisma.$disconnect();
}

main().catch((e) => {
	// eslint-disable-next-line no-console
	console.error(e);
	process.exit(1);
});
