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
})