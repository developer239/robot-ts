import * as path from 'node:path'

import type { Capabilities } from './capabilities'
import { ErrorCode, RobotError } from './errors'
import type { InputEvent } from './events'
import type { LogicalPoint } from './geometry'
import type { Monitor } from './monitor'
import type { Rgba } from './pixel'
import type { ScrollUnit } from './scroll'

export interface NativeBinding {
  createSession(options: NativeSessionOptions): NativeSession
}

export interface NativeSessionOptions {
  requireInputPermission: boolean
  requireCapturePermission: boolean
  linuxBackend: number
}

export interface NativeImage {
  width(): number
  height(): number
  savePng(path: string): void
  toBuffer(): Buffer
}

export interface NativeSession {
  capabilities(): Capabilities
  keyDown(key: number): void
  keyUp(key: number): void
  typeChar(codepoint: number): void
  typeText(text: string): void
  warpCursor(x: number, y: number): void
  cursorPosition(): LogicalPoint
  button(button: number, down: boolean, clickCount: number): void
  scroll(horizontal: number, vertical: number, unit: ScrollUnit): void
  enumerateMonitors(): Monitor[]
  captureRegion(x: number, y: number, width: number, height: number): NativeImage
  pixel(x: number, y: number): Rgba
  isEventTapSupported(): boolean
  isEventTapRunning(): boolean
  startEventTap(sink: (event: InputEvent) => void): void
  stopEventTap(): void
  dispose(): void
}

export const runNative = <TResult>(operation: () => TResult): TResult => {
  try {
    return operation()
  } catch (error) {
    throw RobotError.fromUnknown(error)
  }
}

export function loadNativeBinding(): NativeBinding {
  const packageRoot = path.resolve(__dirname, '..')
  const candidates = [
    path.join(packageRoot, 'prebuilds', abiTag(), 'robot_ts_native.node'),
    path.join(packageRoot, 'native', 'build', 'Release', 'robot_ts_native.node'),
    path.join(packageRoot, 'native', 'build', 'Debug', 'robot_ts_native.node'),
  ]

  const errors: string[] = []
  for (const candidate of candidates) {
    try {
      const mod = require(candidate) as NativeBinding

      if (typeof mod.createSession === 'function') {
        return mod
      }

      errors.push(`${candidate}: missing createSession export`)
    } catch (error) {
      errors.push(`${candidate}: ${(error as Error).message}`)
    }
  }

  throw new RobotError(
    ErrorCode.BackendUnavailable,
    'Could not load the robot-ts native addon. Build it with `npm run build:native`, or install a package that ships a prebuilt binary for your platform. Attempts:\n' +
      errors.map((error) => `  - ${error}`).join('\n'),
  )
}

const abiTag = (): string => `${process.platform}-${process.arch}-napi-abi${process.versions.modules}`
