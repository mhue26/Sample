import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { authOptions } from "@/utils/auth";
import { getServerSession } from "next-auth";

// Create a new Prisma client instance
const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const termId = parseInt(params.id);
    const body = await request.json();
    const { name, startDate, endDate, year, isActive, userId } = body;

    if (!name || !startDate || !endDate || !year || userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return NextResponse.json({ error: "Start date must be before end date" }, { status: 400 });
    }

    // Check if term exists and belongs to user
    const existingTerm = await prisma.term.findFirst({
      where: {
        id: termId,
        userId: (session.user as any).id
      }
    });

    if (!existingTerm) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 });
    }

    const term = await prisma.term.update({
      where: { id: termId },
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        year,
        isActive: isActive ?? true
      }
    });

    return NextResponse.json(term);
  } catch (error) {
    console.error('Error updating term:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const termId = parseInt(params.id);

    // Check if term exists and belongs to user
    const existingTerm = await prisma.term.findFirst({
      where: {
        id: termId,
        userId: (session.user as any).id
      }
    });

    if (!existingTerm) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 });
    }

    await prisma.term.delete({
      where: { id: termId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting term:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
