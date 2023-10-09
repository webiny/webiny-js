import ValidationError from "~/validationError";

/**
 * @name gte
 * @description "Greater than or equals" validator. This validator checks if the given values is greater than or equal to the `min` value.
 * @param {any} value This is the value that will be validated.
 * @param {any} min This is the value to validate against. It is passed as a validator parameter: `gte:valueToCompareAgainst`
 * @throws {ValidationError}
 * @example
 * import { validation } from '@webiny/validation';
 * validation.validate(10, 'gte:100').then(() => {
 *  // Valid
 * }).catch(e => {
 *  // Invalid
 * });
 */
export default (value: any, params?: string[]) => {
    if (value === undefined || value === null || !params) {
        return;
    }
    value = value + "";

    if (parseFloat(value) >= parseFloat(params[0])) {
        return;
    }
    throw new ValidationError("Value needs to be greater than or equal to " + params[0] + ".");
};
