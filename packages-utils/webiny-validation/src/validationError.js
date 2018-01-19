// @flow
class ValidationError extends Error {
    validator: string;
    value: any;

    constructor(message: string, validator: string, value: any) {
        super();
        this.message = message;
        this.validator = validator;
        this.value = value;
    }

    /**
     * Sets the name of validator that resulted with an error.
     */
    setValidator(validator: string) {
        this.validator = validator;
    }

    /**
     * Returns the name of validator that resulted with an error.
     */
    getValidator(): string {
        return this.validator;
    }

    /**
     * Returns validation message.
     */
    getMessage(): string {
        return this.message;
    }

    /**
     * Sets validation message.
     */
    setMessage(message: string) {
        this.message = message;
    }

    /**
     * Returns value that is invalid.
     */
    getValue(): any {
        return this.value;
    }

    /**
     * Sets invalid value.
     */
    setValue(value: any) {
        this.value = value;
    }
}

export default ValidationError;