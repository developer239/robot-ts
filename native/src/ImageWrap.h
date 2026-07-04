#pragma once

#include <napi.h>

#include "robot/Image.h"

namespace robot_ts {

class ImageWrap : public Napi::ObjectWrap<ImageWrap> {
 public:
  static Napi::Function Init(Napi::Env env);
  static Napi::Object Create(Napi::Env env, robot::Image image);

  explicit ImageWrap(const Napi::CallbackInfo& info);

 private:
  static Napi::FunctionReference constructor;

  Napi::Value Width(const Napi::CallbackInfo& info);
  Napi::Value Height(const Napi::CallbackInfo& info);
  Napi::Value SavePng(const Napi::CallbackInfo& info);
  Napi::Value ToBuffer(const Napi::CallbackInfo& info);

  robot::Image image_;
};

}  // namespace robot_ts
