import type { LogicalPoint } from './geometry'
import type { Key } from './keys'
import type { MouseButton } from './buttons'
import type { ScrollDelta } from './scroll'

export interface KeyInputEvent {
  type: 'key'
  key: Key
  down: boolean
}

export interface MouseMoveInputEvent {
  type: 'mouseMove'
  position: LogicalPoint
}

export interface MouseButtonInputEvent {
  type: 'mouseButton'
  button: MouseButton
  down: boolean
  position: LogicalPoint
}

export interface ScrollInputEvent {
  type: 'scroll'
  delta: ScrollDelta
  position: LogicalPoint
}

export type InputEvent = KeyInputEvent | MouseMoveInputEvent | MouseButtonInputEvent | ScrollInputEvent

export interface RecordedEvent {
  timestampMs: number
  event: InputEvent
}
