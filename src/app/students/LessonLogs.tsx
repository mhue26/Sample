"use client";

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

interface LessonLogsProps {
  meetings: Meeting[];
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-GB');
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

function getDuration(startTime: Date, endTime: Date): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMs = end.getTime() - start.getTime();
  const durationMinutes = Math.round(durationMs / (1000 * 60));
  
  if (durationMinutes < 60) {
    return `${durationMinutes} min`;
  } else {
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}

export default function LessonLogs({ meetings }: LessonLogsProps) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <h4 className="font-medium text-gray-900 mb-4">Lesson Logs ({meetings.length})</h4>
      <div className="max-h-96 overflow-y-auto space-y-3">
        {meetings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No lessons found for the selected period.
          </div>
        ) : (
          meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{meeting.title}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {formatDate(meeting.startTime)} at {formatTime(meeting.startTime)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Duration: {getDuration(meeting.startTime, meeting.endTime)}
                  </div>
                  {meeting.description && (
                    <div className="text-sm text-gray-600 mt-2">
                      {meeting.description}
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      meeting.isCompleted
                        ? 'bg-green-100 text-green-800'
                        : new Date(meeting.startTime) > new Date()
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {meeting.isCompleted
                      ? 'Completed'
                      : new Date(meeting.startTime) > new Date()
                      ? 'Upcoming'
                      : 'Past'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
