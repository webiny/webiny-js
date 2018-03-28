"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _validationError = require("./../validationError");

var _validationError2 = _interopRequireDefault(_validationError);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @function number
 * @description This validator checks of the given value is a number
 * @param {any} value
 * @return {boolean}
 */
exports.default = value => {
    if (!value && !_lodash2.default.isNaN(value)) return;

    if (_lodash2.default.isNumber(value) && !_lodash2.default.isNaN(value)) {
        return;
    }

    throw new _validationError2.default("Value needs to be a number.");
};
//# sourceMappingURL=number.js.map
