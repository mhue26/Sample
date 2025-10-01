"use client";

interface SubjectsDisplayProps {
  subjects: string;
}

const SUBJECT_COLORS = {
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

function getSubjectColor(subject: string): string {
  const trimmedSubject = subject.trim();
  return SUBJECT_COLORS[trimmedSubject as keyof typeof SUBJECT_COLORS] || "bg-gray-100 text-gray-800";
}

export default function SubjectsDisplay({ subjects }: SubjectsDisplayProps) {
  if (!subjects || subjects.trim() === "") {
    return <span className="text-gray-500">—</span>;
  }

  const subjectList = subjects.split(",").map(s => s.trim()).filter(s => s);

  return (
    <div className="flex flex-wrap gap-1">
      {subjectList.map((subject, index) => (
        <span
          key={index}
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSubjectColor(subject)}`}
        >
          {subject}
        </span>
      ))}
    </div>
  );
}
