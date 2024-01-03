import ValidationError from "~/validationError";

/**
 * @name starts
 * @description Starts With validator. This validator checks if the given value starts with specific word or character.
 * @param {any} value This is the value that will be validated.
 * @param {Array<string>} params This is the value to validate against. It is passed as a validator parameter: `starts:valueToCompareWith`
 * @throws {ValidationError}
 * @example
 * import { validation } from '@webiny/validation';
 * validation.validate('another email', 'starts:another).then(() => {
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
    const startOfString = value.slice(0, params[0].length);

    // Intentionally put '==' instead of '===' because passed parameter for this validator is always sent inside a string (eg. "starts:test").
    // eslint-disable-next-line
    if (startOfString == params[0]) {
        return;
    }

    throw new ValidationError("Value must start with " + params[0] + ".");
};
