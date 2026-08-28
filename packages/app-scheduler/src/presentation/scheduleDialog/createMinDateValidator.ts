import type { Validator } from "@webiny/validation/types.js";
import ValidationError from "@webiny/validation/validationError.js";
import type { DateFormatter } from "@webiny/app-admin";

/**
 * Builds a validator that requires the scheduled date to be at least 2 minutes in the future. The
 * formatter is injected so the error message's date matches the format used everywhere else.
 */
export const createMinDateValidator = (dateFormatter: DateFormatter.Interface): Validator => {
    const minDateValidator: Validator = (input: string) => {
        const value = new Date(input);
        const minDate = new Date(new Date().getTime() + 120 * 1000);
        if (minDate < value) {
            return;
        }
        throw new ValidationError(
            `The date must be at least 2 minutes in the future. Current minimum date is ${dateFormatter.format(
                minDate
            )}.`
        );
    };

    minDateValidator.validatorName = "minDateValidator";

    return minDateValidator;
};
