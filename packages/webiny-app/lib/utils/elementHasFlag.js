"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _get2 = require("lodash/get");

var _get3 = _interopRequireDefault(_get2);

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = function(element, flag) {
    if (_react2.default.isValidElement(element)) {
        return (0, _get3.default)(element.type, "options." + flag, false);
    }

    return false;
};
//# sourceMappingURL=elementHasFlag.js.map
