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
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});


