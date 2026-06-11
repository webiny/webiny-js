import ValidationError from "~/validationError.js";

/**
 * Validates that given value is a lesser than or equal date to a lteValue
 */
export default (value: string, params?: string[]) => {
    if (!value || !params) {
        return;
    }
    // we need to join because validation params are being split by :
    const lteValue = params.join(":");
    if (!lteValue) {
        return;
    }

    const date = new Date(value);
    const lteDate = new Date(lteValue);

    if (isNaN(lteDate.getTime())) {
        throw new ValidationError(`Value "${lteValue}" is not a valid date to compare against.`);
    }

    if (date <= lteDate) {
        return;
    }
    throw new ValidationError(
        `Value needs to be lesser than or equal to "${lteDate.toISOString()}".`
    );
};
