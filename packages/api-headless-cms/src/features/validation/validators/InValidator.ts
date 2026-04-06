import { validation } from "@webiny/validation";
import { CmsModelFieldValidator } from "../abstractions.js";
import type { CmsModelFieldValidatorValidateParams } from "~/types/types.js";

class InValidatorImpl implements CmsModelFieldValidator.Interface {
    public readonly name = "in";

    public async validate({
        value,
        validator
    }: CmsModelFieldValidatorValidateParams): Promise<boolean> {
        const values = validator.settings?.values;
        if (Array.isArray(values)) {
            return validation
                .validate(value, `in:${values.join(":")}`)
                .then(v => v === true)
                .catch(() => false);
        }
        return true;
    }
}

export const InValidator = CmsModelFieldValidator.createImplementation({
    implementation: InValidatorImpl,
    dependencies: []
});
