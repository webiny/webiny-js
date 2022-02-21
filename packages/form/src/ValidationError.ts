class ValidationError extends Error {
    value: any;

    constructor(message: string, value: string = null) {
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
