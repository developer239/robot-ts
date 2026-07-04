# robot-ts

[![npm version](https://img.shields.io/npm/v/robot-ts.svg?style=flat)](https://www.npmjs.com/package/robot-ts)
[![CI](https://github.com/developer239/robot-ts/actions/workflows/ci.yml/badge.svg)](https://github.com/developer239/robot-ts/actions/workflows/ci.yml)

robot-ts is a Node.js library for programmatic keyboard, mouse, and screen control on macOS, Windows, and Linux. It is a typed async binding over [robot-cpp](https://github.com/developer239/robot-cpp) with input injection, native-resolution screen capture, global input recording, explicit capabilities, and typed errors.

## Why it exists

Input automation libraries in the [robotjs](https://github.com/octalmage/robotjs) lineage collapse distinctions that matter:

- Physical keys are separate from text. A key is identified by its keyboard position. Text injects Unicode directly and is layout-independent.
- Logical coordinates are separate from device pixels. Cursor coordinates and capture dimensions never silently disagree on Retina and DPI-scaled monitors.
- Failures are typed errors, not silent no-ops. Every fallible operation rejects with a `RobotError` carrying a structured `code`.
- There is no global state. Everything hangs off an explicit `Session`, so native lifetimes are clear.

## What it does

- Move the cursor, interpolate motion, click, double-click, drag, and scroll.
- Press and release physical keys by position, build modifier chords, and type arbitrary Unicode text independent of the active keyboard layout.
- Enumerate displays with per-monitor scale factors and logical/physical bounds.
- Capture monitors or regions at native pixel resolution, sample pixels, and encode captures as PNG.
- Record global mouse and keyboard input and replay the captured timeline.
- Report per-environment capabilities so callers can branch on what is actually available.

## Supported platforms

| Platform | Backend | Injection | Capture | Recording |
| --- | --- | --- | --- | --- |
| macOS | Quartz (CoreGraphics) | yes, needs Accessibility | yes, needs Screen Recording | yes, needs Accessibility |
| Windows | SendInput + GDI | yes | yes | yes |
| Linux (X11) | XTest + XRandR + XRecord | yes | yes | yes |
| Linux (Wayland) | uinput, opt-in | keyboard + relative mouse only | no | no |

Prebuilt binaries ship for macOS, Windows, and Linux on Node 18, 20, and 22.

## Requirements

- Node.js 18.17 or newer.
- No build toolchain when a prebuilt binary matches your platform and Node ABI.
- Source builds need CMake 3.24+ and a C++23 compiler: Apple Clang 17+ on macOS, current MSVC on Windows, or GCC 14+ on Linux. Linux source builds also need `libx11-dev`, `libxtst-dev`, and `libxrandr-dev`.

## Installation

```bash
pnpm add robot-ts
```

## Quick start

```typescript
import { Session } from 'robot-ts'

const session = await Session.create()

try {
  await session.mouse.moveSmooth({ x: 400, y: 300 })
  await session.keyboard.typeText('Hello, 世界!')
} finally {
  await session.dispose()
}
```

`Session` holds native resources, so dispose it when finished. On Node 20+ you can let the runtime do that with `await using`:

```typescript
import { Session } from 'robot-ts'

await using session = await Session.create()
await session.keyboard.typeText('disposed automatically at end of scope')
```

## Core concepts

### A session owns the backend

All state lives on a `Session`. `Session.create()` loads the native addon, selects a backend, checks requested permissions, and resolves to a fully formed session or rejects with a `RobotError`. The session exposes `keyboard`, `mouse`, `screen`, `eventTap`, and a `capabilities` report.

### Physical keys versus text

- A `Key` names a physical key by position. Use physical keys for shortcuts, chords, and games.
- Text (`typeText`, `typeChar`) injects Unicode directly and is layout-independent. Use it for specific characters, symbols, accents, CJK text, and emoji.

Modifier semantics differ per platform and the library does not remap them: `Modifier.Meta` is Command on macOS and the Super/Windows key on Windows and Linux, and `Modifier.Alt` is Option on macOS. A cross-platform "select all" is `Meta+A` on macOS and `Control+A` on Windows and Linux.

### Logical versus physical coordinates

- Logical coordinates are DPI-independent desktop units. Cursor movement and position operate here.
- Physical coordinates are device pixels. Screen capture and pixel access operate here.

Each `Monitor` carries its own `scaleFactor`, logical bounds, and physical bounds.

TypeScript is structurally typed, so `LogicalPoint` and `PhysicalPoint` have the same shape and the compiler will not stop you passing one where the other is expected. The names document the intended coordinate space; correctness rests on calling the right method.

## Keyboard

```typescript
import { Key, Modifier, Session } from 'robot-ts'

const session = await Session.create()

await session.keyboard.typeText('café 日本語')
await session.keyboard.typeTextHumanLike('dear reviewer,')
await session.keyboard.tap(Key.Enter)
await session.keyboard.tap(Key.C, Modifier.Control)
await session.keyboard.tap(Key.S, [Modifier.Control, Modifier.Shift])
await session.keyboard.press(Key.W)
await session.keyboard.release(Key.W)
```

## Mouse

Mouse control operates in global logical coordinates.

```typescript
import { MouseButton, pixels, lines, Session } from 'robot-ts'

const session = await Session.create()

await session.mouse.move({ x: 800, y: 450 })
await session.mouse.moveSmooth({ x: 100, y: 100 })
await session.mouse.click()
await session.mouse.click(MouseButton.Right)
await session.mouse.doubleClick()
await session.mouse.click(MouseButton.X1) // needs capabilities.supportsExtraMouseButtons
await session.mouse.drag({ x: 500, y: 500 })
await session.mouse.scroll(lines(3))
await session.mouse.scroll(pixels(-120)) // needs capabilities.supportsHighResolutionScroll

const position = await session.mouse.position()
```

Scroll sign convention, applied before any operating-system natural scrolling setting: `vertical > 0` scrolls up, `vertical < 0` scrolls down, `horizontal > 0` scrolls right, and `horizontal < 0` scrolls left. Natural scrolling may invert the visible direction; that is a user preference the library does not hide.

## Screen

Capture regions are specified in device pixels.

```typescript
import { Session } from 'robot-ts'

const session = await Session.create()
const monitors = await session.screen.monitors()
const primary = await session.screen.primaryMonitor()
const image = await session.screen.captureMonitor(primary.id)

await image.savePng('primary.png')

const buffer = image.toBuffer()
const color = await session.screen.pixel({ x: 100, y: 200 })
```

`Image` keeps pixels in native memory. `savePng` encodes natively, `toBuffer` copies RGBA bytes once, and `at(x, y)` reads one pixel.

## Recording and replay

```typescript
import { Recorder, Session } from 'robot-ts'

const session = await Session.create()

if (!session.capabilities.canRecordEvents) {
  throw new Error('Global recording is not available on this backend')
}

const recorder = new Recorder()
await recorder.attach(session.eventTap)

await new Promise((resolve) => setTimeout(resolve, 5000))
await session.eventTap.stop()

const json = recorder.toJSON()
const restored = Recorder.fromJSON(json)
await restored.replay(session)
await session.dispose()
```

## Errors

Every failure is a `RobotError` with a structured `code` from `ErrorCode`: `Unsupported`, `PermissionDenied`, `BackendUnavailable`, `InvalidArgument`, `MonitorNotFound`, `UnmappableInput`, `CaptureFailed`, `EncodeFailed`, `IoError`, or `PlatformError`.

```typescript
import { ErrorCode, RobotError, Session } from 'robot-ts'

const session = await Session.create()

try {
  await session.mouse.move({ x: 100, y: 100 })
} catch (error) {
  if (RobotError.is(error) && error.code === ErrorCode.Unsupported) {
    // Cursor warping may be unsupported under native Wayland.
  }
}
```

## Platform limitations

### macOS

Injection and global recording require Accessibility permission. Screen capture requires Screen Recording permission.

```typescript
const session = await Session.create({
  requireInputPermission: true,
  requireCapturePermission: true,
})
```

### Windows

No runtime permission is required for injection or capture from an interactive desktop session. Injection into a higher-integrity window can be blocked by the OS and rejects as a platform error.

### Linux

Under X11 the library supports injection, capture, and recording. Under native Wayland, unprivileged clients cannot inject input, warp or read the cursor, or capture the screen. The uinput backend can inject keyboard and relative pointer motion when `/dev/uinput` access is granted.

```typescript
import { LinuxBackend, Session } from 'robot-ts'

const session = await Session.create({ linuxBackend: LinuxBackend.Uinput })
```

## Building from source

```bash
git clone --recurse-submodules https://github.com/developer239/robot-ts.git
cd robot-ts
pnpm install
pnpm run build
pnpm test
```

The native addon links the vendored `robot-cpp` submodule under `native/vendor/robot-cpp`.

## License

MIT. See [LICENSE](./LICENSE).
