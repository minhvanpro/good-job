import { PrismaClient, CoreValue } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const password = await bcrypt.hash("password123", 12);

  const alice = await prisma.user.upsert({
    where: { email: "alice@company.com" },
    update: {},
    create: {
      email: "alice@company.com",
      name: "Alice Nguyen",
      password,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@company.com" },
    update: {},
    create: {
      email: "bob@company.com",
      name: "Bob Tran",
      password,
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: "charlie@company.com" },
    update: {},
    create: {
      email: "charlie@company.com",
      name: "Charlie Le",
      password,
    },
  });

  console.log(`Created users: ${alice.name}, ${bob.name}, ${charlie.name}`);

  const rewards = [
    { name: "Company Hoodie", costPoints: 500, description: "Premium company hoodie" },
    { name: "Friday Afternoon Off", costPoints: 1000, description: "Leave early on Friday" },
    { name: "Gift Card $10", costPoints: 200, description: "Digital gift card" },
    { name: "Team Lunch", costPoints: 300, description: "Treat your team to lunch" },
    { name: "Coffee Mug", costPoints: 100, description: " branded coffee mug" },
  ];

  for (const reward of rewards) {
    await prisma.rewardCatalog.upsert({
      where: { id: reward.name },
      update: {},
      create: {
        name: reward.name,
        description: reward.description,
        costPoints: reward.costPoints,
        stock: 100,
      },
    });
  }

  console.log(`Created ${rewards.length} rewards`);

  const coreValues: CoreValue[] = ["Teamwork", "Ownership", "Innovation", "Integrity", "Excellence", "Respect"];

  const kudo1 = await prisma.kudo.create({
    data: {
      points: 30,
      description: "Great teamwork on the project delivery!",
      coreValue: "Teamwork",
      fromUserId: alice.id,
      toUserId: bob.id,
    },
  });

  const kudo2 = await prisma.kudo.create({
    data: {
      points: 50,
      description: "Took ownership of the critical bug fix",
      coreValue: "Ownership",
      fromUserId: bob.id,
      toUserId: charlie.id,
    },
  });

  const kudo3 = await prisma.kudo.create({
    data: {
      points: 20,
      description: "Innovative solution for the caching problem",
      coreValue: "Innovation",
      fromUserId: charlie.id,
      toUserId: alice.id,
    },
  });

  await prisma.pointLedger.createMany({
    data: [
      { userId: alice.id, delta: -30, balanceAfter: 170, reason: "kudo_sent", referenceId: kudo1.id },
      { userId: bob.id, delta: 30, balanceAfter: 30, reason: "kudo_received", referenceId: kudo1.id },
      { userId: bob.id, delta: -50, balanceAfter: -20, reason: "kudo_sent", referenceId: kudo2.id },
      { userId: charlie.id, delta: 50, balanceAfter: 50, reason: "kudo_received", referenceId: kudo2.id },
      { userId: charlie.id, delta: -20, balanceAfter: 30, reason: "kudo_sent", referenceId: kudo3.id },
      { userId: alice.id, delta: 20, balanceAfter: 190, reason: "kudo_received", referenceId: kudo3.id },
    ],
  });

  console.log("Created sample kudos and ledger entries");
  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
