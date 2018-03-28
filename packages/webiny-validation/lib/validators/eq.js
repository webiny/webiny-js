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
 * @name eq
 * @description Equality validator. This validator checks if the given values are equal.
 * @param {any} value This is the value that will be validated.
 * @param {Array<string>} params This is the value to validate against. It is passed as a validator parameter: `eq:valueToCompareWith`
 * @throws {ValidationError}
 * @example
 * import { validation } from 'webiny-validation';
 * validation.validate('email@gmail.com', 'eq:another@gmail.com').then(() => {
 *  // Valid
 * }).catch(e => {
 *  // Invalid
 * });
 */
exports.default = (value, params) => {
    if (!value) return;
    value = value + "";

    // Intentionally put '==' instead of '===' because passed parameter for this validator is always sent inside a string (eg. "eq:test").
    if (value == params[0]) {
        return;
    }
    throw new _validationError2.default("Value must be equal to " + params[0] + ".");
};
//# sourceMappingURL=eq.js.map
