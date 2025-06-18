import { Box, Typography } from '@mui/material'

interface KenalLogoProps {
  size?: 'small' | 'medium' | 'large'
  variant?: 'full' | 'icon'
  color?: 'primary' | 'white' | 'gradient'
}

export function KenalLogo({ 
  size = 'medium', 
  variant = 'full',
  color = 'white' 
}: KenalLogoProps) {
  const sizes = {
    small: { fontSize: '1.25rem', iconSize: 24 },
    medium: { fontSize: '1.5rem', iconSize: 32 },
    large: { fontSize: '2rem', iconSize: 48 },
  }

  const colors = {
    primary: '#3b82f6',
    white: '#ffffff',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography 
        variant="h5" 
        sx={{ 
          fontWeight: 700,
          fontSize: sizes[size].fontSize,
          color: colors[color],
          background: color === 'gradient' ? colors[color] : 'none',
          backgroundClip: color === 'gradient' ? 'text' : 'unset',
          WebkitBackgroundClip: color === 'gradient' ? 'text' : 'unset',
          WebkitTextFillColor: color === 'gradient' ? 'transparent' : 'unset',
          letterSpacing: '-0.02em',
        }}
      >
        KENAL
      </Typography>
    </Box>
  )
}
