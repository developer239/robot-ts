import type { InputEvent, RecordedEvent } from './events'
import type { EventTap } from './eventTap'
import { sleep } from './internal/timing'
import type { Session } from './session'

export interface ReplayOptions {
  timeScale?: number
  maxGapMs?: number
}

export class Recorder {
  private readonly recorded: RecordedEvent[] = []
  private started = false
  private startTime = 0

  public get events(): readonly RecordedEvent[] {
    return this.recorded
  }

  public get isEmpty(): boolean {
    return this.recorded.length === 0
  }

  public capture(event: InputEvent): void {
    const now = performance.now()

    if (!this.started) {
      this.started = true
      this.startTime = now
    }

    this.recorded.push({ timestampMs: Math.round(now - this.startTime), event })
  }

  public async attach(tap: EventTap): Promise<EventTap> {
    await tap.start((event) => this.capture(event))

    return tap
  }

  public reset(): void {
    this.recorded.length = 0
    this.started = false
    this.startTime = 0
  }

  public toJSON(): RecordedEvent[] {
    return this.recorded.map((event) => ({ ...event }))
  }

  public static fromJSON(data: readonly RecordedEvent[]): Recorder {
    const recorder = new Recorder()

    for (const entry of data) {
      if (typeof entry?.timestampMs !== 'number' || typeof entry?.event?.type !== 'string') {
        throw new Error('Malformed recorded event timeline')
      }

      recorder.recorded.push({ timestampMs: entry.timestampMs, event: entry.event })
    }

    recorder.started = recorder.recorded.length > 0

    return recorder
  }

  public async replay(session: Session, options: ReplayOptions = {}): Promise<void> {
    if (this.recorded.length === 0) {
      return
    }

    const timeScale = options.timeScale ?? 1.0
    const maxGapMs = options.maxGapMs ?? 0
    let previous = this.recorded[0]!.timestampMs

    for (const { timestampMs, event } of this.recorded) {
      let gap = (timestampMs - previous) * timeScale
      previous = timestampMs

      if (maxGapMs > 0 && gap > maxGapMs) {
        gap = maxGapMs
      }
      if (gap > 0) {
        await sleep(gap)
      }

      await this.dispatch(session, event)
    }
  }

  private async dispatch(session: Session, event: InputEvent): Promise<void> {
    switch (event.type) {
      case 'key':
        await (event.down ? session.keyboard.press(event.key) : session.keyboard.release(event.key))
        return
      case 'mouseMove':
        await session.mouse.move(event.position)
        return
      case 'mouseButton':
        await session.mouse.move(event.position)
        await (event.down ? session.mouse.press(event.button) : session.mouse.release(event.button))
        return
      case 'scroll':
        await session.mouse.move(event.position)
        await session.mouse.scroll(event.delta)
        return
    }

    const exhaustive: never = event
    throw new Error(`Unhandled event: ${JSON.stringify(exhaustive)}`)
  }
}
