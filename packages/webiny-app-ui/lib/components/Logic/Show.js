"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Show = function Show(props) {
    var show = false;
    if (typeof props.if === "function") {
        show = props.if();
    } else if (props.if === true) {
        show = true;
    }

    if (!show) {
        return _react2.default.createElement("webiny-show", null);
    }

    var children = _react2.default.Children.toArray(props.children);
    if (children.length === 1) {
        return _react2.default.createElement("webiny-show", null, children[0]);
    }

    return _react2.default.createElement("webiny-show", null, props.children);
};

exports.default = Show;
//# sourceMappingURL=Show.js.map
