// @flow
import _ from "lodash";
import ValidationError from "./../validationError";

export default (value: any) => {
    if (_.isEmpty(value)) {
        if (_.isNumber(value)) {
            return;
        }
        throw new ValidationError("Value is required.");
    }
};
