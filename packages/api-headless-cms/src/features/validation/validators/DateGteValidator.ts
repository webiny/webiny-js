import { validation } from "@webiny/validation";
import { CmsModelFieldValidator } from "../abstractions/CmsModelFieldValidator.js";
import type { CmsModelFieldValidatorValidateParams } from "~/types/types.js";
import { formatDateLimitMessage, getDateLimit } from "./dateLimit.js";

class DateGteValidatorImpl implements CmsModelFieldValidator.Interface {
    public readonly name = "dateGte";

    public async validate({
        value,
        validator
    }: CmsModelFieldValidatorValidateParams): Promise<boolean> {
        const { expression, type } = validator.settings || {};
        let gteValue: unknown;
        try {
            gteValue = getDateLimit(validator.settings, "gte");
        } catch {
            return false;
        }
        if (typeof gteValue === "undefined") {
            return true;
        } else if (type === "time" && typeof expression !== "string") {
            return validation
                .validate(value, `timeGte:${gteValue}`)
                .then(v => v === true)
                .catch(() => false);
        }
        return validation
            .validate(value, `dateGte:${gteValue}`)
            .then(v => v === true)
            .catch(() => false);
    }

    /** A message's `{date}` is the limit, as `2008-10-19`. */
    public formatMessage(message: string, { validator }: CmsModelFieldValidatorValidateParams) {
        return formatDateLimitMessage(message, validator.settings, "gte");
    }
}

export const DateGteValidator = CmsModelFieldValidator.createImplementation({
    implementation: DateGteValidatorImpl,
    dependencies: []
});
