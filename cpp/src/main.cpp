#include <napi.h>
#include "MouseBinding.h"
#include "KeyboardBinding.h"
#include "ScreenBinding.h"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  exports.Set("Mouse", InitMouse(env));
  exports.Set("Keyboard", InitKeyboard(env));
  exports.Set("Screen", InitScreen(env));
  return exports;
}


NODE_API_MODULE(robotcpp_node_bindings, InitAll);
