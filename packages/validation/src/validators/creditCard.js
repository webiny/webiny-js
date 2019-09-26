// @flow
import ValidationError from "./../validationError";

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
export default (value: any): void => {
    if (!value) return;
    value = value + "";

    if (value.length < 12) {
        throw new ValidationError("Credit card number too short.");
    }

    if (/[^0-9-\s]+/.test(value)) throw new ValidationError("Credit card number invalid.");

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

    throw new ValidationError("Credit card number invalid.");
};
