import { ErrorCode, RobotError } from './errors'
import { Key } from './keys'

export enum Modifier {
  Control = 'Control',
  Shift = 'Shift',
  Alt = 'Alt',
  Meta = 'Meta',
}

export type ModifierInput = Modifier | readonly Modifier[]

export const MODIFIER_TO_KEY: Record<Modifier, Key> = {
  [Modifier.Control]: Key.LeftControl,
  [Modifier.Shift]: Key.LeftShift,
  [Modifier.Alt]: Key.LeftAlt,
  [Modifier.Meta]: Key.LeftMeta,
}

const MODIFIERS = new Set<string>(Object.values(Modifier))

export const normalizeModifiers = (input?: ModifierInput): Modifier[] => {
  if (input === undefined) {
    return []
  }

  const modifiers = Array.isArray(input) ? input : [input]
  for (const modifier of modifiers) {
    if (!MODIFIERS.has(modifier)) {
      throw new RobotError(ErrorCode.InvalidArgument, `Unknown modifier: ${String(modifier)}`)
    }
  }

  return [...modifiers]
}
