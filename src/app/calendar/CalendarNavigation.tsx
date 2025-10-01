"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CalendarNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    
    // Update URL with new month/year
    const params = new URLSearchParams(searchParams);
    params.set('month', (newDate.getMonth() + 1).toString());
    params.set('year', newDate.getFullYear().toString());
    router.push(`/calendar?${params.toString()}`);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    
    const params = new URLSearchParams(searchParams);
    params.set('month', (today.getMonth() + 1).toString());
    params.set('year', today.getFullYear().toString());
    router.push(`/calendar?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <h3 className="text-lg font-medium">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={goToToday}
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          Today
        </button>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 rounded-md border hover:bg-gray-50 transition-colors"
          title="Previous month"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 rounded-md border hover:bg-gray-50 transition-colors"
          title="Next month"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
