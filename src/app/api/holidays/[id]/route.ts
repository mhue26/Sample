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

    const holidayId = parseInt(params.id);
    const body = await request.json();
    const { name, startDate, endDate, year, userId } = body;

    if (!name || !startDate || !endDate || !year || userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return NextResponse.json({ error: "Start date must be before end date" }, { status: 400 });
    }

    // Check if holiday exists and belongs to user
    const existingHoliday = await prisma.holiday.findFirst({
      where: {
        id: holidayId,
        userId: (session.user as any).id
      }
    });

    if (!existingHoliday) {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }

    const holiday = await prisma.holiday.update({
      where: { id: holidayId },
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        year
      }
    });

    return NextResponse.json(holiday);
  } catch (error) {
    console.error('Error updating holiday:', error);
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

    const holidayId = parseInt(params.id);

    // Check if holiday exists and belongs to user
    const existingHoliday = await prisma.holiday.findFirst({
      where: {
        id: holidayId,
        userId: (session.user as any).id
      }
    });

    if (!existingHoliday) {
      return NextResponse.json({ error: "Holiday not found" }, { status: 404 });
    }

    await prisma.holiday.delete({
      where: { id: holidayId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
