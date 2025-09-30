import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
// Create a local Prisma client here to avoid importing edge-incompatible client into middleware
import { PrismaClient } from "@/generated/prisma";
const prisma = new PrismaClient();
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";

export const authOptions: NextAuthOptions = {
	session: { strategy: "jwt" },
	providers: [
		Google({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		}),
		Credentials({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				const email = String(credentials?.email || "").trim().toLowerCase();
				const password = String(credentials?.password || "");
				if (!email || !password) return null;
				const user = await prisma.user.findUnique({ where: { email } });
				if (!user || !user.passwordHash) return null;
				const ok = await bcrypt.compare(password, user.passwordHash);
				if (!ok) return null;
				return { id: user.id, name: user.name ?? null, email: user.email ?? null } as any;
			},
		}),
	],
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = (user as any).id;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user && token?.id) {
				(session.user as any).id = token.id as string;
			}
			return session;
		},
	},
};

export const auth = () => getServerSession(authOptions);


