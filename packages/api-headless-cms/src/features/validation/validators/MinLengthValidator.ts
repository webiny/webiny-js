import { validation } from "@webiny/validation";
import { CmsModelFieldValidator } from "../abstractions.js";
import type { CmsModelFieldValidatorValidateParams } from "~/types/types.js";

class MinLengthValidatorImpl implements CmsModelFieldValidator.Interface {
    public readonly name = "minLength";

    public async validate({
        value,
        validator
    }: CmsModelFieldValidatorValidateParams): Promise<boolean> {
        const minLengthValue = validator.settings?.value;
        if (typeof minLengthValue !== "undefined") {
            return validation
                .validate(value, `minLength:${minLengthValue}`)
                .then(v => v === true)
                .catch(() => false);
        }
        return true;
    }
}

export const MinLengthValidator = CmsModelFieldValidator.createImplementation({
    implementation: MinLengthValidatorImpl,
    dependencies: []
});
