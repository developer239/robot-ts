#include "Conversions.h"

#include <string>
#include <variant>

#include "robot/Key.h"

namespace robot_ts {
namespace {

template <class... Ts>
struct Overloaded : Ts... {
  using Ts::operator()...;
};

Napi::Object logicalPointToJs(Napi::Env env, const robot::LogicalPoint& point) {
  Napi::Object obj = Napi::Object::New(env);
  obj.Set("x", Napi::Number::New(env, point.x));
  obj.Set("y", Napi::Number::New(env, point.y));
  return obj;
}

Napi::Object logicalRectToJs(Napi::Env env, const robot::LogicalRect& rect) {
  Napi::Object origin = logicalPointToJs(env, rect.origin);
  Napi::Object size = Napi::Object::New(env);
  size.Set("width", Napi::Number::New(env, rect.size.width));
  size.Set("height", Napi::Number::New(env, rect.size.height));

  Napi::Object obj = Napi::Object::New(env);
  obj.Set("origin", origin);
  obj.Set("size", size);
  return obj;
}

Napi::Object physicalRectToJs(Napi::Env env, const robot::PhysicalRect& rect) {
  Napi::Object origin = Napi::Object::New(env);
  origin.Set("x", Napi::Number::New(env, rect.origin.x));
  origin.Set("y", Napi::Number::New(env, rect.origin.y));

  Napi::Object size = Napi::Object::New(env);
  size.Set("width", Napi::Number::New(env, rect.size.width));
  size.Set("height", Napi::Number::New(env, rect.size.height));

  Napi::Object obj = Napi::Object::New(env);
  obj.Set("origin", origin);
  obj.Set("size", size);
  return obj;
}

Napi::Object scrollDeltaToJs(Napi::Env env, const robot::ScrollDelta& delta) {
  Napi::Object obj = Napi::Object::New(env);
  obj.Set("horizontal", Napi::Number::New(env, delta.horizontal));
  obj.Set("vertical", Napi::Number::New(env, delta.vertical));
  obj.Set("unit", Napi::Number::New(env, static_cast<int>(delta.unit)));
  return obj;
}

}  // namespace

void throwRobotError(Napi::Env env, const robot::Error& error) {
  Napi::Error jsError = Napi::Error::New(env, error.message);
  jsError.Set("code", Napi::String::New(env, std::string(robot::toString(error.code))));
  jsError.ThrowAsJavaScriptException();
  throw jsError;
}

Napi::Object capabilitiesToJs(Napi::Env env, const robot::Capabilities& caps) {
  Napi::Object obj = Napi::Object::New(env);
  obj.Set("backendName", Napi::String::New(env, caps.backendName));
  obj.Set("canInjectKeyboard", Napi::Boolean::New(env, caps.canInjectKeyboard));
  obj.Set("canInjectMouse", Napi::Boolean::New(env, caps.canInjectMouse));
  obj.Set("canTypeUnicode", Napi::Boolean::New(env, caps.canTypeUnicode));
  obj.Set("canWarpCursor", Napi::Boolean::New(env, caps.canWarpCursor));
  obj.Set("canReadCursorPosition", Napi::Boolean::New(env, caps.canReadCursorPosition));
  obj.Set("supportsExtraMouseButtons", Napi::Boolean::New(env, caps.supportsExtraMouseButtons));
  obj.Set("supportsHighResolutionScroll", Napi::Boolean::New(env, caps.supportsHighResolutionScroll));
  obj.Set("canCaptureScreen", Napi::Boolean::New(env, caps.canCaptureScreen));
  obj.Set("canEnumerateMonitors", Napi::Boolean::New(env, caps.canEnumerateMonitors));
  obj.Set("canRecordEvents", Napi::Boolean::New(env, caps.canRecordEvents));
  obj.Set("requiresAccessibilityPermission", Napi::Boolean::New(env, caps.requiresAccessibilityPermission));
  obj.Set("requiresScreenRecordingPermission", Napi::Boolean::New(env, caps.requiresScreenRecordingPermission));
  return obj;
}

Napi::Array monitorsToJs(Napi::Env env, const std::vector<robot::Monitor>& monitors) {
  Napi::Array arr = Napi::Array::New(env, monitors.size());

  for (std::size_t i = 0; i < monitors.size(); ++i) {
    const robot::Monitor& monitor = monitors[i];
    Napi::Object obj = Napi::Object::New(env);
    obj.Set("id", Napi::Number::New(env, monitor.id));
    obj.Set("name", Napi::String::New(env, monitor.name));
    obj.Set("isPrimary", Napi::Boolean::New(env, monitor.isPrimary));
    obj.Set("logicalBounds", logicalRectToJs(env, monitor.logicalBounds));
    obj.Set("physicalBounds", physicalRectToJs(env, monitor.physicalBounds));
    obj.Set("scaleFactor", Napi::Number::New(env, monitor.scaleFactor));
    arr.Set(i, obj);
  }

  return arr;
}

Napi::Object rgbaToJs(Napi::Env env, const robot::Rgba& pixel) {
  Napi::Object obj = Napi::Object::New(env);
  obj.Set("r", Napi::Number::New(env, pixel.r));
  obj.Set("g", Napi::Number::New(env, pixel.g));
  obj.Set("b", Napi::Number::New(env, pixel.b));
  obj.Set("a", Napi::Number::New(env, pixel.a));
  return obj;
}

Napi::Object inputEventToJs(Napi::Env env, const robot::InputEvent& event) {
  Napi::Object obj = Napi::Object::New(env);
  std::visit(
      Overloaded{
          [&](const robot::KeyEvent& key) {
            obj.Set("type", Napi::String::New(env, "key"));
            obj.Set("key", Napi::Number::New(env, robot::keyToHidUsage(key.key)));
            obj.Set("down", Napi::Boolean::New(env, key.down));
          },
          [&](const robot::MouseMoveEvent& move) {
            obj.Set("type", Napi::String::New(env, "mouseMove"));
            obj.Set("position", logicalPointToJs(env, move.position));
          },
          [&](const robot::MouseButtonEvent& button) {
            obj.Set("type", Napi::String::New(env, "mouseButton"));
            obj.Set("button", Napi::Number::New(env, static_cast<int>(button.button)));
            obj.Set("down", Napi::Boolean::New(env, button.down));
            obj.Set("position", logicalPointToJs(env, button.position));
          },
          [&](const robot::ScrollEvent& scroll) {
            obj.Set("type", Napi::String::New(env, "scroll"));
            obj.Set("delta", scrollDeltaToJs(env, scroll.delta));
            obj.Set("position", logicalPointToJs(env, scroll.position));
          },
      },
      event
  );
  return obj;
}

}  // namespace robot_ts
