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

export const DARK: Palette = {
  bg: '#050918',
  surface: '#0B1530',
  surface2: '#0F1C3A',
  surface3: '#142447',
  accent: '#C9A84C',
  accentDim: 'rgba(201,168,76,0.13)',
  accentRing: 'rgba(201,168,76,0.28)',
  accentSoft: 'rgba(201,168,76,0.08)',
  goldLight: '#F0D98A',
  royal: '#1A3A8F',
  royalBright: '#2952CC',
  royalSoft: 'rgba(41,82,204,0.18)',
  text: '#FFFFFF',
  textMid: 'rgba(255,255,255,0.62)',
  textDim: 'rgba(255,255,255,0.32)',
  textFaint: 'rgba(255,255,255,0.18)',
  border: 'rgba(255,255,255,0.07)',
  borderMid: 'rgba(255,255,255,0.10)',
  borderGold: 'rgba(201,168,76,0.22)',
  borderGoldFocus: 'rgba(201,168,76,0.55)',
  greenHud: '#4ADE80',
  redHud: '#FF5577',
  blueHud: '#7FA4FF',
  gridLine: 'rgba(41,82,204,0.05)',
  like: '#FF5577',
  tabBg: 'rgba(5,9,24,0.92)',
  onAccent: '#0A0F1E',
  scrim: 'rgba(5,9,24,0.75)',
  shadow: '#000000',
  orbCore: 'rgba(26,58,143,0.55)',
  orbHalo: 'rgba(201,168,76,0.10)',
};

export const LIGHT: Palette = {
  bg: '#F5F1E6',
  surface: '#FFFFFF',
  surface2: '#EFEAD8',
  surface3: '#E5DEC8',
  accent: '#C9A84C',
  accentDim: 'rgba(201,168,76,0.18)',
  accentRing: 'rgba(201,168,76,0.55)',
  accentSoft: 'rgba(201,168,76,0.10)',
  goldLight: '#8C6F22',
  royal: '#1A3A8F',
  royalBright: '#2952CC',
  royalSoft: 'rgba(26,58,143,0.10)',
  text: '#0A1224',
  textMid: 'rgba(10,18,36,0.66)',
  textDim: 'rgba(10,18,36,0.40)',
  textFaint: 'rgba(10,18,36,0.22)',
  border: 'rgba(10,18,36,0.10)',
  borderMid: 'rgba(10,18,36,0.18)',
  borderGold: 'rgba(201,168,76,0.45)',
  borderGoldFocus: 'rgba(201,168,76,0.75)',
  greenHud: '#1F9D4D',
  redHud: '#D63D63',
  blueHud: '#3F66BB',
  gridLine: 'rgba(10,18,36,0.05)',
  like: '#D63D63',
  tabBg: 'rgba(245,241,230,0.95)',
  onAccent: '#0A0F1E',
  scrim: 'rgba(10,18,36,0.45)',
  shadow: '#0A1224',
  orbCore: 'rgba(26,58,143,0.18)',
  orbHalo: 'rgba(201,168,76,0.18)',
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
