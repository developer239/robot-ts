const robot = require('./cpp/build/Release/robotcpp_node_bindings.node');

// robot {
//     Mouse: {
//         move: [Function (anonymous)],
//             moveSmooth: [Function (anonymous)],
//             drag: [Function (anonymous)],
//             getPosition: [Function (anonymous)],
//             toggleButton: [Function (anonymous)],
//             click: [Function (anonymous)],
//             doubleClick: [Function (anonymous)],
//             scrollBy: [Function (anonymous)],
//             MouseButton: { LEFT_BUTTON: 0, RIGHT_BUTTON: 1, CENTER_BUTTON: 2 }
//     }
// }

console.log('robot', robot.Mouse.move({x: 100, y: 100}))

module.exports = {}
