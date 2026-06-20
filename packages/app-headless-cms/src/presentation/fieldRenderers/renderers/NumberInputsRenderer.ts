import { CmsFieldRenderer } from "../abstractions.js";
import type { CmsModelField } from "~/types.js";

class NumberInputsRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "number-inputs";
    formRenderer = "numberInputs";
    name = "Number Inputs";
    description = "Renders a simple list of number inputs.";

    canUse({ field }: { field: CmsModelField }) {
        return field.type === "number" && !!field.list && !field.predefinedValues?.enabled;
    }

    buildSettingsForm(form: CmsFieldRenderer.FormBuilder) {
        form.fields(fields => ({
            addValueButtonLabel: fields.text().label('"Add Value" button label')
        }));
        form.layout(layout => [layout.row("addValueButtonLabel")]);
    }
}

export const NumberInputsRenderer = CmsFieldRenderer.createImplementation({
    implementation: NumberInputsRendererImpl,
    dependencies: []
});
