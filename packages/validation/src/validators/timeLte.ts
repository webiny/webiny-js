import ValidationError from "~/validationError";
import { compareTime } from "./time";

/**
 * Validates that given value is a leaser or equal to a lteValue
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

    const compare = compareTime(value, lteValue);
    if (compare <= 0) {
        return;
    }
    throw new ValidationError(`Value needs to be lesser than or equal to "${lteValue}".`);
};
