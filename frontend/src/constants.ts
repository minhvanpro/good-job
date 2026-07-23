export const CORE_VALUES = [
  "Teamwork",
  "Ownership",
  "Innovation",
  "Integrity",
  "Excellence",
  "Respect",
] as const;

export type CoreValue = (typeof CORE_VALUES)[number];

export const CORE_VALUE_COLORS: Record<CoreValue, string> = {
  Teamwork: "#6366f1",
  Ownership: "#ec4899",
  Innovation: "#f59e0b",
  Integrity: "#10b981",
  Excellence: "#8b5cf6",
  Respect: "#06b6d4",
};

export const REACTION_ICONS = [
  "thumb_up",
  "favorite",
  "celebration",
  "whatshot",
  "fitness_center",
  "star",
] as const;

export type ReactionIcon = (typeof REACTION_ICONS)[number];
