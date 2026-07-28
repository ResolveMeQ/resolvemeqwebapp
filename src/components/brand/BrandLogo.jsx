import React from 'react';
import { cn } from '../../utils/cn';

/**
 * ResolveMeQ brand assets under /public/brand/.
 *
 * Files (also mirrored to marketing /assets/):
 *   logo-mark[-on-dark|-mono-black|-mono-white].svg
 *   logo-lockup[-on-dark|-mono-black|-mono-white].svg
 *   logo-stacked[-on-dark|-mono-black|-mono-white].svg
 *   logo-wordmark[-on-dark|-mono-black|-mono-white].svg
 *   logo-app-icon.svg
 *
 * @param {'mark'|'lockup'|'stacked'|'wordmark'|'appIcon'} variant
 * @param {'color'|'onDark'|'monoBlack'|'monoWhite'} [tone]
 * @param {boolean} [onDark] — shorthand for tone="onDark"
 * @param {boolean} [adaptive] — lockup/mark with CSS wordmark that follows light/dark theme
 */
export const BRAND_LOGO_ASSETS = {
  mark: {
    color: '/brand/logo-mark.svg',
    onDark: '/brand/logo-mark-on-dark.svg',
    monoBlack: '/brand/logo-mark-mono-black.svg',
    monoWhite: '/brand/logo-mark-mono-white.svg',
  },
  lockup: {
    color: '/brand/logo-lockup.svg',
    onDark: '/brand/logo-lockup-on-dark.svg',
    monoBlack: '/brand/logo-lockup-mono-black.svg',
    monoWhite: '/brand/logo-lockup-mono-white.svg',
  },
  stacked: {
    color: '/brand/logo-stacked.svg',
    onDark: '/brand/logo-stacked-on-dark.svg',
    monoBlack: '/brand/logo-stacked-mono-black.svg',
    monoWhite: '/brand/logo-stacked-mono-white.svg',
  },
  wordmark: {
    color: '/brand/logo-wordmark.svg',
    onDark: '/brand/logo-wordmark-on-dark.svg',
    monoBlack: '/brand/logo-wordmark-mono-black.svg',
    monoWhite: '/brand/logo-wordmark-mono-white.svg',
  },
  appIcon: {
    color: '/brand/logo-app-icon.svg',
    onDark: '/brand/logo-app-icon.svg',
    monoBlack: '/brand/logo-app-icon.svg',
    monoWhite: '/brand/logo-app-icon.svg',
  },
};

const DEFAULT_SIZE = {
  mark: 'h-8 w-8',
  lockup: 'h-8 w-auto',
  stacked: 'h-16 w-auto',
  wordmark: 'h-6 w-auto',
  appIcon: 'h-8 w-8',
};

function resolveSrc(variant, tone, onDark) {
  const family = BRAND_LOGO_ASSETS[variant] ? variant : 'lockup';
  const resolvedTone = tone || (onDark ? 'onDark' : 'color');
  const tones = BRAND_LOGO_ASSETS[family];
  return tones[resolvedTone] || tones.color;
}

const BrandLogo = ({
  variant = 'lockup',
  tone,
  onDark = false,
  adaptive = false,
  className,
  markClassName,
  wordmarkClassName,
  alt = 'ResolveMeQ',
  ...rest
}) => {
  // Adaptive: mark + live wordmark (sidebar / auth that toggle themes)
  if (adaptive) {
    return (
      <span className={cn('inline-flex items-center gap-2.5 min-w-0', className)} {...rest}>
        <img
          src={BRAND_LOGO_ASSETS.mark.color}
          alt={variant === 'mark' ? alt : ''}
          aria-hidden={variant === 'mark' ? undefined : true}
          className={cn('h-8 w-8 object-contain shrink-0', markClassName)}
        />
        {variant !== 'mark' && (
          <span
            className={cn(
              'text-lg font-semibold tracking-tight truncate',
              onDark ? 'text-slate-50' : 'text-slate-900 dark:text-white',
              wordmarkClassName
            )}
          >
            ResolveMeQ
          </span>
        )}
      </span>
    );
  }

  const src = resolveSrc(variant, tone, onDark);
  return (
    <img
      src={src}
      alt={alt}
      className={cn(DEFAULT_SIZE[variant] || DEFAULT_SIZE.lockup, 'object-contain', className)}
      {...rest}
    />
  );
};

export default BrandLogo;
