import { validation } from "@webiny/validation";
import { CmsModelFieldValidator } from "../abstractions.js";
import type { CmsModelFieldValidatorValidateParams } from "~/types/types.js";

class DateLteValidatorImpl implements CmsModelFieldValidator.Interface {
    public readonly name = "dateLte";

    public async validate({
        value,
        validator
    }: CmsModelFieldValidatorValidateParams): Promise<boolean> {
        const { value: lteValue, type } = validator.settings || {};
        if (typeof lteValue === "undefined") {
            return true;
        } else if (type === "time") {
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
