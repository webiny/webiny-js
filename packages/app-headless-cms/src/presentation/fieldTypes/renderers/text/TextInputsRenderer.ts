import { CmsFieldRenderer } from "~/presentation/fieldRenderers/abstractions.js";
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
            addItemLabel: fields.text().label('"Add Item" button label')
        }));
        form.layout(layout => [layout.row("addItemLabel")]);
    }
}

export const TextInputsRenderer = CmsFieldRenderer.createImplementation({
    implementation: TextInputsRendererImpl,
    dependencies: []
});
