// @flow
import ValidationError from "./../validationError";

/**
 * @name email
 * @description Email validator. This validator checks if the given value is a valid email address.
 * @param {any} value This is the value that will be validated.
 * @throws {ValidationError}
 * @example
 * import { validation } from 'webiny-validation';
 * validation.validate('email@gmail.com', 'email').then(() => {
 *  // Valid
 * }).catch(e => {
 *  // Invalid
 * });
 */
export default (value: any) => {
    if (!value) return;
    value = value + "";

    // eslint-disable-next-line
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!value || (value.length && re.test(value))) {
        return true;
    }
    throw new ValidationError("Value must be a valid e-mail address.");
};
