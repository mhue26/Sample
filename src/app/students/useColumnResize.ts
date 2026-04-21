"use client";

import { useState, useEffect } from "react";

const MIN_COLUMN_WIDTH = 48;

export function useColumnResize(
	storageKey: string,
	initialWidths: number[]
): {
	columnWidths: number[];
	setColumnWidths: React.Dispatch<React.SetStateAction<number[]>>;
	startResize: (index: number) => (e: React.MouseEvent) => void;
} {
	const [columnWidths, setColumnWidths] = useState<number[]>(initialWidths);
	const [resizingIndex, setResizingIndex] = useState<number | null>(null);
	const [resizeStartX, setResizeStartX] = useState(0);
	const [resizeStartWidth, setResizeStartWidth] = useState(0);

	useEffect(() => {
		if (resizingIndex === null) return;
		const onMove = (e: MouseEvent) => {
			const delta = e.clientX - resizeStartX;
			setColumnWidths((prev) => {
				const next = [...prev];
				next[resizingIndex] = Math.max(MIN_COLUMN_WIDTH, resizeStartWidth + delta);
				try {
					localStorage.setItem(storageKey, JSON.stringify(next));
				} catch {}
				return next;
			});
		};
		const onUp = () => {
			setResizingIndex(null);
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
		};
		window.addEventListener("mousemove", onMove);
		window.addEventListener("mouseup", onUp);
		return () => {
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
		};
	}, [resizingIndex, resizeStartX, resizeStartWidth, storageKey]);

	const startResize = (index: number) => (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setResizingIndex(index);
		setResizeStartX(e.clientX);
		setResizeStartWidth(columnWidths[index]);
	};

	return { columnWidths, setColumnWidths, startResize };
}
