import cron from "node-cron";
import { prisma } from "../index";

export function startBudgetResetCron(): void {
  cron.schedule("0 0 * * *", async () => {
    console.log("[BudgetCron] Checking monthly budget reset...");

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
      const result = await prisma.user.updateMany({
        where: {
          budgetResetAt: {
            lt: firstOfMonth,
          },
        },
        data: {
          budgetSpent: 0,
          budgetResetAt: now,
        },
      });

      if (result.count > 0) {
        console.log(`[BudgetCron] Reset budget for ${result.count} users`);
      }
    } catch (error) {
      console.error("[BudgetCron] Error resetting budgets:", error);
    }
  });

  console.log("[BudgetCron] Cron job scheduled (daily at midnight)");
}
