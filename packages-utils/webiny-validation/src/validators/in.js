// @flow
import ValidationError from "./../validationError";

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
export default (value: any, params: Array<string>) => {
    if (!value) return;
    value = value + "";

    if (params.includes(value)) {
        return;
    }

    throw new ValidationError("Value must be one of the following: " + params.join(", ") + ".");
};
