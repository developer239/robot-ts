# Robot TS

This library is inspired by older unmaintained libraries like [octalmage/robotjs](https://github.com/octalmage/robotjs)
and [Robot/robot-js](https://github.com/Robot/robot-js). The goal is to provide cross-platform controls for various
devices such as keyboard, mouse, and screen for Node.js applications.

**Supported system:**

- MacOS
- Windows **(not tested yet)**

In case of Linux, please, create issue and leave a star and I will implement support. Right now I want to focus on port to
Node.js using Node-API.

### Known issues:

- Work in progress. If you need specific features, please, create an issue and I will prioritize it.
- I never tested this on Windows. 🙏
- It seems that special keys bindings are not implemented correctly.

## Installation:

Make sure that you can build C++ projects on your machine and that you have [CMake](https://cmake.org) installed.

- On MacOS: `brew install cmake`
- On Windows: `choco install cmake`

Install Node dependencies:

```shell
yarn install
```

