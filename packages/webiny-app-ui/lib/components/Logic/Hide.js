"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Hide = function Hide(props) {
    var hide = false;
    if (typeof props.if === "function") {
        hide = props.if();
    } else if (props.if === true) {
        hide = true;
    }

    if (hide) {
        return _react2.default.createElement("webiny-hide", null);
    }

    var children = _react2.default.Children.toArray(props.children);
    if (children.length === 1) {
        return _react2.default.createElement("webiny-hide", null, children[0]);
    }

    return _react2.default.createElement("webiny-hide", null, props.children);
};

exports.default = Hide;
//# sourceMappingURL=Hide.js.map
