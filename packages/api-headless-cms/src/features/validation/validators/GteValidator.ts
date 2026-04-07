import { validation } from "@webiny/validation";
import { CmsModelFieldValidator } from "../abstractions/CmsModelFieldValidator.js";
import type { CmsModelFieldValidatorValidateParams } from "~/types/types.js";

class GteValidatorImpl implements CmsModelFieldValidator.Interface {
    public readonly name = "gte";

    public async validate({
        value,
        validator
    }: CmsModelFieldValidatorValidateParams): Promise<boolean> {
        const gteValue = validator.settings?.value;
        if (typeof gteValue !== "undefined") {
            return validation
                .validate(value, `gte:${gteValue}`)
                .then(v => v === true)
                .catch(() => false);
        }
        return true;
    }
}

export const GteValidator = CmsModelFieldValidator.createImplementation({
    implementation: GteValidatorImpl,
    dependencies: []
});
