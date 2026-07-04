#include "ImageWrap.h"

#include <cstdint>
#include <string>

#include "Conversions.h"

namespace robot_ts {

Napi::FunctionReference ImageWrap::constructor;

Napi::Function ImageWrap::Init(Napi::Env env) {
  Napi::Function func = DefineClass(
      env, "NativeImage",
      {
          InstanceMethod("width", &ImageWrap::Width),
          InstanceMethod("height", &ImageWrap::Height),
          InstanceMethod("savePng", &ImageWrap::SavePng),
          InstanceMethod("toBuffer", &ImageWrap::ToBuffer),
      }
  );
  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();
  return func;
}

Napi::Object ImageWrap::Create(Napi::Env env, robot::Image image) {
  auto* heap = new robot::Image(std::move(image));
  Napi::External<robot::Image> external =
      Napi::External<robot::Image>::New(env, heap, [](Napi::Env, robot::Image* ptr) {
        delete ptr;
      });

  return constructor.New({external});
}

ImageWrap::ImageWrap(const Napi::CallbackInfo& info)
    : Napi::ObjectWrap<ImageWrap>(info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1 || !info[0].IsExternal()) {
    Napi::Error::New(env, "NativeImage is not constructible directly")
        .ThrowAsJavaScriptException();
    return;
  }

  auto* src = info[0].As<Napi::External<robot::Image>>().Data();
  image_ = std::move(*src);
}

Napi::Value ImageWrap::Width(const Napi::CallbackInfo& info) {
  return Napi::Number::New(info.Env(), image_.width());
}

Napi::Value ImageWrap::Height(const Napi::CallbackInfo& info) {
  return Napi::Number::New(info.Env(), image_.height());
}

Napi::Value ImageWrap::SavePng(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 1 || !info[0].IsString()) {
    Napi::TypeError::New(env, "savePng(path: string) expected")
        .ThrowAsJavaScriptException();
    return env.Undefined();
  }

  const std::string path = info[0].As<Napi::String>().Utf8Value();
  unwrapVoid(env, image_.savePng(path));
  return env.Undefined();
}

Napi::Value ImageWrap::ToBuffer(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();
  const auto& pixels = image_.pixels();
  const std::size_t byteLength = pixels.size() * 4;
  Napi::Buffer<std::uint8_t> buffer = Napi::Buffer<std::uint8_t>::New(env, byteLength);
  std::uint8_t* out = buffer.Data();

  for (std::size_t i = 0; i < pixels.size(); ++i) {
    const robot::Rgba& pixel = pixels[i];
    out[i * 4 + 0] = pixel.r;
    out[i * 4 + 1] = pixel.g;
    out[i * 4 + 2] = pixel.b;
    out[i * 4 + 3] = pixel.a;
  }

  return buffer;
}

}  // namespace robot_ts
