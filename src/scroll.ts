export enum ScrollUnit {
  Line = 0,
  Pixel = 1,
}

export interface ScrollDelta {
  horizontal: number
  vertical: number
  unit: ScrollUnit
}

export const lines = (vertical: number, horizontal = 0): ScrollDelta => ({
  horizontal,
  vertical,
  unit: ScrollUnit.Line,
})

export const pixels = (vertical: number, horizontal = 0): ScrollDelta => ({
  horizontal,
  vertical,
  unit: ScrollUnit.Pixel,
})
