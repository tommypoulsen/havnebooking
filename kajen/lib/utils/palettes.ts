// Each palette defines the full set of CSS custom properties used across the site.
// Injected at the tenant layout level so both public site and admin reflect tenant branding.

export type PaletteVars = {
  '--color-rust':         string  // accent / CTA buttons / links
  '--color-rust-dark':    string  // accent hover
  '--color-rust-light':   string  // accent soft
  '--color-charcoal':     string  // dark surfaces: header, footer, admin nav
  '--color-charcoal-mid': string  // dark hover surfaces
  '--color-offwhite':     string  // main page background
  '--color-warm-gray':    string  // borders, dividers, subtle backgrounds
}

export type Palette = {
  label: string
  vars: PaletteVars
}

export const PALETTES: Record<string, Palette> = {
  default: {
    label: 'Rust',
    vars: {
      '--color-rust':         '#7a3010',
      '--color-rust-dark':    '#5a2008',
      '--color-rust-light':   '#a04520',
      '--color-charcoal':     '#1e1e1e',
      '--color-charcoal-mid': '#2e2e2e',
      '--color-offwhite':     '#f5f4f2',
      '--color-warm-gray':    '#e8e4de',
    },
  },
  navy: {
    label: 'Havblå',
    vars: {
      '--color-rust':         '#1a4a7a',
      '--color-rust-dark':    '#0f3060',
      '--color-rust-light':   '#2a6099',
      '--color-charcoal':     '#0d2137',
      '--color-charcoal-mid': '#1a3558',
      '--color-offwhite':     '#f4f7fa',
      '--color-warm-gray':    '#d4dfe8',
    },
  },
  forest: {
    label: 'Skovgrøn',
    vars: {
      '--color-rust':         '#2e7d4f',
      '--color-rust-dark':    '#1e5c38',
      '--color-rust-light':   '#3a9e63',
      '--color-charcoal':     '#1a2e1e',
      '--color-charcoal-mid': '#243b28',
      '--color-offwhite':     '#f4f6f4',
      '--color-warm-gray':    '#dce5dc',
    },
  },
  slate: {
    label: 'Skifergrå',
    vars: {
      '--color-rust':         '#4a6278',
      '--color-rust-dark':    '#344858',
      '--color-rust-light':   '#607d93',
      '--color-charcoal':     '#263238',
      '--color-charcoal-mid': '#37474f',
      '--color-offwhite':     '#f5f5f5',
      '--color-warm-gray':    '#dde0e2',
    },
  },
  terracotta: {
    label: 'Terrakotta',
    vars: {
      '--color-rust':         '#c0392b',
      '--color-rust-dark':    '#922b21',
      '--color-rust-light':   '#e74c3c',
      '--color-charcoal':     '#2c1a1a',
      '--color-charcoal-mid': '#3d2a2a',
      '--color-offwhite':     '#fdf5f3',
      '--color-warm-gray':    '#ead8d4',
    },
  },
}

export function getPalette(theme: string | undefined): Palette {
  return PALETTES[theme ?? 'default'] ?? PALETTES.default!
}
