import ValidationError from "./../validationError";

// In array validator. This validator checks if the given value is allowed to.
export default (value: any, params: string[]) => {
    if (!value) return;
    value = value + "";

    if (params.includes(value)) {
        return;
    }

    throw new ValidationError("Value must be one of the following: " + params.join(", ") + ".");
};
