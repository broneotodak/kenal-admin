import { createTheme } from '@mui/material/styles';

// KENAL Brand Colors based on logo design
const kenalColors = {
  // Primary Blue (Bold Blue from logo)
  primaryBlue: '#1e3a8a',
  primaryBlueDark: '#1e2d5f',
  primaryBlueLight: '#2563eb',
  
  // Secondary Orange-Red Gradient
  orangeRed: '#dc2626',
  orange: '#ea580c',
  orangeLight: '#f97316',
  
  // Neutral colors
  white: '#ffffff',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  }
};

// Create KENAL theme
export const kenalTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: kenalColors.primaryBlue,
      dark: kenalColors.primaryBlueDark,
      light: kenalColors.primaryBlueLight,
      contrastText: kenalColors.white,
    },
    secondary: {
      main: kenalColors.orange,
      dark: kenalColors.orangeRed,
      light: kenalColors.orangeLight,
      contrastText: kenalColors.white,
    },
    background: {
      default: kenalColors.gray[50],
      paper: kenalColors.white,
    },
    text: {
      primary: kenalColors.gray[900],
      secondary: kenalColors.gray[600],
    },
    divider: kenalColors.gray[200],
    error: {
      main: kenalColors.orangeRed,
    },
    success: {
      main: '#10b981',
    },
    warning: {
      main: kenalColors.orange,
    },
    info: {
      main: kenalColors.primaryBlue,
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 12px rgba(30, 58, 138, 0.15)',
          },
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${kenalColors.primaryBlue} 0%, ${kenalColors.primaryBlueLight} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${kenalColors.primaryBlueDark} 0%, ${kenalColors.primaryBlue} 100%)`,
          },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${kenalColors.orange} 0%, ${kenalColors.orangeRed} 100%)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${kenalColors.orangeRed} 0%, ${kenalColors.orange} 100%)`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          borderRadius: 16,
          border: `1px solid ${kenalColors.gray[100]}`,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&.Mui-focused fieldset': {
              borderColor: kenalColors.primaryBlue,
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: `linear-gradient(180deg, ${kenalColors.primaryBlueDark} 0%, ${kenalColors.primaryBlue} 100%)`,
          color: kenalColors.white,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 8px',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
          },
        },
      },
    },
  },
});

// Gradient styles for special elements
export const gradients = {
  primary: `linear-gradient(135deg, ${kenalColors.primaryBlue} 0%, ${kenalColors.primaryBlueLight} 100%)`,
  secondary: `linear-gradient(135deg, ${kenalColors.orange} 0%, ${kenalColors.orangeRed} 100%)`,
  fingerprint: `linear-gradient(135deg, ${kenalColors.orange} 0%, ${kenalColors.orangeRed} 50%, ${kenalColors.orangeLight} 100%)`,
};
