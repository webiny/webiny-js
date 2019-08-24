// @flow
import ValidationError from "./../validationError";
import isNumeric from "isnumeric";

/**
 * @function number
 * @description This validator checks if the given value is numeric
 * @param {any} value
 * @return {boolean}
 */
export default (value: any) => {
    // Eliminate edge cases
    if (typeof value === "undefined" || value === 0 || value === "0") {
        return;
    }

    if (!value && !isNaN(value)) {
        return;
    }

    if (isNumeric(value)) {
        return;
    }

    throw new ValidationError("Value needs to be numeric.");
};
