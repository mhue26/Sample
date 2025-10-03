"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import CalendarNavigation from "./CalendarNavigation";
import CalendarGrid from "./CalendarGrid";

interface Student {
  id: number;
  firstName: string;
  lastName: string;
}

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  isCompleted: boolean;
  student: Student;
}

interface CalendarClientProps {
  meetings: Meeting[];
  upcomingMeetings: Meeting[];
  currentYear: number;
  currentMonth: number;
  students: Student[];
  createMeeting: (formData: FormData) => Promise<void>;
  userId: string;
}

export default function CalendarClient({ 
  meetings, 
  upcomingMeetings, 
  currentYear, 
  currentMonth, 
  students,
  createMeeting,
  userId
}: CalendarClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('week');
  const [currentTerm, setCurrentTerm] = useState<any>(null);
  const [currentWeek, setCurrentWeek] = useState<number | null>(null);
  const [teachingPeriods, setTeachingPeriods] = useState<any[]>([]);

  const loadCurrentTerm = async () => {
    try {
      const [termsResponse, holidaysResponse] = await Promise.all([
        fetch(`/api/terms?userId=${userId}`),
        fetch(`/api/holidays?userId=${userId}`)
      ]);
      
      const terms = termsResponse.ok ? await termsResponse.json() : [];
      const holidays = holidaysResponse.ok ? await holidaysResponse.json() : [];
      
      // Combine all teaching periods
      const allPeriods = [
        ...terms.map((term: any) => ({ ...term, type: 'term' as const })),
        ...holidays.map((holiday: any) => ({ ...holiday, type: 'holiday' as const }))
      ];
      
      setTeachingPeriods(allPeriods);
      
      const today = new Date();
      
      // Find current active term
      const activeTerm = terms.find((term: any) => {
        const startDate = new Date(term.startDate);
        const endDate = new Date(term.endDate);
        return today >= startDate && today <= endDate && term.isActive;
      });
      
      if (activeTerm) {
        setCurrentTerm(activeTerm);
        // Calculate current week
        const startDate = new Date(activeTerm.startDate);
        const diffTime = today.getTime() - startDate.getTime();
        const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
        setCurrentWeek(Math.max(1, diffWeeks));
      }
    } catch (error) {
      console.error('Error loading current term:', error);
    }
  };

  useEffect(() => {
    loadCurrentTerm();
  }, [userId]);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatMeetingDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const meetingDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    
    if (meetingDate.getTime() === todayDate.getTime()) {
      return "Today";
    } else if (meetingDate.getTime() === tomorrowDate.getTime()) {
      return "Tomorrow";
    } else {
      return new Date(date).toLocaleDateString('en-GB', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const handleDateSelect = (date: Date) => {
    // Format date as YYYY-MM-DD for the input field
    const formattedDate = date.toISOString().split('T')[0];
    setSelectedDate(formattedDate);
  };

  const getFilteredMeetings = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let endDate: Date;
    
    switch (timeRange) {
      case 'today':
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'tomorrow':
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 2);
        break;
      case 'week':
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'month':
        endDate = new Date(today);
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      default:
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 7);
    }
    
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.startTime);
      return meetingDate >= today && meetingDate < endDate;
    });
  };

  return (
    <div className="space-y-6 pt-8 font-sans" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Calendar</h2>
        {currentTerm && (
          <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
            <span className="font-medium">{currentTerm.name}</span>
            {currentWeek && (
              <span className="ml-2">• Week {currentWeek}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-6">
        {/* Main Calendar Content */}
        <div className={`transition-all duration-300 ${showForm ? 'w-[calc(100%-24rem)]' : 'w-full'}`}>
          {/* Upcoming Meetings */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Upcoming</h3>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
                <option value="week">Next Week</option>
                <option value="month">Next Month</option>
              </select>
            </div>
            {getFilteredMeetings().length === 0 ? (
              <p className="text-gray-500">No upcoming events scheduled.</p>
            ) : (
              <div className="space-y-3">
                {getFilteredMeetings().map((meeting) => (
                  <div key={meeting.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{meeting.title}</div>
                      <div className="text-sm text-gray-600">
                        with {meeting.student.firstName} {meeting.student.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatMeetingDate(new Date(meeting.startTime))} at {formatTime(new Date(meeting.startTime))}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      meeting.isCompleted 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {meeting.isCompleted ? 'Completed' : 'Scheduled'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Monthly Calendar View */}
          <div className="bg-white rounded-lg border p-6 mt-6">
            <CalendarNavigation onScheduleClick={() => setShowForm(!showForm)} userId={userId} />
            
            {/* Calendar Grid */}
            <CalendarGrid 
              meetings={meetings} 
              currentYear={currentYear} 
              currentMonth={currentMonth}
              onDateSelect={handleDateSelect}
              isFormOpen={showForm}
              teachingPeriods={teachingPeriods}
            />
          </div>
        </div>

        {/* Side Panel Form */}
        {showForm && (
          <div className="w-96 bg-white rounded-lg border p-6 h-fit transform transition-all duration-500 ease-out animate-in slide-in-from-right fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Schedule New Meeting</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form action={createMeeting} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="e.g., Piano Lesson, Math Tutoring"
                />
              </div>

              <div>
                <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
                  Student *
                </label>
                <select
                  id="studentId"
                  name="studentId"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="">Select a student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="meetingDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Date *
                </label>
                <input
                  type="date"
                  id="meetingDate"
                  name="meetingDate"
                  required
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Optional notes about this meeting..."
                />
              </div>

              {/* Repeat Options */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Repeat Options</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isRepeating"
                      name="isRepeating"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isRepeating" className="ml-2 block text-sm text-gray-700">
                      This is a repeating meeting
                    </label>
                  </div>

                  <div id="repeatOptions" className="space-y-3 hidden">
                    <div>
                      <label htmlFor="repeatType" className="block text-sm font-medium text-gray-700 mb-2">
                        Repeat
                      </label>
                      <select
                        id="repeatType"
                        name="repeatType"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Every 2 weeks</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="repeatCount" className="block text-sm font-medium text-gray-700 mb-2">
                        Number of occurrences
                      </label>
                      <input
                        type="number"
                        id="repeatCount"
                        name="repeatCount"
                        min="2"
                        max="52"
                        defaultValue="4"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isCompleted"
                  name="isCompleted"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isCompleted" className="ml-2 block text-sm text-gray-700">
                  Mark as completed
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
                >
                  Create Meeting
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>

            <script dangerouslySetInnerHTML={{
              __html: `
                document.addEventListener('DOMContentLoaded', function() {
                  const isRepeatingCheckbox = document.getElementById('isRepeating');
                  const repeatOptions = document.getElementById('repeatOptions');
                  const meetingDateInput = document.getElementById('meetingDate');
                  const startTimeInput = document.getElementById('startTime');
                  const endTimeInput = document.getElementById('endTime');
                  
                  // Handle repeating checkbox
                  if (isRepeatingCheckbox) {
                    isRepeatingCheckbox.addEventListener('change', function() {
                      if (this.checked) {
                        repeatOptions.classList.remove('hidden');
                      } else {
                        repeatOptions.classList.add('hidden');
                      }
                    });
                  }
                  
                  // Set default date to today if no date is selected
                  if (meetingDateInput && !meetingDateInput.value) {
                    const today = new Date();
                    const todayString = today.toISOString().split('T')[0];
                    meetingDateInput.value = todayString;
                  }
                  
                  // Set default times
                  if (startTimeInput) startTimeInput.value = '09:00';
                  if (endTimeInput) endTimeInput.value = '10:00';
                  
                  // Auto-update end time when start time changes
                  if (startTimeInput && endTimeInput) {
                    startTimeInput.addEventListener('change', function() {
                      const startTime = this.value;
                      if (startTime && !endTimeInput.value) {
                        const [hours, minutes] = startTime.split(':');
                        const startDate = new Date();
                        startDate.setHours(parseInt(hours), parseInt(minutes));
                        startDate.setHours(startDate.getHours() + 1); // Add 1 hour
                        const endTime = startDate.toTimeString().slice(0, 5);
                        endTimeInput.value = endTime;
                      }
                    });
                  }
                });
              `
            }} />
          </div>
        )}
      </div>
    </div>
  );
}

