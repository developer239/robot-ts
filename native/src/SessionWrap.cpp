#include "SessionWrap.h"

#include <cstdint>
#include <string>
#include <utility>
#include <vector>

#include "Conversions.h"
#include "ImageWrap.h"
#include "robot/Key.h"
#include "robot/MouseButton.h"
#include "robot/Scroll.h"

namespace robot_ts {

Napi::FunctionReference SessionWrap::constructor;

Napi::Function SessionWrap::Init(Napi::Env env) {
  Napi::Function func = DefineClass(
      env, "NativeSession",
      {
          InstanceMethod("capabilities", &SessionWrap::Capabilities),
          InstanceMethod("keyDown", &SessionWrap::KeyDown),
          InstanceMethod("keyUp", &SessionWrap::KeyUp),
          InstanceMethod("typeChar", &SessionWrap::TypeChar),
          InstanceMethod("typeText", &SessionWrap::TypeText),
          InstanceMethod("warpCursor", &SessionWrap::WarpCursor),
          InstanceMethod("cursorPosition", &SessionWrap::CursorPosition),
          InstanceMethod("button", &SessionWrap::Button),
          InstanceMethod("scroll", &SessionWrap::Scroll),
          InstanceMethod("enumerateMonitors", &SessionWrap::EnumerateMonitors),
          InstanceMethod("captureRegion", &SessionWrap::CaptureRegion),
          InstanceMethod("pixel", &SessionWrap::Pixel),
          InstanceMethod("isEventTapSupported", &SessionWrap::IsEventTapSupported),
          InstanceMethod("isEventTapRunning", &SessionWrap::IsEventTapRunning),
          InstanceMethod("startEventTap", &SessionWrap::StartEventTap),
          InstanceMethod("stopEventTap", &SessionWrap::StopEventTap),
          InstanceMethod("dispose", &SessionWrap::Dispose),
      }
  );
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  return func;
}

namespace {

robot::SessionOptions readOptions(Napi::Object opts) {
  robot::SessionOptions out;

  if (opts.Has("requireInputPermission")) {
    out.requireInputPermission = opts.Get("requireInputPermission").ToBoolean().Value();
  }
  if (opts.Has("requireCapturePermission")) {
    out.requireCapturePermission = opts.Get("requireCapturePermission").ToBoolean().Value();
  }
  if (opts.Has("linuxBackend")) {
    out.linuxBackend = static_cast<robot::LinuxBackend>(
        opts.Get("linuxBackend").ToNumber().Uint32Value()
    );
  }

  return out;
}

}  // namespace

Napi::Object SessionWrap::Create(Napi::Env env, Napi::Object options) {
  return constructor.New({options});
}

SessionWrap::SessionWrap(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<SessionWrap>(info) {
  Napi::Env env = info.Env();
  Napi::Object opts =
      info.Length() >= 1 && info[0].IsObject() ? info[0].As<Napi::Object>() : Napi::Object::New(env);
  auto created = robot::Session::create(readOptions(opts));

  if (!created) {
    throwRobotError(env, created.error());
    return;
  }

  session_ = std::move(*created);
}

SessionWrap::~SessionWrap() {
  stopTapInternal();
}

robot::Session& SessionWrap::session(Napi::Env env) {
  if (!session_) {
    Napi::Error::New(env, "Session has been disposed").ThrowAsJavaScriptException();
    throw Napi::Error::New(env, "Session has been disposed");
  }

  return *session_;
}

Napi::Value SessionWrap::Capabilities(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return capabilitiesToJs(env, session(env).capabilities());
}

Napi::Value SessionWrap::KeyDown(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  const auto usage = static_cast<std::uint16_t>(info[0].ToNumber().Uint32Value());
  unwrapVoid(env, session(env).keyboard().press(static_cast<robot::Key>(usage)));
  return env.Undefined();
}

Napi::Value SessionWrap::KeyUp(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  const auto usage = static_cast<std::uint16_t>(info[0].ToNumber().Uint32Value());
  unwrapVoid(env, session(env).keyboard().release(static_cast<robot::Key>(usage)));
  return env.Undefined();
}

Napi::Value SessionWrap::TypeChar(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  const auto cp = static_cast<char32_t>(info[0].ToNumber().Uint32Value());
  unwrapVoid(env, session(env).keyboard().typeChar(cp));
  return env.Undefined();
}

Napi::Value SessionWrap::TypeText(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  const std::string text = info[0].As<Napi::String>().Utf8Value();
  unwrapVoid(env, session(env).keyboard().typeText(text));
  return env.Undefined();
}

Napi::Value SessionWrap::WarpCursor(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  const double x = info[0].ToNumber().DoubleValue();
  const double y = info[1].ToNumber().DoubleValue();
  unwrapVoid(env, session(env).mouse().move(robot::LogicalPoint{x, y}));
  return env.Undefined();
}

Napi::Value SessionWrap::CursorPosition(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  const robot::LogicalPoint point = unwrap(env, session(env).mouse().position());
  Napi::Object obj = Napi::Object::New(env);
  obj.Set("x", Napi::Number::New(env, point.x));
  obj.Set("y", Napi::Number::New(env, point.y));
  return obj;
}

Napi::Value SessionWrap::Button(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  const auto button = static_cast<robot::MouseButton>(info[0].ToNumber().Uint32Value());
  const bool down = info[1].ToBoolean().Value();
  const int clickCount = info[2].ToNumber().Int32Value();

  if (down && clickCount >= 2) {
    unwrapVoid(env, session(env).mouse().doubleClick(button));
    return env.Undefined();
  }
  if (!down && clickCount >= 2) {
    return env.Undefined();
  }
  if (down) {
    unwrapVoid(env, session(env).mouse().press(button));
    return env.Undefined();
  }

  unwrapVoid(env, session(env).mouse().release(button));
  return env.Undefined();
}

Napi::Value SessionWrap::Scroll(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  robot::ScrollDelta delta;
  delta.horizontal = info[0].ToNumber().DoubleValue();
  delta.vertical = info[1].ToNumber().DoubleValue();
  delta.unit = static_cast<robot::ScrollUnit>(info[2].ToNumber().Uint32Value());
  unwrapVoid(env, session(env).mouse().scroll(delta));
  return env.Undefined();
}

Napi::Value SessionWrap::EnumerateMonitors(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  const std::vector<robot::Monitor> monitors = unwrap(env, session(env).screen().monitors());
  return monitorsToJs(env, monitors);
}

Napi::Value SessionWrap::CaptureRegion(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  robot::PhysicalRect region;
  region.origin.x = info[0].ToNumber().Int32Value();
  region.origin.y = info[1].ToNumber().Int32Value();
  region.size.width = info[2].ToNumber().Int32Value();
  region.size.height = info[3].ToNumber().Int32Value();

  robot::Image image = unwrap(env, session(env).screen().capture(region));
  return ImageWrap::Create(env, std::move(image));
}

Napi::Value SessionWrap::Pixel(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  robot::PhysicalPoint point;
  point.x = info[0].ToNumber().Int32Value();
  point.y = info[1].ToNumber().Int32Value();
  const robot::Rgba pixel = unwrap(env, session(env).screen().pixel(point));
  return rgbaToJs(env, pixel);
}

Napi::Value SessionWrap::IsEventTapSupported(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  return Napi::Boolean::New(env, session(env).eventTap().isSupported());
}

Napi::Value SessionWrap::IsEventTapRunning(const Napi::CallbackInfo& info) {
  return Napi::Boolean::New(info.Env(), tapRunning_.load());
}

Napi::Value SessionWrap::StartEventTap(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (tapRunning_.load()) {
    Napi::Error::New(env, "Event tap already running").ThrowAsJavaScriptException();
    return env.Undefined();
  }
  if (info.Length() < 1 || !info[0].IsFunction()) {
    Napi::TypeError::New(env, "startEventTap(onEvent: function) expected")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }

  tapTsfn_ = Napi::ThreadSafeFunction::New(
      env, info[0].As<Napi::Function>(), "robot-ts-eventtap", 0, 1
  );
  tapRunning_.store(true);
  robot::EventTap& tap = session(env).eventTap();
  tapThread_ = std::thread([this, &tap] {
    auto result = tap.start([this](const robot::InputEvent& event) {
      auto* copy = new robot::InputEvent(event);
      tapTsfn_.BlockingCall(
          copy,
          [](Napi::Env env, Napi::Function jsCallback, robot::InputEvent* payload) {
            Napi::Object js = inputEventToJs(env, *payload);
            delete payload;
            jsCallback.Call({js});
          }
      );
    });
    (void)result;
    tapRunning_.store(false);
    tapTsfn_.Release();
  });

  return env.Undefined();
}

Napi::Value SessionWrap::StopEventTap(const Napi::CallbackInfo& info) {
  stopTapInternal();
  return info.Env().Undefined();
}

void SessionWrap::stopTapInternal() {
  if (!tapRunning_.load()) {
    if (tapThread_.joinable()) {
      tapThread_.join();
    }
    return;
  }

  if (session_) {
    session_->eventTap().stop();
  }
  if (tapThread_.joinable()) {
    tapThread_.join();
  }
  tapRunning_.store(false);
}

Napi::Value SessionWrap::Dispose(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  stopTapInternal();
  session_.reset();
  return env.Undefined();
}

}  // namespace robot_ts
