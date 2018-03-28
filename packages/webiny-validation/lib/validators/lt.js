"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _validationError = require("./../validationError");

var _validationError2 = _interopRequireDefault(_validationError);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = (value, params) => {
    if (!value) return;
    value = value + "";

    if (parseFloat(value) < parseFloat(params[0])) {
        return;
    }

    throw new _validationError2.default("Value needs to be less than " + params[0] + ".");
};
//# sourceMappingURL=lt.js.map
