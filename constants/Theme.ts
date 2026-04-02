/**
 * Equilibrium Finance Design System
 * Supporting both Dark (Primary) and Light themes.
 */

export const Colors = {
  dark: {
    primary: '#10B981', // Emerald
    secondary: '#3B82F6', // Blue
    accent: '#F97316', // Orange
    background: '#06090D',
    card: '#0F172A',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#1E293B',
    income: '#10B981',
    expense: '#EF4444',
  },
  light: {
    primary: '#059669', // Darker Emerald for readability
    secondary: '#2563EB',
    accent: '#EA580C',
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    income: '#059669',
    expense: '#DC2626',
  }
};

export type ColorTheme = typeof Colors.dark;

const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
};

export const Theme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    full: 9999,
  },
  typography,
};

export default Theme;
