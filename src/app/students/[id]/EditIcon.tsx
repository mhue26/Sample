"use client";

import { useState } from "react";
import Link from "next/link";

interface EditIconProps {
  studentId: number;
}

export default function EditIcon({ studentId }: EditIconProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <Link 
        href={`/students/${studentId}/edit`}
        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </Link>
      
      {showTooltip && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg z-50 whitespace-nowrap">
          Edit
        </div>
      )}
    </div>
  );
}
