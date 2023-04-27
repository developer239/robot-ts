#include <napi.h>
#include "Mouse.h"

Napi::Value Move(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 1 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "Expected an object with x and y properties").ThrowAsJavaScriptException();
    return env.Null();
  }

  Napi::Object point = info[0].As<Napi::Object>();
  int x = point.Get("x").As<Napi::Number>().Int32Value();
  int y = point.Get("y").As<Napi::Number>().Int32Value();

  Robot::Mouse::Move({x, y});

  return env.Null();
}

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  exports.Set("move", Napi::Function::New(env, Move));
  // Add other Mouse methods here
  return exports;
}

NODE_API_MODULE(robotcpp_node_bindings, InitAll);
