"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = function(components) {
    var FinalCmp = components.reduce(function(Res, Cmp) {
        if (!Res) {
            return _react2.default.createElement(Cmp);
        }

        return _react2.default.createElement(Cmp, {}, Res);
    }, null);

    return function(props) {
        return _react2.default.cloneElement(FinalCmp, props);
    };
};
//# sourceMappingURL=hocCompose.js.map
