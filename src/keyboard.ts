import { ErrorCode, RobotError } from './errors'
import { sleep, randomNormalDelay } from './internal/timing'
import { Key, isKey } from './keys'
import { MODIFIER_TO_KEY, normalizeModifiers, type ModifierInput } from './modifiers'
import { runNative, type NativeSession } from './native'

export interface HumanTypingOptions {
  meanMs?: number
  stddevMs?: number
  minMs?: number
  maxMs?: number
  seed?: number
}

const HUMAN_DEFAULTS: Required<HumanTypingOptions> = {
  meanMs: 75,
  stddevMs: 25,
  minMs: 15,
  maxMs: 250,
  seed: 0,
}

export class Keyboard {
  public constructor(private readonly native: NativeSession) {}

  public async press(key: Key): Promise<void> {
    this.assertKey(key)
    runNative(() => this.native.keyDown(key))
  }

  public async release(key: Key): Promise<void> {
    this.assertKey(key)
    runNative(() => this.native.keyUp(key))
  }

  public async tap(key: Key, modifiers?: ModifierInput): Promise<void> {
    this.assertKey(key)
    const order = normalizeModifiers(modifiers)
    const pressed: Key[] = []

    try {
      for (const modifier of order) {
        const modKey = MODIFIER_TO_KEY[modifier]
        runNative(() => this.native.keyDown(modKey))
        pressed.push(modKey)
      }

      runNative(() => this.native.keyDown(key))
      runNative(() => this.native.keyUp(key))
    } finally {
      for (let i = pressed.length - 1; i >= 0; i--) {
        const modKey = pressed[i]

        if (modKey !== undefined) {
          runNative(() => this.native.keyUp(modKey))
        }
      }
    }

  }

  public async typeChar(codepoint: number): Promise<void> {
    if (!Number.isInteger(codepoint) || !isScalarValue(codepoint)) {
      throw new RobotError(ErrorCode.InvalidArgument, `Not a valid Unicode scalar value: ${codepoint}`)
    }

    runNative(() => this.native.typeChar(codepoint))
  }

  public async typeText(text: string): Promise<void> {
    if (text.length === 0) {
      return
    }

    runNative(() => this.native.typeText(text))
  }

  public async typeTextHumanLike(text: string, options: HumanTypingOptions = {}): Promise<void> {
    const opts = { ...HUMAN_DEFAULTS, ...options }
    const nextDelay = randomNormalDelay(opts.meanMs, opts.stddevMs, opts.minMs, opts.maxMs, opts.seed)

    for (const ch of text) {
      const codepoint = ch.codePointAt(0)

      if (codepoint !== undefined) {
        runNative(() => this.native.typeChar(codepoint))
        await sleep(nextDelay())
      }
    }
  }

  private assertKey(key: Key): void {
    if (!isKey(key)) {
      throw new RobotError(ErrorCode.InvalidArgument, `Unknown key: ${String(key)}`)
    }
  }
}

const isScalarValue = (codepoint: number): boolean =>
  codepoint >= 0 && codepoint <= 0x10ffff && !(codepoint >= 0xd800 && codepoint <= 0xdfff)
