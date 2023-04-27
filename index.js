// TODO: this can be simplified and bindings dependency is not necessary
const addon = require('bindings')({
  bindings: 'robotcpp_node_bindings',
  // TODO: figure out a better way to do this?
  try: [['module_root', 'cpp', 'build', 'Release', 'bindings']]
})

module.exports = {
  Keyboard: addon.Keyboard,
  Mouse: addon.Mouse
}
