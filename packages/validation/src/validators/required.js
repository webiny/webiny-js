// @flow
import _ from "lodash";
import ValidationError from "./../validationError";

const throwError = () => {
    throw new ValidationError("Value is required.");
};

export default (value: any) => {
    if (value === "" || value === null || value === undefined) {
        throwError();
    }

    if (Array.isArray(value) && value.length === 0) {
        throwError();
    }

    if (_.isEqual(value, {})) {
        throwError();
    }
};
