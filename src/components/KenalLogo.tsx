import { Box, Typography, useTheme } from '@mui/material'
import Image from 'next/image'

interface KenalLogoProps {
  size?: 'small' | 'medium' | 'large'
  variant?: 'full' | 'icon' | 'text'
  color?: 'primary' | 'white' | 'gradient' | 'theme'
}

export function KenalLogo({ 
  size = 'medium', 
  variant = 'full',
  color = 'white' 
}: KenalLogoProps) {
  const theme = useTheme()
  
  const sizes = {
    small: { height: 24 },
    medium: { height: 28 },
    large: { height: 40 },
  }

  const textSizes = {
    small: { fontSize: '1.25rem', iconSize: 24 },
    medium: { fontSize: '1.5rem', iconSize: 32 },
    large: { fontSize: '2rem', iconSize: 48 },
  }

  const colors = {
    primary: '#3b82f6',
    white: '#ffffff',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
  }

  // Use the text logo image
  if (variant === 'text' || variant === 'full') {
    // Apply filter based on theme and color prop
    let filter = 'none'
    if (color === 'white') {
      filter = 'brightness(0) invert(1)'
    } else if (color === 'theme' && theme.palette.mode === 'light') {
      // In light mode, we want dark logo (no filter needed)
      filter = 'none'
    } else if (color === 'theme' && theme.palette.mode === 'dark') {
      // In dark mode, we want white logo
      filter = 'brightness(0) invert(1)'
    }
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <img
          src="https://etkuxatycjqwvfjjwxqm.supabase.co/storage/v1/object/public/images/kenal-logo-text.png"
          alt="KENAL"
          style={{ 
            height: `${sizes[size].height}px`,
            width: 'auto',
            filter: filter,
          }}
        />
      </Box>
    )
  }

  // Fallback text version
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography 
        variant="h5" 
        sx={{ 
          fontWeight: 700,
          fontSize: textSizes[size].fontSize,
          color: color === 'theme' ? 'text.primary' : colors[color],
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
