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
    if (!value) {
        if (!isNaN(value)) {
            return;
        }
    }

    if (isNumeric(value)) {
        return;
    }

    throw new ValidationError("Value needs to be numeric.");
};
