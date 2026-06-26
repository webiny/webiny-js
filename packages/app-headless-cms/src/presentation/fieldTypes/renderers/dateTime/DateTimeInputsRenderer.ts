import { CmsFieldRenderer } from "~/presentation/fieldRenderers/abstractions.js";
import type { CmsModelField } from "~/types.js";

class DateTimeInputsRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "date-time-inputs";
    formRenderer = "dateTimeInputs";
    name = "Date/Time Inputs";
    description = "Renders inputs for various formats of dates and times.";

    canUse({ field }: { field: CmsModelField }) {
        return field.type === "datetime" && !!field.list && !field.predefinedValues?.enabled;
    }

    buildSettingsForm(form: CmsFieldRenderer.FormBuilder) {
        form.fields(fields => ({
            addValueButtonLabel: fields.text().label('"Add Value" button label')
        }));
        form.layout(layout => [layout.row("addValueButtonLabel")]);
    }
}

export const DateTimeInputsRenderer = CmsFieldRenderer.createImplementation({
    implementation: DateTimeInputsRendererImpl,
    dependencies: []
});
