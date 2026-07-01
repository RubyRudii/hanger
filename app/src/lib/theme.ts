export type Palette = {
  bg: string;
  surface: string;
  surface2: string;
  surface3: string;
  accent: string;
  accentDim: string;
  accentRing: string;
  accentSoft: string;
  goldLight: string;
  royal: string;
  royalBright: string;
  royalSoft: string;
  text: string;
  textMid: string;
  textDim: string;
  textFaint: string;
  border: string;
  borderMid: string;
  borderGold: string;
  borderGoldFocus: string;
  greenHud: string;
  redHud: string;
  blueHud: string;
  gridLine: string;
  like: string;
  tabBg: string;
  onAccent: string;
  scrim: string;
  shadow: string;
  orbCore: string;
  orbHalo: string;
};

// Palettes match the softer fintech reference: warm neutrals + a single
// saturated red accent. The naming (accent/goldLight/royal*) is legacy
// from the earlier gold+navy theme; the values are remapped rather than
// the keys renamed to avoid touching every screen file.
export const DARK: Palette = {
  bg: '#0F0E0D',
  surface: '#1A1918',
  surface2: '#232120',
  surface3: '#2B2827',
  accent: '#EF3B3B',
  accentDim: 'rgba(239,59,59,0.12)',
  accentRing: 'rgba(239,59,59,0.32)',
  accentSoft: 'rgba(239,59,59,0.06)',
  goldLight: '#FFFFFF',
  royal: '#2A2A2A',
  royalBright: '#EF3B3B',
  royalSoft: 'rgba(239,59,59,0.10)',
  text: '#FFFFFF',
  textMid: 'rgba(255,255,255,0.70)',
  textDim: 'rgba(255,255,255,0.42)',
  textFaint: 'rgba(255,255,255,0.22)',
  border: 'rgba(255,255,255,0.08)',
  borderMid: 'rgba(255,255,255,0.14)',
  borderGold: 'rgba(239,59,59,0.25)',
  borderGoldFocus: 'rgba(239,59,59,0.60)',
  greenHud: '#4ADE80',
  redHud: '#EF3B3B',
  blueHud: '#9FB4E5',
  gridLine: 'rgba(255,255,255,0.03)',
  like: '#EF3B3B',
  tabBg: 'rgba(15,14,13,0.94)',
  onAccent: '#FFFFFF',
  scrim: 'rgba(0,0,0,0.60)',
  shadow: '#000000',
  orbCore: 'rgba(50,20,20,0.55)',
  orbHalo: 'rgba(239,59,59,0.07)',
};

export const LIGHT: Palette = {
  bg: '#F0EEEB',
  surface: '#FFFFFF',
  surface2: '#F7F5F2',
  surface3: '#EEEBE7',
  accent: '#E01E1E',
  accentDim: 'rgba(224,30,30,0.08)',
  accentRing: 'rgba(224,30,30,0.28)',
  accentSoft: 'rgba(224,30,30,0.04)',
  goldLight: '#0A0A0A',
  royal: '#1A1918',
  royalBright: '#E01E1E',
  royalSoft: 'rgba(224,30,30,0.08)',
  text: '#0A0A0A',
  textMid: 'rgba(10,10,10,0.62)',
  textDim: 'rgba(10,10,10,0.42)',
  textFaint: 'rgba(10,10,10,0.22)',
  border: 'rgba(10,10,10,0.06)',
  borderMid: 'rgba(10,10,10,0.12)',
  borderGold: 'rgba(224,30,30,0.20)',
  borderGoldFocus: 'rgba(224,30,30,0.55)',
  greenHud: '#0FA55A',
  redHud: '#E01E1E',
  blueHud: '#3F66BB',
  gridLine: 'rgba(10,10,10,0.03)',
  like: '#E01E1E',
  tabBg: 'rgba(240,238,235,0.95)',
  onAccent: '#FFFFFF',
  scrim: 'rgba(0,0,0,0.45)',
  shadow: '#0A0A0A',
  orbCore: 'rgba(224,30,30,0.10)',
  orbHalo: 'rgba(224,30,30,0.05)',
};

export function gradeFromScore(score: number): string {
  if (score >= 90) return 'GRADE S';
  if (score >= 85) return 'GRADE A';
  if (score >= 75) return 'GRADE B';
  if (score >= 65) return 'GRADE C';
  return 'GRADE D';
}

export const fonts = {
  display: 'BebasNeue_400Regular',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyLight: 'DMSans_300Light',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
};
