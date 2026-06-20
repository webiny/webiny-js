import { z } from "zod";
import type { IFieldBuilder } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelFieldValidator } from "@webiny/app-headless-cms-common/types/validation.js";
import type { CmsModelField } from "~/types.js";
import { CmsFieldValidator } from "../abstractions.js";
import type { ICmsFieldValidatorFormBuilder } from "../abstractions.js";

class GteValidatorImpl implements CmsFieldValidator.Interface {
    name = "gte";
    label = "Greater or equal";
    description = "Entered value must be equal or greater than the provided min value.";
    defaultMessage = "Value is too small.";

    buildSettingsForm(form: ICmsFieldValidatorFormBuilder) {
        form.fields(fields => ({
            value: fields
                .number()
                .label("Value")
                .description("This is the smallest value that will be allowed.")
                .required()
        }));
        form.layout(layout => [layout.row("value")]);
    }

    mapToFieldBuilder(
        builder: IFieldBuilder,
        validator: CmsModelFieldValidator,
        _field: CmsModelField
    ) {
        const min = validator.settings?.value;
        if (min != null) {
            builder.schema(z.number().gte(Number(min), validator.message || undefined));
        }
    }
}

export const GteValidator = CmsFieldValidator.createImplementation({
    implementation: GteValidatorImpl,
    dependencies: []
});
