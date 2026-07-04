import { MouseButton, isMouseButton } from './buttons'
import { ErrorCode, RobotError } from './errors'
import type { LogicalPoint } from './geometry'
import { distance } from './geometry'
import { sleep } from './internal/timing'
import { runNative, type NativeSession } from './native'
import type { ScrollDelta } from './scroll'

export interface MouseMoveOptions {
  durationMs?: number
  steps?: number
}

const MAX_DERIVED_STEPS = 200
const LOGICAL_UNITS_PER_STEP = 4
const DRAG_SETTLE_MS = 10

export class Mouse {
  public constructor(private readonly native: NativeSession) {}

  public async move(point: LogicalPoint): Promise<void> {
    runNative(() => this.native.warpCursor(point.x, point.y))
  }

  public async moveSmooth(point: LogicalPoint, options: MouseMoveOptions = {}): Promise<void> {
    const from = runNative(() => this.native.cursorPosition())
    const steps = resolveSteps(options.steps, distance(from, point))
    const durationMs = options.durationMs ?? 300
    const stepDelay = durationMs / steps

    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const x = from.x + (point.x - from.x) * t
      const y = from.y + (point.y - from.y) * t

      runNative(() => this.native.warpCursor(x, y))

      if (stepDelay > 0) {
        await sleep(stepDelay)
      }
    }
  }

  public async position(): Promise<LogicalPoint> {
    return runNative(() => this.native.cursorPosition())
  }

  public async press(button: MouseButton = MouseButton.Left): Promise<void> {
    this.assertButton(button)
    runNative(() => this.native.button(button, true, 1))
  }

  public async release(button: MouseButton = MouseButton.Left): Promise<void> {
    this.assertButton(button)
    runNative(() => this.native.button(button, false, 1))
  }

  public async click(button: MouseButton = MouseButton.Left): Promise<void> {
    this.assertButton(button)
    runNative(() => this.native.button(button, true, 1))
    runNative(() => this.native.button(button, false, 1))

  }

  public async doubleClick(button: MouseButton = MouseButton.Left): Promise<void> {
    this.assertButton(button)
    runNative(() => this.native.button(button, true, 1))
    runNative(() => this.native.button(button, false, 1))
    runNative(() => this.native.button(button, true, 2))
    runNative(() => this.native.button(button, false, 2))

  }

  public async drag(to: LogicalPoint, button: MouseButton = MouseButton.Left): Promise<void> {
    this.assertButton(button)
    runNative(() => this.native.button(button, true, 1))
    await sleep(DRAG_SETTLE_MS)

    try {
      runNative(() => this.native.warpCursor(to.x, to.y))
      await sleep(DRAG_SETTLE_MS)
    } finally {
      runNative(() => this.native.button(button, false, 1))
    }
  }

  public async dragSmooth(
    to: LogicalPoint,
    button: MouseButton = MouseButton.Left,
    options: MouseMoveOptions = {},
  ): Promise<void> {
    this.assertButton(button)
    runNative(() => this.native.button(button, true, 1))
    await sleep(DRAG_SETTLE_MS)

    try {
      await this.moveSmooth(to, options)
      await sleep(DRAG_SETTLE_MS)
    } finally {
      runNative(() => this.native.button(button, false, 1))
    }
  }

  public async scroll(delta: ScrollDelta): Promise<void> {
    runNative(() => this.native.scroll(delta.horizontal, delta.vertical, delta.unit))
  }

  private assertButton(button: MouseButton): void {
    if (!isMouseButton(button)) {
      throw new RobotError(ErrorCode.InvalidArgument, `Unknown mouse button: ${String(button)}`)
    }
  }
}

const resolveSteps = (explicit: number | undefined, dist: number): number => {
  if (explicit !== undefined && explicit > 0) {
    return explicit
  }

  const raw = Math.round(dist / LOGICAL_UNITS_PER_STEP)

  return Math.min(Math.max(raw, 1), MAX_DERIVED_STEPS)
}
