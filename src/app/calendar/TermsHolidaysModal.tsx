"use client";

import { useState, useEffect } from "react";
import { useModal } from "../contexts/ModalContext";

interface TeachingPeriod {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  year: number;
  isActive: boolean;
  color: string;
  type: 'term' | 'holiday';
}

interface TeachingPeriodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function TeachingPeriodsModal({ isOpen, onClose, userId }: TeachingPeriodsModalProps) {
  const { setIsModalOpen } = useModal();
  const [teachingPeriods, setTeachingPeriods] = useState<TeachingPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<TeachingPeriod | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    year: new Date().getFullYear(),
    isActive: true,
    color: '#3B82F6',
    type: 'term' as 'term' | 'holiday'
  });

  useEffect(() => {
    if (isOpen) {
      setIsModalOpen(true);
      loadTeachingPeriods();
    } else {
      setIsModalOpen(false);
    }
  }, [isOpen, userId, setIsModalOpen]);

  const loadTeachingPeriods = async () => {
    try {
      console.log('Loading teaching periods...');
      const [termsResponse, holidaysResponse] = await Promise.all([
        fetch(`/api/terms?userId=${userId}`),
        fetch(`/api/holidays?userId=${userId}`)
      ]);
      
      const terms = termsResponse.ok ? await termsResponse.json() : [];
      const holidays = holidaysResponse.ok ? await holidaysResponse.json() : [];
      
      console.log('Loaded terms:', terms);
      console.log('Loaded holidays:', holidays);
      
      const allPeriods = [
        ...terms.map((term: any) => ({ ...term, type: 'term' as const })),
        ...holidays.map((holiday: any) => ({ ...holiday, type: 'holiday' as const }))
      ];
      
      console.log('All periods:', allPeriods);
      setTeachingPeriods(allPeriods);
    } catch (error) {
      console.error('Error loading teaching periods:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isEditing = editingPeriod !== null;
      const isTerm = formData.type === 'term';
      const endpoint = isTerm ? 'terms' : 'holidays';
      const url = isEditing ? `/api/${endpoint}/${editingPeriod.id}` : `/api/${endpoint}`;
      const method = isEditing ? 'PUT' : 'POST';
      
      const requestBody = {
        ...formData,
        userId,
        isActive: isTerm ? formData.isActive : true
      };
      
      console.log('Submitting form:', { formData, isEditing, isTerm, endpoint, url, method });
      console.log('Request body:', requestBody);
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        console.log('Success! Reloading teaching periods...');
        await loadTeachingPeriods();
        resetForm();
      } else {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        alert('Error saving teaching period: ' + errorText);
      }
    } catch (error) {
      console.error('Error saving teaching period:', error);
      alert('Error saving teaching period: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    console.log('Resetting form...');
    setFormData({
      name: '',
      startDate: '',
      endDate: '',
      year: new Date().getFullYear(),
      isActive: true,
      color: '#3B82F6',
      type: 'term'
    });
    setEditingPeriod(null);
    setShowForm(false);
    console.log('Form reset complete');
  };

  const handleEdit = (period: TeachingPeriod) => {
    setEditingPeriod(period);
    setFormData({
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      year: period.year,
      isActive: period.isActive,
      color: period.color,
      type: period.type
    });
    setShowForm(true);
  };

  const handleDelete = async (period: TeachingPeriod) => {
    if (!confirm('Are you sure you want to delete this teaching period?')) return;

    try {
      const endpoint = period.type === 'term' ? `/api/terms/${period.id}` : `/api/holidays/${period.id}`;
      const response = await fetch(endpoint, { method: 'DELETE' });
      
      if (response.ok) {
        await loadTeachingPeriods();
      }
    } catch (error) {
      console.error('Error deleting teaching period:', error);
    }
  };

  // Utility: format Date for <input type="date"> (yyyy-mm-dd)
  const toInputDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Open form prefilled to cover a detected gap
  const openGapForm = (gapStart: Date, gapEnd: Date) => {
    setEditingPeriod(null);
    setFormData({
      name: '',
      startDate: toInputDate(gapStart),
      endDate: toInputDate(gapEnd),
      year: gapStart.getFullYear(),
      isActive: true,
      color: '#3B82F6',
      type: 'term'
    });
    setShowForm(true);
  };

  // Keep the list ordered by start date
  const sortedPeriods = [...teachingPeriods].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  const getCurrentTerm = () => {
    const today = new Date();
    return teachingPeriods.find(period => {
      const startDate = new Date(period.startDate);
      const endDate = new Date(period.endDate);
      return period.type === 'term' && today >= startDate && today <= endDate && period.isActive;
    });
  };

  const getCurrentWeek = () => {
    const currentTerm = getCurrentTerm();
    if (!currentTerm) return null;

    const today = new Date();
    const startDate = new Date(currentTerm.startDate);
    const diffTime = today.getTime() - startDate.getTime();
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
    return Math.max(1, diffWeeks);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-500 ease-out">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 ease-out transform-gpu">
        <div className="flex items-center justify-between p-6 border-b animate-in fade-in slide-in-from-top-2 duration-700 delay-100">
          <h2 className="text-xl font-semibold">Teaching Periods</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
          {/* Current Status */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg animate-in fade-in duration-700 delay-300">
            <h3 className="font-medium text-blue-900 mb-2">Current Status</h3>
            {getCurrentTerm() ? (
              <div className="text-blue-800">
                <p><strong>Current Term:</strong> {getCurrentTerm()?.name}</p>
                <p><strong>Week:</strong> {getCurrentWeek()} of {Math.ceil((new Date(getCurrentTerm()!.endDate).getTime() - new Date(getCurrentTerm()!.startDate).getTime()) / (1000 * 60 * 60 * 24 * 7))}</p>
              </div>
            ) : (
              <p className="text-blue-800">No active term found for current date</p>
            )}
          </div>


          {/* Add Button */}
          <div className="mb-4 animate-in fade-in duration-700 delay-400">
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Teaching Period
            </button>
          </div>

          {/* Form */}
          {showForm && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-4">
                {editingPeriod ? 'Edit' : 'Add'} Teaching Period
              </h3>
              <form onSubmit={(e) => {
                console.log('Form submit triggered!');
                handleSubmit(e);
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Term 1, Easter Break"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as 'term' | 'holiday' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="term">Term</option>
                      <option value="holiday">Holiday</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-12 h-10 border border-gray-300 rounded-md cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                {formData.type === 'term' && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                      Active
                    </label>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List */}
          <div className="space-y-3">
            {/* Periods with gap insertors between them */}
            {sortedPeriods.map((period, index) => {
              const periodElement = (
                <div key={`${period.type}-${period.id}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: period.color }}
                      ></div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        period.type === 'term' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {period.type === 'term' ? 'Term' : 'Holiday'}
                      </span>
                      {period.name} ({period.year})
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                      {period.type === 'term' && period.isActive && <span className="ml-2 text-green-600 font-medium">• Active</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(period)}
                      className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(period)}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );

              // Check for gap after this period
              if (index < sortedPeriods.length - 1) {
                const currentEnd = new Date(new Date(period.endDate).getFullYear(), new Date(period.endDate).getMonth(), new Date(period.endDate).getDate());
                const next = sortedPeriods[index + 1];
                const nextStart = new Date(new Date(next.startDate).getFullYear(), new Date(next.startDate).getMonth(), new Date(next.startDate).getDate());
                // Define gap as at least one day between current end and next start
                const gapStart = new Date(currentEnd);
                gapStart.setDate(gapStart.getDate() + 1);
                const gapEnd = new Date(nextStart);
                gapEnd.setDate(gapEnd.getDate() - 1);
                
                if (gapStart.getTime() <= gapEnd.getTime()) {
                  const gapElement = (
                    <div key={`gap-${period.id}-${next.id}`} className="flex items-center justify-center py-1">
                      <button
                        onClick={() => openGapForm(gapStart, gapEnd)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700"
                        title="Add period to fill this gap"
                      >
                        +
                      </button>
                    </div>
                  );
                  return [periodElement, gapElement];
                }
              }
              
              return periodElement;
            }).flat()}
            {sortedPeriods.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No teaching periods found. Click "Add Teaching Period" to get started.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
