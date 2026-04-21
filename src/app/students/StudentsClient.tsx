"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import SubjectsDisplay from "./SubjectsDisplay";
import SubjectsMultiSelect from "./SubjectsMultiSelect";
import StatusIndicator from "./StatusIndicator";
import StudentAvatar from "./StudentAvatar";

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

type StudentItem = {
	id: number;
	firstName: string;
	lastName: string;
	email: string | null;
	phone: string | null;
	subjects: string | null;
	hourlyRateCents: number;
	year?: number | null;
	isArchived: boolean;
	updatedAt?: string | Date;
	parentName?: string | null;
	parentEmail?: string | null;
	parentPhone?: string | null;
	school?: string | null;
};

type EditableField = "firstName" | "lastName" | "subjects" | "year" | "hourlyRate";

type FilterableField = 'year' | 'subjects' | 'isArchived' | 'parentName' | 'email' | 'phone' | 'school';

type Filter = {
	id: string;
	field: FilterableField;
	condition: 'is' | 'isNot' | 'contains' | 'doesNotContain' | 'isGreaterThan' | 'isLessThan';
	value: unknown;
};

type ColumnId = keyof typeof DEFAULT_COLUMN_WIDTH_BY_ID;

const COLUMN_CONFIG: Array<{
	id: ColumnId;
	label: string;
	sortKey: string | null;
	filterKey: FilterableField | null;
	defaultVisible: boolean;
	alwaysVisible?: boolean;
	editable: boolean;
}> = [
	{ id: 'firstName', label: 'First Name', sortKey: 'record', filterKey: null, defaultVisible: true, alwaysVisible: true, editable: true },
	{ id: 'lastName', label: 'Last Name', sortKey: null, filterKey: null, defaultVisible: true, editable: true },
	{ id: 'subjects', label: 'Subjects', sortKey: 'subjects', filterKey: 'subjects', defaultVisible: true, editable: true },
	{ id: 'year', label: 'Year', sortKey: 'year', filterKey: 'year', defaultVisible: true, editable: true },
	{ id: 'hourlyRate', label: 'Rate', sortKey: 'hourlyRate', filterKey: null, defaultVisible: true, editable: true },
	{ id: 'status', label: 'Status', sortKey: 'status', filterKey: 'isArchived', defaultVisible: true, editable: false },
	{ id: 'parentName', label: 'Parent Name', sortKey: 'parentName', filterKey: 'parentName', defaultVisible: false, editable: false },
	{ id: 'email', label: 'Email', sortKey: 'email', filterKey: 'email', defaultVisible: false, editable: false },
	{ id: 'phone', label: 'Phone', sortKey: 'phone', filterKey: 'phone', defaultVisible: false, editable: false },
	{ id: 'school', label: 'School', sortKey: 'school', filterKey: 'school', defaultVisible: false, editable: false },
];

const DEFAULT_VISIBLE_COLUMN_IDS: ColumnId[] = ['firstName', 'lastName', 'subjects', 'year', 'hourlyRate', 'status'];

function formatCurrencyFromCents(valueInCents: number): string {
	const dollars = (valueInCents / 100).toFixed(2);
	return `$${dollars}`;
}

