import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/utils/auth";
import { getServerSession } from "next-auth";

function formatCurrencyFromCents(valueInCents: number): string {
	const dollars = (valueInCents / 100).toFixed(2);
	return `$${dollars}`;
}

export default async function StudentsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return (
            <div className="space-y-2">
                <div className="text-sm text-gray-600">You must sign in to view students.</div>
                <a href="/signin" className="text-blue-600 hover:underline">Sign in</a>
            </div>
        );
    }

    const students = await prisma.student.findMany({
        where: { userId: (session.user as any).id },
        orderBy: { createdAt: "desc" },
    });

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold">Students</h2>
				<Link
					className="rounded-md bg-black text-white px-3 py-2 text-sm hover:opacity-90"
					href="/students/new"
				>
					Add Student
				</Link>
			</div>

			<div className="overflow-x-auto rounded-lg border bg-white">
				<table className="w-full text-left text-sm">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-3 py-2">Name</th>
							<th className="px-3 py-2">Email</th>
							<th className="px-3 py-2">Phone</th>
							<th className="px-3 py-2">Subjects</th>
							<th className="px-3 py-2">Rate</th>
							<th className="px-3 py-2">Status</th>
							<th className="px-3 py-2"/>
						</tr>
					</thead>
					<tbody>
						{students.map((s) => (
							<tr key={s.id} className="border-t">
								<td className="px-3 py-2">{s.firstName} {s.lastName}</td>
								<td className="px-3 py-2">{s.email}</td>
								<td className="px-3 py-2">{s.phone ?? "—"}</td>
								<td className="px-3 py-2">{s.subjects || "—"}</td>
								<td className="px-3 py-2">{formatCurrencyFromCents(s.hourlyRateCents)}</td>
								<td className="px-3 py-2">{s.isActive ? "Active" : "Inactive"}</td>
								<td className="px-3 py-2 text-right">
									<Link className="text-blue-600 hover:underline" href={`/students/${s.id}`}>View</Link>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}


