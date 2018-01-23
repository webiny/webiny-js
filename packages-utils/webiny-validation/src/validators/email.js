// @flow
import ValidationError from "./../validationError";

/**
 * @function email
 * @description This validator checks if the given value is a valid email address
 * @param value Value to validate
 * @return {boolean}
 */
export default (value: any) => {
    if (!value) return;
    value = value + "";

    // eslint-disable-next-line
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!value || (value.length && re.test(value))) {
        return true;
    }
    throw new ValidationError("Value must be a valid e-mail address.");
};
