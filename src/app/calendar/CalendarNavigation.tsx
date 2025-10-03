"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TeachingPeriodsModal from "./TermsHolidaysModal";
import { useModal } from "../contexts/ModalContext";

interface CalendarNavigationProps {
  onScheduleClick?: () => void;
  userId?: string;
}

export default function CalendarNavigation({ onScheduleClick, userId }: CalendarNavigationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setIsModalOpen } = useModal();
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => {
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    if (month && year) {
      return new Date(parseInt(year), parseInt(month) - 1);
    }
    return new Date();
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
    
    // Update URL with new month/year without scrolling
    const params = new URLSearchParams(searchParams);
    params.set('month', (newDate.getMonth() + 1).toString());
    params.set('year', newDate.getFullYear().toString());
    router.replace(`/calendar?${params.toString()}`, { scroll: false });
  };


  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <h3 className="text-lg font-medium">
          {currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => {
            setShowTermsModal(true);
            setIsModalOpen(true);
          }}
          className="p-1 text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
          title="Customise"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>
      
      <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                navigateMonth('prev');
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  e.preventDefault();
                }
              }}
              className="p-2 rounded-md border hover:bg-gray-50 transition-colors"
              title="Previous month"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                navigateMonth('next');
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  e.preventDefault();
                }
              }}
              className="p-2 rounded-md border hover:bg-gray-50 transition-colors"
              title="Next month"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
        
        {onScheduleClick && (
          <button
            onClick={onScheduleClick}
            className="ml-4 rounded-md bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700"
          >
            Schedule
          </button>
        )}
      </div>

      {userId && (
        <TeachingPeriodsModal
          isOpen={showTermsModal}
          onClose={() => {
            setShowTermsModal(false);
            setIsModalOpen(false);
          }}
          userId={userId}
        />
      )}
    </div>
  );
}
