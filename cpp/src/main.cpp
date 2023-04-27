#include <napi.h>
#include "MouseBinding.h"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  exports.Set("Mouse", InitMouse(env));
  return exports;
}

NODE_API_MODULE(robotcpp_node_bindings, InitAll);
