import { prisma } from "@/lib/prisma";
import { authOptions } from "@/utils/auth";
import { getServerSession } from "next-auth";
import StudentsClient from "./StudentsClient";

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
        where: { 
            userId: (session.user as any).id,
            isArchived: false 
        },
        orderBy: { createdAt: "desc" },
    });

    const archivedStudents = await prisma.student.findMany({
        where: { 
            userId: (session.user as any).id,
            isArchived: true 
        },
        orderBy: { updatedAt: "desc" },
    });

	return <StudentsClient students={students as any} archivedStudents={archivedStudents as any} />;
}


