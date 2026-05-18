export const colors = {
  bg: '#0A0A0B',
  surface: '#141416',
  surfaceAlt: '#1A1A1E',
  surfaceDeep: '#0F0F11',
  chip: '#1E1E22',
  accent: '#E8341A',
  accentSoft: 'rgba(232,52,26,0.12)',
  accentGrid: 'rgba(232,52,26,0.06)',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.12)',
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.5)',
  textDim: 'rgba(255,255,255,0.35)',
  textFaint: 'rgba(255,255,255,0.25)',
  textGhost: 'rgba(255,255,255,0.12)',
};

export const fonts = {
  display: 'BebasNeue_400Regular',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyLight: 'DMSans_300Light',
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 16,
  pill: 30,
};

export function gradeFromScore(score: number): string {
  if (score >= 90) return 'GRADE S';
  if (score >= 85) return 'GRADE A';
  if (score >= 75) return 'GRADE B';
  if (score >= 65) return 'GRADE C';
  return 'GRADE D';
}
