// @flow
import _ from "lodash";
import ValidationError from "./../validationError";

export default (value: any) => {
    if (!value) return;

    if (_.isInteger(value)) {
        return;
    }

    throw new ValidationError("Value needs to be an integer.");
};
