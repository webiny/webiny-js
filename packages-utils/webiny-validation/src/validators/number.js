// @flow
import _ from "lodash";
import ValidationError from "./../validationError";

/**
 * @function number
 * @description This validator checks of the given value is a number
 * @param {any} value
 * @return {boolean}
 */
export default (value: any) => {
    if (!value && !_.isNaN(value)) return;

    if (_.isNumber(value) && !_.isNaN(value)) {
        return true;
    }

    throw new ValidationError("Value needs to be a number.");
};
