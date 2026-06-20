import type { IFieldBuilder } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelFieldValidator } from "@webiny/app-headless-cms-common/types/validation.js";
import type { CmsModelField } from "~/types.js";
import { CmsFieldValidator } from "../abstractions.js";

class RequiredValidatorImpl implements CmsFieldValidator.Interface {
    name = "required";
    label = "Required";
    description = "You won't be able to submit the form if this field is empty.";
    defaultMessage = "Value is required.";

    mapToFieldBuilder(
        builder: IFieldBuilder,
        validator: CmsModelFieldValidator,
        _field: CmsModelField
    ) {
        builder.required(validator.message || this.defaultMessage);
    }
}

export const RequiredValidator = CmsFieldValidator.createImplementation({
    implementation: RequiredValidatorImpl,
    dependencies: []
});
