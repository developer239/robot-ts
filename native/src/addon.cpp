#include <napi.h>

#include "ImageWrap.h"
#include "SessionWrap.h"

namespace {

Napi::Value CreateSession(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  Napi::Object options =
      info.Length() >= 1 && info[0].IsObject() ? info[0].As<Napi::Object>() : Napi::Object::New(env);

  return robot_ts::SessionWrap::Create(env, options);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  robot_ts::SessionWrap::Init(env);
  robot_ts::ImageWrap::Init(env);
  exports.Set("createSession", Napi::Function::New(env, CreateSession));

  return exports;
}

}  // namespace

NODE_API_MODULE(robot_ts_native, Init)
