import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
	const session = await getServerSession(authOptions);
	
	if (!session?.user) {
		return (
			<div className="space-y-2">
				<div className="text-sm text-gray-600">You must sign in to view the dashboard.</div>
				<a href="/signin" className="text-blue-600 hover:underline">Sign in</a>
			</div>
		);
	}

	// Get today's date
	const today = new Date();
	const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

	// Get recent meetings (past and upcoming, limited to 5)
	const recentMeetings = await prisma.meeting.findMany({
		where: {
			userId: (session.user as any).id,
		},
		include: {
			student: true,
		},
		orderBy: {
			startTime: 'desc',
		},
		take: 5,
	});

	const formatTime = (date: Date) => {
		return date.toLocaleTimeString('en-US', { 
			hour: 'numeric', 
			minute: '2-digit',
			hour12: true 
		});
	};

	const formatDate = (date: Date) => {
		return date.toLocaleDateString('en-GB', { 
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
			return date.toLocaleDateString('en-GB', { 
				weekday: 'short',
				month: 'short', 
				day: 'numeric' 
			});
		}
	};

	return (
		<div className="space-y-6 pt-8 font-sans" style={{ fontFamily: "'Work Sans', sans-serif" }}>
			<div>
				<h1 className="text-2xl font-semibold">Dashboard</h1>
			</div>

			{/* Welcome Call-out Block */}
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
				<div className="flex items-center">
					<div className="flex-shrink-0">
						<div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
							<svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
					</div>
					<div className="ml-4">
						<h2 className="text-lg font-semibold text-blue-900">Welcome{session?.user?.name ? `, ${session.user.name}` : ""}!</h2>
						<p className="text-blue-700">Today is {formatDate(today)}</p>
					</div>
				</div>
			</div>

			{/* Recent Events Card */}
			<div className="bg-white rounded-lg border p-6">
				<h2 className="text-lg font-medium mb-4">Recent Events</h2>
				{recentMeetings.length > 0 ? (
					<div className="space-y-3">
						{recentMeetings.map((meeting) => {
							const meetingDate = new Date(meeting.startTime);
							const isPast = meetingDate < today;
							const isCompleted = meeting.isCompleted;
							
							return (
								<div
									key={meeting.id}
									className="border rounded-lg p-4 hover:shadow-md transition-shadow"
								>
									<div className="flex justify-between items-start mb-2">
										<div>
											<h3 className="font-medium text-gray-900">{meeting.title}</h3>
											<p className="text-sm text-gray-500">{formatMeetingDate(meetingDate)}</p>
										</div>
										<span className={`px-2 py-1 rounded-full text-xs font-medium ${
											isPast 
												? 'bg-gray-100 text-gray-800' 
												: isCompleted
												? 'bg-green-100 text-green-800'
												: 'bg-yellow-100 text-yellow-800'
										}`}>
											{isPast ? 'Past' : isCompleted ? 'Completed' : 'Upcoming'}
										</span>
									</div>
								
								<div className="text-sm text-gray-600 mb-2">
									<div className="flex items-center gap-2">
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
										{formatTime(new Date(meeting.startTime))} - {formatTime(new Date(meeting.endTime))}
									</div>
								</div>

								<div className="text-sm text-gray-600 mb-2">
									<div className="flex items-center gap-2">
										<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
										</svg>
										{meeting.student.firstName} {meeting.student.lastName}
									</div>
								</div>

									{meeting.description && (
										<div className="text-sm text-gray-600">
											<p className="mt-2">{meeting.description}</p>
										</div>
									)}
								</div>
							);
						})}
					</div>
				) : (
					<div className="text-center py-8">
						<div className="text-gray-400 mb-4">
							<svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
						</div>
						<h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming lessons</h3>
						<p className="text-gray-500">You don't have any lessons scheduled. Perfect time to plan ahead!</p>
						<div className="mt-4">
							<a 
								href="/calendar/new" 
								className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
							>
								<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
								</svg>
								Schedule a Lesson
							</a>
						</div>
					</div>
				)}
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				<a href="/students" className="rounded-lg border p-4 hover:bg-gray-50">
					<h2 className="font-medium">Manage Students</h2>
					<p className="text-sm text-gray-600">Create, view, and edit your students.</p>
				</a>
				<a href="/students/new" className="rounded-lg border p-4 hover:bg-gray-50">
					<h2 className="font-medium">Add New Student</h2>
					<p className="text-sm text-gray-600">Quickly add a new student to your studio.</p>
				</a>
				<a href="/billing" className="rounded-lg border p-4 hover:bg-gray-50">
					<h2 className="font-medium">Manage Invoicing</h2>
					<p className="text-sm text-gray-600">Create and manage invoices for your students.</p>
				</a>
			</div>
		</div>
	);
}


