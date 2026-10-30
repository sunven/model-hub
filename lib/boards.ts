import type { Board } from './snapshot'

export const BOARDS = ['text', 'webdev'] as const

export const BOARD_LABELS: Record<Board, string> = {
  text: 'Arena text',
  webdev: 'Arena webdev',
}

export function boardTitle(board: Board): string {
  return `${BOARD_LABELS[board]} 榜单`
}

export function isBoard(value: string): value is Board {
  return (BOARDS as readonly string[]).includes(value)
}
