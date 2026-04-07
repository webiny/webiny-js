import { validation } from "@webiny/validation";
import { CmsModelFieldValidator } from "../abstractions/CmsModelFieldValidator.js";
import type { CmsModelFieldValidatorValidateParams } from "~/types/types.js";

class MaxLengthValidatorImpl implements CmsModelFieldValidator.Interface {
    public readonly name = "maxLength";

    public async validate({
        value,
        validator
    }: CmsModelFieldValidatorValidateParams): Promise<boolean> {
        const maxLengthValue = validator.settings?.value;
        if (typeof maxLengthValue !== "undefined") {
            return validation
                .validate(value, `maxLength:${maxLengthValue}`)
                .then(v => v === true)
                .catch(() => false);
        }
        return true;
    }
}

export const MaxLengthValidator = CmsModelFieldValidator.createImplementation({
    implementation: MaxLengthValidatorImpl,
    dependencies: []
});
