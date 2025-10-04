"use client";

import { useState } from "react";
import Link from "next/link";

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface Class {
  id: number;
  name: string;
  description: string | null;
  color: string;
  createdAt: Date;
  students: Student[];
}

interface ClassesClientProps {
  classes: Class[];
}

export default function ClassesClient({ classes }: ClassesClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  if (classes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No classes yet</h3>
        <p className="text-gray-500 mb-4">Create your first class to group students together.</p>
        <Link 
          href="/classes/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Class
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex justify-end">
        <div className="flex border rounded-md">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 text-sm font-medium rounded-l-md ${
              viewMode === 'grid'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 text-sm font-medium rounded-r-md ${
              viewMode === 'list'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Classes Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((classItem) => (
            <div key={classItem.id} className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: classItem.color }}
                  ></div>
                  <h3 className="text-lg font-medium text-gray-900">{classItem.name}</h3>
                </div>
                <Link 
                  href={`/classes/${classItem.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View
                </Link>
              </div>
              
              {classItem.description && (
                <p className="text-gray-600 text-sm mb-4">{classItem.description}</p>
              )}
              
              <div className="space-y-2">
                <div className="text-sm text-gray-500">
                  {classItem.students.length} student{classItem.students.length !== 1 ? 's' : ''}
                </div>
                <div className="text-xs text-gray-400">
                  Created {new Date(classItem.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {classes.map((classItem) => (
                <tr key={classItem.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: classItem.color }}
                      ></div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{classItem.name}</div>
                        {classItem.description && (
                          <div className="text-sm text-gray-500">{classItem.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {classItem.students.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(classItem.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link 
                      href={`/classes/${classItem.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
