import { validation } from "@webiny/validation";
import { CmsModelFieldValidator } from "../abstractions/CmsModelFieldValidator.js";
import type { CmsModelFieldValidatorValidateParams } from "~/types/types.js";

class TimeLteValidatorImpl implements CmsModelFieldValidator.Interface {
    public readonly name = "timeLte";

    public async validate({
        value,
        validator
    }: CmsModelFieldValidatorValidateParams): Promise<boolean> {
        const lteValue = validator.settings?.value;
        if (typeof lteValue === "undefined") {
            return true;
        }
        return validation
            .validate(value, `timeLte:${lteValue}`)
            .then(v => v === true)
            .catch(() => false);
    }
}

export const TimeLteValidator = CmsModelFieldValidator.createImplementation({
    implementation: TimeLteValidatorImpl,
    dependencies: []
});
