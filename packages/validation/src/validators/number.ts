import isNaN from "lodash/isNaN";
import isNumber from "lodash/isNumber";
import ValidationError from "~/validationError";

/**
 * @function number
 * @description This validator checks of the given value is a number
 * @param {any} value
 * @return {boolean}
 */
export default (value: any) => {
    if (!value && !isNaN(value)) {
        return;
    }

    if (isNumber(value) && !isNaN(value)) {
        return;
    }

    throw new ValidationError("Value needs to be a number.");
};
