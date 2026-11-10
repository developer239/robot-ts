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

export interface DragOptions extends MouseMoveOptions {
  // How long the button stays down before the pointer moves. A drag that starts
  // only after a long press (a sortable list with a press delay) needs it.
  holdMs?: number
  // How long the pointer rests on the target before the release. A drop target
  // that reacts to hovering (a list making room, a folder springing open) needs it.
  dwellMs?: number
}

const MAX_DERIVED_STEPS = 200
const LOGICAL_UNITS_PER_STEP = 4
const DRAG_SETTLE_MS = 10
const DEFAULT_MOVE_DURATION_MS = 300

export class Mouse {
  public constructor(private readonly native: NativeSession) {}

  public async move(point: LogicalPoint): Promise<void> {
    runNative(() => this.native.warpCursor(point.x, point.y))
  }

  public async moveSmooth(point: LogicalPoint, options: MouseMoveOptions = {}): Promise<void> {
    const target = pointSnapshot(point)
    const { steps, durationMs } = moveSnapshot(options)
    await this.glide(target, steps, durationMs)
  }

  // steps undefined derives the count from the distance the pointer actually travels.
  private async glide(point: LogicalPoint, explicitSteps: number | undefined, durationMs: number): Promise<void> {
    const from = runNative(() => this.native.cursorPosition())
    const steps = explicitSteps ?? derivedSteps(distance(from, point))
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

  public async drag(
    to: LogicalPoint,
    button: MouseButton = MouseButton.Left,
    options: Pick<DragOptions, 'holdMs' | 'dwellMs'> = {},
  ): Promise<void> {
    this.assertButton(button)
    const target = pointSnapshot(to)
    const { holdMs, dwellMs } = pauseSnapshot(options)
    runNative(() => this.native.button(button, true, 1))
    await sleep(holdMs)

    try {
      runNative(() => this.native.warpCursor(target.x, target.y))
      await sleep(dwellMs)
    } finally {
      runNative(() => this.native.button(button, false, 1))
    }
  }

  // Everything is checked, on a copy taken at the call, before the button goes
  // down, so neither a bad option nor one changed during the hold leaves half a
  // gesture on screen.
  public async dragSmooth(
    to: LogicalPoint,
    button: MouseButton = MouseButton.Left,
    options: DragOptions = {},
  ): Promise<void> {
    this.assertButton(button)
    const target = pointSnapshot(to)
    const { steps, durationMs } = moveSnapshot(options)
    const { holdMs, dwellMs } = pauseSnapshot(options)
    runNative(() => this.native.button(button, true, 1))
    await sleep(holdMs)

    try {
      await this.glide(target, steps, durationMs)
      await sleep(dwellMs)
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

const derivedSteps = (dist: number): number => {
  const raw = Math.round(dist / LOGICAL_UNITS_PER_STEP)

  return Math.min(Math.max(raw, 1), MAX_DERIVED_STEPS)
}

const invalid = (message: string): RobotError => new RobotError(ErrorCode.InvalidArgument, message)

const pointSnapshot = ({ x, y }: LogicalPoint): LogicalPoint => {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw invalid(`A point needs finite coordinates, got (${x}, ${y})`)
  }

  return { x, y }
}

const duration = (name: string, value: number | undefined, fallback: number): number => {
  if (value === undefined) {
    return fallback
  }
  if (!(Number.isFinite(value) && value >= 0)) {
    throw invalid(`${name} must be a finite number of milliseconds, zero or more, got ${value}`)
  }

  return value
}

// steps 0, like an omitted count, derives it from the distance, as robot-cpp's
// MouseMoveOptions does.
const moveSnapshot = ({ steps, durationMs }: MouseMoveOptions): { steps: number | undefined; durationMs: number } => {
  if (steps !== undefined && !(Number.isInteger(steps) && steps >= 0)) {
    throw invalid(`steps must be a whole number, zero or more, got ${steps}`)
  }

  return {
    steps: steps === 0 ? undefined : steps,
    durationMs: duration('durationMs', durationMs, DEFAULT_MOVE_DURATION_MS),
  }
}

const pauseSnapshot = ({ holdMs, dwellMs }: Pick<DragOptions, 'holdMs' | 'dwellMs'>): { holdMs: number; dwellMs: number } => ({
  holdMs: duration('holdMs', holdMs, DRAG_SETTLE_MS),
  dwellMs: duration('dwellMs', dwellMs, DRAG_SETTLE_MS),
})
