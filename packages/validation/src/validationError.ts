/**
 * This class is used by validators to throw an error when value validation fails.
 */
class ValidationError extends Error {
    public override readonly message: string;
    public readonly validator: string | null;
    public readonly value: any;

    constructor(message = "", validator: string | null = null, value: string | null = null) {
        super();
        this.message = message;
        this.validator = validator;
        this.value = value;
    }
}

export default ValidationError;