export default function StudentsClient({ students, archivedStudents }: { students: StudentItem[], archivedStudents: StudentItem[] }) {
	const [allStudents, setAllStudents] = useState<StudentItem[]>(() => [...students, ...archivedStudents]);
    const [filters, setFilters] = useState<Filter[]>([]);
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingCell, setEditingCell] = useState<{ id: number; field: EditableField } | null>(null);
    const [draftValue, setDraftValue] = useState("");
    const [savingCell, setSavingCell] = useState<string | null>(null);
    const [togglingStatusId, setTogglingStatusId] = useState<number | null>(null);

    const [newRow, setNewRow] = useState({ firstName: "", lastName: "", subjects: "", year: "", hourlyRate: "" });
    const [savingNewRow, setSavingNewRow] = useState(false);
    const [showNewRow, setShowNewRow] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const newRowFirstInputRef = useRef<HTMLInputElement>(null);
    const tableOptionsRef = useRef<HTMLDivElement>(null);
    const [tableOptionsOpen, setTableOptionsOpen] = useState(false);
    const [addFilterField, setAddFilterField] = useState<FilterableField>('subjects');
    const [addFilterCondition, setAddFilterCondition] = useState<Filter['condition']>('contains');
    const [addFilterValue, setAddFilterValue] = useState('');
    const [showAddFilter, setShowAddFilter] = useState(false);
    const [hoverAvatar, setHoverAvatar] = useState<{ student: StudentItem; x: number; y: number } | null>(null);

    const [visibleColumnIds, setVisibleColumnIds] = useState<ColumnId[]>(() => [...DEFAULT_VISIBLE_COLUMN_IDS]);
    const prefsHydratedRef = useRef(false);
    const pendingDbWidthsRef = useRef<number[] | null>(null);
    const saveDbTimerRef = useRef<number | null>(null);

    const visibleColumns = useMemo(
        () =>
            visibleColumnIds
                .map((id) => COLUMN_CONFIG.find((c) => c.id === id))
                .filter((c): c is NonNullable<typeof c> => !!c),
        [visibleColumnIds]
    );

    const [columnWidths, setColumnWidths] = useState<number[]>(() =>
        visibleColumns.map((c) => Math.max(MIN_COLUMN_WIDTH, DEFAULT_COLUMN_WIDTH_BY_ID[c.id] ?? 100))
    );

    useEffect(() => {
        const applyDbPrefs = (prefs: any) => {
            if (!prefs || typeof prefs !== "object") return;

            if (Array.isArray(prefs.filters)) setFilters(prefs.filters as Filter[]);

            if (prefs.sort && typeof prefs.sort === "object") {
                const field = (prefs.sort as any).field;
                const direction = (prefs.sort as any).direction;
                if (typeof field === "string" && (direction === "asc" || direction === "desc")) {
                    setSortField(field);
                    setSortDirection(direction);
                }
            }

            if (Array.isArray(prefs.visibleColumnIds) && prefs.visibleColumnIds.length > 0) {
                const parsed = prefs.visibleColumnIds as string[];
                const valid = parsed.filter((id): id is ColumnId =>
                    id !== 'avatar' && COLUMN_CONFIG.some((c) => c.id === id)
                );
                if (valid.includes('firstName')) setVisibleColumnIds(valid as ColumnId[]);
            }

            if (Array.isArray(prefs.columnWidths)) {
                const widths = (prefs.columnWidths as any[])
                    .map((w) => Math.max(MIN_COLUMN_WIDTH, Number(w) || MIN_COLUMN_WIDTH));
                pendingDbWidthsRef.current = widths;
                if (widths.length === visibleColumns.length) setColumnWidths(widths);
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
                const parsed = JSON.parse(storedSort) as { field: string; direction: 'asc' | 'desc' };
                if (parsed?.field != null && (parsed.direction === 'asc' || parsed.direction === 'desc')) {
                    setSortField(parsed.field);
                    setSortDirection(parsed.direction);
                }
            }
            const storedCols = localStorage.getItem(STORAGE_KEY_VISIBLE_COLUMNS);
            if (storedCols) {
                const parsed = JSON.parse(storedCols) as string[];
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const valid = parsed.filter((id): id is ColumnId =>
                        id !== 'avatar' && COLUMN_CONFIG.some((c) => c.id === id)
                    );
                    if (valid.includes('firstName')) setVisibleColumnIds(valid as ColumnId[]);
                }
            }
        } catch {}

        // Load DB-backed prefs (synced across devices) and apply on top of localStorage.
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/me/preferences", { method: "GET" });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) return;
                if (cancelled) return;
                applyDbPrefs(data?.studentsTablePrefs);
            } catch {
                // ignore (localStorage fallback remains)
            } finally {
                if (!cancelled) prefsHydratedRef.current = true;
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY_VISIBLE_COLUMNS, JSON.stringify(visibleColumnIds));
        } catch {}
    }, [visibleColumnIds]);

    useEffect(() => {
        const expectedWidths = visibleColumns.map((c) => Math.max(MIN_COLUMN_WIDTH, DEFAULT_COLUMN_WIDTH_BY_ID[c.id] ?? 100));
        setColumnWidths((prev) => {
            const pending = pendingDbWidthsRef.current;
            if (pending && pending.length === visibleColumns.length) {
                pendingDbWidthsRef.current = null;
                return pending.map((w) => Math.max(MIN_COLUMN_WIDTH, w));
            }
            if (prev.length !== visibleColumns.length) return expectedWidths;
            return prev.map((w) => Math.max(MIN_COLUMN_WIDTH, w));
        });
    }, [visibleColumnIds.length]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY_COLUMN_WIDTHS);
            if (stored && visibleColumns.length > 0) {
                const parsed = JSON.parse(stored) as number[];
                if (Array.isArray(parsed) && parsed.length === visibleColumns.length) {
                    setColumnWidths(parsed.map((w) => Math.max(MIN_COLUMN_WIDTH, Number(w) || MIN_COLUMN_WIDTH)));
                }
            }
        } catch {}
    }, []);
    const [resizingIndex, setResizingIndex] = useState<number | null>(null);
    const [resizeStartX, setResizeStartX] = useState(0);
    const [resizeStartWidth, setResizeStartWidth] = useState(0);

    useEffect(() => {
        if (resizingIndex === null) return;
        const onMove = (e: MouseEvent) => {
            const delta = e.clientX - resizeStartX;
            setColumnWidths((prev) => {
                const next = [...prev];
                const newW = Math.max(MIN_COLUMN_WIDTH, resizeStartWidth + delta);
                next[resizingIndex] = newW;
                try {
                    localStorage.setItem(STORAGE_KEY_COLUMN_WIDTHS, JSON.stringify(next));
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
    }, [resizingIndex, resizeStartX, resizeStartWidth]);

    const startResize = (index: number) => (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setResizingIndex(index);
        setResizeStartX(e.clientX);
        setResizeStartWidth(columnWidths[index]);
    };

    const handleSort = (field: string) => {
        if (sortField !== field) {
            setSortField(field);
            setSortDirection('asc');
        } else if (sortDirection === 'asc') {
            setSortDirection('desc');
        } else {
            setSortField(null);
            setSortDirection(null);
        }
    };

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
        try {
            localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(filters));
        } catch {}
    }, [filters]);

    // Debounce-save prefs to DB so they sync across devices.
    useEffect(() => {
        if (!prefsHydratedRef.current) return;
        if (typeof window === "undefined") return;

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

    useEffect(() => {
        if (!tableOptionsOpen) return;
        const onDocClick = (e: MouseEvent) => {
            if (tableOptionsRef.current && !tableOptionsRef.current.contains(e.target as Node)) setTableOptionsOpen(false);
        };
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
    }, [tableOptionsOpen]);

    const addFilter = useCallback(() => {
        let value: unknown = addFilterValue.trim();
        if (addFilterField === 'year') value = value === '' ? null : Number(value);
        if (addFilterField === 'isArchived') value = addFilterValue.toLowerCase() === 'true' || addFilterValue === '1';
        setFilters((prev) => [...prev, { id: crypto.randomUUID(), field: addFilterField, condition: addFilterCondition, value }]);
        setAddFilterValue('');
        setShowAddFilter(false);
    }, [addFilterField, addFilterCondition, addFilterValue]);

    const toggleColumnVisibility = useCallback((id: ColumnId) => {
        const col = COLUMN_CONFIG.find((c) => c.id === id);
        if (col?.alwaysVisible) return;
        setVisibleColumnIds((prev) => {
            const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
            const hasFirstName = next.includes('firstName');
            if (!hasFirstName) return prev;
            return next;
        });
    }, []);

    const filteredStudents = useMemo(() => {
        let result = allStudents;

        // Apply filters
        if (filters.length > 0) {
            result = allStudents.filter(student => {
                return filters.every(filter => {
                    const { field, condition, value } = filter;
                    const studentValue = student[field as keyof StudentItem];

                    switch (condition) {
                        case 'is':
                            return studentValue == value;
                        case 'isNot':
                            return studentValue != value;
                        case 'contains':
                            return typeof studentValue === 'string' && studentValue.toLowerCase().includes(String(value).toLowerCase());
                        case 'doesNotContain':
                            return typeof studentValue === 'string' && !studentValue.toLowerCase().includes(String(value).toLowerCase());
                        case 'isGreaterThan':
                            return typeof studentValue === 'number' && studentValue > Number(value);
                        case 'isLessThan':
                            return typeof studentValue === 'number' && studentValue < Number(value);
                        default:
                            return true;
                    }
                });
            });
        }

        // Apply search
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            result = result.filter((student) => {
                const name = `${student.firstName} ${student.lastName}`.toLowerCase();
                const subjects = (student.subjects || "").toLowerCase();
                return name.includes(q) || subjects.includes(q);
            });
        }

        // Apply sorting
        if (sortField && sortDirection) {
            result = [...result].sort((a, b) => {
                let aValue: any;
                let bValue: any;

                switch (sortField) {
                    case 'record':
                        aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
                        bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
                        break;
                    case 'subjects':
                        aValue = (a.subjects || '').toLowerCase();
                        bValue = (b.subjects || '').toLowerCase();
                        break;
                    case 'year':
                        aValue = a.year ?? -1;
                        bValue = b.year ?? -1;
                        break;
                    case 'hourlyRate':
                        aValue = a.hourlyRateCents;
                        bValue = b.hourlyRateCents;
                        break;
                    case 'status':
                        aValue = a.isArchived ? 1 : 0;
                        bValue = b.isArchived ? 1 : 0;
                        break;
                    case 'parentName':
                        aValue = (a.parentName ?? '').toLowerCase();
                        bValue = (b.parentName ?? '').toLowerCase();
                        break;
                    case 'email':
                        aValue = (a.email ?? '').toLowerCase();
                        bValue = (b.email ?? '').toLowerCase();
                        break;
                    case 'phone':
                        aValue = (a.phone ?? '').toLowerCase();
                        bValue = (b.phone ?? '').toLowerCase();
                        break;
                    case 'school':
                        aValue = (a.school ?? '').toLowerCase();
                        bValue = (b.school ?? '').toLowerCase();
                        break;
                    default:
                        return 0;
                }

                if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [allStudents, filters, sortField, sortDirection, searchTerm]);

    const getCellKey = (id: number, field: EditableField) => `${id}:${field}`;

    const getInitialValue = (student: StudentItem, field: EditableField) => {
        if (field === "firstName") return student.firstName ?? "";
        if (field === "lastName") return student.lastName ?? "";
        if (field === "subjects") return student.subjects ?? "";
        if (field === "year") return student.year?.toString() ?? "";
        if (field === "hourlyRate") return student.hourlyRateCents === 0 ? "" : (student.hourlyRateCents / 100).toFixed(2);
        return "";
    };

    const startEditing = (student: StudentItem, field: EditableField) => {
        setErrorMessage(null);
        setEditingCell({ id: student.id, field });
        setDraftValue(getInitialValue(student, field));
    };

    const cancelEditing = () => {
        setEditingCell(null);
        setDraftValue("");
    };

    const saveEditing = async () => {
        if (!editingCell) return;
        const cellKey = getCellKey(editingCell.id, editingCell.field);
        if (savingCell === cellKey) return;

        const student = allStudents.find((s) => s.id === editingCell.id);
        if (!student) {
            cancelEditing();
            return;
        }

        const initial = getInitialValue(student, editingCell.field).trim();
        const next = draftValue.trim();
        if (initial === next) {
            cancelEditing();
            return;
        }

        setSavingCell(cellKey);
        try {
            const res = await fetch(`/api/students/${editingCell.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ field: editingCell.field, value: draftValue }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData?.error || "Failed to save");
            }

            const data = await res.json();
            const updated = data.student as Partial<StudentItem> & { id: number };
            setAllStudents((prev) =>
                prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
            );
            cancelEditing();
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to save student";
            setErrorMessage(message);
        } finally {
            setSavingCell(null);
        }
    };

    const saveNewRow = async () => {
        const first = newRow.firstName.trim();
        const last = newRow.lastName.trim();
        if (!first || !last || savingNewRow) return;
        setSavingNewRow(true);
        try {
            const res = await fetch("/api/students", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: first,
                    lastName: last,
                    subjects: newRow.subjects.trim(),
                    year: newRow.year.trim() ? Number(newRow.year.trim()) : null,
                    hourlyRate: newRow.hourlyRate.trim() ? Number(newRow.hourlyRate.trim()) : "",
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || "Failed to create student");
            }
            const data = await res.json();
            const created = data.student as StudentItem;
            setAllStudents((prev) => [created, ...prev]);
            setNewRow({ firstName: "", lastName: "", subjects: "", year: "", hourlyRate: "" });
            setShowNewRow(false);
        } catch (e) {
            setErrorMessage(e instanceof Error ? e.message : "Failed to create student");
        } finally {
            setSavingNewRow(false);
        }
    };

    const handleNewRowBlur = () => {
        if (newRow.firstName.trim() && newRow.lastName.trim()) void saveNewRow();
    };

    const startNewPage = () => {
        setErrorMessage(null);
        setNewRow({ firstName: "", lastName: "", subjects: "", year: "", hourlyRate: "" });
        setShowNewRow(true);
        setTimeout(() => newRowFirstInputRef.current?.focus(), 0);
    };

    const toggleStatus = async (student: StudentItem) => {
        if (togglingStatusId !== null) return;
        setTogglingStatusId(student.id);
        setErrorMessage(null);
        const endpoint = student.isArchived ? `/api/students/${student.id}/unarchive` : `/api/students/${student.id}/archive`;
        try {
            const res = await fetch(endpoint, { method: "POST" });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err?.error || "Failed to update status");
            }
            setAllStudents((prev) =>
                prev.map((s) => (s.id === student.id ? { ...s, isArchived: !s.isArchived } : s))
            );
        } catch (e) {
            setErrorMessage(e instanceof Error ? e.message : "Failed to update status");
        } finally {
            setTogglingStatusId(null);
        }
    };

	return (
		<div className="space-y-6 pt-8 font-sans" style={{ fontFamily: "'Work Sans', sans-serif" }}>
				<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold text-[#3D4756]">Students</h2>
				<div className="flex items-center gap-3">
                    {savingCell ? <span className="text-xs text-gray-500">Saving...</span> : null}
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search"
                        className="w-56 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3D4756]/20 focus:border-[#3D4756]"
                    />
                    <div className="relative" ref={tableOptionsRef}>
                        <button
                            type="button"
                            onClick={() => setTableOptionsOpen((o) => !o)}
                            className={`inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#3D4756]/20 focus:ring-offset-1 transition-colors ${tableOptionsOpen ? "bg-gray-50 text-gray-900" : ""}`}
                            aria-expanded={tableOptionsOpen}
                            aria-haspopup="true"
                            aria-label="Table options: sort, filters, and columns"
                        >
                            <svg
                                className="w-4 h-4 text-gray-500"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h16" />
                                <circle cx="8" cy="7" r="1.4" fill="currentColor" />
                                <circle cx="15" cy="12" r="1.4" fill="currentColor" />
                                <circle cx="11" cy="17" r="1.4" fill="currentColor" />
                            </svg>
                            <span>View settings</span>
                        </button>
                        {tableOptionsOpen && (
                            <div
                                role="dialog"
                                aria-label="Table options"
                                className="absolute right-0 top-full z-50 mt-2 w-[360px] max-h-[75vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl"
                            >
                                <div className="px-2 pb-2 flex items-center justify-between">
                                    <p className="text-[15px] font-semibold text-gray-700">View settings</p>
                                    <button
                                        type="button"
                                        onClick={() => setTableOptionsOpen(false)}
                                        className="h-7 w-7 inline-flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                                        aria-label="Close table options"
                                    >
                                        <svg
                                            className="w-3.5 h-3.5"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>
                                <div className="px-2 pt-2 pb-1 space-y-4 border-t border-gray-100">
                                    <section>
                                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-800">
                                            <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h11M8 12h7M8 17h3M4 6v12m0 0-2-2m2 2 2-2M18 6l2 2m-2-2-2 2v12" />
                                            </svg>
                                            <span>Sort</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <select
                                                value={sortField ?? ''}
                                                onChange={(e) => { const v = e.target.value; setSortField(v || null); setSortDirection(v ? (sortDirection || 'asc') : null); }}
                                                className="rounded-lg border border-gray-300 px-2.5 py-2 text-sm"
                                            >
                                                <option value="">None</option>
                                                {COLUMN_CONFIG.filter((c) => c.sortKey).map((c) => (
                                                    <option key={c.id} value={c.sortKey!}>{c.label}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={sortDirection ?? ''}
                                                onChange={(e) => { const v = e.target.value; setSortDirection(v === 'asc' || v === 'desc' ? v : null); }}
                                                disabled={!sortField}
                                                className="rounded-lg border border-gray-300 px-2.5 py-2 text-sm disabled:opacity-50"
                                            >
                                                <option value="">Direction</option>
                                                <option value="asc">Ascending</option>
                                                <option value="desc">Descending</option>
                                            </select>
                                        </div>
                                    </section>
                                    <section>
                                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-800">
                                            <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5h18M6 12h12M10 19h4" />
                                            </svg>
                                            <span>Filter</span>
                                        </div>
                                        {filters.length > 0 && (
                                            <ul className="space-y-1 mb-2">
                                                {filters.map((f) => (
                                                    <li key={f.id} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-2.5 py-2 text-[12px] text-gray-700">
                                                        <span className="truncate">
                                                            {f.field} {f.condition} {String(f.value)}
                                                        </span>
                                                        <button type="button" onClick={() => setFilters((prev) => prev.filter(x => x.id !== f.id))} className="text-gray-500 hover:text-gray-800" aria-label="Remove filter">&times;</button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        {!showAddFilter ? (
                                            <button type="button" onClick={() => setShowAddFilter(true)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#3D4756] hover:bg-gray-50">
                                                <span className="text-sm leading-none">+</span>
                                                <span>Add filter</span>
                                            </button>
                                        ) : (
                                            <div className="space-y-2 rounded-xl border border-gray-200 p-2.5 bg-gray-50">
                                                <select value={addFilterField} onChange={(e) => setAddFilterField(e.target.value as FilterableField)} className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm">
                                                    <option value="year">Year</option>
                                                    <option value="subjects">Subjects</option>
                                                    <option value="isArchived">Status</option>
                                                    <option value="parentName">Parent Name</option>
                                                    <option value="email">Email</option>
                                                    <option value="phone">Phone</option>
                                                    <option value="school">School</option>
                                                </select>
                                                <select value={addFilterCondition} onChange={(e) => setAddFilterCondition(e.target.value as Filter['condition'])} className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm">
                                                    <option value="is">is</option>
                                                    <option value="isNot">is not</option>
                                                    <option value="contains">contains</option>
                                                    <option value="doesNotContain">does not contain</option>
                                                    <option value="isGreaterThan">greater than</option>
                                                    <option value="isLessThan">less than</option>
                                                </select>
                                                <input type="text" value={addFilterValue} onChange={(e) => setAddFilterValue(e.target.value)} placeholder="Value" className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm" />
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={addFilter} className="rounded-lg bg-[#3D4756] px-3 py-1.5 text-sm text-white hover:bg-[#2A3441]">Add</button>
                                                    <button type="button" onClick={() => { setShowAddFilter(false); setAddFilterValue(''); }} className="rounded-lg border px-3 py-1.5 text-sm">Cancel</button>
                                                </div>
                                            </div>
                                        )}
                                    </section>
                                    <section>
                                        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-800">
                                            <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5h18v14H3zM9 5v14M15 5v14" />
                                            </svg>
                                            <span>Property visibility</span>
                                        </div>
                                        <ul className="space-y-1.5">
                                            {COLUMN_CONFIG.map((col) => (
                                                <li key={col.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50">
                                                    <input
                                                        type="checkbox"
                                                        id={`col-${col.id}`}
                                                        checked={visibleColumnIds.includes(col.id)}
                                                        disabled={col.alwaysVisible}
                                                        onChange={() => toggleColumnVisibility(col.id)}
                                                        className="rounded border-gray-300"
                                                    />
                                                    <label htmlFor={`col-${col.id}`} className="text-sm text-gray-800">{col.label}</label>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                </div>
                            </div>
                        )}
                    </div>
					<Link
						className="rounded-md bg-[#3D4756] text-white p-2 font-semibold text-base hover:bg-[#2A3441] transition-colors duration-200"
						href="/students/new"
						title="Add Student"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
						</svg>
					</Link>
				</div>
			</div>

			{errorMessage && (
				<div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm">
					<span>{errorMessage}</span>
					<button
						type="button"
						onClick={() => setErrorMessage(null)}
						className="flex-shrink-0 rounded p-1 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
						aria-label="Dismiss"
					>
						<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			)}

            {filters.length > 0 && (
                <div className="p-4 flex items-center gap-2">
                    {filters.map(filter => (
                        <div key={filter.id} className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1 text-xs">
                            <span>{filter.field} {filter.condition} {String(filter.value)}</span>
                            <button onClick={() => setFilters(filters.filter(f => f.id !== filter.id))} className="text-gray-500 hover:text-gray-800">
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            )}

			<div className="bg-white rounded-lg border-x border-t border-gray-200 overflow-hidden">
				<table className="w-full text-left text-sm table-fixed" style={{ tableLayout: "fixed" }}>
					<colgroup>
						{columnWidths.slice(0, visibleColumns.length).map((w, i) => (
							<col key={visibleColumns[i]?.id ?? i} style={{ width: w }} />
						))}
					</colgroup>
					<thead className="bg-white border-b border-gray-200">
						<tr>
							{visibleColumns.map((col, i) => (
								<th
									key={col.id}
									style={{ width: columnWidths[i] }}
									className={`relative px-4 py-2.5 font-semibold text-gray-900 ${col.sortKey ? 'cursor-pointer hover:bg-gray-50 transition-colors select-none' : ''}`}
									onClick={col.sortKey ? () => handleSort(col.sortKey!) : undefined}
								>
									<div className="flex items-center gap-2 truncate">
										<span>{col.label}</span>
										{col.sortKey && (
											<span className="text-xs w-3 inline-block text-center shrink-0">
												{sortField === col.sortKey ? (sortDirection === 'asc' ? '↑' : '↓') : '\u00A0'}
											</span>
										)}
									</div>
									<div role="separator" onMouseDown={startResize(i)} className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[#3D4756]/20" title="Resize column" />
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{filteredStudents.map((s) => (
							<tr
								key={s.id}
								className="group border-t border-gray-200 hover:bg-gray-50"
							>
								{visibleColumns.map((col) => {
									const baseTd = "py-2 align-middle min-h-[2.25rem]";
									const px = "px-4";
									if (col.id === 'firstName') {
										const isEditing = editingCell?.id === s.id && editingCell.field === "firstName";
										return (
											<td
												key={col.id}
												className={`${baseTd} ${px} font-medium text-gray-900 cursor-text`}
												onClick={() => startEditing(s, "firstName")}
											>
												{isEditing ? (
													<input
														autoFocus
														value={draftValue}
														onChange={(e) => setDraftValue(e.target.value)}
														onBlur={saveEditing}
														onKeyDown={(e) => {
															if (e.key === "Enter") {
																e.preventDefault();
																void saveEditing();
															} else if (e.key === "Escape") {
																e.preventDefault();
																cancelEditing();
															}
														}}
														className="inline-cell-input w-full min-w-0 bg-transparent border-none outline-none focus:ring-0 p-0 text-sm font-medium text-gray-900"
													/>
												) : (
													<Link
														href={`/students/${s.id}`}
														onClick={(e) => e.stopPropagation()}
														onMouseEnter={(e) => setHoverAvatar({ student: s, x: e.clientX, y: e.clientY })}
														onMouseMove={(e) => setHoverAvatar({ student: s, x: e.clientX, y: e.clientY })}
														onMouseLeave={() => setHoverAvatar(null)}
														onFocus={(e) => {
															const rect = e.currentTarget.getBoundingClientRect();
															setHoverAvatar({
																student: s,
																x: rect.left + rect.width / 2,
																y: rect.top,
															});
														}}
														onBlur={() => setHoverAvatar(null)}
														className="block truncate text-gray-900 hover:underline"
														aria-label={`View profile for ${s.firstName} ${s.lastName ?? ""}`}
													>
														{s.firstName}
													</Link>
												)}
											</td>
										);
									}
									if (col.id === 'lastName') {
										return (
											<td key={col.id} className={`${baseTd} ${px} font-medium text-gray-900 cursor-text`} onClick={() => startEditing(s, "lastName")}>
												{editingCell?.id === s.id && editingCell.field === "lastName" ? (
													<input autoFocus value={draftValue} onChange={(e) => setDraftValue(e.target.value)} onBlur={saveEditing} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void saveEditing(); } else if (e.key === "Escape") { e.preventDefault(); cancelEditing(); } }} className="inline-cell-input w-full min-w-0 bg-transparent border-none outline-none focus:ring-0 p-0 text-sm font-medium text-gray-900" />
												) : (<span className="block truncate">{s.lastName}</span>)}
											</td>
										);
									}
									if (col.id === 'subjects') {
										return (
											<td key={col.id} className={`${baseTd} ${px}`} onClick={(e) => { if (editingCell?.id !== s.id || editingCell?.field !== "subjects") startEditing(s, "subjects"); else e.stopPropagation(); }}>
												{editingCell?.id === s.id && editingCell.field === "subjects" ? (
													<div className="min-w-0" onClick={(e) => e.stopPropagation()}><SubjectsMultiSelect value={draftValue} onChange={setDraftValue} onClose={() => void saveEditing()} onCancel={cancelEditing} compact defaultOpen /></div>
												) : (<SubjectsDisplay subjects={s.subjects || ""} />)}
											</td>
										);
									}
									if (col.id === 'year') {
										return (
											<td key={col.id} className={`${baseTd} ${px} text-sm text-gray-900 cursor-text`} onClick={() => startEditing(s, "year")}>
												{editingCell?.id === s.id && editingCell.field === "year" ? (
													<input autoFocus value={draftValue} onChange={(e) => setDraftValue(e.target.value)} onBlur={saveEditing} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void saveEditing(); } else if (e.key === "Escape") { e.preventDefault(); cancelEditing(); } }} className="inline-cell-input w-full min-w-0 bg-transparent border-none outline-none focus:ring-0 p-0 text-sm text-gray-900" />
												) : (
													<span className="block truncate">
														{s.year == null ? "—" : s.year >= 13 ? "Graduated" : s.year}
													</span>
												)}
											</td>
										);
									}
									if (col.id === 'hourlyRate') {
										return (
											<td key={col.id} className={`${baseTd} ${px} cursor-text`} onClick={() => startEditing(s, "hourlyRate")}>
												{editingCell?.id === s.id && editingCell.field === "hourlyRate" ? (
													<input autoFocus value={draftValue} onChange={(e) => setDraftValue(e.target.value)} onBlur={saveEditing} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void saveEditing(); } else if (e.key === "Escape") { e.preventDefault(); cancelEditing(); } }} className="inline-cell-input w-full min-w-0 bg-transparent border-none outline-none focus:ring-0 p-0 text-sm text-gray-900" />
												) : (<span className="block truncate">{s.hourlyRateCents === 0 ? "Free" : formatCurrencyFromCents(s.hourlyRateCents)}</span>)}
											</td>
										);
									}
									if (col.id === 'status') {
										return (
											<td key={col.id} className={`${baseTd} ${px}`}>
												<button type="button" onClick={() => void toggleStatus(s)} disabled={togglingStatusId === s.id} className="flex items-center cursor-pointer rounded px-1 py-0.5 -ml-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed" title={s.isArchived ? "Set to Active" : "Set to Archived"}>
													{togglingStatusId === s.id ? <span className="text-xs text-gray-500">Updating...</span> : <StatusIndicator isActive={!s.isArchived} />}
												</button>
											</td>
										);
									}
									if (col.id === 'parentName') return (<td key={col.id} className={`${baseTd} ${px} text-gray-900`}><span className="block truncate">{s.parentName ?? "—"}</span></td>);
									if (col.id === 'email') return (<td key={col.id} className={`${baseTd} ${px} text-gray-900`}><span className="block truncate">{s.email ?? "—"}</span></td>);
									if (col.id === 'phone') return (<td key={col.id} className={`${baseTd} ${px} text-gray-900`}><span className="block truncate">{s.phone ?? "—"}</span></td>);
									if (col.id === 'school') return (<td key={col.id} className={`${baseTd} ${px} text-gray-900`}><span className="block truncate">{s.school ?? "—"}</span></td>);
									return null;
								})}
							</tr>
						))}
						{/* Notion-style: "+ New page" creates an empty row to fill in */}
						{!showNewRow ? (
							<tr className="border-t border-gray-200">
								<td colSpan={visibleColumns.length} className="px-2 py-2 align-middle min-h-[2.25rem] text-left">
									<button type="button" onClick={startNewPage} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded px-1 py-0.5 transition-colors w-fit">
										<span className="text-gray-400">+</span>
										<span>New page</span>
									</button>
								</td>
							</tr>
						) : (
							<tr className="border-t border-gray-200 bg-gray-50/50">
								{visibleColumns.map((col) => {
									const base = "py-2 align-middle min-h-[2.25rem]";
									if (col.id === 'firstName') return (
										<td key={col.id} className={`${base} px-4`}>
											<input ref={newRowFirstInputRef} placeholder="First name" value={newRow.firstName} onChange={(e) => setNewRow((r) => ({ ...r, firstName: e.target.value }))} onBlur={handleNewRowBlur} onKeyDown={(e) => { if (e.key === "Escape") setShowNewRow(false); if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).closest("tr")?.querySelectorAll("input")[1]?.focus(); } }} className="inline-cell-input w-full min-w-0 bg-transparent border-none outline-none focus:ring-0 p-0 text-sm font-medium text-gray-900 placeholder:text-gray-400" />
										</td>
									);
									if (col.id === 'lastName') return (
										<td key={col.id} className={`${base} px-4`}>
											<input placeholder="Last name" value={newRow.lastName} onChange={(e) => setNewRow((r) => ({ ...r, lastName: e.target.value }))} onBlur={handleNewRowBlur} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const inputs = (e.target as HTMLInputElement).closest("tr")?.querySelectorAll("input"); const idx = Array.from(inputs ?? []).indexOf(e.target as HTMLInputElement); if (inputs && idx >= 0 && idx < inputs.length - 1) (inputs[idx + 1] as HTMLInputElement).focus(); } }} className="inline-cell-input w-full min-w-0 bg-transparent border-none outline-none focus:ring-0 p-0 text-sm font-medium text-gray-900 placeholder:text-gray-400" />
										</td>
									);
									if (col.id === 'subjects') return (
										<td key={col.id} className={`${base} px-4`}>
											<SubjectsMultiSelect value={newRow.subjects} onChange={(v) => setNewRow((r) => ({ ...r, subjects: v }))} compact />
										</td>
									);
									if (col.id === 'year') return (
										<td key={col.id} className={`${base} px-4`}>
											<input placeholder="Year" value={newRow.year} onChange={(e) => setNewRow((r) => ({ ...r, year: e.target.value }))} onBlur={handleNewRowBlur} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const inputs = (e.target as HTMLInputElement).closest("tr")?.querySelectorAll("input"); const idx = Array.from(inputs ?? []).indexOf(e.target as HTMLInputElement); if (inputs && idx >= 0 && idx < inputs.length - 1) (inputs[idx + 1] as HTMLInputElement).focus(); } }} className="inline-cell-input w-full min-w-0 bg-transparent border-none outline-none focus:ring-0 p-0 text-sm text-gray-900 placeholder:text-gray-400" />
										</td>
									);
									if (col.id === 'hourlyRate') return (
										<td key={col.id} className={`${base} px-4`}>
											<input placeholder="Rate" value={newRow.hourlyRate} onChange={(e) => setNewRow((r) => ({ ...r, hourlyRate: e.target.value }))} onBlur={handleNewRowBlur} onKeyDown={(e) => { if (e.key === "Enter") handleNewRowBlur(); }} className="inline-cell-input w-full min-w-0 bg-transparent border-none outline-none focus:ring-0 p-0 text-sm text-gray-900 placeholder:text-gray-400" />
										</td>
									);
									if (col.id === 'status') return (
										<td key={col.id} className={`${base} px-4`}>
											{savingNewRow ? <span className="text-xs text-gray-500">Saving...</span> : <button type="button" onClick={() => setShowNewRow(false)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>}
										</td>
									);
									return <td key={col.id} className={`${base} px-4`} />;
								})}
							</tr>
						)}
					</tbody>
				</table>
			</div>
			{hoverAvatar && (
				<div
					className="fixed z-40 pointer-events-none transition-all duration-100 ease-out"
					style={{
						left: hoverAvatar.x,
						top: hoverAvatar.y - 8,
						transform: "translate(-50%, -100%)",
					}}
				>
					<div className="rounded-xl bg-white shadow-md border border-gray-200 px-2 py-1">
						<StudentAvatar
							firstName={hoverAvatar.student.firstName}
							lastName={hoverAvatar.student.lastName}
							studentId={hoverAvatar.student.id}
						/>
					</div>
				</div>
			)}
		</div>
	);
}


