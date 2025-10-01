'use client';

import { useState, FormEvent } from 'react';

export default function ContactForm() {
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function onSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setLoading(true);
		
		const form = e.currentTarget as HTMLFormElement & {
			elements: any;
		};
		
		const formData = {
			name: (form.elements.namedItem('name') as HTMLInputElement).value,
			email: (form.elements.namedItem('email') as HTMLInputElement).value,
			subject: (form.elements.namedItem('subject') as HTMLInputElement).value,
			message: (form.elements.namedItem('message') as HTMLTextAreaElement).value,
		};

		try {
			// Simulate form submission - in a real app, you'd send this to your backend
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			// For now, we'll just show success
			setSuccess(true);
			form.reset();
		} catch (err) {
			setError('Failed to send message. Please try again.');
		} finally {
			setLoading(false);
		}
	}

	if (success) {
		return (
			<div className="bg-white border rounded-lg p-6 text-center">
				<div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h3 className="text-lg font-semibold text-gray-900 mb-2">Message Sent!</h3>
				<p className="text-gray-600 mb-4">
					Thank you for contacting us. We'll get back to you within 24 hours.
				</p>
				<button 
					onClick={() => setSuccess(false)}
					className="text-blue-600 hover:text-blue-700 text-sm font-medium"
				>
					Send another message
				</button>
			</div>
		);
	}

	return (
		<div className="bg-white border rounded-lg p-6">
			<h2 className="text-xl font-semibold mb-4">Send us a message</h2>
			<form onSubmit={onSubmit} className="space-y-4">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<label className="block">
						<div className="text-sm text-gray-700 mb-1">Name *</div>
						<input 
							name="name" 
							type="text" 
							required 
							className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
						/>
					</label>
					<label className="block">
						<div className="text-sm text-gray-700 mb-1">Email *</div>
						<input 
							name="email" 
							type="email" 
							required 
							className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
						/>
					</label>
				</div>
				
				<label className="block">
					<div className="text-sm text-gray-700 mb-1">Subject *</div>
					<input 
						name="subject" 
						type="text" 
						required 
						className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
					/>
				</label>
				
				<label className="block">
					<div className="text-sm text-gray-700 mb-1">Message *</div>
					<textarea 
						name="message" 
						rows={6} 
						required 
						className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical" 
						placeholder="Please describe your question or issue in detail..."
					/>
				</label>
				
				{error && (
					<div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
						{error}
					</div>
				)}
				
				<div className="flex items-center gap-3">
					<button 
						type="submit"
						disabled={loading} 
						className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? 'Sending...' : 'Send Message'}
					</button>
					<span className="text-xs text-gray-500">* Required fields</span>
				</div>
			</form>
		</div>
	);
}
