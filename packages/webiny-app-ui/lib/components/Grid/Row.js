"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

var Row = function Row(_ref) {
    var style = _ref.style,
        className = _ref.className,
        children = _ref.children;

    return _react2.default.createElement(
        "div",
        { style: style, className: (0, _classnames2.default)("row", className) },
        children
    );
};

exports.default = Row;
//# sourceMappingURL=Row.js.map
