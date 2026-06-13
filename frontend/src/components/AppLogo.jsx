import React from 'react';
import { APP_LOGO_URL, APP_NAME } from '../lib/brand';

const HEIGHT = { xs: 'h-7', sm: 'h-9', md: 'h-11', lg: 'h-14', xl: 'h-20' };

/**
 * Official UniSchedule logo (image includes wordmark + tagline).
 * Use showText=false everywhere — the PNG already contains the text.
 */
export default function AppLogo({ size = 'md', className = '', onDark = false }) {
  return (
    <img
      src={APP_LOGO_URL}
      alt={APP_NAME}
      className={`${HEIGHT[size] || HEIGHT.md} w-auto object-contain object-left ${onDark ? 'brightness-110' : ''} ${className}`}
    />
  );
}
