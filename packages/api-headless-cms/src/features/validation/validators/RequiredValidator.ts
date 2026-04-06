import { validation } from "@webiny/validation";
import { CmsModelFieldValidator } from "../abstractions.js";
import type { CmsModelFieldValidatorValidateParams } from "~/types/types.js";

class RequiredValidatorImpl implements CmsModelFieldValidator.Interface {
    public readonly name = "required";

    public async validate({ value }: CmsModelFieldValidatorValidateParams): Promise<boolean> {
        return validation
            .validate(value, "required")
            .then(v => v === true)
            .catch(() => false);
    }
}

export const RequiredValidator = CmsModelFieldValidator.createImplementation({
    implementation: RequiredValidatorImpl,
    dependencies: []
});
