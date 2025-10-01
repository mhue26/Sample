'use client';

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';

export default function SignInForm() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		const form = e.currentTarget as HTMLFormElement & {
			elements: any;
		};
		const email = (form.elements.namedItem('email') as HTMLInputElement).value;
		const password = (form.elements.namedItem('password') as HTMLInputElement).value;
		const res = await signIn('credentials', {
			redirect: true,
			callbackUrl: '/students',
			email,
			password,
		});
		if (res?.error) {
			setError('Invalid email or password');
			setLoading(false);
		}
	}

	return (
		<div className="max-w-sm mx-auto bg-white border rounded-lg p-6">
			<h2 className="text-2xl font-semibold mb-4">Sign in</h2>
			<form onSubmit={onSubmit} className="space-y-3">
				<label className="block">
					<div className="text-sm text-gray-700">Email</div>
					<input name="email" type="email" required className="mt-1 w-full border rounded-md px-3 py-2" />
				</label>
				<label className="block">
					<div className="text-sm text-gray-700">Password</div>
					<input name="password" type="password" required className="mt-1 w-full border rounded-md px-3 py-2" />
				</label>
				{error && <div className="text-sm text-red-600">{error}</div>}
				<button disabled={loading} className="rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700 w-full">
					{loading ? 'Signing in…' : 'Sign in'}
				</button>
			</form>
			<div className="my-4 flex items-center gap-3">
				<div className="h-px bg-gray-200 flex-1" />
				<div className="text-xs text-gray-500">Or</div>
				<div className="h-px bg-gray-200 flex-1" />
			</div>
			<button onClick={() => signIn('google', { callbackUrl: '/students' })} className="w-full rounded-md border px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-center gap-2">
				<span className="inline-block h-4 w-4 rounded bg-gray-200" />
				Continue with Google
			</button>
			<p className="text-xs text-gray-600 mt-3">Use tutor@example.com / password123</p>
		</div>
	);
}


