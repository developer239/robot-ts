export enum MouseButton {
  Left = 0,
  Right = 1,
  Middle = 2,
  X1 = 3,
  X2 = 4,
}

const MOUSE_BUTTONS = new Set<number>(Object.values(MouseButton).filter((value) => typeof value === 'number'))

export const isMouseButton = (button: MouseButton): boolean => MOUSE_BUTTONS.has(button)
