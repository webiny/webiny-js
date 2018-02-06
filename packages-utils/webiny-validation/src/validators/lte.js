// @flow
import ValidationError from "./../validationError";

export default (value: any, params: Array<string>) => {
    if (!value) return;
    value = value + "";

    if (parseFloat(value) <= parseFloat(params[0])) {
        return;
    }

    throw new ValidationError("Value needs to be less than or equal to " + params[0] + ".");
};
