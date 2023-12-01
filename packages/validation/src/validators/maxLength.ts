import isObject from "lodash/isObject";
import isString from "lodash/isString";
import has from "lodash/has";
import keys from "lodash/keys";
import ValidationError from "~/validationError";

export default (value: any, params?: string[]) => {
    if (!value || !params) {
        return;
    }

    let lengthOfValue = null;
    if (has(value, "length")) {
        lengthOfValue = value.length;
    } else if (isObject(value)) {
        lengthOfValue = keys(value).length;
    }

    if (lengthOfValue === null || lengthOfValue <= params[0]) {
        return;
    }

    if (isString(value)) {
        throw new ValidationError("Value requires " + params[0] + " characters at most.");
    }
    throw new ValidationError("Value requires " + params[0] + " items at most.");
};
