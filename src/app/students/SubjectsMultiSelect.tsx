"use client";

import { useState, useRef, useEffect } from "react";

interface SubjectsMultiSelectProps {
  name: string;
  defaultValue?: string;
  required?: boolean;
}

const COMMON_SUBJECTS = [
  "Math", "English", "Science", "Physics", "Chemistry", "Biology",
  "History", "Geography", "Art", "Music", "PE", "Computer Science",
  "Economics", "Psychology", "Spanish", "French", "German", "Chinese",
  "Japanese", "Latin", "Philosophy", "Politics", "Sociology", "Statistics"
];

// Store available subjects in localStorage
const getAvailableSubjects = (): string[] => {
  if (typeof window === 'undefined') return COMMON_SUBJECTS;
  const stored = localStorage.getItem('availableSubjects');
  return stored ? JSON.parse(stored) : COMMON_SUBJECTS;
};

const saveAvailableSubjects = (subjects: string[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('availableSubjects', JSON.stringify(subjects));
};

export default function SubjectsMultiSelect({ name, defaultValue = "", required = false }: SubjectsMultiSelectProps) {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    defaultValue ? defaultValue.split(",").map(s => s.trim()).filter(s => s) : []
  );
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize available subjects from localStorage
  useEffect(() => {
    setAvailableSubjects(getAvailableSubjects());
  }, []);

  const filteredSubjects = availableSubjects.filter(subject =>
    subject.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedSubjects.includes(subject)
  );

  const toggleSubject = (subject: string) => {
    setSelectedSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject]
    );
  };

  const deleteAvailableSubject = (subject: string) => {
    const updatedSubjects = availableSubjects.filter(s => s !== subject);
    setAvailableSubjects(updatedSubjects);
    saveAvailableSubjects(updatedSubjects);
  };

  const removeSubject = (subject: string) => {
    setSelectedSubjects(prev => prev.filter(s => s !== subject));
  };

  const addCustomSubject = () => {
    if (searchTerm.trim() && !selectedSubjects.includes(searchTerm.trim())) {
      setSelectedSubjects(prev => [...prev, searchTerm.trim()]);
      setSearchTerm("");
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={name}
        value={selectedSubjects.join(",")}
        required={required}
      />
      
      {/* Selected subjects display */}
      <div className="min-h-[42px] border border-gray-300 rounded-md p-2 flex flex-wrap gap-1 cursor-pointer"
           onClick={() => setIsOpen(!isOpen)}>
        {selectedSubjects.length === 0 ? (
          <span className="text-gray-500 text-sm">Select subjects...</span>
        ) : (
          selectedSubjects.map((subject) => (
            <span
              key={subject}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              {subject}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSubject(subject);
                }}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))
        )}
        <div className="ml-auto text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          {/* Search input */}
          <div className="p-2 border-b">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search or add custom subject..."
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {searchTerm && !COMMON_SUBJECTS.includes(searchTerm) && (
              <button
                type="button"
                onClick={addCustomSubject}
                className="mt-1 text-xs text-blue-600 hover:text-blue-800"
              >
                Add "{searchTerm}"
              </button>
            )}
          </div>

          {/* Subject options */}
          <div className="py-1">
            {filteredSubjects.map((subject) => (
              <div
                key={subject}
                className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 group"
              >
                <button
                  type="button"
                  onClick={() => toggleSubject(subject)}
                  className="flex-1 text-left"
                >
                  {subject}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAvailableSubject(subject);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity ml-2"
                  title="Delete subject from available list"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {filteredSubjects.length === 0 && searchTerm && (
              <div className="px-3 py-2 text-sm text-gray-500">
                No subjects found. Type to add a custom subject.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
