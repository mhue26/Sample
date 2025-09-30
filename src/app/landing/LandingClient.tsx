'use client';

import { useEffect } from 'react';

export default function LandingClient() {
	useEffect(() => {
		// Sticky header shadow on scroll
		const header = document.querySelector('header[data-landing-header]');
		const onScroll = () => {
			if (!header) return;
			if (window.scrollY > 8) header.classList.add('shadow-sm');
			else header.classList.remove('shadow-sm');
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener('scroll', onScroll);
	}, []);

	useEffect(() => {
		// Fade-in animations for modules as they enter viewport
		const items = Array.from(document.querySelectorAll('[data-fade]')) as HTMLElement[];
		items.forEach((el) => {
			el.style.opacity = '0';
			el.style.transform = 'translateY(12px)';
			el.style.transition = 'opacity 500ms ease, transform 500ms ease';
		});
		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						const el = entry.target as HTMLElement;
						el.style.opacity = '1';
						el.style.transform = 'translateY(0)';
						io.unobserve(el);
					}
				});
			},
			{ threshold: 0.12 }
		);
		items.forEach((el) => io.observe(el));
		return () => io.disconnect();
	}, []);

	return null;
}


