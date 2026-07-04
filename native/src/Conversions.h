#pragma once

#include <expected>
#include <napi.h>

#include "robot/Capabilities.h"
#include "robot/Error.h"
#include "robot/Event.h"
#include "robot/Image.h"
#include "robot/Monitor.h"

namespace robot_ts {

[[noreturn]] void throwRobotError(Napi::Env env, const robot::Error& error);

template <typename T>
T unwrap(Napi::Env env, std::expected<T, robot::Error>&& result) {
  if (!result) {
    throwRobotError(env, result.error());
  }

  return std::move(*result);
}

inline void unwrapVoid(
    Napi::Env env, std::expected<void, robot::Error>&& result
) {
  if (!result) {
    throwRobotError(env, result.error());
  }
}

Napi::Object capabilitiesToJs(Napi::Env env, const robot::Capabilities& caps);
Napi::Array monitorsToJs(Napi::Env env, const std::vector<robot::Monitor>& monitors);
Napi::Object rgbaToJs(Napi::Env env, const robot::Rgba& pixel);
Napi::Object inputEventToJs(Napi::Env env, const robot::InputEvent& event);

}  // namespace robot_ts
