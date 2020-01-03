/**
 * This class is used by validators to throw an error when value validation fails.
 */
class ValidationError extends Error {
    message: string;
    validator: string;
    value: any;

    constructor(message = "", validator: string = null, value = null) {
        super();
        this.message = message;
        this.validator = validator;
        this.value = value;
    }
}

export default ValidationError;
