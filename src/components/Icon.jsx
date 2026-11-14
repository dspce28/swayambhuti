// Minimal stroke icon set (replaces the emoji icons on the old site, which render
// differently on every Android / Windows / iOS device).
const paths = {
  transform: 'M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4',
  process: 'M4 6h10M4 12h16M4 18h7M17 4l3 2-3 2M14 16l3 2-3 2',
  cx: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z',
  sales: 'M3 20h18M6 16l4-5 3 3 6-8M15 6h4v4',
  lead: 'M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9Z',
  people: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.5 20a6.5 6.5 0 0 1 13 0M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14a6.5 6.5 0 0 1 3.5 6',
  audit: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM15.5 15.5 21 21M7.5 11h6M10.5 8v6',
  growth: 'M4 19 10 8l4 6 6-10M4 4v15h16',
  impl: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4Z',
  factory: 'M3 21V10l5 3V10l5 3V6l8 4v11ZM7 17h2M12 17h2M17 17h2',
  retail: 'M4 8h16l-1.5 12h-13ZM9 8V6a3 3 0 0 1 6 0v2',
  health: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z',
  edu: 'M2 9l10-5 10 5-10 5ZM6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5M22 9v6',
  build: 'M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6',
  pro: 'M4 8h16v12H4ZM9 8V5h6v3M4 13h16',
  hotel: 'M3 20V8M3 14h18v6M21 14v-2a3 3 0 0 0-3-3h-7v5M7 12.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  tech: 'M4 5h16v11H4ZM2 20h20M9 9l-2 2 2 2M15 9l2 2-2 2',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0ZM8 6H4a3 3 0 0 0 4 4M16 6h4a3 3 0 0 1-4 4M12 13v4M8 21h8M9 17h6',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z',
  mail: 'M3 6h18v12H3ZM3 7l9 6 9-6',
  pin: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  linkedin: 'M4 9h3.5v11H4ZM5.75 4.5a1.75 1.75 0 1 1 0 3.5 1.75 1.75 0 0 1 0-3.5ZM10 9h3.3v1.6c.5-.9 1.7-1.9 3.5-1.9 3.6 0 4.2 2.3 4.2 5.3v6h-3.5v-5.3c0-1.3 0-2.9-1.8-2.9s-2.1 1.4-2.1 2.8V20H10Z',
  calendar: 'M4 6h16v15H4ZM4 10h16M8 3v4M16 3v4',
  plus: 'M12 5v14M5 12h14',
  quote: 'M10 7H6a2 2 0 0 0-2 2v4h4v4H4M20 7h-4a2 2 0 0 0-2 2v4h4v4h-4',
}

export default function Icon({ name, size = 24, stroke = 1.6, className, fill }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill || 'none'}
      stroke={fill ? 'none' : 'currentColor'}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.arrow} />
    </svg>
  )
}
