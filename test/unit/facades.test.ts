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

  it.each([
    [{ steps: 1.5 }],
    [{ steps: -1 }],
    [{ steps: Number.POSITIVE_INFINITY }],
    [{ durationMs: -1 }],
    [{ holdMs: Number.NaN }],
    [{ dwellMs: Number.POSITIVE_INFINITY }],
  ])('rejects drag options %j before pressing the button', async (options) => {
    const binding = new MockNativeBinding()
    const session = await Session.create({ binding })

    await expect(session.mouse.dragSmooth({ x: 10, y: 20 }, MouseButton.Left, options)).rejects.toMatchObject({
      code: ErrorCode.InvalidArgument,
    })

    expect(binding.session.calls.filter(({ method }) => method === 'button')).toEqual([])
  })

  it('rejects a drag target without finite coordinates before pressing the button', async () => {
    const binding = new MockNativeBinding()
    const session = await Session.create({ binding })

    await expect(session.mouse.drag({ x: Number.NaN, y: 20 })).rejects.toMatchObject({
      code: ErrorCode.InvalidArgument,
    })

    expect(binding.session.calls.filter(({ method }) => method === 'button')).toEqual([])
  })

  it('moves in exactly the requested number of steps, ending on the target', async () => {
    const binding = new MockNativeBinding()
    const session = await Session.create({ binding })

    await session.mouse.dragSmooth({ x: 30, y: 40 }, MouseButton.Left, { steps: 3, durationMs: 0, dwellMs: 0 })

    const moves = binding.session.calls.filter(({ method }) => method === 'warpCursor')
    expect(moves).toHaveLength(3)
    expect(moves.at(-1)).toEqual({ method: 'warpCursor', args: [30, 40] })
  })

  it('derives the step count when steps is zero', async () => {
    const binding = new MockNativeBinding()
    const session = await Session.create({ binding })

    await session.mouse.moveSmooth({ x: 40, y: 0 }, { steps: 0, durationMs: 0 })

    expect(binding.session.calls.filter(({ method }) => method === 'warpCursor')).toHaveLength(10)
  })

  it('holds before moving and dwells on the target before releasing', async () => {
    vi.useFakeTimers()
    try {
      const binding = new MockNativeBinding()
      const session = await Session.create({ binding })
      const methods = (): string[] =>
        binding.session.calls.map(({ method }) => method).filter((method) => method === 'button' || method === 'warpCursor')

      const pending = session.mouse.dragSmooth({ x: 30, y: 40 }, MouseButton.Left, {
        steps: 1,
        durationMs: 0,
        holdMs: 500,
        dwellMs: 300,
      })
      await vi.advanceTimersByTimeAsync(499)
      expect(methods()).toEqual(['button'])
      await vi.advanceTimersByTimeAsync(1)
      expect(methods()).toEqual(['button', 'warpCursor'])
      await vi.advanceTimersByTimeAsync(299)
      expect(methods()).toEqual(['button', 'warpCursor'])
      await vi.advanceTimersByTimeAsync(1)
      await pending
      expect(methods()).toEqual(['button', 'warpCursor', 'button'])
    } finally {
      vi.useRealTimers()
    }
  })

  it('drags with the options as they were at the call, whatever changes during the hold', async () => {
    vi.useFakeTimers()
    try {
      const binding = new MockNativeBinding()
      const session = await Session.create({ binding })
      const options = { steps: 3, durationMs: 0, holdMs: 50, dwellMs: 0 }
      const target = { x: 30, y: 40 }

      const pending = session.mouse.dragSmooth(target, MouseButton.Left, options)
      options.steps = Number.POSITIVE_INFINITY
      target.x = Number.NaN
      await vi.advanceTimersByTimeAsync(60)
      await pending

      const moves = binding.session.calls.filter(({ method }) => method === 'warpCursor')
      expect(moves).toHaveLength(3)
      expect(moves.at(-1)).toEqual({ method: 'warpCursor', args: [30, 40] })
    } finally {
      vi.useRealTimers()
    }
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
