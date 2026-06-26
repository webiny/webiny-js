import { CmsFieldRenderer } from "~/presentation/fieldRenderers/abstractions.js";
import type { CmsModelField } from "~/types.js";

class LongTextsRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "long-text-inputs";
    formRenderer = "textareas";
    name = "Text Areas";
    description = "Renders a simple list of text areas.";

    canUse({ field }: { field: CmsModelField }) {
        return field.type === "long-text" && !!field.list && !field.predefinedValues?.enabled;
    }

    buildSettingsForm(form: CmsFieldRenderer.FormBuilder) {
        form.fields(fields => ({
            addValueButtonLabel: fields.text().label('"Add Value" button label')
        }));
        form.layout(layout => [layout.row("addValueButtonLabel")]);
    }
}

export const LongTextsRenderer = CmsFieldRenderer.createImplementation({
    implementation: LongTextsRendererImpl,
    dependencies: []
});
