import { CmsFieldRenderer } from "../abstractions.js";
import type { CmsModelField } from "~/types.js";

class TextInputsRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "text-inputs";
    formRenderer = "textInputs";
    name = "Text Inputs";
    description = "Renders a simple list of text inputs.";

    canUse({ field }: { field: CmsModelField }) {
        return field.type === "text" && !!field.list && !field.predefinedValues?.enabled;
    }

    buildSettingsForm(form: CmsFieldRenderer.FormBuilder) {
        form.fields(fields => ({
            addValueButtonLabel: fields.text().label('"Add Value" button label')
        }));
        form.layout(layout => [layout.row("addValueButtonLabel")]);
    }
}

export const TextInputsRenderer = CmsFieldRenderer.createImplementation({
    implementation: TextInputsRendererImpl,
    dependencies: []
});
