import { describe, expect, it, vi } from 'vitest'

import { ErrorCode, Image, Key, Modifier, MouseButton, RobotError, Session, lines } from '../../src'
import { MockNativeBinding, MockNativeImage } from './mock-native'

describe('facades', () => {
  it('creates a session through an injected native binding', async () => {
    const binding = new MockNativeBinding()

    const session = await Session.create({ requireInputPermission: true, binding })

    expect(session.capabilities.backendName).toBe('mock')
    expect(binding.session.calls[0]).toEqual({
      method: 'createSession',
      args: [{ requireInputPermission: true, requireCapturePermission: false, linuxBackend: 0 }],
    })
  })

  it('releases keyboard modifiers in reverse order when tapping fails', async () => {
    const binding = new MockNativeBinding()
    const session = await Session.create({ binding })
    binding.session.throwWhen = (method, args) => method === 'keyDown' && args[0] === Key.C

    await expect(session.keyboard.tap(Key.C, [Modifier.Control, Modifier.Shift])).rejects.toMatchObject({
      code: ErrorCode.Unsupported,
    })

    expect(binding.session.calls).toContainEqual({ method: 'keyUp', args: [Key.LeftShift] })
    expect(binding.session.calls).toContainEqual({ method: 'keyUp', args: [Key.LeftControl] })
  })

  it('rejects invalid Unicode scalar values as promise rejections', async () => {
    const binding = new MockNativeBinding()
    const session = await Session.create({ binding })

    await expect(session.keyboard.typeChar(0xd800)).rejects.toMatchObject({
      code: ErrorCode.InvalidArgument,
    })
  })

  it('types human-like text by Unicode code point', async () => {
    vi.useFakeTimers()
    const binding = new MockNativeBinding()
    const session = await Session.create({ binding })

    const typing = session.keyboard.typeTextHumanLike('a🙂', { meanMs: 1, stddevMs: 0, minMs: 1, maxMs: 1, seed: 1 })
    await vi.runAllTimersAsync()
    await typing

    expect(binding.session.calls.filter((call) => call.method === 'typeChar')).toEqual([
      { method: 'typeChar', args: [97] },
      { method: 'typeChar', args: [128578] },
    ])
    vi.useRealTimers()
  })

  it('emits exactly four native button atoms for double-click', async () => {
    const binding = new MockNativeBinding()
    const session = await Session.create({ binding })

    await session.mouse.doubleClick(MouseButton.Left)

    expect(binding.session.calls.filter((call) => call.method === 'button')).toEqual([
      { method: 'button', args: [MouseButton.Left, true, 1] },
      { method: 'button', args: [MouseButton.Left, false, 1] },
      { method: 'button', args: [MouseButton.Left, true, 2] },
      { method: 'button', args: [MouseButton.Left, false, 2] },
    ])
  })

  it('releases mouse button after drag failure', async () => {
    const binding = new MockNativeBinding()
    const session = await Session.create({ binding })
    binding.session.throwOnMethod = 'warpCursor'

    await expect(session.mouse.drag({ x: 10, y: 20 })).rejects.toMatchObject({ code: ErrorCode.Unsupported })

    expect(binding.session.calls).toContainEqual({ method: 'button', args: [MouseButton.Left, false, 1] })
  })

  it('derives screen values from monitor atoms', async () => {
    const binding = new MockNativeBinding()
    binding.session.monitorsResult = [
      {
        id: 2,
        name: 'secondary',
        isPrimary: false,
        logicalBounds: { origin: { x: -100, y: 0 }, size: { width: 100, height: 100 } },
        physicalBounds: { origin: { x: -200, y: 0 }, size: { width: 200, height: 200 } },
        scaleFactor: 2,
      },
      {
        id: 1,
        name: 'primary',
        isPrimary: true,
        logicalBounds: { origin: { x: 0, y: 0 }, size: { width: 300, height: 200 } },
        physicalBounds: { origin: { x: 0, y: 0 }, size: { width: 300, height: 200 } },
        scaleFactor: 1,
      },
    ]
    const session = await Session.create({ binding })

    await expect(session.screen.monitors()).resolves.toMatchObject([{ id: 1 }, { id: 2 }])
    await expect(session.screen.virtualBounds()).resolves.toEqual({
      origin: { x: -200, y: 0 },
      size: { width: 500, height: 200 },
    })
    await expect(session.screen.captureMonitor(99)).rejects.toMatchObject({ code: ErrorCode.MonitorNotFound })
  })

  it('maps native error codes to RobotError', async () => {
    const binding = new MockNativeBinding()
    const session = await Session.create({ binding })
    binding.session.throwOnMethod = 'scroll'

    await expect(session.mouse.scroll(lines(1))).rejects.toBeInstanceOf(RobotError)
    await expect(session.mouse.scroll(lines(1))).rejects.toMatchObject({ code: ErrorCode.Unsupported })
  })

  it('checks image bounds before reading a pixel', () => {
    const image = new Image(new MockNativeImage())

    expect(image.at(1, 0)).toEqual({ r: 5, g: 6, b: 7, a: 8 })
    expect(() => image.at(2, 0)).toThrow(RobotError)
  })
})
