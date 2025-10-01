"use server";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/utils/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export async function createMeeting(formData: FormData) {
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
