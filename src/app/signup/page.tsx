import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { PrismaClient } from "@/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function doSignup(formData: FormData) {
	"use server";
	const name = String(formData.get("name") || "").trim() || null;
	const email = String(formData.get("email") || "").trim().toLowerCase();
	const password = String(formData.get("password") || "");
	if (!email || !password) return;
	const existing = await prisma.user.findUnique({ where: { email } });
	if (!existing) {
		const passwordHash = await bcrypt.hash(password, 10);
		await prisma.user.create({ data: { name, email, passwordHash } });
	}
	redirect("/signin");
}

export default async function SignupPage() {
	const session = await getServerSession(authOptions);
	if (session?.user) redirect("/students");
	return (
		<div className="max-w-sm mx-auto bg-white border rounded-lg p-6 mt-8">
			<h2 className="text-2xl font-semibold mb-4">Create your account</h2>
			<form action={doSignup} className="space-y-3">
				<label className="block">
					<div className="text-sm text-gray-700">Name</div>
					<input name="name" className="mt-1 w-full border rounded-md px-3 py-2" />
				</label>
				<label className="block">
					<div className="text-sm text-gray-700">Email</div>
					<input name="email" type="email" required className="mt-1 w-full border rounded-md px-3 py-2" />
				</label>
				<label className="block">
					<div className="text-sm text-gray-700">Password</div>
					<input name="password" type="password" required className="mt-1 w-full border rounded-md px-3 py-2" />
				</label>
				<button className="rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700 w-full">Sign up</button>
			</form>
			<p className="text-xs text-gray-600 mt-3">Already have an account? <a href="/signin" className="underline">Log in</a></p>
		</div>
	);
}


