import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { authOptions } from "@/utils/auth";
import { getServerSession } from "next-auth";

// Create a new Prisma client instance
const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId || userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const holidays = await prisma.holiday.findMany({
      where: { userId },
      orderBy: [
        { year: 'desc' },
        { startDate: 'asc' }
      ]
    });

    return NextResponse.json(holidays);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, startDate, endDate, year, color, userId } = body;

    if (!name || !startDate || !endDate || !year || userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return NextResponse.json({ error: "Start date must be before end date" }, { status: 400 });
    }

    const holiday = await prisma.holiday.create({
      data: {
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        year,
        color: color || '#F59E0B',
        userId
      }
    });

    return NextResponse.json(holiday);
  } catch (error) {
    console.error('Error creating holiday:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
