export class ValidationError extends Error {
    public value: unknown | null;

    constructor(message: string, value: unknown | null = null) {
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
