import ValidationError from "~/validationError.js";
const isNumeric = (value: unknown): boolean => {
    return !isNaN(parseFloat(String(value))) && isFinite(Number(value));
};

/**
 * @function number
 * @description This validator checks if the given value is numeric
 * @param {any} value
 * @return {boolean}
 */
export default (value: any) => {
    // Eliminate edge cases
    if (typeof value === "undefined" || value === 0 || value === "0") {
        return;
    }

    if (!value && !isNaN(value)) {
        return;
    }

    if (isNumeric(value)) {
        return;
    }

    throw new ValidationError("Value needs to be numeric.");
};
