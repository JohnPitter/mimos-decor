import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@mimosdecor.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@mimosdecor.com",
      username: "admin",
      password: hashedPassword,
      isAdmin: true,
    },
  });

  console.log("Seed completed: admin@mimosdecor.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
