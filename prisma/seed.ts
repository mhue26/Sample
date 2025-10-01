import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    // Ensure a default tutor exists
    const email = "tutor@example.com";
    const passwordHash = await bcrypt.hash("password123", 10);
    const tutor = await prisma.user.upsert({
        where: { email },
        update: {},
        create: { email, name: "Default Tutor", passwordHash },
    });

    const count = await prisma.student.count();
    if (count === 0) {
        await prisma.student.createMany({
            data: [
                {
                    firstName: "Alice",
                    lastName: "Nguyen",
                    email: "alice@example.com",
                    phone: "555-123-4567",
                    subjects: "Math, Physics",
                    hourlyRateCents: 5000,
                    notes: "Preparing for SAT.",
                    userId: tutor.id,
                },
                {
                    firstName: "Ben",
                    lastName: "Santos",
                    email: "ben@example.com",
                    subjects: "English, History",
                    hourlyRateCents: 4500,
                    notes: "Struggles with essay structure.",
                    userId: tutor.id,
                },
                {
                    firstName: "Chloe",
                    lastName: "Park",
                    email: "chloe@example.com",
                    subjects: "Chemistry",
                    hourlyRateCents: 6000,
                    notes: null,
                    userId: tutor.id,
                },
            ],
        });
        console.log("Seeded tutor and students.");
    } else {
        // Backfill any existing students with no owner
        const unowned = await prisma.student.findMany({ where: { userId: null } });
        for (const s of unowned) {
            await prisma.student.update({ where: { id: s.id }, data: { userId: tutor.id } });
        }
        if (unowned.length > 0) {
            console.log(`Assigned ${unowned.length} existing students to default tutor.`);
        } else {
            console.log("No unowned students to assign.");
        }
    }

    // Add some sample meetings
    const students = await prisma.student.findMany({ where: { userId: tutor.id } });
    if (students.length > 0) {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        await prisma.meeting.createMany({
            data: [
                {
                    title: "Math Tutoring Session",
                    description: "Working on algebra problems",
                    startTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000), // 2 PM tomorrow
                    endTime: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000), // 3 PM tomorrow
                    isCompleted: false,
                    userId: tutor.id,
                    studentId: students[0].id,
                },
                {
                    title: "Physics Review",
                    description: "Preparing for upcoming test",
                    startTime: new Date(nextWeek.getTime() + 10 * 60 * 60 * 1000), // 10 AM next week
                    endTime: new Date(nextWeek.getTime() + 11 * 60 * 60 * 1000), // 11 AM next week
                    isCompleted: false,
                    userId: tutor.id,
                    studentId: students[0].id,
                },
                {
                    title: "English Essay Help",
                    description: "Working on argumentative essay structure",
                    startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
                    endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1 hour later
                    isCompleted: false,
                    userId: tutor.id,
                    studentId: students[1]?.id || students[0].id,
                },
            ],
            skipDuplicates: true,
        });
        console.log("Added sample meetings.");
    }
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});


