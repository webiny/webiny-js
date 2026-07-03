import { z } from "zod";
import type { IFieldBuilder } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelFieldValidator } from "~/types.js";
import type { CmsModelField } from "~/types.js";
import { CmsFieldValidator } from "../abstractions.js";
import type { ICmsFieldValidatorFormBuilder } from "../abstractions.js";

class InValidatorImpl implements CmsFieldValidator.Interface {
    name = "in";
    label = "Specific values";
    description =
        "You won't be able to submit the form if the field value is not in the list of specified values.";
    defaultMessage = "Value is not allowed.";

    buildSettingsForm(form: ICmsFieldValidatorFormBuilder) {
        form.fields(fields => ({
            values: fields
                .text()
                .list()
                .label("Allowed values")
                .description("Hit ENTER to add values")
                .renderer("tags")
                .required()
        }));
        form.layout(layout => [layout.row("values")]);
    }

    mapToFieldBuilder(
        builder: IFieldBuilder,
        validator: CmsModelFieldValidator,
        _field: CmsModelField
    ) {
        const values = validator.settings?.values;
        if (Array.isArray(values) && values.length > 0) {
            builder.schema(z.enum(values as [string, ...string[]]));
        }
    }
}

export const InValidator = CmsFieldValidator.createImplementation({
    implementation: InValidatorImpl,
    dependencies: []
});
