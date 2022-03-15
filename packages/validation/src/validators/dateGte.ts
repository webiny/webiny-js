import ValidationError from "~/validationError";

/**
 * Validates that given value is a greater or equal date to a gteValue
 */
export default (value: string, params?: string[]) => {
    if (!value || !params) {
        return;
    }
    // we need to join because validation params are being split by :
    const gteValue = params.join(":");
    if (!gteValue) {
        return;
    }

    const date = new Date(value);
    const gteDate = new Date(gteValue);

    if (date >= gteDate) {
        return;
    }
    throw new ValidationError(
        `Value needs to be greater than or equal to "${gteDate.toISOString()}".`
    );
};
