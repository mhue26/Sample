import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

// Create a new Prisma client instance
const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Test if we can connect to the database
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Database test result:', result);
    
    // Test if we can access the term table
    const termCount = await prisma.term.count();
    console.log('Term count:', termCount);
    
    // Test creating a term
    console.log('Testing term creation...');
    const testTerm = await prisma.term.create({
      data: {
        name: 'Test Term',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-03-31'),
        year: 2025,
        isActive: true,
        userId: 'test-user-id'
      }
    });
    console.log('Test term created:', testTerm);
    
    // Clean up test data
    await prisma.term.delete({ where: { id: testTerm.id } });
    console.log('Test term deleted');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection and term creation successful',
      termCount 
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
