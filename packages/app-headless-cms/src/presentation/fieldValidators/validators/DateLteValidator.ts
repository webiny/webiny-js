import { z } from "zod";
import type { IFieldBuilder } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelFieldValidator } from "@webiny/app-headless-cms-common/types/validation.js";
import type { CmsModelField } from "~/types.js";
import { CmsFieldValidator } from "../abstractions.js";
import type { ICmsFieldValidatorFormBuilder, ICmsFieldValidatorContext } from "../abstractions.js";

class DateLteValidatorImpl implements CmsFieldValidator.Interface {
    name = "dateLte";
    label = "Earlier or equal";
    description = "Entered date/time must be equal or earlier compared to the provided date.";
    defaultMessage = "Date/time is later than the provided one.";

    buildSettingsForm(form: ICmsFieldValidatorFormBuilder, context: ICmsFieldValidatorContext) {
        const type = context.field.settings ? context.field.settings.type : "date";

        form.fields(fields => {
            const valueField = fields
                .datetime()
                .label("Value")
                .description("This is the latest date/time that will be allowed.");

            switch (type) {
                case "time":
                    valueField.timeOnly();
                    break;
                case "dateTimeWithTimezone":
                    valueField.withTimezone();
                    break;
                case "dateTimeWithoutTimezone":
                    valueField.withoutTimezone();
                    break;
                default:
                    valueField.dateOnly();
                    break;
            }

            return { value: valueField };
        });
        form.layout(layout => [layout.row("value")]);
    }

    mapToFieldBuilder(
        builder: IFieldBuilder,
        validator: CmsModelFieldValidator,
        _field: CmsModelField
    ) {
        const maxDate = validator.settings?.value;
        if (maxDate != null) {
            builder.schema(
                z.string().refine(val => val <= maxDate, {
                    message: validator.message || `Must be on or before ${maxDate}`
                })
            );
        }
    }
}

export const DateLteValidator = CmsFieldValidator.createImplementation({
    implementation: DateLteValidatorImpl,
    dependencies: []
});
