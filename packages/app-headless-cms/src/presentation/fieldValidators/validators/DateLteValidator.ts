import { z } from "zod";
import type { IFieldBuilder } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelFieldValidator } from "~/types.js";
import type { CmsModelField } from "~/types.js";
import { CmsFieldValidator } from "../abstractions.js";
import type { ICmsFieldValidatorFormBuilder, ICmsFieldValidatorContext } from "../abstractions.js";
import {
    buildDateLimitSettingsForm,
    dateLimitSettingsFromForm,
    dateLimitSettingsToForm
} from "./dateLimitSettings.js";

class DateLteValidatorImpl implements CmsFieldValidator.Interface {
    name = "dateLte";
    label = "Earlier or equal";
    description =
        "Entered date/time must be equal or earlier compared to the provided date. A date relative to today is worked out from the current date every time the value is checked.";
    defaultMessage = "Must be on or before {date}.";
    variables = [{ name: "date", description: "The latest allowed date, worked out when the value is checked." }];

    buildSettingsForm(form: ICmsFieldValidatorFormBuilder, context: ICmsFieldValidatorContext) {
        buildDateLimitSettingsForm(form, context, {
            valueDescription: "This is the latest date/time that will be allowed."
        });
    }

    mapSettingsToForm(settings: Record<string, unknown>, context: ICmsFieldValidatorContext) {
        return dateLimitSettingsToForm(settings, context);
    }

    mapSettingsFromForm(settings: Record<string, unknown>) {
        return dateLimitSettingsFromForm(settings);
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
