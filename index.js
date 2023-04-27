const robot = require('./cpp/build/Release/robotcpp_node_bindings.node');

module.exports = {
  Mouse: robot.Mouse,
  MouseButton: robot.Mouse.MouseButton,
  Keyboard: robot.Keyboard,
  SpecialKey: robot.Keyboard.SpecialKey,
  Screen: robot.Screen
};
