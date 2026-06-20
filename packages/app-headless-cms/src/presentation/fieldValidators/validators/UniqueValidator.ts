import type { IFieldBuilder } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelFieldValidator } from "@webiny/app-headless-cms-common/types/validation.js";
import type { CmsModelField } from "~/types.js";
import { CmsFieldValidator } from "../abstractions.js";

class UniqueValidatorImpl implements CmsFieldValidator.Interface {
    name = "unique";
    label = "Unique";
    description = "You won't be able to submit the form if the field value is not unique.";
    defaultMessage = "Value must be unique.";

    mapToFieldBuilder(
        _builder: IFieldBuilder,
        _validator: CmsModelFieldValidator,
        _field: CmsModelField
    ) {
        // Server-side only — no client-side FormModel validation needed.
    }
}

export const UniqueValidator = CmsFieldValidator.createImplementation({
    implementation: UniqueValidatorImpl,
    dependencies: []
});
