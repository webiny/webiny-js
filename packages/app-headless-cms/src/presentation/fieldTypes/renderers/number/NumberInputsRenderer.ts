import { CmsFieldRenderer } from "~/presentation/fieldRenderers/abstractions.js";
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
            addItemLabel: fields.text().label('"Add Value" button label')
        }));
        form.layout(layout => [layout.row("addItemLabel")]);
    }
}

export const NumberInputsRenderer = CmsFieldRenderer.createImplementation({
    implementation: NumberInputsRendererImpl,
    dependencies: []
});
