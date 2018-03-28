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
 * @name gte
 * @description "Greater than or equals" validator. This validator checks if the given values is greater than or equal to the `min` value.
 * @param {any} value This is the value that will be validated.
 * @param {any} min This is the value to validate against. It is passed as a validator parameter: `gte:valueToCompareAgainst`
 * @throws {ValidationError}
 * @example
 * import { validation } from 'webiny-validation';
 * validation.validate(10, 'gte:100').then(() => {
 *  // Valid
 * }).catch(e => {
 *  // Invalid
 * });
 */
exports.default = (value, params) => {
    if (!value) return;

    if (parseFloat(value) >= parseFloat(params[0])) {
        return;
    }
    throw new _validationError2.default(
        "Value needs to be greater than or equal to " + params[0] + "."
    );
};
//# sourceMappingURL=gte.js.map
