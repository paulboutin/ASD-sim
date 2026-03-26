import type { SVGProps } from 'react';

interface SymbolIconProps {
  icon: string;
  className?: string;
}

function SvgFrame({ className, children }: Pick<SymbolIconProps, 'className'> & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

function iconStrokeProps(color: string, width: number): SVGProps<SVGPathElement> {
  return {
    stroke: color,
    strokeWidth: width,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };
}

export function SymbolIcon({ icon, className }: SymbolIconProps) {
  switch (icon) {
    case 'yes.svg':
      return (
        <SvgFrame className={className}>
          <circle cx="32" cy="32" r="24" stroke="#1c6f43" strokeWidth="5" />
          <path d="M19 33l9 9 17-20" {...iconStrokeProps('#1c6f43', 6)} />
        </SvgFrame>
      );
    case 'no.svg':
      return (
        <SvgFrame className={className}>
          <circle cx="32" cy="32" r="24" stroke="#9f2b2b" strokeWidth="5" />
          <path d="M23 23l18 18M41 23L23 41" {...iconStrokeProps('#9f2b2b', 6)} />
        </SvgFrame>
      );
    case 'help.svg':
      return (
        <SvgFrame className={className}>
          <path d="M32 8l5 12 13 2-9 9 2 13-11-6-11 6 2-13-9-9 13-2 5-12z" stroke="#7a5a0e" strokeWidth="4" />
          <circle cx="32" cy="48" r="2.8" fill="#7a5a0e" />
        </SvgFrame>
      );
    case 'more.svg':
      return (
        <SvgFrame className={className}>
          <circle cx="32" cy="32" r="24" stroke="#375a7f" strokeWidth="5" />
          <path d="M32 20v24M20 32h24" {...iconStrokeProps('#375a7f', 6)} />
        </SvgFrame>
      );
    case 'water.svg':
      return (
        <SvgFrame className={className}>
          <path
            d="M32 10C24 20 18 27 18 35c0 8 6 14 14 14s14-6 14-14c0-8-6-15-14-25z"
            stroke="#1f6da1"
            strokeWidth="5"
          />
        </SvgFrame>
      );
    case 'break.svg':
      return (
        <SvgFrame className={className}>
          <rect x="14" y="16" width="10" height="32" rx="2" fill="#35506b" />
          <rect x="40" y="16" width="10" height="32" rx="2" fill="#35506b" />
        </SvgFrame>
      );
    case 'food.svg':
      return (
        <SvgFrame className={className}>
          <path d="M20 12v18M26 12v18M23 30v22" {...iconStrokeProps('#7f4e1c', 4)} />
          <path d="M42 12c0 8-6 14-6 20v20" {...iconStrokeProps('#7f4e1c', 4)} />
        </SvgFrame>
      );
    case 'home.svg':
      return (
        <SvgFrame className={className}>
          <path d="M12 30l20-16 20 16" {...iconStrokeProps('#38608a', 5)} />
          <path d="M18 30v18h28V30" stroke="#38608a" strokeWidth="5" />
          <rect x="28" y="36" width="8" height="12" fill="#38608a" />
        </SvgFrame>
      );
    case 'school.svg':
      return (
        <SvgFrame className={className}>
          <path d="M10 24l22-10 22 10-22 10-22-10z" stroke="#4a4f7a" strokeWidth="4" />
          <path d="M16 30v12c5 5 27 5 32 0V30" stroke="#4a4f7a" strokeWidth="4" />
        </SvgFrame>
      );
    case 'thank-you.svg':
      return (
        <SvgFrame className={className}>
          <path
            d="M32 52s-16-9-16-22c0-6 4-10 9-10 4 0 7 2 7 5 0-3 3-5 7-5 5 0 9 4 9 10 0 13-16 22-16 22z"
            stroke="#8d3a55"
            strokeWidth="4"
          />
        </SvgFrame>
      );
    case 'all-done.svg':
      return (
        <SvgFrame className={className}>
          <circle cx="32" cy="32" r="23" stroke="#49566d" strokeWidth="4" />
          <path d="M22 32h20" {...iconStrokeProps('#49566d', 5)} />
        </SvgFrame>
      );
    case 'friend.svg':
      return (
        <SvgFrame className={className}>
          <circle cx="23" cy="25" r="7" stroke="#406b59" strokeWidth="4" />
          <circle cx="41" cy="25" r="7" stroke="#406b59" strokeWidth="4" />
          <path d="M14 46c1-7 6-11 9-11s8 4 9 11M32 46c1-7 6-11 9-11s8 4 9 11" {...iconStrokeProps('#406b59', 4)} />
        </SvgFrame>
      );
    default:
      return (
        <SvgFrame className={className}>
          <circle cx="32" cy="32" r="18" stroke="#506070" strokeWidth="4" />
        </SvgFrame>
      );
  }
}
