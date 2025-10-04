"use client";

import { useState, useMemo, useEffect, useRef } from "react";

interface Meeting {
  id: number;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TeachingPeriod {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  year: number;
  isActive: boolean;
  color: string;
  type: 'term' | 'holiday';
}

interface LessonBreakdownProps {
  meetings: Meeting[];
  teachingPeriods: TeachingPeriod[];
  studentName: string;
  studentSubjects: string;
}

interface ActiveFilter {
  id: string;
  type: 'period' | 'subject';
  value: string;
  label: string;
}

export default function LessonBreakdown({ meetings, teachingPeriods, studentName, studentSubjects }: LessonBreakdownProps) {
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [filterType, setFilterType] = useState<'period' | 'subject' | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [chartType, setChartType] = useState<'pie' | 'column'>('pie');
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Helper functions for managing filters
  const addFilter = (type: 'period' | 'subject', value: string, label: string) => {
    const newFilter: ActiveFilter = {
      id: `${type}-${value}-${Date.now()}`,
      type,
      value,
      label
    };
    setActiveFilters(prev => [...prev, newFilter]);
  };

  const removeFilter = (filterId: string) => {
    setActiveFilters(prev => prev.filter(f => f.id !== filterId));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setSelectedPeriod('all');
    setSelectedSubject('all');
  };

  const handleAddPeriodFilter = () => {
    if (selectedPeriod !== 'all') {
      const period = teachingPeriods.find(p => p.id.toString() === selectedPeriod);
      if (period) {
        addFilter('period', selectedPeriod, `${period.name} (${period.year})`);
        setSelectedPeriod('all');
      }
    }
  };

  const handleAddSubjectFilter = () => {
    if (selectedSubject !== 'all') {
      addFilter('subject', selectedSubject, selectedSubject);
      setSelectedSubject('all');
    }
  };

  // Parse subjects from the student's subjects string
  const subjects = useMemo(() => {
    if (!studentSubjects) return [];
    return studentSubjects.split(',').map(s => s.trim()).filter(s => s.length > 0);
  }, [studentSubjects]);

  // Filter meetings based on active filters
  const filteredMeetings = useMemo(() => {
    if (activeFilters.length === 0) {
      return meetings;
    }

    return meetings.filter(meeting => {
      return activeFilters.every(filter => {
        if (filter.type === 'period') {
          if (filter.value === 'all') return true;
          
          const period = teachingPeriods.find(p => p.id.toString() === filter.value);
          if (!period) return true;

          const periodStart = new Date(period.startDate);
          const periodEnd = new Date(period.endDate);
          const meetingDate = new Date(meeting.startTime);
          
          return meetingDate >= periodStart && meetingDate <= periodEnd;
        } else if (filter.type === 'subject') {
          if (filter.value === 'all') return true;

          // Check if the meeting title or description contains the selected subject
          const titleMatch = meeting.title.toLowerCase().includes(filter.value.toLowerCase());
          const descriptionMatch = meeting.description?.toLowerCase().includes(filter.value.toLowerCase());
          
          // Also check for common subject variations
          const subjectVariations = {
            'math': ['mathematics', 'maths', 'math'],
            'english': ['english', 'literature', 'language'],
            'science': ['science', 'physics', 'chemistry', 'biology'],
            'chemistry': ['chemistry', 'chem'],
            'physics': ['physics', 'phys'],
            'biology': ['biology', 'bio'],
            'history': ['history', 'hist'],
            'geography': ['geography', 'geo'],
            'art': ['art', 'arts', 'drawing', 'painting'],
            'music': ['music', 'musical'],
            'pe': ['pe', 'physical education', 'sport', 'sports'],
            'drama': ['drama', 'theatre', 'theater'],
            'computing': ['computing', 'computer science', 'it', 'ict']
          };
          
          const normalizedSubject = filter.value.toLowerCase();
          let variationMatch = false;
          
          if (subjectVariations[normalizedSubject as keyof typeof subjectVariations]) {
            const variations = subjectVariations[normalizedSubject as keyof typeof subjectVariations];
            variationMatch = variations.some(variation => 
              meeting.title.toLowerCase().includes(variation) || 
              meeting.description?.toLowerCase().includes(variation)
            );
          }
          
          return titleMatch || descriptionMatch || variationMatch;
        }
        
        return true;
      });
    });
  }, [meetings, teachingPeriods, activeFilters]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalLessons = filteredMeetings.length;
    const completedLessons = filteredMeetings.filter(m => m.isCompleted).length;
    const cancelledLessons = filteredMeetings.filter(m => {
      // Check if the lesson title or description contains cancellation indicators
      const title = m.title.toLowerCase();
      const description = m.description?.toLowerCase() || '';
      return title.includes('cancelled') || title.includes('canceled') || 
             description.includes('cancelled') || description.includes('canceled');
    }).length;
    const upcomingLessons = filteredMeetings.filter(m => !m.isCompleted && new Date(m.startTime) > new Date()).length;
    const pastLessons = filteredMeetings.filter(m => m.isCompleted || new Date(m.startTime) < new Date()).length;
    
    // Calculate total hours
    const totalHours = filteredMeetings.reduce((total, meeting) => {
      const duration = (new Date(meeting.endTime).getTime() - new Date(meeting.startTime).getTime()) / (1000 * 60 * 60);
      return total + duration;
    }, 0);

    // Calculate average lesson duration
    const avgDuration = totalLessons > 0 ? totalHours / totalLessons : 0;

    return {
      totalLessons,
      completedLessons,
      cancelledLessons,
      upcomingLessons,
      pastLessons,
      totalHours,
      avgDuration
    };
  }, [filteredMeetings]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDuration = (startTime: Date, endTime: Date) => {
    const duration = (new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60 * 60);
    return `${duration.toFixed(1)}h`;
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium">Lesson Breakdown</h3>
        
        {/* Filter Button */}
        <div className="relative" ref={filterMenuRef}>
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Filter
          </button>

          {/* Filter Menu */}
          {showFilterMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              <div className="py-1">
                <button
                  onClick={() => {
                    setFilterType('period');
                    setShowFilterMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Teaching Period
                </button>
                <button
                  onClick={() => {
                    setFilterType('subject');
                    setShowFilterMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Subject
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-blue-800">Active Filters:</span>
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <div
                key={filter.id}
                className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                <span className="font-medium">
                  {filter.type === 'period' ? 'Period' : 'Subject'}:
                </span>
                <span>{filter.label}</span>
                <button
                  onClick={() => removeFilter(filter.id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Filter - Only show when a specific filter type is selected */}
      {filterType && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">
              Add {filterType === 'period' ? 'Teaching Period' : 'Subject'} Filter:
            </span>
            
            {filterType === 'period' ? (
              <>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Select period</option>
                  {teachingPeriods.map((period) => (
                    <option key={`${period.type}-${period.id}`} value={period.id.toString()}>
                      {period.name} ({period.year})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddPeriodFilter}
                  disabled={selectedPeriod === 'all'}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </>
            ) : (
              <>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Select subject</option>
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddSubjectFilter}
                  disabled={selectedSubject === 'all'}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </>
            )}
            
            <button
              onClick={() => {
                setFilterType(null);
                setSelectedPeriod('all');
                setSelectedSubject('all');
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Statistics with Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Statistics Cards */}
        <div className="space-y-4">
          {/* First row: Completed and Completed Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.completedLessons}</div>
              <div className="text-sm text-green-800">Completed</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{stats.totalHours.toFixed(1)}h</div>
              <div className="text-sm text-gray-800">Completed Hours</div>
            </div>
          </div>
          
          {/* Second row: Cancelled and Upcoming */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.cancelledLessons}</div>
              <div className="text-sm text-red-800">Cancelled</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.upcomingLessons}</div>
              <div className="text-sm text-orange-800">Upcoming</div>
            </div>
          </div>
          
          {/* Third row: Total Lessons */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totalLessons}</div>
              <div className="text-sm text-blue-800">Total Lessons</div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Visualization</h4>
            <div className="flex gap-2">
              <button
                onClick={() => setChartType('pie')}
                className={`p-2 rounded-md transition-colors ${
                  chartType === 'pie'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Pie Chart"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </button>
              <button
                onClick={() => setChartType('column')}
                className={`p-2 rounded-md transition-colors ${
                  chartType === 'column'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Column Chart"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="h-64 flex items-center justify-center">
            {chartType === 'pie' ? (
              <div className="text-center">
                <div className="w-48 h-48 mx-auto mb-4 relative">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Pie chart segments */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="20"
                      strokeDasharray={`${(stats.completedLessons / stats.totalLessons) * 251.2} 251.2`}
                      transform="rotate(-90 50 50)"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="20"
                      strokeDasharray={`${(stats.cancelledLessons / stats.totalLessons) * 251.2} 251.2`}
                      strokeDashoffset={`-${(stats.completedLessons / stats.totalLessons) * 251.2}`}
                      transform="rotate(-90 50 50)"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="20"
                      strokeDasharray={`${(stats.upcomingLessons / stats.totalLessons) * 251.2} 251.2`}
                      strokeDashoffset={`-${((stats.completedLessons + stats.cancelledLessons) / stats.totalLessons) * 251.2}`}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                </div>
                <div className="text-sm text-gray-600">Lesson Distribution</div>
              </div>
            ) : (
              <div className="w-full h-full flex items-end justify-center gap-4">
                {/* Column chart bars */}
                <div className="flex flex-col items-center">
                  <div 
                    className="bg-green-500 w-12 rounded-t"
                    style={{ height: `${(stats.completedLessons / stats.totalLessons) * 200}px` }}
                  ></div>
                  <div className="text-xs text-gray-600 mt-2">Completed</div>
                  <div className="text-xs font-medium">{stats.completedLessons}</div>
                </div>
                <div className="flex flex-col items-center">
                  <div 
                    className="bg-red-500 w-12 rounded-t"
                    style={{ height: `${(stats.cancelledLessons / stats.totalLessons) * 200}px` }}
                  ></div>
                  <div className="text-xs text-gray-600 mt-2">Cancelled</div>
                  <div className="text-xs font-medium">{stats.cancelledLessons}</div>
                </div>
                <div className="flex flex-col items-center">
                  <div 
                    className="bg-orange-500 w-12 rounded-t"
                    style={{ height: `${(stats.upcomingLessons / stats.totalLessons) * 200}px` }}
                  ></div>
                  <div className="text-xs text-gray-600 mt-2">Upcoming</div>
                  <div className="text-xs font-medium">{stats.upcomingLessons}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
}
