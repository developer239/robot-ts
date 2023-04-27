declare module Robot {
  type KeyCode = number;

  export enum SpecialKey {
    BACKSPACE,
    ENTER,
    TAB,
    ESCAPE,
    UP,
    DOWN,
    RIGHT,
    LEFT,
    META,
    ALT,
    CONTROL,
    SHIFT,
    CAPSLOCK
  }

  export class Keyboard {
    static Type(query: string): void;

    static TypeHumanLike(query: string): void;

    static Click(asciiChar: string | SpecialKey): void;

    static Press(asciiChar: string | SpecialKey): void;

    static Release(asciiChar: string | SpecialKey): void;
  }

  export enum MouseButton {
    LEFT_BUTTON = 0,
    RIGHT_BUTTON = 1,
    CENTER_BUTTON = 2
  }

  interface Point {
    x: number;
    y: number;
  }

  export class Mouse {
    static delay: number;

    static Move(point: Point): void;

    static MoveSmooth(point: Point, speed?: number): void;

    static Drag(point: Point, speed?: number): void;

    static GetPosition(): Point;

    static ToggleButton(down: boolean, button: MouseButton, doubleClick?: boolean): void;

    static Click(button: MouseButton): void;

    static DoubleClick(button: MouseButton): void;

    static ScrollBy(y: number, x?: number): void;
  }

  export interface DisplaySize {
    width: number;
    height: number;
  }

  export interface Pixel {
    r: number;
    g: number;
    b: number;
  }

  export class Screen {
    constructor();

    GetPixelColor(x: number, y: number): Pixel;

    GetScreenSize(): DisplaySize;

    Capture(x?: number, y?: number, width?: number, height?: number): void;

    GetPixels(): Pixel[];

    saveAsPNG(filename: string): void;
  }
}
