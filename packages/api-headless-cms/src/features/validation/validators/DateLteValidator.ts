import { validation } from "@webiny/validation";
import { getLenientToday, resolveDateExpression } from "@webiny/utils";
import { CmsModelFieldValidator } from "../abstractions/CmsModelFieldValidator.js";
import type { CmsModelFieldValidatorValidateParams } from "~/types/types.js";

class DateLteValidatorImpl implements CmsModelFieldValidator.Interface {
    public readonly name = "dateLte";

    public async validate({
        value,
        validator
    }: CmsModelFieldValidatorValidateParams): Promise<boolean> {
        const { value: fixedValue, expression, type } = validator.settings || {};
        let lteValue = fixedValue;
        if (typeof expression === "string") {
            /**
             * The server can't know the user's timezone, so "today" is the latest date on
             * Earth: a date the user's own today allows always passes.
             */
            try {
                lteValue = resolveDateExpression(expression, getLenientToday("lte"));
            } catch {
                return false;
            }
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
}

export const DateLteValidator = CmsModelFieldValidator.createImplementation({
    implementation: DateLteValidatorImpl,
    dependencies: []
});
