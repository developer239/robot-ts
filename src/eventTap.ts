import { ErrorCode, RobotError } from './errors'
import type { InputEvent } from './events'
import { runNative, type NativeSession } from './native'

export type EventSink = (event: InputEvent) => void

export class EventTap {
  private running = false
  private sink: EventSink | undefined

  public constructor(private readonly native: NativeSession) {}

  public get isSupported(): boolean {
    return runNative(() => this.native.isEventTapSupported())
  }

  public get isRunning(): boolean {
    return this.running && runNative(() => this.native.isEventTapRunning())
  }

  public async start(sink: EventSink): Promise<void> {
    if (this.running) {
      throw new RobotError(ErrorCode.Unsupported, 'An event tap is already running on this session')
    }

    this.sink = sink
    runNative(() => this.native.startEventTap((event) => this.sink?.(event)))
    this.running = true
  }

  public async stop(): Promise<void> {
    if (!this.running) {
      return
    }

    this.running = false
    this.sink = undefined
    runNative(() => this.native.stopEventTap())
  }
}
