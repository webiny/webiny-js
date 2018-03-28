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
 * @name gt
 * @description "Greater than" validator. This validator checks if the given values is greater than the `min` value.
 * @param {any} value This is the value that will be validated.
 * @param {Array<string>} params This is the value to validate against. It is passed as a validator parameter: `gt:valueToCompareAgainst`
 * @throws {ValidationError}
 * @example
 * import { validation } from 'webiny-validation';
 * validation.validate(10, 'gt:100').then(() => {
 *  // Valid
 * }).catch(e => {
 *  // Invalid
 * });
 */
exports.default = (value, params) => {
    if (!value) return;

    if (parseFloat(value) > parseFloat(params[0])) {
        return;
    }
    throw new _validationError2.default("Value needs to be greater than " + params[0] + ".");
};
//# sourceMappingURL=gt.js.map
