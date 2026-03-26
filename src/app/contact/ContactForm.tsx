'use client';

import { useState, FormEvent } from 'react';

export default function ContactForm() {
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

	async function onSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		
		const form = e.currentTarget as HTMLFormElement & {
			elements: any;
		};
		
		const name = (form.elements.namedItem('name') as HTMLInputElement).value.trim();
		const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();
		const subject = (form.elements.namedItem('subject') as HTMLInputElement).value.trim();
		const message = (form.elements.namedItem('message') as HTMLTextAreaElement).value.trim();
		
		// Validate fields
		const errors: Record<string, boolean> = {};
		if (!name) errors.name = true;
		if (!email) errors.email = true;
		if (!subject) errors.subject = true;
		if (!message) errors.message = true;
		
		if (Object.keys(errors).length > 0) {
			setFieldErrors(errors);
			return;
		}
		
		setFieldErrors({});
		setLoading(true);
		
		try {
			// Simulate form submission - in a real app, you'd send this to your backend
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			// For now, we'll just show success
			setSuccess(true);
			form.reset();
			setFieldErrors({});
		} catch {
			setError('Failed to send message. Please try again.');
		} finally {
			setLoading(false);
		}
	}
	
	function handleInputChange(fieldName: string) {
		if (fieldErrors[fieldName]) {
			setFieldErrors(prev => {
				const newErrors = { ...prev };
				delete newErrors[fieldName];
				return newErrors;
			});
		}
	}

	if (success) {
		return (
			<div className="bg-white rounded-2xl shadow-sm p-6 text-center">
				<div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h3 className="text-lg font-semibold text-gray-900 mb-2">Message Sent!</h3>
				<p className="text-gray-600 mb-4">
					Thank you for contacting us. We&apos;ll get back to you within 24 hours.
				</p>
				<button 
					onClick={() => setSuccess(false)}
					className="text-[#584b53] hover:text-[#3D4756] text-sm font-medium"
				>
					Send another message
				</button>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-2xl shadow-sm p-6">
			<form onSubmit={onSubmit} noValidate className="space-y-6">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
					<label className="block">
						<div className="text-sm text-gray-500 mb-2">Name</div>
						<input 
							name="name" 
							type="text" 
							onChange={() => handleInputChange('name')}
							className={`w-full border-0 border-b-2 px-0 py-2 text-gray-900 font-medium focus:outline-none transition-colors ${
								fieldErrors.name 
									? 'border-red-500' 
									: 'border-gray-300 focus:border-ui-form-lavender'
							}`}
						/>
					</label>
					<label className="block">
						<div className="text-sm text-gray-500 mb-2">Email</div>
						<input 
							name="email" 
							type="email" 
							onChange={() => handleInputChange('email')}
							className={`w-full border-0 border-b-2 px-0 py-2 text-gray-900 font-medium focus:outline-none transition-colors ${
								fieldErrors.email 
									? 'border-red-500' 
									: 'border-gray-300 focus:border-ui-form-lavender'
							}`}
						/>
					</label>
				</div>
				
				<label className="block">
					<div className="text-sm text-gray-500 mb-2">Subject</div>
					<input 
						name="subject" 
						type="text" 
						onChange={() => handleInputChange('subject')}
						className={`w-full border-0 border-b-2 px-0 py-2 text-gray-900 font-medium focus:outline-none transition-colors ${
							fieldErrors.subject 
								? 'border-red-500' 
								: 'border-gray-300 focus:border-ui-form-lavender'
						}`}
					/>
				</label>
				
				<label className="block">
					<div className="text-sm text-gray-500 mb-2">Message</div>
					<textarea 
						name="message" 
						rows={6} 
						onChange={() => handleInputChange('message')}
						className={`w-full border-0 border-b-2 px-0 py-2 text-gray-900 font-medium focus:outline-none transition-colors resize-vertical ${
							fieldErrors.message 
								? 'border-red-500' 
								: 'border-gray-300 focus:border-ui-form-lavender'
						}`}
					/>
				</label>
				
				{error && (
					<div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
						{error}
					</div>
				)}
				
				<button 
					type="submit"
					disabled={loading} 
					className="bg-[#3D4756] text-white px-4 py-2 rounded-lg font-semibold text-base hover:bg-[#2A3441] transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? 'Submitting...' : 'Submit'}
				</button>
			</form>
		</div>
	);
}
