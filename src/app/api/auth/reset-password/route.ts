import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, password } = body;

		if (!email || !password) {
			return NextResponse.json(
				{ error: 'Email and password are required' },
				{ status: 400 }
			);
		}

		if (password.length < 6) {
			return NextResponse.json(
				{ error: 'Password must be at least 6 characters' },
				{ status: 400 }
			);
		}

		const normalizedEmail = email.trim().toLowerCase();

		// Check if user exists
		const user = await prisma.user.findUnique({
			where: { email: normalizedEmail },
		});

		if (!user) {
			return NextResponse.json({ success: true, message: 'If an account exists with this email, the password has been reset.' });
		}

		// Hash the new password
		const passwordHash = await bcrypt.hash(password, 10);

		// Update the user's password
		await prisma.user.update({
			where: { email: normalizedEmail },
			data: { passwordHash },
		});

		return NextResponse.json({ 
			success: true,
			message: 'Password reset successfully' 
		});
	} catch (error) {
		console.error('Error resetting password:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

