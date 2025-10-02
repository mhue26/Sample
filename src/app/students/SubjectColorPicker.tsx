"use client";

import { useState } from 'react';
import { COLOR_OPTIONS, setSubjectColor, getSubjectColor } from './subjectColors';

interface SubjectColorPickerProps {
  subject: string;
  onColorChange?: () => void;
}

export default function SubjectColorPicker({ subject, onColorChange }: SubjectColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentColor = getSubjectColor(subject);

  const handleColorSelect = (colorClasses: string) => {
    setSubjectColor(subject, colorClasses);
    setIsOpen(false);
    if (onColorChange) {
      onColorChange();
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="ml-1 w-3 h-3 rounded-full border border-gray-300 hover:border-gray-400 flex-shrink-0"
        title="Change color"
      >
        <div className={`w-full h-full rounded-full ${currentColor.split(' ')[0]}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 p-2">
          <div className="grid grid-cols-5 gap-1">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color.name}
                type="button"
                onClick={() => handleColorSelect(color.classes)}
                className={`w-6 h-6 rounded-full border-2 ${color.preview} ${
                  currentColor === color.classes ? 'border-gray-800' : 'border-gray-300'
                } hover:border-gray-500`}
                title={color.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
