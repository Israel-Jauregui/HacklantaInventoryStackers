export const Colors = {
  yellow: '#FFFC00',
  yellowDim: '#E6E300',
  black: '#0A0A0A',
  dark: '#111111',
  dark2: '#1A1A1A',
  dark3: '#242424',
  dark4: '#2E2E2E',
  white: '#FFFFFF',
  red: '#FF3B30',
  amber: '#FF9500',
  green: '#34C759',
  blue: '#007AFF',
  muted: 'rgba(255,255,255,0.45)',
  muted2: 'rgba(255,255,255,0.15)',
  muted3: 'rgba(255,255,255,0.07)',
} as const;

export const Fonts = {
  sans: 'System',
  mono: 'SpaceMono',
} as const;

export function severityColor(score: number): string {
  if (score >= 7.5) return Colors.red;
  if (score >= 4) return Colors.amber;
  return Colors.green;
}

export function severityLabel(score: number): string {
  if (score >= 7.5) return 'Critical';
  if (score >= 4) return 'Moderate';
  return 'Minor';
}
