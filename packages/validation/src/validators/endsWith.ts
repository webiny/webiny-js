import ValidationError from "~/validationError";

/**
 * @name ends
 * @description Ends With validator. This validator checks if the given value ends with specific word or character.
 * @param {any} value This is the value that will be validated.
 * @param {Array<string>} params This is the value to validate against. It is passed as a validator parameter: `ends:valueToCompareWith`
 * @throws {ValidationError}
 * @example
 * import { validation } from '@webiny/validation';
 * validation.validate('another email', 'ends:email').then(() => {
 *  // Valid
 * }).catch(e => {
 *  // Invalid
 * });
 */
export default (value: any, params?: string[]) => {
    if (!value || !params) {
        return;
    }
    value = value + "";

    const endOfTheString = value.slice(value.length - params[0].length);

    // Intentionally put '==' instead of '===' because passed parameter for this validator is always sent inside a string (eg. "ends:test").
    // eslint-disable-next-line
    if (endOfTheString == params[0]) {
        return;
    }

    throw new ValidationError("Value must end with " + params[0] + ".");
};
