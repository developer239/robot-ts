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
    static type(query: string): void;

    static typeHumanLike(query: string): void;

    static click(asciiChar: string | SpecialKey): void;

    static press(asciiChar: string | SpecialKey): void;

    static release(asciiChar: string | SpecialKey): void;
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

    static move(point: Point): void;

    static moveSmooth(point: Point, speed?: number): void;

    static drag(point: Point, speed?: number): void;

    static getPosition(): Point;

    static toggleButton(down: boolean, button: MouseButton, doubleClick?: boolean): void;

    static click(button: MouseButton): void;

    static doubleClick(button: MouseButton): void;

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

    getPixelColor(x: number, y: number): Pixel;

    getScreenSize(): DisplaySize;

    capture(x?: number, y?: number, width?: number, height?: number): void;

    getPixels(): Pixel[];

    saveAsPNG(filename: string): void;
  }
}
