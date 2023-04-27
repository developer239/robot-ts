#include "Keyboard.h"
#include <napi.h>

Napi::Value KeyboardType(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  if (info.Length() != 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected a string").ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string query = info[0].As<Napi::String>().Utf8Value();

  Robot::Keyboard::Type(query);

  return env.Null();
}

Napi::Value KeyboardTypeHumanLike(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  if (info.Length() != 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected a string").ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string query = info[0].As<Napi::String>().Utf8Value();

  Robot::Keyboard::TypeHumanLike(query);

  return env.Null();
}

Napi::Value KeyboardClick(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  if (info.Length() != 1 || (!info[0].IsString() && !info[0].IsNumber())) {
    Napi::TypeError::New(env, "Expected a string or a SpecialKey")
        .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (info[0].IsString()) {
    std::string asciiChar = info[0].As<Napi::String>().Utf8Value();
    Robot::Keyboard::Click(asciiChar[0]);
  } else {
    Robot::Keyboard::SpecialKey specialKey =
        static_cast<Robot::Keyboard::SpecialKey>(
            info[0].As<Napi::Number>().Uint32Value());
    Robot::Keyboard::Click(specialKey);
  }

  return env.Null();
}

Napi::Value KeyboardPress(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  if (info.Length() != 1 || (!info[0].IsString() && !info[0].IsNumber())) {
    Napi::TypeError::New(env, "Expected a string or a SpecialKey")
        .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (info[0].IsString()) {
    std::string asciiChar = info[0].As<Napi::String>().Utf8Value();
    Robot::Keyboard::Press(asciiChar[0]);
  } else {
    Robot::Keyboard::SpecialKey specialKey =
        static_cast<Robot::Keyboard::SpecialKey>(
            info[0].As<Napi::Number>().Uint32Value());
    Robot::Keyboard::Press(specialKey);
  }

  return env.Null();
}

Napi::Value KeyboardRelease(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  if (info.Length() != 1 || (!info[0].IsString() && !info[0].IsNumber())) {
    Napi::TypeError::New(env, "Expected a string or a SpecialKey")
        .ThrowAsJavaScriptException();
    return env.Null();
  }

  if (info[0].IsString()) {
    std::string asciiChar = info[0].As<Napi::String>().Utf8Value();
    Robot::Keyboard::Release(asciiChar[0]);
  } else {
    Robot::Keyboard::SpecialKey specialKey =
        static_cast<Robot::Keyboard::SpecialKey>(
            info[0].As<Napi::Number>().Uint32Value());
    Robot::Keyboard::Release(specialKey);
  }

  return env.Null();
}

Napi::Object InitKeyboard(Napi::Env env) {
  Napi::Object keyboard = Napi::Object::New(env);

  keyboard.Set("type", Napi::Function::New(env, KeyboardType));
  keyboard.Set("typeHumanLike", Napi::Function::New(env, KeyboardTypeHumanLike));
  keyboard.Set("click", Napi::Function::New(env, KeyboardClick));
  keyboard.Set("press", Napi::Function::New(env, KeyboardPress));
  keyboard.Set("release", Napi::Function::New(env, KeyboardRelease));

  Napi::Object specialKey = Napi::Object::New(env);
  for (int i = Robot::Keyboard::SpecialKey::BACKSPACE;
       i <= Robot::Keyboard::SpecialKey::CAPSLOCK; i++) {
    specialKey.Set(i, Napi::Number::New(env, static_cast<int>(i)));
  }
  keyboard.Set("SpecialKey", specialKey);

  return keyboard;
}
