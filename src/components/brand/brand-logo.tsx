import { cn } from '@/lib/utils';

const SIZE_MAP = {
  sm: 28,
  md: 40,
  lg: 56,
  xl: 96,
} as const;

type BrandLogoSize = keyof typeof SIZE_MAP;

interface BrandLogoProps {
  size?: BrandLogoSize | number;
  className?: string;
  /** Accessible name when the logo stands alone (no visible brand text beside it). */
  alt?: string;
  /** Kept for call-site compatibility; mask logos don't need image priority. */
  priority?: boolean;
}

/**
 * Renders the brand mark in the current foreground color via CSS mask.
 * Matches light/dark text exactly — no plate, no invert shade mismatch.
 */
export function BrandLogo({ size = 'md', className, alt = '' }: BrandLogoProps) {
  const pixels = typeof size === 'number' ? size : SIZE_MAP[size];

  return (
    <span
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={cn('inline-block shrink-0 bg-foreground', className)}
      style={{
        width: pixels,
        height: pixels,
        maskImage: 'url(/logo-display.png)',
        WebkitMaskImage: 'url(/logo-display.png)',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
      }}
    />
  );
}
