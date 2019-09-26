class ValidationError extends Error {
    constructor(message, value = null) {
        super();
        this.message = message;
        this.value = value;
    }

    getMessage() {
        return this.message;
    }

    getValue() {
        return this.value;
    }
}

export default ValidationError;
