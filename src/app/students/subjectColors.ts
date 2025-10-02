"use client";

export const DEFAULT_SUBJECT_COLORS = {
  "Math": "bg-blue-100 text-blue-800",
  "English": "bg-green-100 text-green-800", 
  "Science": "bg-purple-100 text-purple-800",
  "Physics": "bg-indigo-100 text-indigo-800",
  "Chemistry": "bg-pink-100 text-pink-800",
  "Biology": "bg-emerald-100 text-emerald-800",
  "History": "bg-amber-100 text-amber-800",
  "Geography": "bg-teal-100 text-teal-800",
  "Art": "bg-rose-100 text-rose-800",
  "Music": "bg-violet-100 text-violet-800",
  "PE": "bg-orange-100 text-orange-800",
  "Computer Science": "bg-cyan-100 text-cyan-800",
  "Economics": "bg-lime-100 text-lime-800",
  "Psychology": "bg-fuchsia-100 text-fuchsia-800",
  "Spanish": "bg-red-100 text-red-800",
  "French": "bg-blue-100 text-blue-800",
  "German": "bg-yellow-100 text-yellow-800",
  "Chinese": "bg-gray-100 text-gray-800",
  "Japanese": "bg-slate-100 text-slate-800",
  "Latin": "bg-stone-100 text-stone-800",
  "Philosophy": "bg-zinc-100 text-zinc-800",
  "Politics": "bg-neutral-100 text-neutral-800",
  "Sociology": "bg-sky-100 text-sky-800",
  "Statistics": "bg-indigo-100 text-indigo-800"
};

export const COLOR_OPTIONS = [
  { name: "Blue", classes: "bg-blue-100 text-blue-800", preview: "bg-blue-100" },
  { name: "Green", classes: "bg-green-100 text-green-800", preview: "bg-green-100" },
  { name: "Purple", classes: "bg-purple-100 text-purple-800", preview: "bg-purple-100" },
  { name: "Pink", classes: "bg-pink-100 text-pink-800", preview: "bg-pink-100" },
  { name: "Indigo", classes: "bg-indigo-100 text-indigo-800", preview: "bg-indigo-100" },
  { name: "Emerald", classes: "bg-emerald-100 text-emerald-800", preview: "bg-emerald-100" },
  { name: "Amber", classes: "bg-amber-100 text-amber-800", preview: "bg-amber-100" },
  { name: "Teal", classes: "bg-teal-100 text-teal-800", preview: "bg-teal-100" },
  { name: "Rose", classes: "bg-rose-100 text-rose-800", preview: "bg-rose-100" },
  { name: "Violet", classes: "bg-violet-100 text-violet-800", preview: "bg-violet-100" },
  { name: "Orange", classes: "bg-orange-100 text-orange-800", preview: "bg-orange-100" },
  { name: "Cyan", classes: "bg-cyan-100 text-cyan-800", preview: "bg-cyan-100" },
  { name: "Red", classes: "bg-red-100 text-red-800", preview: "bg-red-100" },
  { name: "Yellow", classes: "bg-yellow-100 text-yellow-800", preview: "bg-yellow-100" },
  { name: "Gray", classes: "bg-gray-100 text-gray-800", preview: "bg-gray-100" }
];

// Get custom subject colors from localStorage
export const getCustomSubjectColors = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem('customSubjectColors');
  return stored ? JSON.parse(stored) : {};
};

// Save custom subject colors to localStorage
export const saveCustomSubjectColors = (colors: Record<string, string>) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('customSubjectColors', JSON.stringify(colors));
};

// Get color for a specific subject (custom or default)
export const getSubjectColor = (subject: string): string => {
  const trimmedSubject = subject.trim();
  const customColors = getCustomSubjectColors();
  
  // Check custom colors first
  if (customColors[trimmedSubject]) {
    return customColors[trimmedSubject];
  }
  
  // Fall back to default colors
  return DEFAULT_SUBJECT_COLORS[trimmedSubject as keyof typeof DEFAULT_SUBJECT_COLORS] || "bg-gray-100 text-gray-800";
};

// Set custom color for a subject
export const setSubjectColor = (subject: string, colorClasses: string) => {
  const customColors = getCustomSubjectColors();
  customColors[subject.trim()] = colorClasses;
  saveCustomSubjectColors(customColors);
};
