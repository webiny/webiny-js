// @flow

/**
 * This class is used by validators to throw an error when value validation fails.
 * @class ValidationError
 * @param {string} message Error message
 * @param {string} validator Validator that triggered this error
 * @param {any} value Value that triggered this error
 */
class ValidationError extends Error {
    message: string;
    validator: ?string;
    value: ?mixed;

    constructor(message: string = "", validator: ?string = null, value: ?mixed = null) {
        super();
        this.message = message;
        this.validator = validator;
        this.value = value;
    }
}

export default ValidationError;
