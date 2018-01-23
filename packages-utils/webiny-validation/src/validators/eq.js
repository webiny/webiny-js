// @flow
import ValidationError from "./../validationError";

/**
 * @function eq
 * @description This validator checks if the given values are equal
 * @param value Value to validate
 * @param equalTo Value to compare with
 * @return {boolean}
 */
export default (value: any, equalTo: any) => {
    if (!value) return;
    value = value + "";

    // Intentionally put '==' instead of '===' because passed parameter for this validator is always sent inside a string (eg. "eq:test").
    if (value == equalTo) {
        return true;
    }
    throw new ValidationError("Value must be equal to " + equalTo + ".");
};
