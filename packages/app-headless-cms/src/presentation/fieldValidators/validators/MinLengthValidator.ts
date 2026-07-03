import { z } from "zod";
import type { IFieldBuilder } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelFieldValidator } from "~/types.js";
import type { CmsModelField } from "~/types.js";
import { CmsFieldValidator } from "../abstractions.js";
import type { ICmsFieldValidatorFormBuilder } from "../abstractions.js";

class MinLengthValidatorImpl implements CmsFieldValidator.Interface {
    name = "minLength";
    label = "Min length";
    description = "Entered value must not be shorter than the provided min length.";
    defaultMessage = "Value is too short.";
    variables = [{ name: "value", description: "This is the minimum allowed length." }];

    getVariableValues({ validator }: { validator: CmsModelFieldValidator }) {
        return { value: String(validator.settings?.value ?? "") };
    }

    buildSettingsForm(form: ICmsFieldValidatorFormBuilder) {
        form.fields(fields => ({
            value: fields
                .number()
                .label("Value")
                .description("This is the minimum number of characters required.")
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
            builder.schema(z.string().min(Number(min), validator.message || undefined));
        }
    }
}

export const MinLengthValidator = CmsFieldValidator.createImplementation({
    implementation: MinLengthValidatorImpl,
    dependencies: []
});
