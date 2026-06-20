import { z } from "zod";
import type { IFieldBuilder } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelFieldValidator } from "@webiny/app-headless-cms-common/types/validation.js";
import type { CmsModelField } from "~/types.js";
import { CmsFieldValidator } from "../abstractions.js";
import type { ICmsFieldValidatorFormBuilder, ICmsFieldValidatorContext } from "../abstractions.js";

class DateGteValidatorImpl implements CmsFieldValidator.Interface {
    name = "dateGte";
    label = "Later or equal";
    description = "Entered date/time must be equal or later compared to the provided date.";
    defaultMessage = "Date/time is earlier than the provided one.";

    buildSettingsForm(form: ICmsFieldValidatorFormBuilder, context: ICmsFieldValidatorContext) {
        const type = context.field.settings ? context.field.settings.type : "date";

        form.fields(fields => {
            const valueField = fields
                .datetime()
                .label("Value")
                .description("This is the earliest date/time that will be allowed.");

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
        const minDate = validator.settings?.value;
        if (minDate != null) {
            builder.schema(
                z.string().refine(val => val >= minDate, {
                    message: validator.message || `Must be on or after ${minDate}`
                })
            );
        }
    }
}

export const DateGteValidator = CmsFieldValidator.createImplementation({
    implementation: DateGteValidatorImpl,
    dependencies: []
});
