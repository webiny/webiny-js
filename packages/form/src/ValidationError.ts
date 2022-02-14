class ValidationError extends Error {
    public value: string | null;

    constructor(message: string, value: string | null = null) {
        super();
        this.message = message;
        this.value = value;
    }

    public getMessage() {
        return this.message;
    }

    public getValue() {
        return this.value;
    }
}

export default ValidationError;
