import { CmsFieldRenderer } from "~/presentation/fieldRenderers/abstractions.js";
import type { CmsModelField } from "~/types.js";

class LexicalTextInputsRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "lexical-text-inputs";
    formRenderer = "lexical";
    name = "Lexical Text Inputs";
    description = "Renders a list of lexical editors.";

    canUse({ field }: { field: CmsModelField }) {
        return field.type === "rich-text" && !!field.list && !field.predefinedValues?.enabled;
    }

    buildSettingsForm(form: CmsFieldRenderer.FormBuilder) {
        form.fields(fields => ({
            addValueButtonLabel: fields.text().label('"Add Value" button label')
        }));
        form.layout(layout => [layout.row("addValueButtonLabel")]);
    }
}

export const LexicalTextInputsRenderer = CmsFieldRenderer.createImplementation({
    implementation: LexicalTextInputsRendererImpl,
    dependencies: []
});
