import type { Capabilities } from './capabilities'
import { EventTap } from './eventTap'
import { Keyboard } from './keyboard'
import { Mouse } from './mouse'
import { loadNativeBinding, runNative, type NativeBinding, type NativeSession } from './native'
import { Screen } from './screen'

export enum LinuxBackend {
  Auto = 0,
  X11 = 1,
  Uinput = 2,
}

export interface SessionOptions {
  requireInputPermission?: boolean
  requireCapturePermission?: boolean
  linuxBackend?: LinuxBackend
  binding?: NativeBinding
}

export class Session {
  public readonly keyboard: Keyboard
  public readonly mouse: Mouse
  public readonly screen: Screen
  public readonly eventTap: EventTap
  public readonly capabilities: Capabilities

  private disposed = false

  private constructor(private readonly native: NativeSession) {
    this.capabilities = runNative(() => native.capabilities())
    this.keyboard = new Keyboard(native)
    this.mouse = new Mouse(native)
    this.screen = new Screen(native)
    this.eventTap = new EventTap(native)
  }

  public static create(options: SessionOptions = {}): Promise<Session> {
    const binding = options.binding ?? loadNativeBinding()
    const native = runNative(() =>
      binding.createSession({
        requireInputPermission: options.requireInputPermission ?? false,
        requireCapturePermission: options.requireCapturePermission ?? false,
        linuxBackend: options.linuxBackend ?? LinuxBackend.Auto,
      }),
    )

    return Promise.resolve(new Session(native))
  }

  public get isDisposed(): boolean {
    return this.disposed
  }

  public dispose(): Promise<void> {
    if (this.disposed) {
      return Promise.resolve()
    }

    this.disposed = true
    runNative(() => this.native.dispose())

    return Promise.resolve()
  }

  public async [Symbol.asyncDispose](): Promise<void> {
    await this.dispose()
  }
}
