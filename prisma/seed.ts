import "dotenv/config";
import { createDb } from "../lib/server/db";
import { hashPassword, normalizeEmail } from "../lib/server/auth";
import { examples } from "../lib/examples";

async function main() {
  const db = createDb(process.env.DATABASE_URL);
  try {
    // Starter problems: only when the table is empty, so reruns never duplicate
    // and never resurrect problems a teacher deleted on purpose.
    if ((await db.problem.count()) === 0) {
      await db.problem.createMany({
        data: examples.map((ex) => ({
          title: ex.title,
          description: ex.description,
          level: ex.level,
          tag: ex.tag,
          blocks: JSON.parse(JSON.stringify(ex.make())),
        })),
      });
      console.log(`Seeded ${examples.length} problems.`);
    } else {
      console.log("Problems already exist - skipped.");
    }

    const email = process.env.SEED_TEACHER_EMAIL;
    const password = process.env.SEED_TEACHER_PASSWORD;
    if (email && password) {
      if (password.length < 8)
        throw new Error("SEED_TEACHER_PASSWORD must be 8+ characters.");
      const normalized = normalizeEmail(email);
      await db.user.upsert({
        where: { email: normalized },
        update: { role: "TEACHER", passwordHash: hashPassword(password) },
        create: {
          email: normalized,
          name: "Багш",
          role: "TEACHER",
          passwordHash: hashPassword(password),
        },
      });
      console.log(`Teacher account ready: ${normalized}`);
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
