"use client";

import { useState } from "react";

interface Class {
  id: number;
  name: string;
  description: string | null;
  color: string;
}

interface ClassSelectorProps {
  classes: Class[];
  selectedClassId?: number | null;
  name?: string;
}

export default function ClassSelector({ classes, selectedClassId, name = "classId" }: ClassSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentClassId, setCurrentClassId] = useState<number | null>(selectedClassId || null);

  const selectedClass = classes.find(c => c.id === currentClassId);

  return (
    <div className="relative">
      <label className="block text-sm text-gray-700 mb-2">Class</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full border rounded-md px-3 py-2 text-left flex items-center justify-between bg-white"
        >
          <div className="flex items-center gap-2">
            {selectedClass ? (
              <>
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: selectedClass.color }}
                ></div>
                <span>{selectedClass.name}</span>
              </>
            ) : (
              <span className="text-gray-500">Select a class (optional)</span>
            )}
          </div>
          <svg 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  setCurrentClassId(null);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
              >
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <span className="text-gray-500">No class</span>
              </button>
              {classes.map((classItem) => (
                <button
                  key={classItem.id}
                  type="button"
                  onClick={() => {
                    setCurrentClassId(classItem.id);
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: classItem.color }}
                  ></div>
                  <div>
                    <div className="font-medium">{classItem.name}</div>
                    {classItem.description && (
                      <div className="text-sm text-gray-500">{classItem.description}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Hidden input for form submission */}
      <input 
        type="hidden" 
        name={name} 
        value={currentClassId || ""} 
      />
    </div>
  );
}
