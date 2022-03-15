import ValidationError from "~/validationError";
import { compareTime } from "./time";

/**
 * Validates that given value is a greater or equal to a gteValue
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

    const compare = compareTime(value, gteValue);

    if (compare >= 0) {
        return;
    }
    throw new ValidationError(`Value needs to be greater than or equal to "${gteValue}".`);
};
