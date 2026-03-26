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
  status: "SCHEDULED" | "IN_PROGRESS" | "CANCELLED" | "NEEDS_REVIEW" | "COMPLETED";
  lessonPlan: string | null;
  homework: string | null;
  lessonSummary: string | null;
  nextLessonPrep: string | null;
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
  accountTab: React.ReactNode;
  initialTab?: "profile" | "lessons" | "notes" | "account";
}

interface Note {
  id: string;
  content: string;
  isEditing: boolean;
}

export default function StudentTabs({
  children,
  meetings,
  teachingPeriods,
  studentName,
  studentSubjects,
  accountTab,
  initialTab = "profile",
}: StudentTabsProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "lessons" | "notes" | "account">(initialTab);
  const [notes, setNotes] = useState<Note[]>([]);

  const addNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      content: '',
      isEditing: true
    };
    setNotes([...notes, newNote]);
  };

  const updateNote = (id: string, content: string) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, content } : note
    ));
  };

  const toggleEdit = (id: string) => {
    setNotes(notes.map(note => 
      note.id === id ? { ...note, isEditing: !note.isEditing } : note
    ));
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('lessons')}
            className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
              activeTab === 'lessons'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Lessons
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
              activeTab === 'notes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Notes
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
              activeTab === 'account'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Account
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
                <LessonLogs
                  meetings={meetings}
                  terms={teachingPeriods.filter((p) => p.type === "term")}
                />
              </div>
            )}
            
            {activeTab === 'notes' && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Student Notes</h4>
                  <button 
                    onClick={addNote}
                    className="inline-flex items-center px-6 py-3 bg-[#3D4756] text-white rounded-2xl font-semibold text-base hover:bg-[#2A3441] transition-colors duration-200 cursor-pointer"
                  >
                    Add Note
                  </button>
                </div>
                
                {notes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No notes yet. Click &quot;Add Note&quot; to create your first note.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                        {note.isEditing ? (
                          <div className="space-y-3">
                            <textarea
                              value={note.content}
                              onChange={(e) => updateNote(note.id, e.target.value)}
                              placeholder="Enter your note here..."
                              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              rows={3}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => toggleEdit(note.id)}
                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => deleteNote(note.id)}
                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="text-gray-800 whitespace-pre-wrap">
                              {note.content || <span className="text-gray-400 italic">Empty note</span>}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => toggleEdit(note.id)}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteNote(note.id)}
                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "account" && (
              <div className="space-y-6">{accountTab}</div>
            )}
      </div>
    </div>
  );
}
