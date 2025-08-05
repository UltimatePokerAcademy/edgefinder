export const colors = {
  // Main poker theme colors
  background: '#1a1a1a',
  cardBackground: '#2d2d30',
  surface: '#3c3c41',
  primary: '#007acc',
  
  // Card colors
  red: '#dc3545',
  black: '#000000',
  blue: '#007acc',
  green: '#28a745',
  
  // Text colors
  textPrimary: '#ffffff',
  textSecondary: '#b0b0b0',
  textMuted: '#808080',
  
  // Action colors
  success: '#28a745',
  warning: '#ffc107',
  danger: '#dc3545',
  info: '#17a2b8',
  
  // Button colors
  buttonPrimary: '#007acc',
  buttonSecondary: '#6c757d',
  buttonSuccess: '#28a745',
  buttonDanger: '#dc3545',
  
  // Border colors
  border: '#4a4a4f',
  borderLight: '#6c6c70',
  
  // Input colors
  inputBackground: '#2d2d30',
  inputBorder: '#4a4a4f',
  inputFocus: '#007acc',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  h2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  body: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  caption: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  small: {
    fontSize: 12,
    color: colors.textMuted,
  },
};

export const cardStyles = {
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
};

export const buttonStyles = {
  primary: {
    backgroundColor: colors.buttonPrimary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: colors.buttonSecondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  success: {
    backgroundColor: colors.buttonSuccess,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  danger: {
    backgroundColor: colors.buttonDanger,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
};

export const inputStyles = {
  container: {
    marginVertical: spacing.sm,
  },
  label: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary,
    fontSize: 16,
  },
  inputFocused: {
    borderColor: colors.inputFocus,
  },
};