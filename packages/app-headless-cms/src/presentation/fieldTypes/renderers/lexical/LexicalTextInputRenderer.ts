import { CmsFieldRenderer } from "~/presentation/fieldRenderers/abstractions.js";
import type { CmsModelField } from "~/types.js";

class LexicalTextInputRendererImpl implements CmsFieldRenderer.Interface {
    rendererName = "lexical-text-input";
    formRenderer = "lexical";
    name = "Lexical Text Input";
    description = "Renders a lexical text editor.";

    canUse({ field }: { field: CmsModelField }) {
        return field.type === "rich-text" && !field.list && !field.predefinedValues?.enabled;
    }
}

export const LexicalTextInputRenderer = CmsFieldRenderer.createImplementation({
    implementation: LexicalTextInputRendererImpl,
    dependencies: []
});
