import { validation } from "@webiny/validation";
import { CmsModelFieldValidator } from "../abstractions/CmsModelFieldValidator.js";
import type { CmsModelFieldValidatorValidateParams } from "~/types/types.js";

class TimeGteValidatorImpl implements CmsModelFieldValidator.Interface {
    public readonly name = "timeGte";

    public async validate({
        value,
        validator
    }: CmsModelFieldValidatorValidateParams): Promise<boolean> {
        const gteValue = validator.settings?.value;
        if (typeof gteValue === "undefined") {
            return true;
        }
        return validation
            .validate(value, `timeGte:${gteValue}`)
            .then(v => v === true)
            .catch(() => false);
    }
}

export const TimeGteValidator = CmsModelFieldValidator.createImplementation({
    implementation: TimeGteValidatorImpl,
    dependencies: []
});
