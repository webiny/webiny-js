class ValidationError extends Error {

    constructor(message, validator, value = null) {
        super();
        this.message = message;
        this.validator = validator;
        this.value = value;
    }

    setValidator(validator) {
        this.validator = validator;
    }

    getMessage() {
        return this.message;
    }

    getValidator() {
        return this.validator;
    }

    getValue() {
        return this.value;
    }

    setMessage(message) {
        this.message = message;
        return this;
    }
}

export default ValidationError;