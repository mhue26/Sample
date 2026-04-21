export type FilterableField = "year" | "subjects" | "isArchived" | "parentName" | "email" | "phone" | "school";

export type Filter = {
	id: string;
	field: FilterableField;
	condition: "is" | "isNot" | "contains" | "doesNotContain" | "isGreaterThan" | "isLessThan";
	value: unknown;
};

export type ColumnId =
	| "avatar"
	| "firstName"
	| "lastName"
	| "subjects"
	| "year"
	| "hourlyRate"
	| "status"
	| "parentName"
	| "email"
	| "phone"
	| "school";

export const COLUMN_CONFIG: Array<{
	id: ColumnId;
	label: string;
	sortKey: string | null;
	filterKey: FilterableField | null;
	defaultVisible: boolean;
	alwaysVisible?: boolean;
	editable: boolean;
}> = [
	{ id: "firstName", label: "First Name", sortKey: "record", filterKey: null, defaultVisible: true, alwaysVisible: true, editable: true },
	{ id: "lastName", label: "Last Name", sortKey: null, filterKey: null, defaultVisible: true, editable: true },
	{ id: "subjects", label: "Subjects", sortKey: "subjects", filterKey: "subjects", defaultVisible: true, editable: true },
	{ id: "year", label: "Year", sortKey: "year", filterKey: "year", defaultVisible: true, editable: true },
	{ id: "hourlyRate", label: "Rate", sortKey: "hourlyRate", filterKey: null, defaultVisible: true, editable: true },
	{ id: "status", label: "Status", sortKey: "status", filterKey: "isArchived", defaultVisible: true, editable: false },
	{ id: "parentName", label: "Parent Name", sortKey: "parentName", filterKey: "parentName", defaultVisible: false, editable: false },
	{ id: "email", label: "Email", sortKey: "email", filterKey: "email", defaultVisible: false, editable: false },
	{ id: "phone", label: "Phone", sortKey: "phone", filterKey: "phone", defaultVisible: false, editable: false },
	{ id: "school", label: "School", sortKey: "school", filterKey: "school", defaultVisible: false, editable: false },
];

export const DEFAULT_VISIBLE_COLUMN_IDS: ColumnId[] = [
	"firstName", "lastName", "subjects", "year", "hourlyRate", "status",
];
