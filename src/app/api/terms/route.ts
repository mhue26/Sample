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

    const terms = await prisma.term.findMany({
      where: { userId },
      orderBy: [
        { year: 'desc' },
        { startDate: 'asc' }
      ]
    });

    return NextResponse.json(terms);
  } catch (error) {
    console.error('Error fetching terms:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/terms - Starting request');
    
    let session;
    try {
      session = await getServerSession(authOptions);
      console.log('Session:', session?.user ? 'Authenticated' : 'Not authenticated');
    } catch (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: "Session error" }, { status: 500 });
    }
    
    if (!session?.user) {
      console.log('No session or user found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body);
    
    const { name, startDate, endDate, year, isActive, color, userId } = body;

    if (!name || !startDate || !endDate || !year || userId !== (session.user as any).id) {
      console.log('Validation failed:', { name, startDate, endDate, year, userId, sessionUserId: (session.user as any).id });
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Check if user exists in database
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      console.log('User not found in database:', userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return NextResponse.json({ error: "Start date must be before end date" }, { status: 400 });
    }

    console.log('Creating term with data:', {
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      year,
      isActive: isActive ?? true,
      color: color || '#3B82F6',
      userId
    });

    let term;
    try {
      term = await prisma.term.create({
        data: {
          name,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          year,
          isActive: isActive ?? true,
          color: color || '#3B82F6',
          userId
        }
      });
      console.log('Term created successfully:', term);
    } catch (prismaError) {
      console.error('Prisma error:', prismaError);
      return NextResponse.json({ error: "Database error: " + (prismaError instanceof Error ? prismaError.message : 'Unknown error') }, { status: 500 });
    }

    return NextResponse.json(term);
  } catch (error) {
    console.error('Error creating term:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
