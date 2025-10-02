"use client";

import { useState, useRef, useEffect } from "react";
import { getSubjectColor } from './subjectColors';

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
  const [isClient, setIsClient] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize client-side rendering
  useEffect(() => {
    setIsClient(true);
    setAvailableSubjects(getAvailableSubjects());
  }, []);

  // Listen for color changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'customSubjectColors') {
        // Force re-render by updating selected subjects
        setSelectedSubjects(prev => [...prev]);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
    // Keep dropdown open for multiple selections
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
      // Keep dropdown open for multiple selections
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
      
      {/* Main input with selected subjects */}
      <div className="min-h-[42px] border border-gray-300 rounded-md p-2 flex flex-wrap gap-1 items-center">
        {selectedSubjects.map((subject, index) => (
          <span
            key={`${subject}-${index}`}
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isClient ? getSubjectColor(subject) : 'bg-gray-200 text-gray-800'}`}
          >
            {subject}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeSubject(subject);
              }}
              className="ml-1 hover:opacity-70"
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchTerm.trim()) {
              e.preventDefault();
              addCustomSubject();
            }
          }}
          placeholder={selectedSubjects.length === 0 ? "Select subjects..." : ""}
          className="flex-1 min-w-[120px] outline-none text-sm"
        />
        <div className="text-gray-400 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-hidden">
          {searchTerm && !COMMON_SUBJECTS.includes(searchTerm) && (
            <div className="p-2 border-b">
              <button
                type="button"
                onClick={addCustomSubject}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Add "{searchTerm}"
              </button>
            </div>
          )}

          {/* Subject options */}
          <div className="py-1 overflow-y-auto max-h-48 scrollbar-hide">
            {filteredSubjects.map((subject) => (
              <div
                key={subject}
                className="flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 group cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSubject(subject);
                }}
              >
                <span className="flex-1 text-left">
                  {subject}
                </span>
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
