"use client";

import { useState } from "react";
import LessonBreakdown from "./LessonBreakdown";
import LessonLogs from "./LessonLogs";

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

interface StudentTabsProps {
  children: React.ReactNode; // Profile content
  meetings: Meeting[];
  teachingPeriods: TeachingPeriod[];
  studentName: string;
  studentSubjects: string;
}

export default function StudentTabs({ children, meetings, teachingPeriods, studentName, studentSubjects }: StudentTabsProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'lessons' | 'notes'>('profile');

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('lessons')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'lessons'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Lessons
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'notes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Notes
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {children}
          </div>
        )}
        
            {activeTab === 'lessons' && (
              <div className="space-y-6">
                <LessonBreakdown 
                  meetings={meetings}
                  teachingPeriods={teachingPeriods}
                  studentName={studentName}
                  studentSubjects={studentSubjects}
                />
                <LessonLogs meetings={meetings} />
              </div>
            )}
            
            {activeTab === 'notes' && (
              <div className="bg-white rounded-lg border p-6">
                <h4 className="font-medium text-gray-900 mb-4">Student Notes</h4>
                <div className="text-center py-8 text-gray-500">
                  Notes feature coming soon...
                </div>
              </div>
            )}
      </div>
    </div>
  );
}
