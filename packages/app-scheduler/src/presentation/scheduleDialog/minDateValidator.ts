import type { Validator } from "@webiny/validation/types.js";
import ValidationError from "@webiny/validation/validationError.js";
import { scheduleDateFormatter } from "./scheduleDateFormatter.js";

export const minDateValidator: Validator = (input: string) => {
    const value = new Date(input);
    const minDate = new Date(new Date().getTime() + 120 * 1000);
    if (minDate < value) {
        return;
    }
    throw new ValidationError(
        `The date must be at least 2 minutes in the future. Current minimum date is ${scheduleDateFormatter.format(
            minDate
        )}.`
    );
};

minDateValidator.validatorName = "minDateValidator";
