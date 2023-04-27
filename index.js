const robotcpp = require('./cpp/build/Release/robotcpp_node_bindings.node');

robotcpp.move({x: 100, y: 200});

const Mouse = {
    move: (point) => {
        robotcpp.move(point);
    },
};

module.exports = {
    Mouse,
}
