"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";

interface ArchiveButtonProps {
  studentId: number;
}

export default function ArchiveButton({ studentId }: ArchiveButtonProps) {
  const router = useRouter();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const handleArchive = async () => {
    try {
      const response = await fetch(`/api/students/${studentId}/archive`, {
        method: 'POST',
      });
      if (response.ok) {
        router.push('/students');
      }
    } catch (error) {
      console.error('Failed to archive student:', error);
    }
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node) && 
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowConfirmation(false);
      }
    };

    if (showConfirmation) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showConfirmation]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setShowConfirmation(true)}
        className="rounded-md bg-yellow-600 text-white px-4 py-2 text-sm hover:bg-yellow-700"
      >
        Archive Student
      </button>
      
      {showConfirmation && (
        <div
          ref={popupRef}
          className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-[280px]"
        >
          <div className="text-sm text-gray-700 mb-3">
            Are you sure you want to archive this student? This will hide them from the main student list.
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleArchive}
              className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
            >
              Yes, Archive
            </button>
            <button
              onClick={() => setShowConfirmation(false)}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
