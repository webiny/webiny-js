import { z } from "zod";
import type { IFieldBuilder } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelFieldValidator } from "~/types.js";
import type { CmsModelField } from "~/types.js";
import { CmsFieldValidator } from "../abstractions.js";
import type { ICmsFieldValidatorFormBuilder } from "../abstractions.js";

class LteValidatorImpl implements CmsFieldValidator.Interface {
    name = "lte";
    label = "Less or equal";
    description = "Entered value must be equal or lower than the provided max value.";
    defaultMessage = "Value is too great.";

    buildSettingsForm(form: ICmsFieldValidatorFormBuilder) {
        form.fields(fields => ({
            value: fields
                .number()
                .label("Value")
                .description("This is the greatest value that will be allowed.")
                .required()
        }));
        form.layout(layout => [layout.row("value")]);
    }

    mapToFieldBuilder(
        builder: IFieldBuilder,
        validator: CmsModelFieldValidator,
        _field: CmsModelField
    ) {
        const max = validator.settings?.value;
        if (max != null) {
            builder.schema(z.number().lte(Number(max), validator.message || undefined));
        }
    }
}

export const LteValidator = CmsFieldValidator.createImplementation({
    implementation: LteValidatorImpl,
    dependencies: []
});
