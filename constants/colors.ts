const colors = {
  background: '#0A0E1A',
  surface: '#151925',
  surfaceLight: '#1E2433',
  border: '#2A3142',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  accent: '#8B5CF6',
};

export default {
  light: {
    text: colors.textPrimary,
    background: colors.background,
    tint: colors.primary,
    tabIconDefault: colors.textMuted,
    tabIconSelected: colors.primary,
  },
  colors,
};
