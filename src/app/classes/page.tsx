import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import ClassesClient from "./ClassesClient";

export default async function ClassesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/signin");
  }

  // Fetch classes for the current user
  const classes = await prisma.class.findMany({
    where: {
      userId: (session.user as any).id
    },
    include: {
      students: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className="space-y-6 pt-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Classes</h1>
      </div>

      <ClassesClient classes={classes} />
    </div>
  );
}
