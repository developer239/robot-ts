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

Napi::Value MoveSmooth(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "Expected an object with x and y properties").ThrowAsJavaScriptException();
    return env.Null();
  }

  Napi::Object point = info[0].As<Napi::Object>();
  int x = point.Get("x").As<Napi::Number>().Int32Value();
  int y = point.Get("y").As<Napi::Number>().Int32Value();

  if (info.Length() >= 2 && info[1].IsNumber()) {
    double speed = info[1].As<Napi::Number>().DoubleValue();
    Robot::Mouse::MoveSmooth({x, y}, speed);
  } else {
    Robot::Mouse::MoveSmooth({x, y});
  }

  return env.Null();
}

Napi::Value Drag(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1 || !info[0].IsObject()) {
    Napi::TypeError::New(env, "Expected an object with x and y properties").ThrowAsJavaScriptException();
    return env.Null();
  }

  Napi::Object point = info[0].As<Napi::Object>();
  int x = point.Get("x").As<Napi::Number>().Int32Value();
  int y = point.Get("y").As<Napi::Number>().Int32Value();

  if (info.Length() >= 2 && info[1].IsNumber()) {
    double speed = info[1].As<Napi::Number>().DoubleValue();
    Robot::Mouse::Drag({x, y}, speed);
  } else {
    Robot::Mouse::Drag({x, y});
  }

  return env.Null();
}

Napi::Value GetPosition(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  Robot::Point point = Robot::Mouse::GetPosition();

  Napi::Object result = Napi::Object::New(env);
  result.Set("x", Napi::Number::New(env, point.x));
  result.Set("y", Napi::Number::New(env, point.y));

  return result;
}

Napi::Value ToggleButton(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 2 || !info[0].IsBoolean() || !info[1].IsNumber()) {
    Napi::TypeError::New(env, "Expected a boolean and a MouseButton").ThrowAsJavaScriptException();
    return env.Null();
  }

  bool down = info[0].As<Napi::Boolean>().Value();
  Robot::MouseButton button = static_cast<Robot::MouseButton>(info[1].As<Napi::Number>().Uint32Value());
  bool doubleClick = false;

  if (info.Length() >= 3 && info[2].IsBoolean()) {
    doubleClick = info[2].As<Napi::Boolean>().Value();
  }

  Robot::Mouse::ToggleButton(down, button, doubleClick);

  return env.Null();
}

Napi::Value Click(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Expected a MouseButton").ThrowAsJavaScriptException();
    return env.Null();
  }

  Robot::MouseButton button = static_cast<Robot::MouseButton>(info[0].As<Napi::Number>().Uint32Value());

  Robot::Mouse::Click(button);

  return env.Null();
}

Napi::Value DoubleClick(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() != 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Expected a MouseButton").ThrowAsJavaScriptException();
    return env.Null();
  }

  Robot::MouseButton button = static_cast<Robot::MouseButton>(info[0].As<Napi::Number>().Uint32Value());

  Robot::Mouse::DoubleClick(button);

  return env.Null();
}

Napi::Value ScrollBy(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1 || !info[0].IsNumber()) {
    Napi::TypeError::New(env, "Expected a number for y").ThrowAsJavaScriptException();
    return env.Null();
  }

  int y = info[0].As<Napi::Number>().Int32Value();
  int x = 0;

  if (info.Length() >= 2 && info[1].IsNumber()) {
    x = info[1].As<Napi::Number>().Int32Value();
  }

  Robot::Mouse::ScrollBy(y, x);

  return env.Null();
}

Napi::Object InitMouse(Napi::Env env) {
  Napi::Object mouse = Napi::Object::New(env);

  mouse.Set("move", Napi::Function::New(env, Move));
  mouse.Set("moveSmooth", Napi::Function::New(env, MoveSmooth));
  mouse.Set("drag", Napi::Function::New(env, Drag));
  mouse.Set("getPosition", Napi::Function::New(env, GetPosition));
  mouse.Set("toggleButton", Napi::Function::New(env, ToggleButton));
  mouse.Set("click", Napi::Function::New(env, Click));
  mouse.Set("doubleClick", Napi::Function::New(env, DoubleClick));
  mouse.Set("scrollBy", Napi::Function::New(env, ScrollBy));

  Napi::Object mouseButton = Napi::Object::New(env);
  mouseButton.Set("LEFT_BUTTON", Napi::Number::New(env, static_cast<int>(Robot::MouseButton::LEFT_BUTTON)));
  mouseButton.Set("RIGHT_BUTTON", Napi::Number::New(env, static_cast<int>(Robot::MouseButton::RIGHT_BUTTON)));
  mouseButton.Set("CENTER_BUTTON", Napi::Number::New(env, static_cast<int>(Robot::MouseButton::CENTER_BUTTON)));
  mouse.Set("MouseButton", mouseButton);

  return mouse;
}

