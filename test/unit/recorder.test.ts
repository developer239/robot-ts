import { describe, expect, it } from 'vitest'

import { Key, MouseButton, Recorder, ScrollUnit } from '../../src'

describe('Recorder', () => {
  it('round-trips recorded events as JSON', () => {
    const recorder = new Recorder()

    recorder.capture({ type: 'key', key: Key.A, down: true })
    recorder.capture({ type: 'mouseMove', position: { x: 10, y: 20 } })
    recorder.capture({ type: 'mouseButton', button: MouseButton.Left, down: true, position: { x: 10, y: 20 } })
    recorder.capture({ type: 'scroll', delta: { horizontal: 0, vertical: 1, unit: ScrollUnit.Line }, position: { x: 10, y: 20 } })

    const restored = Recorder.fromJSON(recorder.toJSON())

    expect(restored.events).toEqual(recorder.events)
  })
})
