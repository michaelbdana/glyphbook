export type BookGoal = {
  targetWords?: number;
  dueDate?: string;
  writingDays?: number[];
};

export type HabitPlan = {
  dailyWords?: number;
  writingDays?: number[];
};

export type GoalPlan = {
  currentWords: number;
  remainingWords: number;
  requiredPerWritingDay: number | null;
  daysRemaining: number | null;
  percentComplete: number;
};

export type StreakInfo = {
  today: string;
  wordsToday: number;
  goalMetToday: boolean;
  currentStreak: number;
};

function isWritingDay(days: number[], date: Date): boolean {
  if (days.length === 0) return true;
  return days.includes(date.getDay());
}

export function daysUntilDue(dueDate: string): number | null {
  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((due.getTime() - today.getTime()) / 86_400_000));
}

export function computePlan(
  goal: BookGoal | undefined,
  currentWords: number,
): GoalPlan {
  const targetWords = goal?.targetWords && goal.targetWords > 0 ? goal.targetWords : 0;
  const remainingWords = Math.max(0, targetWords - currentWords);
  const percentComplete =
    targetWords > 0 ? Math.min(100, (currentWords / targetWords) * 100) : 0;

  if (!goal?.dueDate) {
    return { currentWords, remainingWords, requiredPerWritingDay: null, daysRemaining: null, percentComplete };
  }
  const days = daysUntilDue(goal.dueDate);
  const writingDays = goal.writingDays ?? [];
  if (days === null || days === 0 || remainingWords <= 0) {
    return { currentWords, remainingWords, requiredPerWritingDay: null, daysRemaining: days, percentComplete };
  }
  let scheduled = 0;
  const today = new Date();
  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    if (isWritingDay(writingDays, date)) scheduled += 1;
  }
  const requiredPerWritingDay = scheduled > 0 ? Math.ceil(remainingWords / scheduled) : null;
  return { currentWords, remainingWords, requiredPerWritingDay, daysRemaining: days, percentComplete };
}

export function computeStreak(
  log: Record<string, number> | undefined,
  plan: HabitPlan | undefined,
): StreakInfo {
  const dailyTarget = plan?.dailyWords && plan.dailyWords > 0 ? plan.dailyWords : 0;
  const writingDays = plan?.writingDays ?? [];
  const today = new Date();
  const key = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const todayKey = key(today);

  const wordsToday = log?.[todayKey] ?? 0;
  const goalMetToday = dailyTarget > 0 && wordsToday >= dailyTarget;

  let streak = 0;
  const cursor = new Date(today);
  for (let i = 0; i < 365 * 2; i += 1) {
    if (!isWritingDay(writingDays, cursor)) {
      if (i === 0) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    const words = log?.[key(cursor)] ?? 0;
    if (dailyTarget === 0 || words >= dailyTarget) {
      streak += 1;
    } else if (i > 0) {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return { today: todayKey, wordsToday, goalMetToday, currentStreak: streak };
}
