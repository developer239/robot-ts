import { ErrorCode, RobotError } from './errors'
import type { PhysicalSize } from './geometry'
import { runNative, type NativeImage } from './native'
import type { Rgba } from './pixel'

export class Image {
  public constructor(private readonly native: NativeImage) {}

  public get width(): number {
    return runNative(() => this.native.width())
  }

  public get height(): number {
    return runNative(() => this.native.height())
  }

  public get size(): PhysicalSize {
    return { width: this.width, height: this.height }
  }

  public async savePng(path: string): Promise<void> {
    runNative(() => this.native.savePng(path))
  }

  public toBuffer(): Buffer {
    return runNative(() => this.native.toBuffer())
  }

  public at(x: number, y: number): Rgba {
    const w = this.width
    const h = this.height

    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= w || y >= h) {
      throw new RobotError(ErrorCode.InvalidArgument, `Pixel (${x}, ${y}) out of range for ${w}x${h} image`)
    }

    const buffer = this.toBuffer()
    const i = 4 * (y * w + x)
    const r = buffer[i]
    const g = buffer[i + 1]
    const b = buffer[i + 2]
    const a = buffer[i + 3]

    if (r === undefined || g === undefined || b === undefined || a === undefined) {
      throw new RobotError(ErrorCode.InvalidArgument, `Pixel (${x}, ${y}) out of range for ${w}x${h} image`)
    }

    return { r, g, b, a }
  }
}
