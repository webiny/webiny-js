"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _validationError = require("./../validationError");

var _validationError2 = _interopRequireDefault(_validationError);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

/**
 * @name in
 * @description "In array" validator. This validator checks if the given values is greater than or equal to the `min` value.
 * @param {any} value This is the value that will be validated.
 * @param {any} params This is the array of values to search in. It is passed as a validator parameter: `in:1:2:3`. Array values are separated by `:`.
 * @throws {ValidationError}
 * @example
 * import { validation } from 'webiny-validation';
 * validation.validate(10, 'in:10:20:30').then(() => {
 *  // Valid
 * }).catch(e => {
 *  // Invalid
 * });
 */
exports.default = (value, params) => {
    if (!value) return;
    value = value + "";

    if (params.includes(value)) {
        return;
    }

    throw new _validationError2.default(
        "Value must be one of the following: " + params.join(", ") + "."
    );
};
//# sourceMappingURL=in.js.map
