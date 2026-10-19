import { validation } from "@webiny/validation";
import { getLenientToday, resolveDateExpression } from "@webiny/utils";
import { CmsModelFieldValidator } from "../abstractions/CmsModelFieldValidator.js";
import type { CmsModelFieldValidatorValidateParams } from "~/types/types.js";

class DateGteValidatorImpl implements CmsModelFieldValidator.Interface {
    public readonly name = "dateGte";

    public async validate({
        value,
        validator
    }: CmsModelFieldValidatorValidateParams): Promise<boolean> {
        const { value: fixedValue, expression, type } = validator.settings || {};
        let gteValue = fixedValue;
        if (typeof expression === "string") {
            /**
             * The server can't know the user's timezone, so "today" is the earliest date on
             * Earth: a date the user's own today allows always passes.
             */
            try {
                gteValue = resolveDateExpression(expression, getLenientToday("gte"));
            } catch {
                return false;
            }
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
}

export const DateGteValidator = CmsModelFieldValidator.createImplementation({
    implementation: DateGteValidatorImpl,
    dependencies: []
});
