// @flow
import _ from "lodash";
import ValidationError from "./../validationError";

export default (value: any, params: Array<string>) => {
    if (!value) return;

    let lengthOfValue = null;
    if (_.has(value, "length")) {
        lengthOfValue = value.length;
    } else if (_.isObject(value)) {
        lengthOfValue = _.keys(value).length;
    }

    if (lengthOfValue === null || lengthOfValue <= params[0]) {
        return;
    }

    if (_.isString(value)) {
        throw new ValidationError("Value requires " + params[0] + " characters at most.");
    }
    throw new ValidationError("Value requires " + params[0] + " items at most.");
};
