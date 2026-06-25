import { z } from "zod";
import type { IFieldBuilder } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelFieldValidator } from "~/types.js";
import type { CmsModelField } from "~/types.js";
import { CmsFieldValidator } from "../abstractions.js";
import type { ICmsFieldValidatorFormBuilder } from "../abstractions.js";

class MaxLengthValidatorImpl implements CmsFieldValidator.Interface {
    name = "maxLength";
    label = "Max length";
    description = "Entered value must not be longer than the provided max length.";
    defaultMessage = "Value is too long.";
    variables = [{ name: "value", description: "This is the maximum allowed length." }];

    getVariableValues({ validator }: { validator: CmsModelFieldValidator }) {
        return { value: String(validator.settings?.value ?? "") };
    }

    buildSettingsForm(form: ICmsFieldValidatorFormBuilder) {
        form.fields(fields => ({
            value: fields
                .number()
                .label("Value")
                .description("This is the maximum number of characters allowed.")
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
            builder.schema(z.string().max(Number(max), validator.message || undefined));
        }
    }
}

export const MaxLengthValidator = CmsFieldValidator.createImplementation({
    implementation: MaxLengthValidatorImpl,
    dependencies: []
});
