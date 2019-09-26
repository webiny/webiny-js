// @flow
import ValidationError from "./../validationError";

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
export default (value: any, params: Array<string>) => {
    if (!value) return;

    if (parseFloat(value) > parseFloat(params[0])) {
        return;
    }
    throw new ValidationError("Value needs to be greater than " + params[0] + ".");
};
