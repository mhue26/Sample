"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { COLUMN_CONFIG, DEFAULT_VISIBLE_COLUMN_IDS, type ColumnId, type Filter } from "./studentsTableConfig";

const STORAGE_KEY_COLUMN_WIDTHS = "studentsTableColumnWidths";
const STORAGE_KEY_VISIBLE_COLUMNS = "studentsTableVisibleColumns";
const STORAGE_KEY_SORT = "studentsTableSort";
const STORAGE_KEY_FILTERS = "studentsTableFilters";
const MIN_COLUMN_WIDTH = 48;

const DEFAULT_COLUMN_WIDTH_BY_ID: Record<string, number> = {
	avatar: 56,
	firstName: 140,
	lastName: 140,
	subjects: 200,
	year: 80,
	hourlyRate: 90,
	status: 100,
	parentName: 140,
	email: 160,
	phone: 120,
	school: 120,
};

export function useTablePreferences() {
	const [visibleColumnIds, setVisibleColumnIds] = useState<ColumnId[]>(() => [...DEFAULT_VISIBLE_COLUMN_IDS]);
	const [filters, setFilters] = useState<Filter[]>([]);
	const [sortField, setSortField] = useState<string | null>(null);
	const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);

	const prefsHydratedRef = useRef(false);
	const pendingDbWidthsRef = useRef<number[] | null>(null);
	const saveDbTimerRef = useRef<number | null>(null);

	const visibleColumns = COLUMN_CONFIG.filter((c) => visibleColumnIds.includes(c.id));
	const defaultWidths = visibleColumns.map((c) => Math.max(MIN_COLUMN_WIDTH, DEFAULT_COLUMN_WIDTH_BY_ID[c.id] ?? 100));

	const [columnWidths, setColumnWidths] = useState<number[]>(defaultWidths);

	// Load from localStorage then DB on mount
	useEffect(() => {
		const applyDbPrefs = (prefs: Record<string, unknown> | null) => {
			if (!prefs || typeof prefs !== "object") return;

			if (Array.isArray(prefs.filters)) setFilters(prefs.filters as Filter[]);

			if (prefs.sort && typeof prefs.sort === "object") {
				const s = prefs.sort as { field?: unknown; direction?: unknown };
				if (typeof s.field === "string" && (s.direction === "asc" || s.direction === "desc")) {
					setSortField(s.field);
					setSortDirection(s.direction);
				}
			}

			if (Array.isArray(prefs.visibleColumnIds) && (prefs.visibleColumnIds as string[]).length > 0) {
				const valid = (prefs.visibleColumnIds as string[]).filter(
					(id): id is ColumnId => id !== "avatar" && COLUMN_CONFIG.some((c) => c.id === id)
				);
				if (valid.includes("firstName")) setVisibleColumnIds(valid);
			}

			if (Array.isArray(prefs.columnWidths)) {
				const widths = (prefs.columnWidths as unknown[]).map((w) =>
					Math.max(MIN_COLUMN_WIDTH, Number(w) || MIN_COLUMN_WIDTH)
				);
				pendingDbWidthsRef.current = widths;
			}
		};

		try {
			const storedFilters = localStorage.getItem(STORAGE_KEY_FILTERS);
			if (storedFilters) {
				const parsed = JSON.parse(storedFilters) as Filter[];
				if (Array.isArray(parsed)) setFilters(parsed);
			}
			const storedSort = localStorage.getItem(STORAGE_KEY_SORT);
			if (storedSort) {
				const parsed = JSON.parse(storedSort) as { field: string; direction: "asc" | "desc" };
				if (parsed?.field && (parsed.direction === "asc" || parsed.direction === "desc")) {
					setSortField(parsed.field);
					setSortDirection(parsed.direction);
				}
			}
			const storedCols = localStorage.getItem(STORAGE_KEY_VISIBLE_COLUMNS);
			if (storedCols) {
				const parsed = JSON.parse(storedCols) as string[];
				if (Array.isArray(parsed) && parsed.length > 0) {
					const valid = parsed.filter(
						(id): id is ColumnId => id !== "avatar" && COLUMN_CONFIG.some((c) => c.id === id)
					);
					if (valid.includes("firstName")) setVisibleColumnIds(valid);
				}
			}
			const storedWidths = localStorage.getItem(STORAGE_KEY_COLUMN_WIDTHS);
			if (storedWidths) {
				const parsed = JSON.parse(storedWidths) as number[];
				if (Array.isArray(parsed)) pendingDbWidthsRef.current = parsed;
			}
		} catch {}

		let cancelled = false;
		void (async () => {
			try {
				const res = await fetch("/api/me/preferences");
				if (!res.ok || cancelled) return;
				const data = await res.json().catch(() => ({}));
				applyDbPrefs(data?.studentsTablePrefs ?? null);
			} finally {
				if (!cancelled) prefsHydratedRef.current = true;
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	// Reconcile columnWidths when visible columns change
	useEffect(() => {
		setColumnWidths((prev) => {
			const pending = pendingDbWidthsRef.current;
			if (pending && pending.length === visibleColumns.length) {
				pendingDbWidthsRef.current = null;
				return pending.map((w) => Math.max(MIN_COLUMN_WIDTH, w));
			}
			if (prev.length !== visibleColumns.length) {
				return visibleColumns.map((c) => Math.max(MIN_COLUMN_WIDTH, DEFAULT_COLUMN_WIDTH_BY_ID[c.id] ?? 100));
			}
			return prev.map((w) => Math.max(MIN_COLUMN_WIDTH, w));
		});
	}, [visibleColumnIds.length]); // eslint-disable-line react-hooks/exhaustive-deps

	// Persist to localStorage
	useEffect(() => {
		try { localStorage.setItem(STORAGE_KEY_VISIBLE_COLUMNS, JSON.stringify(visibleColumnIds)); } catch {}
	}, [visibleColumnIds]);

	useEffect(() => {
		try {
			if (sortField && sortDirection) {
				localStorage.setItem(STORAGE_KEY_SORT, JSON.stringify({ field: sortField, direction: sortDirection }));
			} else {
				localStorage.removeItem(STORAGE_KEY_SORT);
			}
		} catch {}
	}, [sortField, sortDirection]);

	useEffect(() => {
		try { localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(filters)); } catch {}
	}, [filters]);

	// Debounce-save all prefs to DB
	useEffect(() => {
		if (!prefsHydratedRef.current) return;
		if (saveDbTimerRef.current) window.clearTimeout(saveDbTimerRef.current);
		saveDbTimerRef.current = window.setTimeout(() => {
			const payload = {
				studentsTablePrefs: {
					filters,
					sort: sortField && sortDirection ? { field: sortField, direction: sortDirection } : null,
					visibleColumnIds,
					columnWidths,
				},
			};
			fetch("/api/me/preferences", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			}).catch(() => {});
		}, 600);
		return () => {
			if (saveDbTimerRef.current) window.clearTimeout(saveDbTimerRef.current);
		};
	}, [filters, sortField, sortDirection, visibleColumnIds, columnWidths]);

	const toggleColumnVisibility = useCallback((id: ColumnId) => {
		const col = COLUMN_CONFIG.find((c) => c.id === id);
		if (col?.alwaysVisible) return;
		setVisibleColumnIds((prev) => {
			const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
			return next.includes("firstName") ? next : prev;
		});
	}, []);

	return {
		visibleColumnIds,
		visibleColumns,
		columnWidths,
		setColumnWidths,
		filters,
		setFilters,
		sortField,
		setSortField,
		sortDirection,
		setSortDirection,
		toggleColumnVisibility,
	};
}
