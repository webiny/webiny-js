// @flow
import ValidationError from "./../validationError";

export default (value: any) => {
    if (!value) return;
    value = value + "";

    if (value.match(/^[-+0-9()/\s]+$/)) {
        return;
    }
    throw new ValidationError("Value must be a valid phone number.");
};
