#include "Screen.h"
#include <napi.h>

Napi::Object GetPixelColor(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  if (info.Length() != 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
    Napi::TypeError::New(env, "Expected two numbers (x, y)")
        .ThrowAsJavaScriptException();
  }

  int x = info[0].As<Napi::Number>().Int32Value();
  int y = info[1].As<Napi::Number>().Int32Value();

  Robot::Screen screen;
  Robot::Pixel pixel = screen.GetPixelColor(x, y);

  Napi::Object result = Napi::Object::New(env);
  result.Set("r", Napi::Number::New(env, pixel.r));
  result.Set("g", Napi::Number::New(env, pixel.g));
  result.Set("b", Napi::Number::New(env, pixel.b));

  return result;
}

Napi::Object GetScreenSize(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  Robot::Screen screen;
  Robot::DisplaySize displaySize = screen.GetScreenSize();

  Napi::Object result = Napi::Object::New(env);
  result.Set("width", Napi::Number::New(env, displaySize.width));
  result.Set("height", Napi::Number::New(env, displaySize.height));

  return result;
}

Napi::Value Capture(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  int x = 0, y = 0, width = -1, height = -1;

  if (info.Length() > 0 && !info[0].IsUndefined()) {
    x = info[0].As<Napi::Number>().Int32Value();
  }
  if (info.Length() > 1 && !info[1].IsUndefined()) {
    y = info[1].As<Napi::Number>().Int32Value();
  }
  if (info.Length() > 2 && !info[2].IsUndefined()) {
    width = info[2].As<Napi::Number>().Int32Value();
  }
  if (info.Length() > 3 && !info[3].IsUndefined()) {
    height = info[3].As<Napi::Number>().Int32Value();
  }

  Robot::Screen screen;
  screen.Capture(x, y, width, height);

  return env.Null();
}

Napi::Value GetPixels(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  Robot::Screen screen;
  std::vector<Robot::Pixel> pixels = screen.GetPixels();

  Napi::Array result = Napi::Array::New(env, pixels.size());

  for (size_t i = 0; i < pixels.size(); i++) {
    Napi::Object pixel = Napi::Object::New(env);
    pixel.Set("r", Napi::Number::New(env, pixels[i].r));
    pixel.Set("g", Napi::Number::New(env, pixels[i].g));
    pixel.Set("b", Napi::Number::New(env, pixels[i].b));
    result.Set(i, pixel);
  }

  return result;
}

Napi::Value SaveAsPNG(const Napi::CallbackInfo &info) {
  Napi::Env env = info.Env();

  if (info.Length() != 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "Expected a string for the filename")
        .ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string filename = info[0].As<Napi::String>().Utf8Value();

  Robot::Screen screen;
  screen.saveAsPNG(filename);

  return env.Null();
}

Napi::Object InitScreen(Napi::Env env) {
  Napi::Object screen = Napi::Object::New(env);

  screen.Set("getPixelColor", Napi::Function::New(env, GetPixelColor));
  screen.Set("getScreenSize", Napi::Function::New(env, GetScreenSize));
  screen.Set("capture", Napi::Function::New(env, Capture));
  screen.Set("getPixels", Napi::Function::New(env, GetPixels));
  screen.Set("saveAsPNG", Napi::Function::New(env, SaveAsPNG));

  return screen;
}
