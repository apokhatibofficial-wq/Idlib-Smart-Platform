import localFont from 'next/font/local';

/**
 * Tahrir — the platform's mandated Arabic typeface (six static weights).
 * Do not substitute a Google Font; see design_handoff README.
 */
export const tahrir = localFont({
  src: [
    { path: '../fonts/tahrir-book.ttf', weight: '300', style: 'normal' },
    { path: '../fonts/tahrir-regular.ttf', weight: '400', style: 'normal' },
    { path: '../fonts/tahrir-medium.ttf', weight: '500', style: 'normal' },
    { path: '../fonts/tahrir-bold.ttf', weight: '700', style: 'normal' },
    { path: '../fonts/tahrir-extrabold.ttf', weight: '800', style: 'normal' },
    { path: '../fonts/tahrir-black.ttf', weight: '900', style: 'normal' },
  ],
  variable: '--font-tahrir',
  display: 'swap',
});
