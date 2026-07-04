import { ErrorCode, RobotError } from './errors'
import type { PhysicalPoint, PhysicalRect } from './geometry'
import { Image } from './image'
import type { Monitor } from './monitor'
import { runNative, type NativeSession } from './native'
import type { Rgba } from './pixel'

export class Screen {
  public constructor(private readonly native: NativeSession) {}

  public async monitors(): Promise<Monitor[]> {
    const list = runNative(() => this.native.enumerateMonitors())

    return [...list].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
  }

  public async primaryMonitor(): Promise<Monitor> {
    const list = runNative(() => this.native.enumerateMonitors())

    if (list.length === 0) {
      throw new RobotError(ErrorCode.PlatformError, 'No monitors reported')
    }

    const primary = list.find((monitor) => monitor.isPrimary)

    return primary ?? list[0]!
  }

  public async virtualBounds(): Promise<PhysicalRect> {
    const list = runNative(() => this.native.enumerateMonitors())

    if (list.length === 0) {
      throw new RobotError(ErrorCode.PlatformError, 'No monitors reported')
    }

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const monitor of list) {
      const bounds = monitor.physicalBounds
      minX = Math.min(minX, bounds.origin.x)
      minY = Math.min(minY, bounds.origin.y)
      maxX = Math.max(maxX, bounds.origin.x + bounds.size.width)
      maxY = Math.max(maxY, bounds.origin.y + bounds.size.height)
    }

    return {
      origin: { x: minX, y: minY },
      size: { width: maxX - minX, height: maxY - minY },
    }
  }

  public async capture(region: PhysicalRect): Promise<Image> {
    if (region.size.width <= 0 || region.size.height <= 0) {
      throw new RobotError(ErrorCode.InvalidArgument, 'Capture region must have positive size')
    }

    const native = runNative(() =>
      this.native.captureRegion(region.origin.x, region.origin.y, region.size.width, region.size.height),
    )

    return new Image(native)
  }

  public async captureMonitor(monitorId: number): Promise<Image> {
    const list = runNative(() => this.native.enumerateMonitors())
    const monitor = list.find((item) => item.id === monitorId)

    if (monitor === undefined) {
      throw new RobotError(ErrorCode.MonitorNotFound, `Monitor ${monitorId} not found`)
    }

    return this.capture(monitor.physicalBounds)
  }

  public async pixel(point: PhysicalPoint): Promise<Rgba> {
    return runNative(() => this.native.pixel(point.x, point.y))
  }
}
