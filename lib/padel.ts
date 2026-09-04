export const PADEL_CATEGORIES = ["7ma", "6ta", "5ta", "4ta", "3ra", "2da", "1ra"] as const;
export const PLAYER_POSITIONS = ["drive", "reves"] as const;
export const PLAYER_GENDERS = ["dama", "caballero"] as const;
export const MATCH_FORMATS = ["standard", "mixed"] as const;

export type PadelCategory = typeof PADEL_CATEGORIES[number];
export type PlayerPosition = typeof PLAYER_POSITIONS[number];
export type PlayerGender = typeof PLAYER_GENDERS[number];
export type MatchFormat = typeof MATCH_FORMATS[number];

export function normalizeCategory(value: string): PadelCategory {
  return PADEL_CATEGORIES.includes(value as PadelCategory) ? value as PadelCategory : "7ma";
}

export function positionLabel(position: string) {
  return position === "reves" ? "Revés" : "Drive";
}

export function genderLabel(gender: string) {
  return gender === "dama" ? "Femenino" : "Masculino";
}
