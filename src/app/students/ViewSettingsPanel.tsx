"use client";

import { useState, useCallback } from "react";
import { COLUMN_CONFIG, type ColumnId, type Filter, type FilterableField } from "./studentsTableConfig";

interface Props {
	sortField: string | null;
	sortDirection: "asc" | "desc" | null;
	onSortChange: (field: string | null, direction: "asc" | "desc" | null) => void;
	filters: Filter[];
	onFiltersChange: (filters: Filter[]) => void;
	visibleColumnIds: ColumnId[];
	onToggleColumn: (id: ColumnId) => void;
	onClose: () => void;
}

export default function ViewSettingsPanel({
	sortField,
	sortDirection,
	onSortChange,
	filters,
	onFiltersChange,
	visibleColumnIds,
	onToggleColumn,
	onClose,
}: Props) {
	const [addFilterField, setAddFilterField] = useState<FilterableField>("subjects");
	const [addFilterCondition, setAddFilterCondition] = useState<Filter["condition"]>("contains");
	const [addFilterValue, setAddFilterValue] = useState("");
	const [showAddFilter, setShowAddFilter] = useState(false);

	const addFilter = useCallback(() => {
		let value: unknown = addFilterValue.trim();
		if (addFilterField === "year") value = value === "" ? null : Number(value);
		if (addFilterField === "isArchived") value = addFilterValue.toLowerCase() === "true" || addFilterValue === "1";
		onFiltersChange([...filters, { id: crypto.randomUUID(), field: addFilterField, condition: addFilterCondition, value }]);
		setAddFilterValue("");
		setShowAddFilter(false);
	}, [addFilterField, addFilterCondition, addFilterValue, filters, onFiltersChange]);

	return (
		<div
			role="dialog"
			aria-label="Table options"
			className="absolute right-0 top-full z-50 mt-2 w-[360px] max-h-[75vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl"
		>
			<div className="px-2 pb-2 flex items-center justify-between">
				<p className="text-[15px] font-semibold text-gray-700">View settings</p>
				<button
					type="button"
					onClick={onClose}
					className="h-7 w-7 inline-flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100"
					aria-label="Close table options"
				>
					<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div className="px-2 pt-2 pb-1 space-y-4 border-t border-gray-100">
				{/* Sort */}
				<section>
					<div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-800">
						<svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7h11M8 12h7M8 17h3M4 6v12m0 0-2-2m2 2 2-2M18 6l2 2m-2-2-2 2v12" />
						</svg>
						<span>Sort</span>
					</div>
					<div className="grid grid-cols-2 gap-2">
						<select
							value={sortField ?? ""}
							onChange={(e) => {
								const v = e.target.value;
								onSortChange(v || null, v ? (sortDirection || "asc") : null);
							}}
							className="rounded-lg border border-gray-300 px-2.5 py-2 text-sm"
						>
							<option value="">None</option>
							{COLUMN_CONFIG.filter((c) => c.sortKey).map((c) => (
								<option key={c.id} value={c.sortKey!}>{c.label}</option>
							))}
						</select>
						<select
							value={sortDirection ?? ""}
							onChange={(e) => {
								const v = e.target.value;
								onSortChange(sortField, v === "asc" || v === "desc" ? v : null);
							}}
							disabled={!sortField}
							className="rounded-lg border border-gray-300 px-2.5 py-2 text-sm disabled:opacity-50"
						>
							<option value="">Direction</option>
							<option value="asc">Ascending</option>
							<option value="desc">Descending</option>
						</select>
					</div>
				</section>

				{/* Filter */}
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
									<span className="truncate">{f.field} {f.condition} {String(f.value)}</span>
									<button
										type="button"
										onClick={() => onFiltersChange(filters.filter((x) => x.id !== f.id))}
										className="text-gray-500 hover:text-gray-800"
										aria-label="Remove filter"
									>
										&times;
									</button>
								</li>
							))}
						</ul>
					)}
					{!showAddFilter ? (
						<button
							type="button"
							onClick={() => setShowAddFilter(true)}
							className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-[#3D4756] hover:bg-gray-50"
						>
							<span className="text-sm leading-none">+</span>
							<span>Add filter</span>
						</button>
					) : (
						<div className="space-y-2 rounded-xl border border-gray-200 p-2.5 bg-gray-50">
							<select
								value={addFilterField}
								onChange={(e) => setAddFilterField(e.target.value as FilterableField)}
								className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
							>
								<option value="year">Year</option>
								<option value="subjects">Subjects</option>
								<option value="isArchived">Status</option>
								<option value="parentName">Parent Name</option>
								<option value="email">Email</option>
								<option value="phone">Phone</option>
								<option value="school">School</option>
							</select>
							<select
								value={addFilterCondition}
								onChange={(e) => setAddFilterCondition(e.target.value as Filter["condition"])}
								className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
							>
								<option value="is">is</option>
								<option value="isNot">is not</option>
								<option value="contains">contains</option>
								<option value="doesNotContain">does not contain</option>
								<option value="isGreaterThan">greater than</option>
								<option value="isLessThan">less than</option>
							</select>
							<input
								type="text"
								value={addFilterValue}
								onChange={(e) => setAddFilterValue(e.target.value)}
								placeholder="Value"
								className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm"
							/>
							<div className="flex gap-2">
								<button type="button" onClick={addFilter} className="rounded-lg bg-[#3D4756] px-3 py-1.5 text-sm text-white hover:bg-[#2A3441]">
									Add
								</button>
								<button
									type="button"
									onClick={() => { setShowAddFilter(false); setAddFilterValue(""); }}
									className="rounded-lg border px-3 py-1.5 text-sm"
								>
									Cancel
								</button>
							</div>
						</div>
					)}
				</section>

				{/* Column visibility */}
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
									onChange={() => onToggleColumn(col.id)}
									className="rounded border-gray-300"
								/>
								<label htmlFor={`col-${col.id}`} className="text-sm text-gray-800">{col.label}</label>
							</li>
						))}
					</ul>
				</section>
			</div>
		</div>
	);
}
