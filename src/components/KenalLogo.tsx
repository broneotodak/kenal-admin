import React from 'react';
import { Box, Typography } from '@mui/material';
import { gradients } from '@/theme/kenalTheme';

interface KenalLogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'full' | 'icon';
  color?: 'primary' | 'white' | 'gradient';
}

export const KenalLogo: React.FC<KenalLogoProps> = ({ 
  size = 'medium', 
  variant = 'full',
  color = 'primary' 
}) => {
  const sizeMap = {
    small: { icon: 32, font: '1.25rem' },
    medium: { icon: 48, font: '1.75rem' },
    large: { icon: 64, font: '2.25rem' }
  };

  const currentSize = sizeMap[size];

  return (
    <Box display="flex" alignItems="center" gap={variant === 'full' ? 2 : 0}>
      {/* Use the actual KENAL logo from Supabase */}
      <img 
        src="https://etkuxatycjqwvfjjwxqm.supabase.co/storage/v1/object/public/images/kenal-logo-icon.png"
        alt="Kenal Logo"
        style={{ 
          width: currentSize.icon, 
          height: currentSize.icon, 
          objectFit: 'contain',
          filter: color === 'white' ? 'brightness(0) invert(1)' : 'none'
        }}
      />

      {/* KENAL Text */}
      {variant === 'full' && (
        <Typography
          sx={{
            fontSize: currentSize.font,
            fontWeight: 700,
            letterSpacing: '0.05em',
            color: color === 'white' ? '#ffffff' : '#1e3a8a',
            background: color === 'gradient' ? gradients.primary : 'none',
            backgroundClip: color === 'gradient' ? 'text' : 'unset',
            WebkitBackgroundClip: color === 'gradient' ? 'text' : 'unset',
            WebkitTextFillColor: color === 'gradient' ? 'transparent' : 'unset',
          }}
        >
          KENAL
        </Typography>
      )}
    </Box>
  );
};

// Animated version for loading states
export const KenalLogoAnimated: React.FC<KenalLogoProps> = (props) => {
  return (
    <Box
      sx={{
        animation: 'pulse 2s ease-in-out infinite',
        '@keyframes pulse': {
          '0%': { transform: 'scale(1)', opacity: 1 },
          '50%': { transform: 'scale(1.05)', opacity: 0.8 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      }}
    >
      <KenalLogo {...props} />
    </Box>
  );
};
