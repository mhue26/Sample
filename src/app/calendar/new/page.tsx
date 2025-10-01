import { prisma } from "@/lib/prisma";
import { authOptions } from "@/utils/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NewMeetingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/signin");
  }

  // Get all students for the current user
  const students = await prisma.student.findMany({
    where: {
      userId: (session.user as any).id,
      isArchived: false,
    },
    orderBy: { firstName: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <Link 
          href="/calendar" 
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Back to Calendar
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Schedule New Meeting</h1>
        <p className="text-gray-600 mt-1">Create a new meeting with one of your students</p>
      </div>

      <form action={createMeeting} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Meeting Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
              Start Time *
            </label>
            <input
              type="time"
              id="startTime"
              name="startTime"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Optional notes about this meeting..."
          />
        </div>

        {/* Repeat Options */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Repeat Options</h3>
          
          <div className="space-y-4">
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

            <div id="repeatOptions" className="space-y-4 hidden">
              <div>
                <label htmlFor="repeatType" className="block text-sm font-medium text-gray-700 mb-2">
                  Repeat
                </label>
                <select
                  id="repeatType"
                  name="repeatType"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">How many times should this meeting repeat?</p>
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

        <div className="flex gap-4">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Create Meeting
          </button>
          <Link
            href="/calendar"
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </Link>
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
            isRepeatingCheckbox.addEventListener('change', function() {
              if (this.checked) {
                repeatOptions.classList.remove('hidden');
              } else {
                repeatOptions.classList.add('hidden');
              }
            });
            
            // Set default date to today
            const today = new Date();
            const todayString = today.toISOString().split('T')[0];
            meetingDateInput.value = todayString;
            
            // Set default times
            startTimeInput.value = '09:00';
            endTimeInput.value = '10:00';
            
            // Auto-update end time when start time changes
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
          });
        `
      }} />
    </div>
  );
}

async function createMeeting(formData: FormData) {
  "use server";
  
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/signin");
  }

  const title = formData.get("title") as string;
  const studentId = formData.get("studentId") as string;
  const meetingDate = formData.get("meetingDate") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const description = formData.get("description") as string;
  const isCompleted = formData.get("isCompleted") === "on";
  const isRepeating = formData.get("isRepeating") === "on";
  const repeatType = formData.get("repeatType") as string;
  const repeatCount = parseInt(formData.get("repeatCount") as string) || 1;

  // Validate required fields
  if (!title || !studentId || !meetingDate || !startTime || !endTime) {
    throw new Error("All required fields must be filled");
  }

  // Validate that the student belongs to the current user
  const student = await prisma.student.findFirst({
    where: {
      id: parseInt(studentId),
      userId: (session.user as any).id,
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  // Combine date and time fields to create datetime objects
  const baseStartTime = new Date(`${meetingDate}T${startTime}`);
  const baseEndTime = new Date(`${meetingDate}T${endTime}`);
  const duration = baseEndTime.getTime() - baseStartTime.getTime();

  if (isRepeating && repeatType && repeatCount > 1) {
    // Create multiple meetings for recurring events
    const meetings = [];
    
    for (let i = 0; i < repeatCount; i++) {
      let meetingStartTime = new Date(baseStartTime);
      let meetingEndTime = new Date(baseEndTime);
      
      // Calculate the date for this occurrence
      if (i > 0) {
        switch (repeatType) {
          case "weekly":
            meetingStartTime.setDate(meetingStartTime.getDate() + (i * 7));
            meetingEndTime.setDate(meetingEndTime.getDate() + (i * 7));
            break;
          case "biweekly":
            meetingStartTime.setDate(meetingStartTime.getDate() + (i * 14));
            meetingEndTime.setDate(meetingEndTime.getDate() + (i * 14));
            break;
          case "monthly":
            meetingStartTime.setMonth(meetingStartTime.getMonth() + i);
            meetingEndTime.setMonth(meetingEndTime.getMonth() + i);
            break;
        }
      }
      
      meetings.push({
        title: i === 0 ? title : `${title} (${i + 1}/${repeatCount})`,
        description: description || null,
        startTime: meetingStartTime,
        endTime: meetingEndTime,
        isCompleted: false, // Only mark the first one as completed if specified
        userId: (session.user as any).id,
        studentId: parseInt(studentId),
      });
    }
    
    // Create all meetings
    await prisma.meeting.createMany({
      data: meetings,
    });
  } else {
    // Create a single meeting
    await prisma.meeting.create({
      data: {
        title,
        description: description || null,
        startTime: baseStartTime,
        endTime: baseEndTime,
        isCompleted,
        userId: (session.user as any).id,
        studentId: parseInt(studentId),
      },
    });
  }

  redirect("/calendar");
}
