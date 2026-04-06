import { validation } from "@webiny/validation";
import { CmsModelFieldValidator } from "../abstractions.js";
import type { CmsModelFieldValidatorValidateParams } from "~/types/types.js";

class DateGteValidatorImpl implements CmsModelFieldValidator.Interface {
    public readonly name = "dateGte";

    public async validate({
        value,
        validator
    }: CmsModelFieldValidatorValidateParams): Promise<boolean> {
        const { value: gteValue, type } = validator.settings || {};
        if (typeof gteValue === "undefined") {
            return true;
        } else if (type === "time") {
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
