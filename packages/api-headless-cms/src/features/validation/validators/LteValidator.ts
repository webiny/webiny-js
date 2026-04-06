import { validation } from "@webiny/validation";
import { CmsModelFieldValidator } from "../abstractions.js";
import type { CmsModelFieldValidatorValidateParams } from "~/types/types.js";

class LteValidatorImpl implements CmsModelFieldValidator.Interface {
    public readonly name = "lte";

    public async validate({
        value,
        validator
    }: CmsModelFieldValidatorValidateParams): Promise<boolean> {
        const lteValue = validator.settings?.value;
        if (typeof lteValue !== "undefined") {
            return validation
                .validate(value, `lte:${lteValue}`)
                .then(v => v === true)
                .catch(() => false);
        }
        return true;
    }
}

export const LteValidator = CmsModelFieldValidator.createImplementation({
    implementation: LteValidatorImpl,
    dependencies: []
});
