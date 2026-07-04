#pragma once

#include <atomic>
#include <memory>
#include <napi.h>
#include <thread>

#include "robot/EventTap.h"
#include "robot/Session.h"

namespace robot_ts {

class SessionWrap : public Napi::ObjectWrap<SessionWrap> {
 public:
  static Napi::Function Init(Napi::Env env);
  static Napi::Object Create(Napi::Env env, Napi::Object options);

  explicit SessionWrap(const Napi::CallbackInfo& info);
  ~SessionWrap() override;

 private:
  static Napi::FunctionReference constructor;

  Napi::Value Capabilities(const Napi::CallbackInfo& info);
  Napi::Value KeyDown(const Napi::CallbackInfo& info);
  Napi::Value KeyUp(const Napi::CallbackInfo& info);
  Napi::Value TypeChar(const Napi::CallbackInfo& info);
  Napi::Value TypeText(const Napi::CallbackInfo& info);
  Napi::Value WarpCursor(const Napi::CallbackInfo& info);
  Napi::Value CursorPosition(const Napi::CallbackInfo& info);
  Napi::Value Button(const Napi::CallbackInfo& info);
  Napi::Value Scroll(const Napi::CallbackInfo& info);
  Napi::Value EnumerateMonitors(const Napi::CallbackInfo& info);
  Napi::Value CaptureRegion(const Napi::CallbackInfo& info);
  Napi::Value Pixel(const Napi::CallbackInfo& info);
  Napi::Value IsEventTapSupported(const Napi::CallbackInfo& info);
  Napi::Value IsEventTapRunning(const Napi::CallbackInfo& info);
  Napi::Value StartEventTap(const Napi::CallbackInfo& info);
  Napi::Value StopEventTap(const Napi::CallbackInfo& info);
  Napi::Value Dispose(const Napi::CallbackInfo& info);

  void stopTapInternal();
  robot::Session& session(Napi::Env env);

  std::unique_ptr<robot::Session> session_;
  Napi::ThreadSafeFunction tapTsfn_;
  std::thread tapThread_;
  std::atomic<bool> tapRunning_{false};
};

}  // namespace robot_ts
