# Robot TS 🤖

[![npm version](http://img.shields.io/npm/v/robot-ts.svg?style=flat)](https://www.npmjs.com/package/robot-ts "View this project on npm")

This library is inspired by older unmaintained libraries like [octalmage/robotjs](https://github.com/octalmage/robotjs)
and [Robot/robot-js](https://github.com/Robot/robot-js). The goal is to provide cross-platform controls for various
devices such as keyboard, mouse, and screen for Node.js applications.

You can find C++ implementation CMake library 📚 [here: developer239/robot-cpp](https://github.com/developer239/robot-cpp)

**Supported system:**

- MacOS
- Windows **(not tested yet)**

In case of Linux, please, create issue and leave a star ⭐ and I will implement support. Right now I want to focus on port to
Node.js using Node-API.

### Known issues:

- Work in progress. If you need specific features, please, create an issue and I will prioritize it.
- I never tested this on Windows. 🙏
- It seems that special keys bindings are not implemented correctly.
- Upper case is converted to lower case when typing. (it will be possible to use shift key when special keys are fixed though)
- It seems that screen bindings are not implemented correctly.

## Installation:

Make sure that you can build C++ projects on your machine and that you have [CMake](https://cmake.org) installed.

- On MacOS: `brew install cmake`
- On Windows: `choco install cmake`

Install Node dependencies:

```shell
yarn add robot-ts
```

## Keyboard ⌨️

The `Keyboard` class provides a interface for simulating keyboard key presses, releases, and typing.

### Public Methods

- `type(query: string): void`
  Types the given text as a string.

- `typeHumanLike(query: string): void`
  Types the given text as a string with a human-like typing speed.

- `click(asciiChar: string): void`
  Simulates a key press and release for the specified ASCII character.

- `click(specialKey: SpecialKey): void`
  Simulates a key press and release for the specified special key.

- `press(asciiChar: string): void`
  Simulates a key press for the specified ASCII character.

- `press(specialKey: SpecialKey): void`
  Simulates a key press for the specified special key.

- `release(asciiChar: string): void`
  Simulates a key release for the specified ASCII character.

- `release(specialKey: SpecialKey): void`
  Simulates a key release for the specified special key.

### Example Usage

```typescript
import { Keyboard } from "robot-ts";

Keyboard.typeHumanLike("hello, world");
```

## Mouse 🖱️

The `Mouse` class provides a interface for controlling the mouse cursor, simulating mouse clicks, and scrolling.

### Public Methods

- `move(point: Point): void`
  Moves the mouse cursor to the specified point (x, y).

- `moveSmooth(point: Point, speed?: number): void`
  Moves the mouse cursor smoothly to the specified point (x, y) at the given speed.

- `drag(point: Point, speed?: number): void`
  Drags the mouse cursor to the specified point (x, y) at the given speed.

- `getPosition(): Point`
  Returns the current position of the mouse cursor as a `Point`.

- `toggleButton(down: boolean, button: MouseButton, doubleClick?: boolean): void`
  Presses or releases the specified mouse button depending on the `down` argument. If `doubleClick` is set to true, it will perform a double click.

- `click(button: MouseButton): void`
  Simulates a single click using the specified mouse button.

- `doubleClick(button: MouseButton): void`
  Simulates a double click using the specified mouse button.

- `scrollBy(y: number, x?: number): void`
  Scrolls the mouse wheel by the specified x and y distances.

### Example Usage

```typescript
import { Mouse } from "robot-ts";

Mouse.moveSmooth({ x: 100, y: 200 });
```

## Screen 🖥️

The `Screen` class provides functionality to capture the screen, get pixel colors, and save the captured screen as a PNG image.

### Public Methods

- `getPixelColor(x: number, y: number): Pixel`
  Returns the color of the pixel at the specified (x, y) coordinates as a `Pixel` structure.

- `getScreenSize(): DisplaySize`
  Returns the size of the screen as a `DisplaySize` structure containing the width and height.

- `capture(x?: number, y?: number, width?: number, height?: number): void`
  Captures a rectangular area of the screen defined by the specified (x, y) coordinates and dimensions (width, height).

- `getPixels(): Pixel[]`
  Returns an array of `Pixel` structures representing the captured screen.

- `saveAsPNG(filename: string): void`
  Saves the captured screen as a PNG image with the specified filename.

### Example Usage

```typescript
import { Screen } from "robot-ts";

const screen = new Screen();
screen.capture(0, 0, 800, 600);
const pixel = screen.getPixelColor(100, 200);
screen.saveAsPNG("screenshot.png");
```
