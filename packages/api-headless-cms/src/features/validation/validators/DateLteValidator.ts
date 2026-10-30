import { validation } from "@webiny/validation";
import { CmsModelFieldValidator } from "../abstractions/CmsModelFieldValidator.js";
import type { CmsModelFieldValidatorValidateParams } from "~/types/types.js";
import { formatDateLimitMessage, getDateLimit } from "./dateLimit.js";

class DateLteValidatorImpl implements CmsModelFieldValidator.Interface {
    public readonly name = "dateLte";

    public async validate({
        value,
        validator
    }: CmsModelFieldValidatorValidateParams): Promise<boolean> {
        const { expression, type } = validator.settings || {};
        let lteValue: unknown;
        try {
            lteValue = getDateLimit(validator.settings, "lte");
        } catch {
            return false;
        }
        if (typeof lteValue === "undefined") {
            return true;
        } else if (type === "time" && typeof expression !== "string") {
            return validation
                .validate(value, `timeLte:${lteValue}`)
                .then(v => v === true)
                .catch(() => false);
        }
        return validation
            .validate(value, `dateLte:${lteValue}`)
            .then(v => v === true)
            .catch(() => false);
    }

    /** A message's `{date}` is the limit, as `2008-10-19`. */
    public formatMessage(message: string, { validator }: CmsModelFieldValidatorValidateParams) {
        return formatDateLimitMessage(message, validator.settings, "lte");
    }
}

export const DateLteValidator = CmsModelFieldValidator.createImplementation({
    implementation: DateLteValidatorImpl,
    dependencies: []
});
