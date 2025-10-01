"use client";

import { useState, useRef, useEffect } from "react";

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  isCompleted: boolean;
  student: {
    firstName: string;
    lastName: string;
  };
}

interface CalendarGridProps {
  meetings: Meeting[];
  currentYear: number;
  currentMonth: number;
  onDateSelect?: (date: Date) => void;
  isFormOpen?: boolean;
}

export default function CalendarGrid({ meetings, currentYear, currentMonth, onDateSelect, isFormOpen }: CalendarGridProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const getDayMeetings = (date: Date) => {
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.startTime);
      return meetingDate.getDate() === date.getDate() && 
             meetingDate.getMonth() === date.getMonth() &&
             meetingDate.getFullYear() === date.getFullYear();
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleDateClick = (date: Date, event: React.MouseEvent) => {
    // If form is open and we have a date selection callback, use that instead of showing popup
    if (isFormOpen && onDateSelect) {
      onDateSelect(date);
      return;
    }
    
    setSelectedDate(date);
    
    // Calculate position relative to the grid container
    const rect = event.currentTarget.getBoundingClientRect();
    const gridRect = gridRef.current?.getBoundingClientRect();
    
    if (gridRect) {
      // Position popup so its bottom edge is above the top edge of the date box
      // Use a larger spacing to ensure clear separation
      const spacing = 20; // Gap between popup bottom and date box top
      
      // Calculate the desired position (popup bottom above date box top)
      const desiredY = rect.top - gridRect.top - spacing;
      
      // Only clamp to 0 if the popup would go completely off-screen
      // Otherwise, allow some negative positioning to maintain spacing
      const finalY = Math.max(-50, desiredY); // Allow popup to go slightly above viewport
      
      setPopupPosition({
        x: rect.left - gridRect.left + rect.width / 2,
        y: finalY
      });
      
      // Trigger animation after a brief delay to allow position to be set
      setTimeout(() => {
        setIsPopupVisible(true);
      }, 10);
    }
  };

  const closeModal = () => {
    setIsPopupVisible(false);
    // Wait for animation to complete before clearing state
    setTimeout(() => {
      setSelectedDate(null);
      setPopupPosition(null);
    }, 200);
  };

  // Add click-outside-to-close functionality
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedDate && popupPosition) {
        const target = event.target as Element;
        // Check if click is outside the popup and not on a date cell
        if (!target.closest('.calendar-popup') && !target.closest('.date-cell')) {
          closeModal();
        }
      }
    };

    if (selectedDate) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [selectedDate, popupPosition]);

  return (
    <div className="relative" ref={gridRef}>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }, (_, i) => {
          // Calculate the correct date for each cell
          const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
          const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const date = new Date(currentYear, currentMonth, i - firstDayOfWeek + 1);
          
          const dayMeetings = getDayMeetings(date);
          const isCurrentMonth = date.getMonth() === currentMonth;
          const isToday = date.toDateString() === new Date().toDateString();
          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

          return (
            <div
              key={i}
              onClick={(e) => handleDateClick(date, e)}
              className={`date-cell min-h-[100px] p-2 rounded-lg border cursor-pointer transition-all ${
                isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
              } ${isToday ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : ''} ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              } hover:shadow-md hover:scale-105`}
            >
              <div className={`text-sm font-medium mb-2 ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {dayMeetings.slice(0, 3).map((meeting) => (
                  <div
                    key={meeting.id}
                    className="text-xs p-1.5 bg-blue-100 text-blue-800 rounded-md truncate hover:bg-blue-200 transition-colors"
                    title={`${meeting.title} with ${meeting.student.firstName} ${meeting.student.lastName}`}
                  >
                    {meeting.title}
                  </div>
                ))}
                {dayMeetings.length > 3 && (
                  <div className="text-xs text-gray-500 font-medium">
                    +{dayMeetings.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Popup for selected date */}
      {selectedDate && popupPosition && (
        <div 
          className={`calendar-popup absolute bg-white rounded-lg shadow-lg border p-4 max-w-sm w-80 z-50 transition-all duration-200 ease-out ${
            isPopupVisible 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-95 translate-y-2'
          }`}
          style={{
            left: `${popupPosition.x}px`,
            top: `${popupPosition.y}px`, // Use calculated position directly
            transform: 'translateX(-50%) translateY(-100%)' // Position popup so its bottom is at the calculated position
          }}
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold text-gray-900">
              {formatDate(selectedDate)}
            </h3>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            {getDayMeetings(selectedDate).length > 0 ? (
              getDayMeetings(selectedDate).map((meeting) => (
                <div
                  key={meeting.id}
                  className="border rounded-lg p-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">{meeting.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      meeting.isCompleted 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {meeting.isCompleted ? 'Completed' : 'Upcoming'}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatTime(new Date(meeting.startTime))} - {formatTime(new Date(meeting.endTime))}
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 mb-2">
                    <div className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {meeting.student.firstName} {meeting.student.lastName}
                    </div>
                  </div>

                  {meeting.description && (
                    <div className="text-xs text-gray-600">
                      <p className="mt-1">{meeting.description}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <div className="text-gray-400 mb-3">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Nothing scheduled today</h4>
                <p className="text-xs text-gray-500">This day is free! Perfect for planning or taking a break.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
