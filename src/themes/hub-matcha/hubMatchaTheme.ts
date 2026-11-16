import { defineTheme } from '@astryxdesign/core/theme'
import { matchaTheme } from '@astryxdesign/theme-matcha'

const plexSans = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", -apple-system, sans-serif'
const plexMono = '"SFMono-Regular", Menlo, Consolas, monospace'

export const hubMatchaTheme = defineTheme({
  name: 'hub-matcha',
  extends: matchaTheme,
  typography: {
    body: { family: 'IBM Plex Sans', fallbacks: plexSans },
    heading: { family: 'IBM Plex Sans', fallbacks: plexSans },
    code: { family: 'IBM Plex Mono', fallbacks: plexMono },
  },
  tokens: {
    // Use the compact base spacing scale for this data workbench.
    '--spacing-0-5': '0.125rem',
    '--spacing-1': '0.25rem',
    '--spacing-1-5': '0.375rem',
    '--spacing-2': '0.5rem',
    '--spacing-3': '0.75rem',
    '--spacing-4': '1rem',
    '--spacing-5': '1.25rem',
    '--spacing-6': '1.5rem',
    '--spacing-7': '1.75rem',
    '--spacing-8': '2rem',
    '--spacing-9': '2.25rem',
    '--spacing-10': '2.5rem',
    '--spacing-11': '2.75rem',
    '--spacing-12': '3rem',
    // A neutral reading surface keeps the olive accent for actions and data.
    '--color-background-body': ['#f5f6f1', '#141710'],
    '--color-background-surface': ['#ffffff', '#1d2119'],
    '--color-text-primary': ['#262d23', '#edf0e8'],
    '--color-text-secondary': ['#636b5b', '#bdc6b2'],
    '--color-icon-primary': 'var(--color-text-primary)',
    '--color-icon-secondary': 'var(--color-text-secondary)',
    '--color-border': ['#e1e6db', '#343c2d'],
    '--color-border-emphasized': ['#abb59f', '#657456'],
    '--text-heading-1-size': 'var(--font-size-4xl)',
    '--text-heading-1-weight': 'var(--font-weight-medium)',
    '--text-heading-1-leading': '1.2',
    '--text-supporting-size': 'var(--font-size-sm)',
    '--color-text-yellow': ['#795a00', '#f4d46b'],
    '--color-text-green': ['#315d1a', '#b4dd98'],
    // Matcha's accent is olive and its success is green, so a green "positive"
    // reads as brand colour. Success moves to the app's teal-green to stay a
    // distinct hue; the whole family is overridden so derived variants follow.
    '--color-success': ['#1e7b4f', '#5fd39a'],
    '--color-success-muted': ['#1e7b4f20', '#5fd39a20'],
    '--color-text-success': ['#1e7b4f', '#5fd39a'],
    '--color-on-success': ['#ffffff', '#12140e'],
    '--color-on-success-muted': ['#1e7b4f', '#5fd39a'],
    '--shadow-inset-success': 'inset 0px 0px 0px 2px #1e7b4f50',
    '--color-error': ['#c4242a', '#ff7a7a'],
    '--color-error-muted': ['#c4242a20', '#ff7a7a20'],
    '--color-text-error': ['#c4242a', '#ff7a7a'],
    '--color-on-error': ['#ffffff', '#12140e'],
    '--color-on-error-muted': ['#c4242a', '#ff7a7a'],
    '--shadow-inset-error': 'inset 0px 0px 0px 2px #c4242a50',
  },
  components: {
    button: {
      base: { borderRadius: 'var(--radius-inner)' },
      'variant:secondary': {
        border: 'var(--border-width) solid var(--color-border-emphasized)',
        backgroundColor: 'var(--color-background-surface)',
      },
    },
    'top-nav': {
      base: {
        minHeight: 'calc(var(--spacing-4) * 4)',
        paddingInline: 'var(--spacing-8)',
        backgroundColor: 'var(--color-background-surface)',
        borderBottom: 'var(--border-width) solid var(--color-border)',
      },
    },
    'top-nav-heading': {
      base: { marginInlineEnd: 'var(--spacing-6)', paddingInlineStart: '0' },
    },
    'top-nav-item': {
      base: { paddingInline: 'var(--spacing-4)', borderRadius: 'var(--radius-inner)' },
    },
    'table-header-cell': {
      base: { backgroundColor: 'var(--color-background-body)' },
    },
    'table-cell': {
      'density:compact': { paddingBlock: 'var(--spacing-3)' },
    },
  },
  adaptations: {
    rules: [
      {
        when: { width: { below: 'md' } },
        value: {
          tokens: {
            '--text-heading-1-size': 'var(--font-size-3xl)',
            '--size-element-sm': '2.75rem',
            '--size-element-md': '2.75rem',
          },
          components: {
            'top-nav': { base: { paddingInline: 'var(--spacing-4)' } },
            'top-nav-heading': { base: { marginInlineEnd: '0' } },
          },
        },
      },
    ],
  },
})
