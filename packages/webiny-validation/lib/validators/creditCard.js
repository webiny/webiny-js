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
 * @name creditCard
 * @description Credit card validator. This validator will check if the given value is a credit card number.
 * @param {any} value This is the value that will be validated.
 * @throws {ValidationError}
 * @example
 * import { validation } from 'webiny-validation';
 * validation.validate('notACreditCard', 'creditCard').then(() => {
 *  // Valid
 * }).catch(e => {
 *  // Invalid
 * });
 */
exports.default = value => {
    if (!value) return;
    value = value + "";

    if (value.length < 12) {
        throw new _validationError2.default("Credit card number too short.");
    }

    if (/[^0-9-\s]+/.test(value))
        throw new _validationError2.default("Credit card number invalid.");

    let nCheck = 0;
    let nDigit = 0;
    let bEven = false;

    value = value.replace(/ /g, "");
    value = value.replace(/\D/g, "");

    for (let n = value.length - 1; n >= 0; n--) {
        const cDigit = value.charAt(n);
        nDigit = parseInt(cDigit);

        if (bEven) {
            nDigit *= 2;
            if (nDigit > 9) {
                nDigit -= 9;
            }
        }

        nCheck += nDigit;
        bEven = !bEven;
    }

    if (nCheck % 10 === 0) {
        return;
    }

    throw new _validationError2.default("Credit card number invalid.");
};
//# sourceMappingURL=creditCard.js.map
