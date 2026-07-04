import type { Capabilities, InputEvent, LogicalPoint, Monitor, Rgba, ScrollUnit } from '../../src'
import type { NativeBinding, NativeImage, NativeSession, NativeSessionOptions } from '../../src/native'

export interface NativeCall {
  method: string
  args: readonly unknown[]
}

export class MockNativeImage implements NativeImage {
  public constructor(
    private readonly imageWidth = 2,
    private readonly imageHeight = 1,
    private readonly pixels = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]),
  ) {}

  public width(): number {
    return this.imageWidth
  }

  public height(): number {
    return this.imageHeight
  }

  public savePng(path: string): void {
    void path
  }

  public toBuffer(): Buffer {
    return Buffer.from(this.pixels)
  }
}

export class MockNativeSession implements NativeSession {
  public readonly calls: NativeCall[] = []
  public cursor: LogicalPoint = { x: 0, y: 0 }
  public monitorsResult: Monitor[] = []
  public pixelResult: Rgba = { r: 1, g: 2, b: 3, a: 255 }
  public throwOnMethod: string | undefined
  public throwWhen: ((method: string, args: readonly unknown[]) => boolean) | undefined

  public capabilities(): Capabilities {
    return {
      backendName: 'mock',
      canInjectKeyboard: true,
      canInjectMouse: true,
      canTypeUnicode: true,
      canWarpCursor: true,
      canReadCursorPosition: true,
      supportsExtraMouseButtons: true,
      supportsHighResolutionScroll: true,
      canCaptureScreen: true,
      canEnumerateMonitors: true,
      canRecordEvents: true,
      requiresAccessibilityPermission: false,
      requiresScreenRecordingPermission: false,
    }
  }

  public keyDown(key: number): void {
    this.record('keyDown', key)
  }

  public keyUp(key: number): void {
    this.record('keyUp', key)
  }

  public typeChar(codepoint: number): void {
    this.record('typeChar', codepoint)
  }

  public typeText(text: string): void {
    this.record('typeText', text)
  }

  public warpCursor(x: number, y: number): void {
    this.record('warpCursor', x, y)
    this.cursor = { x, y }
  }

  public cursorPosition(): LogicalPoint {
    this.record('cursorPosition')

    return this.cursor
  }

  public button(button: number, down: boolean, clickCount: number): void {
    this.record('button', button, down, clickCount)
  }

  public scroll(horizontal: number, vertical: number, unit: ScrollUnit): void {
    this.record('scroll', horizontal, vertical, unit)
  }

  public enumerateMonitors(): Monitor[] {
    this.record('enumerateMonitors')

    return this.monitorsResult
  }

  public captureRegion(x: number, y: number, width: number, height: number): NativeImage {
    this.record('captureRegion', x, y, width, height)

    return new MockNativeImage(width, height)
  }

  public pixel(x: number, y: number): Rgba {
    this.record('pixel', x, y)

    return this.pixelResult
  }

  public isEventTapSupported(): boolean {
    this.record('isEventTapSupported')

    return true
  }

  public isEventTapRunning(): boolean {
    this.record('isEventTapRunning')

    return true
  }

  public startEventTap(sink: (event: InputEvent) => void): void {
    this.record('startEventTap')
    sink({ type: 'key', key: 4, down: true })
  }

  public stopEventTap(): void {
    this.record('stopEventTap')
  }

  public dispose(): void {
    this.record('dispose')
  }

  private record(method: string, ...args: readonly unknown[]): void {
    this.calls.push({ method, args })

    if (this.throwOnMethod === method || this.throwWhen?.(method, args) === true) {
      const error = new Error(`${method} failed`) as Error & { code: string }
      error.code = 'Unsupported'
      throw error
    }
  }
}

export class MockNativeBinding implements NativeBinding {
  public constructor(public readonly session = new MockNativeSession()) {}

  public createSession(options: NativeSessionOptions): NativeSession {
    this.session.calls.push({ method: 'createSession', args: [options] })

    return this.session
  }
}
