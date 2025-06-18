'use client';

import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ReactNode } from 'react';
import { kenalTheme } from '@/theme/kenalTheme';

export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <MuiThemeProvider theme={kenalTheme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
