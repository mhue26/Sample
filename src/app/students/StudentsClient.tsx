"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import SubjectsDisplay from "./SubjectsDisplay";
import SubjectsMultiSelect from "./SubjectsMultiSelect";
import StatusIndicator from "./StatusIndicator";
import StudentAvatar from "./StudentAvatar";
import ViewSettingsPanel from "./ViewSettingsPanel";
import { useTablePreferences } from "./useTablePreferences";
import { useColumnResize } from "./useColumnResize";
import { type ColumnId } from "./studentsTableConfig";

const STORAGE_KEY_COLUMN_WIDTHS = "studentsTableColumnWidths";
const MIN_COLUMN_WIDTH = 48;
const DEFAULT_COLUMN_WIDTH_BY_ID: Record<string, number> = {
	avatar: 56, firstName: 140, lastName: 140, subjects: 200,
	year: 80, hourlyRate: 90, status: 100, parentName: 140,
	email: 160, phone: 120, school: 120,
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

function formatCurrencyFromCents(valueInCents: number): string {
	return `$${(valueInCents / 100).toFixed(2)}`;
}

function getInitialValue(student: StudentItem, field: EditableField): string {
	if (field === "firstName") return student.firstName ?? "";
	if (field === "lastName") return student.lastName ?? "";
	if (field === "subjects") return student.subjects ?? "";
	if (field === "year") return student.year?.toString() ?? "";
	if (field === "hourlyRate") return student.hourlyRateCents === 0 ? "" : (student.hourlyRateCents / 100).toFixed(2);
	return "";
}

export default function StudentsClient({
	students,
	archivedStudents,
}: {
	students: StudentItem[];
	archivedStudents: StudentItem[];
}) {
	const [allStudents, setAllStudents] = useState<StudentItem[]>(() => [...students, ...archivedStudents]);
	const [searchTerm, setSearchTerm] = useState("");
	const [editingCell, setEditingCell] = useState<{ id: number; field: EditableField } | null>(null);
	const [draftValue, setDraftValue] = useState("");
	const [savingCell, setSavingCell] = useState<string | null>(null);
	const [togglingStatusId, setTogglingStatusId] = useState<number | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const [newRow, setNewRow] = useState({ firstName: "", lastName: "", subjects: "", year: "", hourlyRate: "" });
	const [savingNewRow, setSavingNewRow] = useState(false);
	const [showNewRow, setShowNewRow] = useState(false);
	const newRowFirstInputRef = useRef<HTMLInputElement>(null);

	const [tableOptionsOpen, setTableOptionsOpen] = useState(false);
	const tableOptionsRef = useRef<HTMLDivElement>(null);
	const [hoverAvatar, setHoverAvatar] = useState<{ student: StudentItem; x: number; y: number } | null>(null);

	const prefs = useTablePreferences();
	const { visibleColumns, columnWidths: prefWidths } = prefs;

	const initialWidths = useMemo(
		() => visibleColumns.map((c) => Math.max(MIN_COLUMN_WIDTH, DEFAULT_COLUMN_WIDTH_BY_ID[c.id] ?? 100)),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[visibleColumns.length]
	);

	const { columnWidths, setColumnWidths, startResize } = useColumnResize(STORAGE_KEY_COLUMN_WIDTHS, initialWidths);

	// Keep column resize widths in sync when preference widths change
	useEffect(() => {
		if (prefWidths.length === columnWidths.length && prefWidths.some((w, i) => w !== columnWidths[i])) {
			setColumnWidths(prefWidths);
		}
	}, [prefWidths]); // eslint-disable-line react-hooks/exhaustive-deps

	// Close table options panel on outside click
	useEffect(() => {
		if (!tableOptionsOpen) return;
		const onDocClick = (e: MouseEvent) => {
			if (tableOptionsRef.current && !tableOptionsRef.current.contains(e.target as Node)) {
				setTableOptionsOpen(false);
			}
		};
		document.addEventListener("click", onDocClick);
		return () => document.removeEventListener("click", onDocClick);
	}, [tableOptionsOpen]);

	const filteredStudents = useMemo(() => {
		let result = allStudents;

		if (prefs.filters.length > 0) {
			result = allStudents.filter((student) =>
				prefs.filters.every((filter) => {
					const { field, condition, value } = filter;
					const studentValue = student[field as keyof StudentItem];
					switch (condition) {
						case "is": return studentValue == value;
						case "isNot": return studentValue != value;
						case "contains": return typeof studentValue === "string" && studentValue.toLowerCase().includes(String(value).toLowerCase());
						case "doesNotContain": return typeof studentValue === "string" && !studentValue.toLowerCase().includes(String(value).toLowerCase());
						case "isGreaterThan": return typeof studentValue === "number" && studentValue > Number(value);
						case "isLessThan": return typeof studentValue === "number" && studentValue < Number(value);
						default: return true;
					}
				})
			);
		}

		if (searchTerm.trim()) {
			const q = searchTerm.toLowerCase();
			result = result.filter((s) => {
				const name = `${s.firstName} ${s.lastName}`.toLowerCase();
				const subjects = (s.subjects || "").toLowerCase();
				return name.includes(q) || subjects.includes(q);
			});
		}

		if (prefs.sortField && prefs.sortDirection) {
			result = [...result].sort((a, b) => {
				let aValue: string | number;
				let bValue: string | number;
				switch (prefs.sortField) {
					case "record": aValue = `${a.firstName} ${a.lastName}`.toLowerCase(); bValue = `${b.firstName} ${b.lastName}`.toLowerCase(); break;
					case "subjects": aValue = (a.subjects || "").toLowerCase(); bValue = (b.subjects || "").toLowerCase(); break;
					case "year": aValue = a.year ?? -1; bValue = b.year ?? -1; break;
					case "hourlyRate": aValue = a.hourlyRateCents; bValue = b.hourlyRateCents; break;
					case "status": aValue = a.isArchived ? 1 : 0; bValue = b.isArchived ? 1 : 0; break;
					case "parentName": aValue = (a.parentName ?? "").toLowerCase(); bValue = (b.parentName ?? "").toLowerCase(); break;
					case "email": aValue = (a.email ?? "").toLowerCase(); bValue = (b.email ?? "").toLowerCase(); break;
					case "phone": aValue = (a.phone ?? "").toLowerCase(); bValue = (b.phone ?? "").toLowerCase(); break;
					case "school": aValue = (a.school ?? "").toLowerCase(); bValue = (b.school ?? "").toLowerCase(); break;
					default: return 0;
				}
				if (aValue < bValue) return prefs.sortDirection === "asc" ? -1 : 1;
				if (aValue > bValue) return prefs.sortDirection === "asc" ? 1 : -1;
				return 0;
			});
		}

		return result;
	}, [allStudents, prefs.filters, prefs.sortField, prefs.sortDirection, searchTerm]);

	const getCellKey = (id: number, field: EditableField) => `${id}:${field}`;

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
		if (!student) { cancelEditing(); return; }

		const initial = getInitialValue(student, editingCell.field).trim();
		if (initial === draftValue.trim()) { cancelEditing(); return; }

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
			setAllStudents((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
			cancelEditing();
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : "Failed to save student");
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
			setAllStudents((prev) => [data.student as StudentItem, ...prev]);
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
		const endpoint = student.isArchived
			? `/api/students/${student.id}/unarchive`
			: `/api/students/${student.id}/archive`;
		try {
			const res = await fetch(endpoint, { method: "POST" });
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err?.error || "Failed to update status");
			}
			setAllStudents((prev) => prev.map((s) => (s.id === student.id ? { ...s, isArchived: !s.isArchived } : s)));
		} catch (e) {
			setErrorMessage(e instanceof Error ? e.message : "Failed to update status");
		} finally {
			setTogglingStatusId(null);
		}
	};

	const handleSort = (field: string) => {
		if (prefs.sortField !== field) {
			prefs.setSortField(field);
			prefs.setSortDirection("asc");
		} else if (prefs.sortDirection === "asc") {
			prefs.setSortDirection("desc");
		} else {
			prefs.setSortField(null);
			prefs.setSortDirection(null);
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
							<svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h16M4 12h16M4 17h16" />
								<circle cx="8" cy="7" r="1.4" fill="currentColor" />
								<circle cx="15" cy="12" r="1.4" fill="currentColor" />
								<circle cx="11" cy="17" r="1.4" fill="currentColor" />
							</svg>
							<span>View settings</span>
						</button>
						{tableOptionsOpen && (
							<ViewSettingsPanel
								sortField={prefs.sortField}
								sortDirection={prefs.sortDirection}
								onSortChange={(field, dir) => { prefs.setSortField(field); prefs.setSortDirection(dir); }}
								filters={prefs.filters}
								onFiltersChange={prefs.setFilters}
								visibleColumnIds={prefs.visibleColumnIds}
								onToggleColumn={prefs.toggleColumnVisibility as (id: ColumnId) => void}
								onClose={() => setTableOptionsOpen(false)}
							/>
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

			{prefs.filters.length > 0 && (
				<div className="p-4 flex items-center gap-2">
					{prefs.filters.map((filter) => (
						<div key={filter.id} className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1 text-xs">
							<span>{filter.field} {filter.condition} {String(filter.value)}</span>
							<button
								onClick={() => prefs.setFilters(prefs.filters.filter((f) => f.id !== filter.id))}
								className="text-gray-500 hover:text-gray-800"
							>
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
									className={`relative px-4 py-2.5 font-semibold text-gray-900 ${col.sortKey ? "cursor-pointer hover:bg-gray-50 transition-colors select-none" : ""}`}
									onClick={col.sortKey ? () => handleSort(col.sortKey!) : undefined}
								>
									<div className="flex items-center gap-2 truncate">
										<span>{col.label}</span>
										{col.sortKey && (
											<span className="text-xs w-3 inline-block text-center shrink-0">
												{prefs.sortField === col.sortKey ? (prefs.sortDirection === "asc" ? "↑" : "↓") : " "}
											</span>
										)}
									</div>
									<div
										role="separator"
										onMouseDown={startResize(i)}
										className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[#3D4756]/20"
										title="Resize column"
									/>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{filteredStudents.map((s) => (
							<tr key={s.id} className="group border-t border-gray-200 hover:bg-gray-50">
								{visibleColumns.map((col) => {
									const baseTd = "py-2 align-middle min-h-[2.25rem]";
									const px = "px-4";

									if (col.id === "firstName") {
										const isEditing = editingCell?.id === s.id && editingCell.field === "firstName";
										return (
											<td key={col.id} className={`${baseTd} ${px} font-medium text-gray-900 cursor-text`} onClick={() => startEditing(s, "firstName")}>
												{isEditing ? (
													<input
														autoFocus
														value={draftValue}
														onChange={(e) => setDraftValue(e.target.value)}
														onBlur={saveEditing}
														onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void saveEditing(); } else if (e.key === "Escape") { e.preventDefault(); cancelEditing(); } }}
														className="inline-cell-input w-full min-w-0 bg-transparent border-none outline-none focus:ring-0 p-0 text-sm font-medium text-gray-900"
													/>
												) : (
													<Link
														href={`/students/${s.id}`}
														onClick={(e) => e.stopPropagation()}
														onMouseEnter={(e) => setHoverAvatar({ student: s, x: e.clientX, y: e.clientY })}
														onMouseMove={(e) => setHoverAvatar({ student: s, x: e.clientX, y: e.clientY })}
														onMouseLeave={() => setHoverAvatar(null)}
														onFocus={(e) => { const r = e.currentTarget.getBoundingClientRect(); setHoverAvatar({ student: s, x: r.left + r.width / 2, y: r.top }); }}
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

									if (col.id === "lastName") {
										const isEditing = editingCell?.id === s.id && editingCell.field === "lastName";
										return (
											<td key={col.id} className={`${baseTd} ${px} font-medium text-gray-900 cursor-text`} onClick={() => startEditing(s, "lastName")}>
												{isEditing ? (
													<input autoFocus value={draftValue} onChange={(e) => setDraftValue(e.target.value)} onBlur={saveEditing} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void saveEditing(); } else if (e.key === "Escape") { e.preventDefault(); cancelEditing(); } }} className="inline-cell-input w-full min-w-0 bg-transparent border-none outline-none focus:ring-0 p-0 text-sm font-medium text-gray-900" />
												) : <span className="block truncate">{s.lastName}</span>}
											</td>
										);
									}

									if (col.id === "subjects") {
										const isEditing = editingCell?.id === s.id && editingCell.field === "subjects";
										return (
											<td key={col.id} className={`${baseTd} ${px}`} onClick={(e) => { if (!isEditing) startEditing(s, "subjects"); else e.stopPropagation(); }}>
												{isEditing ? (
													<div className="min-w-0" onClick={(e) => e.stopPropagation()}>
														<SubjectsMultiSelect value={draftValue} onChange={setDraftValue} onClose={() => void saveEditing()} onCancel={cancelEditing} compact defaultOpen />
													</div>
												) : <SubjectsDisplay subjects={s.subjects || ""} />}
											</td>
										);
									}

									if (col.id === "year") {
										const isEditing = editingCell?.id === s.id && editingCell.field === "year";
										return (
											<td key={col.id} className={`${baseTd} ${px} text-sm text-gray-900 cursor-text`} onClick={() => startEditing(s, "year")}>
												{isEditing ? (
													<input autoFocus value={draftValue} onChange={(e) => setDraftValue(e.target.value)} onBlur={saveEditing} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void saveEditing(); } else if (e.key === "Escape") { e.preventDefault(); cancelEditing(); } }} className="inline-cell-input w-full min-w-0 bg-transparent border-none outline-none focus:ring-0 p-0 text-sm text-gray-900" />
												) : <span className="block truncate">{s.year == null ? "—" : s.year >= 13 ? "Graduated" : s.year}</span>}
											</td>
										);
									}

									if (col.id === "hourlyRate") {
										const isEditing = editingCell?.id === s.id && editingCell.field === "hourlyRate";
										return (
											<td key={col.id} className={`${baseTd} ${px} cursor-text`} onClick={() => startEditing(s, "hourlyRate")}>
												{isEditing ? (
													<input autoFocus value={draftValue} onChange={(e) => setDraftValue(e.target.value)} onBlur={saveEditing} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void saveEditing(); } else if (e.key === "Escape") { e.preventDefault(); cancelEditing(); } }} className="inline-cell-input w-full min-w-0 bg-transparent border-none outline-none focus:ring-0 p-0 text-sm text-gray-900" />
												) : <span className="block truncate">{s.hourlyRateCents === 0 ? "Free" : formatCurrencyFromCents(s.hourlyRateCents)}</span>}
											</td>
										);
									}

									if (col.id === "status") {
										return (
											<td key={col.id} className={`${baseTd} ${px}`}>
												<button
													type="button"
													onClick={() => void toggleStatus(s)}
													disabled={togglingStatusId === s.id}
													className="flex items-center cursor-pointer rounded px-1 py-0.5 -ml-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
													title={s.isArchived ? "Set to Active" : "Set to Archived"}
												>
													{togglingStatusId === s.id
														? <span className="text-xs text-gray-500">Updating...</span>
														: <StatusIndicator isActive={!s.isArchived} />}
												</button>
											</td>
										);
									}

									if (col.id === "parentName") return <td key={col.id} className={`${baseTd} ${px} text-gray-900`}><span className="block truncate">{s.parentName ?? "—"}</span></td>;
									if (col.id === "email") return <td key={col.id} className={`${baseTd} ${px} text-gray-900`}><span className="block truncate">{s.email ?? "—"}</span></td>;
									if (col.id === "phone") return <td key={col.id} className={`${baseTd} ${px} text-gray-900`}><span className="block truncate">{s.phone ?? "—"}</span></td>;
									if (col.id === "school") return <td key={col.id} className={`${baseTd} ${px} text-gray-900`}><span className="block truncate">{s.school ?? "—"}</span></td>;
									return null;
								})}
							</tr>
						))}

						{/* New row */}
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
									if (col.id === "firstName") return (
										<td key={col.id} className={`${base} px-4`}>
											<input ref={newRowFirstInputRef} placeholder="First name" value={newRow.firstName} onChange={(e) => setNewRow((r) => ({ ...r, firstName: e.target.value }))} onBlur={handleNewRowBlur} onKeyDown={(e) => { if (e.key === "Escape") setShowNewRow(false); if (e.key === "Enter") { e.preventDefault(); (e.target as HTMLInputElement).closest("tr")?.querySelectorAll("input")[1]?.focus(); } }} className="inline-cell-input w-full min-w-0 bg-transparent border-none outline-none focus:ring-0 p-0 text-sm font-medium text-gray-900 placeholder:text-gray-400" />
										</td>
									);
									if (col.id === "lastName") return (
										<td key={col.id} className={`${base} px-4`}>
											<input placeholder="Last name" value={newRow.lastName} onChange={(e) => setNewRow((r) => ({ ...r, lastName: e.target.value }))} onBlur={handleNewRowBlur} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const inputs = (e.target as HTMLInputElement).closest("tr")?.querySelectorAll("input"); const idx = Array.from(inputs ?? []).indexOf(e.target as HTMLInputElement); if (inputs && idx >= 0 && idx < inputs.length - 1) (inputs[idx + 1] as HTMLInputElement).focus(); } }} className="inline-cell-input w-full min-w-0 bg-transparent border-none outline-none focus:ring-0 p-0 text-sm font-medium text-gray-900 placeholder:text-gray-400" />
										</td>
									);
									if (col.id === "subjects") return (
										<td key={col.id} className={`${base} px-4`}>
											<SubjectsMultiSelect value={newRow.subjects} onChange={(v) => setNewRow((r) => ({ ...r, subjects: v }))} compact />
										</td>
									);
									if (col.id === "year") return (
										<td key={col.id} className={`${base} px-4`}>
											<input placeholder="Year" value={newRow.year} onChange={(e) => setNewRow((r) => ({ ...r, year: e.target.value }))} onBlur={handleNewRowBlur} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const inputs = (e.target as HTMLInputElement).closest("tr")?.querySelectorAll("input"); const idx = Array.from(inputs ?? []).indexOf(e.target as HTMLInputElement); if (inputs && idx >= 0 && idx < inputs.length - 1) (inputs[idx + 1] as HTMLInputElement).focus(); } }} className="inline-cell-input w-full min-w-0 bg-transparent border-none outline-none focus:ring-0 p-0 text-sm text-gray-900 placeholder:text-gray-400" />
										</td>
									);
									if (col.id === "hourlyRate") return (
										<td key={col.id} className={`${base} px-4`}>
											<input placeholder="Rate" value={newRow.hourlyRate} onChange={(e) => setNewRow((r) => ({ ...r, hourlyRate: e.target.value }))} onBlur={handleNewRowBlur} onKeyDown={(e) => { if (e.key === "Enter") handleNewRowBlur(); }} className="inline-cell-input w-full min-w-0 bg-transparent border-none outline-none focus:ring-0 p-0 text-sm text-gray-900 placeholder:text-gray-400" />
										</td>
									);
									if (col.id === "status") return (
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
					style={{ left: hoverAvatar.x, top: hoverAvatar.y - 8, transform: "translate(-50%, -100%)" }}
				>
					<div className="rounded-xl bg-white shadow-md border border-gray-200 px-2 py-1">
						<StudentAvatar firstName={hoverAvatar.student.firstName} lastName={hoverAvatar.student.lastName} studentId={hoverAvatar.student.id} />
					</div>
				</div>
			)}
		</div>
	);
}
